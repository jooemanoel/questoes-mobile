// Hook: reúne o estado e as regras da sessão de estudo (equivale ao composable
// useQuestionario da versão Vue). Os componentes só exibem dados e avisam o que
// o usuário fez; quem decide o que acontece em seguida é este arquivo.

import { useCallback, useMemo, useRef, useState } from "react";
import { buscarConcursos, buscarConteudo, carregarQuestoes } from "../servicos/api";
import { gravarLocal, lerLocal } from "../servicos/armazenamento";
import { lerHistorico, limparHistorico, migrarDadosAntigos, registrarResposta } from "../servicos/historico";

const CHAVE_CONCURSO = "concurso-atual";

/**
 * A tela está sempre em UMA destas etapas:
 *   "carregando"           -> buscando dados na API
 *   "erro"                 -> a busca falhou
 *   "escolhendo-concurso"  -> escolha do concurso (só quando há mais de um)
 *   "escolhendo"           -> tela inicial do concurso: escolha da disciplina
 *   "vazio"                -> a disciplina escolhida não tem questões
 *   "respondendo"          -> questão na tela, aguardando a resposta
 *   "corrigida"            -> resposta dada, crítica visível
 *   "fim"                  -> todas as questões da sessão respondidas
 */
export function useQuestionario() {
  // ---------- Estado ----------
  const [etapa, setEtapa] = useState("carregando");
  const [mensagemErro, setMensagemErro] = useState("");

  const [concursos, setConcursos] = useState([]); // catálogo da API
  const [concurso, setConcurso] = useState(null); // concurso em estudo
  const [idCarregado, setIdCarregado] = useState(null); // concurso cujos dados estão na memória

  const [todasQuestoes, setTodasQuestoes] = useState([]); // todas as questões do concurso
  const [questoes, setQuestoes] = useState([]); // só as da disciplina escolhida, em ordem de estudo
  const [filtroAtual, setFiltroAtual] = useState(null); // id do tópico escolhido (null = todas)

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostaDada, setRespostaDada] = useState(null); // "C"/"E", uma letra da alternativa ou null

  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);

  const [topicos, setTopicos] = useState([]); // lista plana do conteudo.json do concurso

  // Questões do concurso já respondidas neste aparelho: { id: { vezes, acertos, ultima } }
  const [historico, setHistorico] = useState({});

  // Quantas questões da sessão já tinham sido respondidas quando ela começou.
  const [respondidasNaSessao, setRespondidasNaSessao] = useState(0);

  // Histórico da questão atual como estava ANTES de respondê-la agora
  // (null = nunca respondida). É guardado ao exibir a questão, para que a
  // resposta dada nesta sessão não altere o aviso.
  const [historicoQuestaoAtual, setHistoricoQuestaoAtual] = useState(null);

  // Cada abertura de concurso recebe um número; uma resposta da API que chegue
  // depois de o usuário trocar de concurso é ignorada.
  const carregamentoAtual = useRef(0);

  // ---------- Valores derivados ----------
  const topicosPorId = useMemo(() => new Map(topicos.map((t) => [t.id, t])), [topicos]);

  const questaoAtual = questoes[indiceAtual];
  const acertou = respostaDada !== null && respostaDada === questaoAtual?.gabarito;
  const ehUltimaQuestao = indiceAtual === questoes.length - 1;
  const podeTrocarConcurso = concursos.length > 1;
  // Os dados na memória são do concurso atual (dá para voltar à escolha da disciplina).
  const concursoCarregado = idCarregado !== null && idCarregado === concurso?.id;

  /** Quantas das questões existentes já foram respondidas ao menos uma vez. */
  const totalRespondidas = useMemo(
    () => todasQuestoes.filter((q) => historico[q.id]).length,
    [todasQuestoes, historico]
  );

  /**
   * Opções da tela inicial: cada item do edital (nível 1) com suas
   * disciplinas (nível 2) e a quantidade de questões de cada um.
   * Itens sem nenhuma questão não aparecem.
   */
  const opcoesDeEstudo = useMemo(() => {
    const contar = (id) => todasQuestoes.filter((q) => pertenceAo(q, id)).length;
    const naProva = concurso?.distribuicao || {};
    return topicos
      .filter((t) => t.nivel === 1)
      .map((grupo) => ({
        id: grupo.id,
        titulo: grupo.titulo,
        total: contar(grupo.id),
        disciplinas: topicos
          .filter((t) => t.parentId === grupo.id)
          .map((d) => ({ id: d.id, titulo: d.titulo, total: contar(d.id), naProva: naProva[d.id] ?? null }))
          .filter((d) => d.total > 0),
      }))
      .filter((grupo) => grupo.total > 0);
  }, [topicos, todasQuestoes, concurso]);

  /** Nome do filtro em uso, exibido durante a sessão. */
  const rotuloFiltro = useMemo(() => {
    if (!filtroAtual) return "Todas as disciplinas";
    const topico = topicosPorId.get(filtroAtual);
    return topico ? `${topico.id} ${topico.titulo}` : filtroAtual;
  }, [filtroAtual, topicosPorId]);

  /** Disciplina (nível 2) e tópico da questão atual, para dar contexto. */
  const topicoAtual = useMemo(() => {
    const id = questaoAtual?.topicoId;
    const topico = id && topicosPorId.get(id);
    if (!topico) return null;

    const idDisciplina = id.split(".").slice(0, 2).join(".");
    const disciplina = topicosPorId.get(idDisciplina);

    return {
      id: topico.id,
      titulo: topico.titulo,
      disciplina: disciplina && disciplina !== topico ? disciplina.titulo : "",
    };
  }, [questaoAtual, topicosPorId]);

  // ---------- Ações ----------

  /** Carrega as questões e o conteúdo do concurso e vai para a escolha da disciplina. */
  const abrir = useCallback(async (escolhido) => {
    const meuCarregamento = ++carregamentoAtual.current;
    setEtapa("carregando");
    setMensagemErro("");
    setConcurso(escolhido);
    gravarLocal(CHAVE_CONCURSO, escolhido.id);

    try {
      // As duas buscas são independentes, então rodam em paralelo.
      const [{ questoes: listaQuestoes }, conteudo] = await Promise.all([
        carregarQuestoes(escolhido), // usa a cópia do aparelho se a lista não mudou
        buscarConteudo(escolhido.id),
      ]);
      if (meuCarregamento !== carregamentoAtual.current) return;

      setTopicos(conteudo);
      setTodasQuestoes(listaQuestoes);
      setHistorico(lerHistorico(escolhido.id));
      setFiltroAtual(null);
      setIdCarregado(escolhido.id);
      setEtapa("escolhendo");
    } catch (erro) {
      if (meuCarregamento !== carregamentoAtual.current) return;
      setMensagemErro(erro.message);
      setEtapa("erro");
    }
  }, []);

  /** Busca o catálogo e abre o último concurso estudado (ou pede para escolher). */
  const carregar = useCallback(async () => {
    setEtapa("carregando");
    setMensagemErro("");
    migrarDadosAntigos();

    let lista;
    try {
      lista = await buscarConcursos();
    } catch (erro) {
      setMensagemErro(erro.message);
      setEtapa("erro");
      return;
    }
    setConcursos(lista);

    const salvo = lerLocal(CHAVE_CONCURSO);
    const escolhido = lista.find((c) => c.id === salvo) ?? (lista.length === 1 ? lista[0] : null);
    if (escolhido) await abrir(escolhido);
    else setEtapa("escolhendo-concurso");
  }, [abrir]);

  /** Abre o concurso escolhido na lista. */
  function abrirConcurso(idConcurso) {
    const escolhido = concursos.find((c) => c.id === idConcurso);
    if (escolhido) abrir(escolhido);
  }

  /** Inicia uma sessão com as questões do tópico escolhido (null = todas). */
  function iniciar(idTopico) {
    const lista = priorizarNaoRespondidas(
      todasQuestoes.filter((q) => pertenceAo(q, idTopico)),
      historico
    );
    setFiltroAtual(idTopico);
    setQuestoes(lista);
    setRespondidasNaSessao(lista.filter((q) => historico[q.id]).length);
    setHistoricoQuestaoAtual(historicoDe(lista[0]));
    setIndiceAtual(0);
    setRespostaDada(null);
    setAcertos(0);
    setErros(0);
    setEtapa(lista.length > 0 ? "respondendo" : "vazio");
  }

  function responder(opcao) {
    if (etapa !== "respondendo") return; // evita responder duas vezes

    const certo = opcao === questaoAtual.gabarito;
    setRespostaDada(opcao);
    if (certo) setAcertos((n) => n + 1);
    else setErros((n) => n + 1);

    setHistorico(registrarResposta(concurso.id, historico, questaoAtual.id, certo));
    setEtapa("corrigida");
  }

  function proxima() {
    if (etapa !== "corrigida") return;

    if (ehUltimaQuestao) {
      setEtapa("fim");
      return;
    }

    setIndiceAtual(indiceAtual + 1);
    setRespostaDada(null);
    setHistoricoQuestaoAtual(historicoDe(questoes[indiceAtual + 1]));
    setEtapa("respondendo");
  }

  /** Histórico salvo de uma questão (null = nunca respondida). */
  function historicoDe(questao) {
    return (questao && historico[questao.id]) || null;
  }

  /** Repete a mesma disciplina, em nova ordem. */
  function recomecar() {
    iniciar(filtroAtual);
  }

  /** Volta para a tela inicial de escolha da disciplina. */
  function trocarDisciplina() {
    setEtapa("escolhendo");
  }

  /** Volta para a escolha do concurso. */
  function trocarConcurso() {
    if (podeTrocarConcurso) setEtapa("escolhendo-concurso");
  }

  /** Esquece quais questões do concurso já foram respondidas neste aparelho. */
  function apagarHistorico() {
    setHistorico(limparHistorico(concurso.id));
  }

  // Tudo o que os componentes podem usar:
  return {
    etapa,
    mensagemErro,
    concursos,
    concurso,
    podeTrocarConcurso,
    concursoCarregado,
    todasQuestoes,
    questoes,
    indiceAtual,
    questaoAtual,
    respostaDada,
    acertou,
    ehUltimaQuestao,
    acertos,
    erros,
    totalRespondidas,
    respondidasNaSessao,
    historicoQuestaoAtual,
    topicoAtual,
    opcoesDeEstudo,
    rotuloFiltro,
    carregar,
    abrirConcurso,
    iniciar,
    responder,
    proxima,
    recomecar,
    trocarDisciplina,
    trocarConcurso,
    apagarHistorico,
  };
}

// ---------- Funções auxiliares ----------

/** A questão pertence ao tópico se o topicoId é ele ou um descendente (ex.: "3.2" inclui "3.2.1.4"). */
function pertenceAo(questao, idTopico) {
  if (!idTopico) return true;
  const id = questao.topicoId || "";
  return id === idTopico || id.startsWith(`${idTopico}.`);
}

/**
 * Ordena a sessão: primeiro as questões nunca respondidas (em ordem aleatória),
 * depois as já respondidas, das que foram vistas menos vezes para as mais vistas.
 * Empates ficam em ordem aleatória (embaralha antes; o sort do JS é estável).
 */
function priorizarNaoRespondidas(lista, historico) {
  const vezes = (q) => historico[q.id]?.vezes ?? 0;
  return embaralhar(lista).sort((a, b) => vezes(a) - vezes(b));
}

/** Embaralhamento de Fisher-Yates: devolve uma cópia em ordem aleatória. */
function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
