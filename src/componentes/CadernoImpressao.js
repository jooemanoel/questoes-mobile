// Montagem do caderno para imprimir: quantidade, novo sorteio e o resumo do que vai no papel.
// "Imprimir ou salvar em PDF" monta o HTML do caderno (servicos/caderno.js) e abre a
// impressão do Android, que mostra a prévia das páginas e tem a opção "Salvar como PDF".
import * as Print from "expo-print";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useEstilos } from "../estilos";
import { montarHtmlCaderno } from "../servicos/caderno";
import { agruparPorDisciplina } from "../servicos/selecao";
import Botao from "./Botao";

export default function CadernoImpressao({ concurso, caderno, topicos, rotulo, maximo, aoSortear, aoVoltar }) {
  const { cores, e } = useEstilos();
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState("");

  const grupos = agruparPorDisciplina(caderno.questoes, topicos);
  const limite = Math.min(caderno.disponiveis, maximo);
  const quantidades = [...[5, 10, 20, 30, 40, 60, 80, 100].filter((n) => n < limite), limite];
  const faltas = caderno.faltas
    .map((f) => `${topicos.find((t) => t.id === f.disciplina)?.titulo ?? f.disciplina}: ${f.disponiveis} de ${f.pedidas}`)
    .join("; ");

  async function imprimir() {
    setErro("");
    setAbrindo(true);
    try {
      await Print.printAsync({ html: montarHtmlCaderno({ concurso, caderno, topicos, rotulo }) });
    } catch (falha) {
      // Fechar a tela de impressão sem imprimir não é erro; só mostra o que veio de fato do sistema.
      const mensagem = String(falha?.message ?? falha);
      if (!/cancel/i.test(mensagem)) setErro(`Não foi possível abrir a impressão: ${mensagem}`);
    } finally {
      setAbrindo(false);
    }
  }

  return (
    <View>
      <View style={e.tituloEscolha}>
        <Text style={[e.subtitulo, { marginBottom: 0 }]}>Caderno para imprimir</Text>
        <Botao tipo="link" titulo="Voltar" aoTocar={aoVoltar} />
      </View>
      <Text style={e.detalhe}>{rotulo}</Text>

      {!caderno.simulado && (
        <View style={{ marginTop: 12 }}>
          <Text style={e.texto}>Quantas questões?</Text>
          <View style={e.quantidades}>
            {quantidades.map((n) => {
              const ativa = n === caderno.quantidade;
              return (
                <Pressable
                  key={n}
                  onPress={() => aoSortear(n)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ativa }}
                  style={[e.quantidade, ativa && e.quantidadeAtiva]}
                >
                  <Text style={[e.quantidadeTexto, ativa && e.quantidadeTextoAtivo]}>
                    {n === caderno.disponiveis ? `todas (${n})` : n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {caderno.disponiveis > maximo && (
            <Text style={[e.detalhe, { marginTop: 6 }]}>
              O caderno vai até {maximo} questões ({caderno.disponiveis} disponíveis).
            </Text>
          )}
        </View>
      )}

      <View style={[e.aviso, { marginTop: 16 }]}>
        <Text style={[e.texto, e.negrito]}>
          {caderno.quantidade} {caderno.quantidade === 1 ? "questão" : "questões"}
        </Text>
        <View>
          {grupos.map((g) => (
            <View key={g.id} style={e.resumoLinha}>
              <Text style={[e.detalhe, { flex: 1 }]}>{g.titulo}</Text>
              <Text style={e.detalhe}>
                {g.primeira === g.ultima ? g.primeira : `${g.primeira} a ${g.ultima}`}
              </Text>
            </View>
          ))}
        </View>
        <Text style={e.detalhe}>Depois das questões, em página nova: gabarito e comentários.</Text>
      </View>

      {!!faltas && (
        <View style={[e.aviso, e.avisoErro, { marginTop: 12 }]}>
          <Text style={e.texto}>Algumas disciplinas não têm questões suficientes para o simulado: {faltas}.</Text>
        </View>
      )}

      <View style={e.acoes}>
        {abrindo ? (
          <ActivityIndicator color={cores.destaque} />
        ) : (
          <Botao titulo="Imprimir ou salvar em PDF" aoTocar={imprimir} />
        )}
        <Botao tipo="secundario" titulo="Sortear outras" aoTocar={() => aoSortear(caderno.quantidade)} />
      </View>
      {!!erro && <Text style={[e.detalhe, { color: cores.errado, marginTop: 8 }]}>{erro}</Text>}

      <Text style={[e.detalhe, { marginTop: 16 }]}>
        As questões ainda não respondidas no app têm prioridade no sorteio. Responder no papel não entra no
        histórico. Para guardar o arquivo, escolha &quot;Salvar como PDF&quot; no lugar da impressora.
      </Text>
    </View>
  );
}
