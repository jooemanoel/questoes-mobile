// Lista os concursos da API para escolher qual estudar.
// Só exibe as opções e avisa (aoEscolher) o id do concurso.
import { Pressable, Text, View } from "react-native";
import { useEstilos } from "../estilos";

const FORMATOS = { "certo-errado": "Certo ou Errado", "multipla-escolha": "Múltipla escolha" };

/** "2027-01-17" vira "17/01/2027" (sem passar por fuso horário). */
function dataPorExtenso(iso) {
  const [ano, mes, dia] = String(iso).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}

function detalhes(c) {
  return [c.banca, FORMATOS[c.formato] ?? c.formato, c.dataProva && `prova em ${dataPorExtenso(c.dataProva)}`]
    .filter(Boolean)
    .join(" · ");
}

export default function EscolhaConcurso({ concursos, idAtual, aoEscolher }) {
  const { e } = useEstilos();

  return (
    <View>
      <Text style={e.subtitulo}>Qual concurso você quer estudar?</Text>

      {concursos.map((c) => {
        const atual = c.id === idAtual;
        return (
          <Pressable
            key={c.id}
            onPress={() => aoEscolher(c.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: atual }}
            style={({ pressed }) => [e.opcaoEstudo, (atual || pressed) && e.opcaoEstudoTodas]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[e.opcaoEstudoTexto, e.negrito]}>{c.nome}</Text>
              <Text style={e.detalhe}>{detalhes(c)}</Text>
            </View>
            {atual && <Text style={e.contagem}>atual</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}
