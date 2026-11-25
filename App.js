// Componente raiz: liga o estado (hook useQuestionario) aos componentes de tela.
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useRef } from "react";
import { ActivityIndicator, BackHandler, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import Botao from "./src/componentes/Botao";
import CriticaQuestao from "./src/componentes/CriticaQuestao";
import EscolhaDisciplina from "./src/componentes/EscolhaDisciplina";
import PlacarSessao from "./src/componentes/PlacarSessao";
import QuestaoItem from "./src/componentes/QuestaoItem";
import { useQuestionario } from "./src/estado/useQuestionario";
import { useEstilos } from "./src/estilos";

export default function App() {
  return (
    <SafeAreaProvider>
      <Questionario />
    </SafeAreaProvider>
  );
}

function Questionario() {
  const q = useQuestionario();
  const { etapa, carregar, trocarDisciplina } = q;
  const { cores, e } = useEstilos();
  const margens = useSafeAreaInsets();

  // Rolagem: volta ao topo a cada nova tela/questão e desce até a crítica ao responder.
  const rolagem = useRef(null);
  const posicao = useRef({ y: 0, altura: 0 });

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Cor da janela nativa (aparece atrás do app em transições).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(cores.fundo).catch(() => {});
  }, [cores.fundo]);

  useEffect(() => {
    if (etapa !== "corrigida") rolagem.current?.scrollTo({ y: 0, animated: false });
  }, [etapa, q.indiceAtual]);

  // Botão "voltar" do Android: durante a sessão, volta à escolha da disciplina
  // (como "Trocar disciplina"); na tela inicial, fecha o app normalmente.
  useEffect(() => {
    const emTelaInterna = ["respondendo", "corrigida", "fim", "vazio"].includes(etapa);
    if (!emTelaInterna) return;
    const assinatura = BackHandler.addEventListener("hardwareBackPress", () => {
      trocarDisciplina();
      return true;
    });
    return () => assinatura.remove();
  }, [etapa, trocarDisciplina]);

  /** Se a crítica ficou abaixo da parte visível, rola até ela. */
  function mostrarCritica(evento) {
    const { y } = evento.nativeEvent.layout;
    const { y: rolado, altura } = posicao.current;
    if (y + 120 > rolado + altura) rolagem.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }

  // O placar só faz sentido durante uma sessão (e no resultado final).
  const emSessao = ["respondendo", "corrigida", "fim"].includes(etapa);

  return (
    <View style={e.app}>
      <StatusBar style={cores.escuro ? "light" : "dark"} />

      <ScrollView
        ref={rolagem}
        contentContainerStyle={[e.pagina, { paddingTop: margens.top + 16, paddingBottom: margens.bottom + 48 }]}
        onLayout={(ev) => (posicao.current.altura = ev.nativeEvent.layout.height)}
        onScroll={(ev) => (posicao.current.y = ev.nativeEvent.contentOffset.y)}
        scrollEventThrottle={100}
      >
        <View style={e.cabecalho}>
          <Text style={e.titulo} accessibilityRole="header">
            Questões
          </Text>
          {emSessao && <PlacarSessao acertos={q.acertos} erros={q.erros} />}
        </View>

        {/* Cada bloco abaixo corresponde a uma etapa do questionário */}

        {etapa === "carregando" && (
          <View style={[e.aviso, e.carregando]}>
            <ActivityIndicator color={cores.destaque} />
            <Text style={e.texto}>Carregando questões…</Text>
          </View>
        )}

        {etapa === "erro" && (
          <View style={[e.aviso, e.avisoErro]}>
            <Text style={e.texto}>Não foi possível carregar as questões.</Text>
            <Text style={e.detalhe}>{q.mensagemErro}</Text>
            <Botao titulo="Tentar de novo" aoTocar={carregar} />
          </View>
        )}

        {etapa === "escolhendo" && (
          <EscolhaDisciplina
            grupos={q.opcoesDeEstudo}
            totalGeral={q.todasQuestoes.length}
            totalRespondidas={q.totalRespondidas}
            aoEscolher={q.iniciar}
            aoApagarHistorico={q.apagarHistorico}
          />
        )}

        {etapa === "vazio" && (
          <View style={e.aviso}>
            <Text style={e.texto}>Nenhuma questão cadastrada para {q.rotuloFiltro}.</Text>
            <Botao titulo="Escolher outra disciplina" aoTocar={trocarDisciplina} />
          </View>
        )}

        {(etapa === "respondendo" || etapa === "corrigida") && (
          <>
            <View style={e.barraSessao}>
              <Text style={e.progresso}>
                Questão {q.indiceAtual + 1} de {q.questoes.length} · {q.rotuloFiltro}
              </Text>
              <Botao tipo="link" titulo="Trocar disciplina" aoTocar={trocarDisciplina} />
            </View>

            {q.respondidasNaSessao > 0 && (
              <Text style={[e.detalhe, e.historico]}>
                Você já respondeu {q.respondidasNaSessao} de {q.questoes.length} questões.{" "}
                {q.respondidasNaSessao < q.questoes.length
                  ? "As ainda não respondidas aparecem primeiro."
                  : "As respondidas menos vezes aparecem primeiro."}
              </Text>
            )}

            <QuestaoItem
              questao={q.questaoAtual}
              topico={q.topicoAtual}
              historico={q.historicoQuestaoAtual}
              respostaDada={q.respostaDada}
              bloqueada={etapa === "corrigida"}
              aoResponder={q.responder}
            />

            {etapa === "corrigida" && (
              <CriticaQuestao
                acertou={q.acertou}
                gabarito={q.questaoAtual.gabarito}
                comentario={q.questaoAtual.comentario}
                ehUltimaQuestao={q.ehUltimaQuestao}
                aoAvancar={q.proxima}
                onLayout={mostrarCritica}
              />
            )}
          </>
        )}

        {etapa === "fim" && (
          <View style={e.aviso}>
            <Text style={e.subtitulo}>Sessão concluída</Text>
            <Text style={e.detalhe}>{q.rotuloFiltro}</Text>
            <Text style={e.texto}>
              Você respondeu {q.questoes.length} questões: {q.acertos} acertos e {q.erros} erros.
            </Text>
            <View style={[e.acoes, { marginTop: 4 }]}>
              <Botao titulo="Recomeçar" aoTocar={q.recomecar} />
              <Botao tipo="secundario" titulo="Trocar disciplina" aoTocar={trocarDisciplina} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
