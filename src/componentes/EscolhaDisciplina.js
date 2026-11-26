// Tela inicial do concurso: lista os itens do edital e suas disciplinas para escolher o que estudar.
// Só exibe as opções. Conforme o modo, avisa aoEscolher (responder na tela) ou aoImprimir
// (montar o caderno) com o id do tópico (null = todas, "simulado" = simulado da prova).
import { Alert, Pressable, Text, View } from "react-native";
import { useEstilos } from "../estilos";
import Botao from "./Botao";

/** "CONHECIMENTOS ESPECÍFICOS - CARGO 4: ..." vira "CONHECIMENTOS ESPECÍFICOS". */
function tituloCurto(titulo) {
  return titulo.split(" - ")[0];
}

/** "LÍNGUA PORTUGUESA" vira "Língua Portuguesa" (títulos de edital costumam vir em maiúsculas). */
function tituloLegivel(titulo) {
  if (titulo !== titulo.toUpperCase()) return titulo;
  const minusculas = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "em", "na", "no"]);
  return titulo
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((p, i) => {
      if (i > 0 && minusculas.has(p)) return p;
      // Palavras de até 3 letras fora da lista acima costumam ser siglas: "SUS", "TI".
      if (p.length <= 3) return p.toLocaleUpperCase("pt-BR");
      return p.charAt(0).toLocaleUpperCase("pt-BR") + p.slice(1);
    })
    .join(" ");
}

export default function EscolhaDisciplina({
  podeTrocarConcurso,
  grupos,
  totalGeral,
  totalRespondidas,
  totalSimulado = 0, // questões do simulado da prova (0 = sem distribuição cadastrada)
  modo = "responder", // "responder" ou "imprimir"
  aoMudarModo,
  aoEscolher,
  aoImprimir,
  aoApagarHistorico,
  aoTrocarConcurso,
}) {
  const { e } = useEstilos();
  const imprimindo = modo === "imprimir";

  /** Responde na tela ou abre o caderno, conforme o modo escolhido. */
  const escolher = (idTopico) => (imprimindo ? aoImprimir : aoEscolher)(idTopico);

  /** "5 de Língua Portuguesa, 5 de Raciocínio Lógico, ..." */
  const partesDoSimulado = grupos
    .flatMap((g) => g.disciplinas)
    .filter((d) => d.naProva)
    .map((d) => `${d.naProva} de ${tituloLegivel(d.titulo)}`)
    .join(", ");

  function confirmarApagarHistorico() {
    Alert.alert("Limpar histórico", "Esquecer todas as questões já respondidas deste concurso neste aparelho?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpar", style: "destructive", onPress: aoApagarHistorico },
    ]);
  }

  return (
    <View>
      {/* O nome do concurso fica no cabeçalho (App.js). */}
      <View style={e.tituloEscolha}>
        <Text style={[e.subtitulo, { marginBottom: 0 }]}>O que você quer estudar?</Text>
        {podeTrocarConcurso && <Botao tipo="link" titulo="Trocar concurso" aoTocar={aoTrocarConcurso} />}
      </View>

      {totalGeral === 0 ? (
        <View style={e.aviso}>
          <Text style={e.texto}>Este concurso ainda não tem questões cadastradas.</Text>
        </View>
      ) : (
        <>
          <View style={e.modo} accessibilityRole="radiogroup">
            {[
              ["responder", "Responder na tela"],
              ["imprimir", "Imprimir caderno"],
            ].map(([valor, rotulo], i) => (
              <Pressable
                key={valor}
                onPress={() => aoMudarModo(valor)}
                accessibilityRole="radio"
                accessibilityState={{ checked: modo === valor }}
                style={[e.modoOpcao, i > 0 && e.modoOpcaoSeguinte, modo === valor && e.modoOpcaoAtiva]}
              >
                <Text style={[e.modoTexto, modo === valor && e.modoTextoAtivo]}>{rotulo}</Text>
              </Pressable>
            ))}
          </View>
          {imprimindo && (
            <Text style={[e.detalhe, { marginBottom: 8 }]}>
              Escolha o que vai no caderno. O gabarito e os comentários ficam no final, depois de todas as
              questões.
            </Text>
          )}

          {totalRespondidas > 0 && (
            <View style={e.historico}>
              <Text style={e.detalhe}>
                Você já respondeu {totalRespondidas} de {totalGeral} questões. As ainda não respondidas
                aparecem primeiro.
              </Text>
              <Botao tipo="link" titulo="Limpar histórico" aoTocar={confirmarApagarHistorico} style={{ marginTop: 4 }} />
            </View>
          )}

          {totalSimulado > 0 && (
            <Opcao total={totalSimulado} destaque negrito detalhe={partesDoSimulado} aoTocar={() => escolher("simulado")} e={e}>
              Simulado da prova
            </Opcao>
          )}

          <Opcao total={totalGeral} destaque negrito aoTocar={() => escolher(null)} e={e}>
            Todas as disciplinas
          </Opcao>

          {grupos.map((grupo) => (
            <View key={grupo.id} style={e.grupo}>
              <Opcao total={grupo.total} negrito aoTocar={() => escolher(grupo.id)} e={e}>
                {grupo.id} {tituloCurto(grupo.titulo)}
              </Opcao>

              <View style={e.disciplinas}>
                {grupo.disciplinas.map((disciplina) => (
                  <Opcao
                    key={disciplina.id}
                    total={disciplina.total}
                    naProva={disciplina.naProva}
                    aoTocar={() => escolher(disciplina.id)}
                    e={e}
                  >
                    <Text style={e.negrito}>{disciplina.id}</Text> {disciplina.titulo}
                  </Opcao>
                ))}
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function Opcao({ children, total, naProva, detalhe, destaque, negrito, aoTocar, e }) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      style={({ pressed }) => [e.opcaoEstudo, destaque && e.opcaoEstudoTodas, pressed && e.opcaoEstudoPressionada]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[e.opcaoEstudoTexto, negrito && e.negrito]}>{children}</Text>
        {!!detalhe && <Text style={e.naProva}>{detalhe}</Text>}
        {!!naProva && (
          <Text style={e.naProva}>
            {naProva} {naProva === 1 ? "questão" : "questões"} na prova
          </Text>
        )}
      </View>
      <Text style={e.contagem}>{total}</Text>
    </Pressable>
  );
}
