// Leitura e gravação de dados no aparelho (equivale ao localStorage da versão web).
// Usa a API síncrona do kv-store do expo-sqlite: o histórico já está disponível
// quando a tela abre. Nenhuma falha aqui pode quebrar o app: na pior hipótese,
// nada é salvo.
import Storage from "expo-sqlite/kv-store";

const PREFIXO = "questoes-rapidas:";

export function lerLocal(chave) {
  try {
    const texto = Storage.getItemSync(PREFIXO + chave);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

export function gravarLocal(chave, valor) {
  try {
    Storage.setItemSync(PREFIXO + chave, JSON.stringify(valor));
  } catch (erro) {
    console.warn(`Não foi possível salvar "${chave}" no aparelho:`, erro);
  }
}

export function removerLocal(chave) {
  try {
    Storage.removeItemSync(PREFIXO + chave);
  } catch {
    // nada a fazer
  }
}
