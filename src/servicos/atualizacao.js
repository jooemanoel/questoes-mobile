// Aviso de versão nova do app: compara a versão instalada (app.json) com a release
// marcada como "Latest" em github.com/jooemanoel/questoes-mobile.
//
// A API do GitHub sem login aceita 60 consultas por hora por IP; o app consulta no
// máximo uma vez por hora (ao abrir e ao voltar para o app) e guarda a resposta,
// então o aviso continua aparecendo sem internet. Qualquer falha é silenciosa: o aviso é só uma conveniência.
import config from "../../app.json";
import { gravarLocal, lerLocal } from "./armazenamento";

export const VERSAO_INSTALADA = config.expo.version;

const URL_RELEASE = "https://api.github.com/repos/jooemanoel/questoes-mobile/releases/latest";
const CHAVE = "atualizacao"; // { verificadoEm, versao, url }
// Uma hora: com um dia, quem abriu o app logo antes de uma release só via o aviso no dia seguinte.
const INTERVALO_MS = 60 * 60 * 1000;
const TEMPO_LIMITE_MS = 10000;

/** Compara "1.10.0" com "1.9.2" número a número: > 0 se a for mais nova. */
export function compararVersoes(a, b) {
  const pa = String(a).split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diferenca = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diferenca !== 0) return diferenca;
  }
  return 0;
}

/** { versao, url } se a última versão conhecida for mais nova que a instalada; senão null. */
function novaSeHouver(registro) {
  if (!registro?.versao || !registro?.url) return null;
  return compararVersoes(registro.versao, VERSAO_INSTALADA) > 0 ? { versao: registro.versao, url: registro.url } : null;
}

/**
 * Devolve { versao, url } da versão nova (url = o APK da release, ou a página dela),
 * ou null se o app está em dia. Usa a consulta guardada se ela tiver menos de uma hora.
 */
export async function verificarAtualizacao() {
  const salvo = lerLocal(CHAVE);
  if (salvo?.verificadoEm && Date.now() - salvo.verificadoEm < INTERVALO_MS) return novaSeHouver(salvo);

  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    const resposta = await fetch(URL_RELEASE, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controle.signal,
    });
    if (!resposta.ok) return novaSeHouver(salvo);
    const release = await resposta.json();
    const versao = String(release.tag_name ?? "").replace(/^v/i, "");
    const apk = (release.assets ?? []).find((a) => a.name?.toLowerCase().endsWith(".apk"));
    const registro = { verificadoEm: Date.now(), versao, url: apk?.browser_download_url ?? release.html_url };
    gravarLocal(CHAVE, registro);
    return novaSeHouver(registro);
  } catch {
    return novaSeHouver(salvo); // sem internet: vale o que já se sabia
  } finally {
    clearTimeout(temporizador);
  }
}
