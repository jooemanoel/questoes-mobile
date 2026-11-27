// Cartão "Versão X disponível" (a consulta ao GitHub fica no App.js).
//
// "Atualizar agora" baixa o APK dentro do app e abre o instalador do Android (o download
// pelo navegador às vezes trava em 100%). Se falhar, o botão passa a abrir o navegador.
import { useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { useEstilos } from "../estilos";
import { VERSAO_INSTALADA, baixarEInstalar } from "../servicos/atualizacao";
import Botao from "./Botao";

export default function AvisoAtualizacao({ atualizacao, aoAdiar }) {
  const { e } = useEstilos();
  const [progresso, setProgresso] = useState(null); // null = parado; 0 a 1 (ou -1 sem tamanho) = baixando
  const [falhou, setFalhou] = useState(false);

  const peloApp = Platform.OS === "android" && !falhou && /\.apk$/i.test(atualizacao.url);
  const baixando = progresso !== null;

  async function atualizar() {
    if (baixando) return;
    if (!peloApp) return Linking.openURL(atualizacao.url);
    setProgresso(0);
    try {
      await baixarEInstalar(atualizacao, (p) => setProgresso(p ?? -1));
    } catch {
      setFalhou(true);
    } finally {
      setProgresso(null);
    }
  }

  const tituloBotao = !baixando
    ? peloApp
      ? "Atualizar agora"
      : "Baixar pelo navegador"
    : progresso >= 0
      ? `Baixando… ${Math.round(progresso * 100)}%`
      : "Baixando…";

  return (
    <View style={[e.aviso, e.avisoAtualizacao]}>
      <Text style={e.texto}>
        <Text style={e.negrito}>Versão {atualizacao.versao} disponível.</Text> Você está com a {VERSAO_INSTALADA}. A
        nova versão instala por cima e o histórico é mantido.
      </Text>
      {falhou && <Text style={e.texto}>Não deu para baixar a atualização. Tente pelo navegador.</Text>}
      <View style={[e.acoes, { marginTop: 0 }]}>
        <Botao titulo={tituloBotao} aoTocar={atualizar} />
        {!baixando && <Botao tipo="secundario" titulo="Depois" aoTocar={aoAdiar} />}
      </View>
    </View>
  );
}
