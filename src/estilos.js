// Cores e estilos do app: equivalem ao estilo.css da versão web.
// O tema (claro/escuro) segue o do sistema, como o prefers-color-scheme.
import { useMemo } from "react";
import { Platform, StyleSheet, useColorScheme } from "react-native";

export const CORES = {
  claro: {
    escuro: false,
    fundo: "#f6f7f9",
    superficie: "#ffffff",
    texto: "#1d2129",
    textoSuave: "#5b6270",
    borda: "#d9dde3",
    destaque: "#2f5bd3",
    sobreDestaque: "#ffffff",
    certo: "#1f7a3f",
    certoFundo: "#e6f4ea",
    errado: "#b3261e",
    erradoFundo: "#fbe9e7",
  },
  escuro: {
    escuro: true,
    fundo: "#14161a",
    superficie: "#1d2026",
    texto: "#e6e8eb",
    textoSuave: "#a0a6b1",
    borda: "#343842",
    destaque: "#7c9bff",
    sobreDestaque: "#0b1a45",
    certo: "#6fcf8f",
    certoFundo: "#16301f",
    errado: "#ff8a80",
    erradoFundo: "#3a1a18",
  },
};

const FONTE_CODIGO = Platform.select({ ios: "Menlo", default: "monospace" });

/** Devolve { cores, e } com os estilos do tema atual. */
export function useEstilos() {
  const tema = useColorScheme() === "dark" ? "escuro" : "claro";
  return useMemo(() => {
    const cores = CORES[tema];
    return { cores, e: criarEstilos(cores) };
  }, [tema]);
}

function criarEstilos(c) {
  const cartao = {
    backgroundColor: c.superficie,
    borderWidth: 1,
    borderColor: c.borda,
    borderRadius: 10,
    padding: 20,
  };
  const botao = {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  };

  return StyleSheet.create({
    // ---------- Estrutura ----------
    app: { flex: 1, backgroundColor: c.fundo },
    pagina: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48, width: "100%", maxWidth: 760, alignSelf: "center" },
    texto: { color: c.texto, fontSize: 16, lineHeight: 25 },

    cabecalho: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 20,
    },
    titulo: { color: c.texto, fontSize: 22, fontWeight: "700" },

    // ---------- Placar ----------
    placar: { flexDirection: "row", gap: 20 },
    placarItem: { alignItems: "center" },
    placarRotulo: { color: c.textoSuave, fontSize: 12 },
    placarValor: { color: c.texto, fontSize: 19, fontWeight: "700" },

    // ---------- Questão ----------
    cartao,
    progresso: { color: c.textoSuave, fontSize: 14, flexShrink: 1 },
    topico: { color: c.textoSuave, fontSize: 13.5, lineHeight: 20, marginBottom: 12 },
    jaRespondida: {
      color: c.textoSuave,
      fontSize: 13,
      lineHeight: 19,
      borderLeftWidth: 3,
      borderLeftColor: c.borda,
      paddingLeft: 8,
      marginBottom: 12,
    },
    naoRevisada: {
      color: c.textoSuave,
      fontSize: 13,
      lineHeight: 19,
      borderLeftWidth: 3,
      borderLeftColor: c.destaque,
      paddingLeft: 8,
      marginBottom: 12,
    },
    textoBase: {
      color: c.textoSuave,
      fontSize: 16,
      lineHeight: 25,
      borderLeftWidth: 3,
      borderLeftColor: c.borda,
      paddingVertical: 4,
      paddingLeft: 14,
      marginBottom: 16,
    },
    codigoCaixa: {
      backgroundColor: c.fundo,
      borderWidth: 1,
      borderColor: c.borda,
      borderRadius: 8,
      marginBottom: 16,
    },
    codigo: { color: c.texto, fontFamily: FONTE_CODIGO, fontSize: 13.5, lineHeight: 20, padding: 12 },
    enunciado: { color: c.texto, fontSize: 17.5, lineHeight: 27, marginBottom: 20 },
    opcoes: { flexDirection: "row", gap: 12 },

    // ---------- Botões ----------
    opcao: { ...botao, flex: 1, borderWidth: 2, borderColor: c.borda, backgroundColor: c.superficie, minHeight: 52 },
    opcaoCertoEscolhida: { borderColor: c.certo, backgroundColor: c.certoFundo },
    opcaoErradoEscolhida: { borderColor: c.errado, backgroundColor: c.erradoFundo },
    opcaoApagada: { opacity: 0.5 },
    opcaoTexto: { color: c.texto, fontSize: 16, fontWeight: "600" },

    botaoPrincipal: { ...botao, backgroundColor: c.destaque },
    botaoPrincipalTexto: { color: c.sobreDestaque, fontSize: 16, fontWeight: "600" },
    botaoSecundario: { ...botao, borderWidth: 1, borderColor: c.destaque },
    botaoSecundarioTexto: { color: c.destaque, fontSize: 16, fontWeight: "600" },
    botaoLink: { color: c.destaque, fontSize: 14.5, textDecorationLine: "underline" },
    pressionado: { opacity: 0.7 },

    // ---------- Crítica ----------
    critica: { ...cartao, marginTop: 16 },
    criticaCerto: { borderColor: c.certo, backgroundColor: c.certoFundo },
    criticaErrado: { borderColor: c.errado, backgroundColor: c.erradoFundo },
    criticaTitulo: { fontSize: 18.5, fontWeight: "700", marginBottom: 4 },
    comentario: { color: c.texto, fontSize: 16, lineHeight: 25, marginVertical: 14 },
    semComentario: { color: c.textoSuave, fontStyle: "italic" },

    // ---------- Escolha da disciplina ----------
    subtitulo: { color: c.texto, fontSize: 18.5, fontWeight: "700", marginBottom: 12 },
    historico: { marginBottom: 6 },
    grupo: { marginTop: 16 },
    disciplinas: { paddingLeft: 12 },
    opcaoEstudo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      marginTop: 6,
      borderWidth: 1,
      borderColor: c.borda,
      borderRadius: 8,
      backgroundColor: c.superficie,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    opcaoEstudoTodas: { borderColor: c.destaque },
    opcaoEstudoPressionada: { borderColor: c.destaque },
    opcaoEstudoTexto: { color: c.texto, fontSize: 14.5, lineHeight: 21, flex: 1 },
    negrito: { fontWeight: "700" },
    contagem: {
      color: c.textoSuave,
      fontSize: 13,
      backgroundColor: c.fundo,
      borderRadius: 999,
      paddingVertical: 2,
      paddingHorizontal: 8,
      overflow: "hidden",
    },

    // ---------- Barra da sessão e ações ----------
    barraSessao: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "baseline",
      columnGap: 12,
      rowGap: 4,
      marginBottom: 8,
    },
    acoes: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },

    // ---------- Avisos ----------
    aviso: { ...cartao, gap: 12 },
    avisoErro: { borderColor: c.errado },
    detalhe: { color: c.textoSuave, fontSize: 14, lineHeight: 21 },
    carregando: { flexDirection: "row", alignItems: "center", gap: 12 },
  });
}
