// Mostra a questão e os botões Certo/Errado.
// Não corrige nada: apenas avisa (aoResponder) a opção escolhida.
import { Pressable, ScrollView, Text, View } from "react-native";
import { useEstilos } from "../estilos";

// historico: histórico desta questão antes da resposta atual ({ vezes, acertos, ultima } ou null)
export default function QuestaoItem({ questao, topico, historico, respostaDada, bloqueada, aoResponder }) {
  const { e } = useEstilos();
  const avisoJaRespondida = textoJaRespondida(historico);

  return (
    <View style={e.cartao}>
      {topico && (
        <Text style={e.topico}>
          {topico.disciplina ? `${topico.disciplina} › ` : ""}
          <Text style={e.negrito}>{topico.id}</Text> {topico.titulo}
        </Text>
      )}

      {!!avisoJaRespondida && <Text style={e.jaRespondida}>{avisoJaRespondida}</Text>}

      {!questao.revisada && (
        <Text style={e.naoRevisada}>
          Questão gerada por IA, ainda não revisada. Confira a base citada no comentário.
        </Text>
      )}

      {!!questao.textoBase && (
        <Text style={e.textoBase} selectable>
          {questao.textoBase}
        </Text>
      )}

      {/* Código longo rola na horizontal, preservando quebras de linha e indentação */}
      {!!questao.codigo && (
        <ScrollView horizontal style={e.codigoCaixa} nestedScrollEnabled>
          <Text style={e.codigo} selectable>
            {questao.codigo}
          </Text>
        </ScrollView>
      )}

      <Text style={e.enunciado} selectable>
        {questao.enunciado}
      </Text>

      <View style={e.opcoes}>
        <Opcao rotulo="Certo" valor="C" {...{ respostaDada, bloqueada, aoResponder, e }} />
        <Opcao rotulo="Errado" valor="E" {...{ respostaDada, bloqueada, aoResponder, e }} />
      </View>
    </View>
  );
}

/** Ex.: "Você já respondeu esta questão 2 vezes (1 acerto), a última em 20/11/2026." */
function textoJaRespondida(h) {
  if (!h?.vezes) return "";
  const vezes = h.vezes === 1 ? "1 vez" : `${h.vezes} vezes`;
  const acertos = h.acertos === 1 ? "1 acerto" : `${h.acertos} acertos`;
  const data = h.ultima ? `, a última em ${new Date(h.ultima).toLocaleDateString("pt-BR")}` : "";
  return `Você já respondeu esta questão ${vezes} (${acertos})${data}.`;
}

function Opcao({ rotulo, valor, respostaDada, bloqueada, aoResponder, e }) {
  const escolhida = respostaDada === valor;
  const estiloEscolhida = valor === "C" ? e.opcaoCertoEscolhida : e.opcaoErradoEscolhida;

  return (
    <Pressable
      onPress={() => aoResponder(valor)}
      disabled={bloqueada}
      accessibilityRole="button"
      accessibilityState={{ disabled: bloqueada, selected: escolhida }}
      style={({ pressed }) => [
        e.opcao,
        (escolhida || pressed) && estiloEscolhida,
        bloqueada && !escolhida && e.opcaoApagada,
      ]}
    >
      <Text style={e.opcaoTexto}>{rotulo}</Text>
    </Pressable>
  );
}
