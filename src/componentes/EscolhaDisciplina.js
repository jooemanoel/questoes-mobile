// Tela inicial: lista os itens do edital e suas disciplinas para escolher o que estudar.
// Só exibe as opções e avisa (aoEscolher) o id do tópico (null = todas).
import { Alert, Pressable, Text, View } from "react-native";
import { useEstilos } from "../estilos";
import Botao from "./Botao";

/** "CONHECIMENTOS ESPECÍFICOS - CARGO 4: ..." vira "CONHECIMENTOS ESPECÍFICOS". */
function tituloCurto(titulo) {
  return titulo.split(" - ")[0];
}

export default function EscolhaDisciplina({ grupos, totalGeral, totalRespondidas, aoEscolher, aoApagarHistorico }) {
  const { e } = useEstilos();

  function confirmarApagarHistorico() {
    Alert.alert("Limpar histórico", "Esquecer todas as questões já respondidas neste aparelho?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpar", style: "destructive", onPress: aoApagarHistorico },
    ]);
  }

  return (
    <View>
      <Text style={e.subtitulo}>O que você quer estudar?</Text>

      {totalRespondidas > 0 && (
        <View style={e.historico}>
          <Text style={e.detalhe}>
            Você já respondeu {totalRespondidas} de {totalGeral} questões. As ainda não respondidas
            aparecem primeiro.
          </Text>
          <Botao tipo="link" titulo="Limpar histórico" aoTocar={confirmarApagarHistorico} style={{ marginTop: 4 }} />
        </View>
      )}

      <Opcao total={totalGeral} destaque negrito aoTocar={() => aoEscolher(null)} e={e}>
        Todas as disciplinas
      </Opcao>

      {grupos.map((grupo) => (
        <View key={grupo.id} style={e.grupo}>
          <Opcao total={grupo.total} negrito aoTocar={() => aoEscolher(grupo.id)} e={e}>
            {grupo.id} {tituloCurto(grupo.titulo)}
          </Opcao>

          <View style={e.disciplinas}>
            {grupo.disciplinas.map((disciplina) => (
              <Opcao key={disciplina.id} total={disciplina.total} aoTocar={() => aoEscolher(disciplina.id)} e={e}>
                <Text style={e.negrito}>{disciplina.id}</Text> {disciplina.titulo}
              </Opcao>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function Opcao({ children, total, destaque, negrito, aoTocar, e }) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      style={({ pressed }) => [e.opcaoEstudo, destaque && e.opcaoEstudoTodas, pressed && e.opcaoEstudoPressionada]}
    >
      <Text style={[e.opcaoEstudoTexto, negrito && e.negrito]}>{children}</Text>
      <Text style={e.contagem}>{total}</Text>
    </Pressable>
  );
}
