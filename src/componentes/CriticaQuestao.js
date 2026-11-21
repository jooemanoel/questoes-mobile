// Mostra o resultado da resposta e a crítica (comentário) da questão.
import { Text, View } from "react-native";
import { useEstilos } from "../estilos";
import Botao from "./Botao";

export default function CriticaQuestao({ acertou, gabarito, comentario, ehUltimaQuestao, aoAvancar, onLayout }) {
  const { cores, e } = useEstilos();
  const gabaritoPorExtenso = gabarito === "C" ? "Certo" : "Errado";

  return (
    <View
      style={[e.critica, acertou ? e.criticaCerto : e.criticaErrado]}
      onLayout={onLayout}
      accessibilityLiveRegion="polite"
    >
      <Text style={[e.criticaTitulo, { color: acertou ? cores.certo : cores.errado }]}>
        {acertou ? "Você acertou!" : "Você errou."}
      </Text>
      <Text style={e.texto}>
        Gabarito: <Text style={e.negrito}>{gabaritoPorExtenso}</Text>
      </Text>

      {comentario ? (
        <Text style={e.comentario} selectable>
          {comentario}
        </Text>
      ) : (
        <Text style={[e.comentario, e.semComentario]}>Esta questão ainda não tem comentário.</Text>
      )}

      <Botao titulo={ehUltimaQuestao ? "Ver resultado" : "Próxima questão"} aoTocar={aoAvancar} />
    </View>
  );
}
