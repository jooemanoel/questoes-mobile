// Gera os ícones do app Android a partir do mesmo símbolo do PWA (projeto Vue):
// "quiz" do Material Symbols (Google).
// Fonte: https://fonts.google.com/icons?selected=Material+Symbols+Rounded:quiz:FILL@1
// Uso: npm run icones   (grava em assets/)
const { writeFileSync } = require("node:fs");
const { join } = require("node:path");
const sharp = require("sharp");

const COR_FUNDO = "#2f5bd3"; // mesma cor de destaque do tema
const COR_SIMBOLO = "#ffffff";

// Desenho original do símbolo (viewBox 0 -960 960 960).
const SIMBOLO_QUIZ =
  "M572-352q12-12 12-29t-12-29q-12-12-29-12t-29 12q-12 12-12 29t12 29q12 12 29 12t29-12Zm-30-114q10 0 16.5-6.5T567-489q2-14 11-27.5t28-31.5q28-27 38-46t10-45q0-46-31.5-75T540-743q-32 0-59 15t-43 42q-5 8-1 17t14 14q9 4 18 .5t15-11.5q11-16 25-23.5t31-7.5q29 0 48 17t19 43q0 19-9 33.5T566-570q-22 18-33.5 38.5T519-489q-1 9 6 16t17 7ZM260-200q-24 0-42-18t-18-42v-560q0-24 18-42t42-18h560q24 0 42 18t18 42v560q0 24-18 42t-42 18H260ZM140-80q-24 0-42-18t-18-42v-590q0-13 8.5-21.5T110-760q13 0 21.5 8.5T140-730v590h590q13 0 21.5 8.5T760-110q0 13-8.5 21.5T730-80H140Z";

/**
 * @param tamanho   lado em pixels
 * @param proporcao fração do lado ocupada pelo símbolo
 * @param fundo     cor do fundo ou null (transparente)
 * @param cantos    raio dos cantos do fundo
 * @param cor       cor do símbolo
 */
function svg(tamanho, proporcao, fundo, cantos = 0, cor = COR_SIMBOLO) {
  const lado = tamanho * proporcao;
  const margem = (tamanho - lado) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 ${tamanho} ${tamanho}">
  ${fundo ? `<rect width="${tamanho}" height="${tamanho}" rx="${cantos}" fill="${fundo}"/>` : ""}
  <svg x="${margem}" y="${margem}" width="${lado}" height="${lado}" viewBox="0 -960 960 960">
    <path d="${SIMBOLO_QUIZ}" fill="${cor}"/>
  </svg>
</svg>`;
}

const ICONES = {
  // Ícone geral (iOS / lojas): quadrado cheio, o sistema arredonda.
  "icon.png": svg(1024, 0.6, COR_FUNDO),
  // Ícone adaptativo do Android: só ~66% central fica sempre visível.
  "android-icon-foreground.png": svg(1024, 0.42, null),
  "android-icon-background.png": svg(1024, 0, COR_FUNDO),
  "android-icon-monochrome.png": svg(1024, 0.42, null, 0, "#000000"),
  // Splash: símbolo branco sobre o fundo azul (definido no app.json).
  "splash-icon.png": svg(512, 0.9, null),
  "favicon.png": svg(48, 0.72, COR_FUNDO, 10),
};

(async () => {
  for (const [nome, conteudo] of Object.entries(ICONES)) {
    const destino = join(__dirname, "../assets", nome);
    writeFileSync(destino, await sharp(Buffer.from(conteudo)).png().toBuffer());
    console.log(`Gerado assets/${nome}`);
  }
})();
