// Mostra a questão e os botões de resposta: Certo/Errado ou, na múltipla escolha,
// uma alternativa por botão. Não corrige nada: apenas avisa (aoResponder) a opção
// escolhida ("C"/"E" ou a letra da alternativa).
import { Pressable, ScrollView, Text, View } from "react-native";
import { useEstilos } from "../estilos";
import { letra } from "../servicos/api";

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

      {questao.alternativas?.length ? (
        <View style={e.alternativas}>
          {questao.alternativas.map((texto, i) => (
            <Alternativa
              key={i}
              valor={letra(i)}
              texto={texto}
              gabarito={questao.gabarito}
              {...{ respostaDada, bloqueada, aoResponder, e }}
            />
          ))}
        </View>
      ) : (
        <View style={e.opcoes}>
          <Opcao rotulo="Certo" valor="C" {...{ respostaDada, bloqueada, aoResponder, e }} />
          <Opcao rotulo="Errado" valor="E" {...{ respostaDada, bloqueada, aoResponder, e }} />
        </View>
      )}
    </View>
  );
}

/** Depois de responder: a correta fica verde e a escolhida errada, vermelha. */
function Alternativa({ valor, texto, gabarito, respostaDada, bloqueada, aoResponder, e }) {
  const escolhida = respostaDada === valor;
  const correta = bloqueada && valor === gabarito;
  const incorreta = bloqueada && escolhida && valor !== gabarito;

  return (
    <Pressable
      onPress={() => aoResponder(valor)}
      disabled={bloqueada}
      accessibilityRole="button"
      accessibilityLabel={`Alternativa ${valor}: ${texto}`}
      accessibilityState={{ disabled: bloqueada, selected: escolhida }}
      style={({ pressed }) => [
        e.alternativa,
        pressed && e.alternativaPressionada,
        correta && e.opcaoCertoEscolhida,
        incorreta && e.opcaoErradoEscolhida,
        bloqueada && !correta && !incorreta && e.opcaoApagada,
      ]}
    >
      <Text style={[e.alternativaLetra, correta && e.letraCerta, incorreta && e.letraErrada]}>{valor}</Text>
      <Text style={e.alternativaTexto}>{texto}</Text>
    </Pressable>
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
