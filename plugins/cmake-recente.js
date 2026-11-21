// Config plugin: faz o build nativo do Android usar um CMake mais novo que o padrão
// do Android Gradle Plugin (3.22.1).
//
// Motivo: o ninja que vem no CMake 3.22.1 (1.10.2) não aceita caminhos com mais de
// 260 caracteres no Windows, e o código gerado das bibliotecas nativas (ex.:
// react-native-safe-area-context) passa disso:
//   "ninja: error: Stat(...ComponentDescriptors.cpp.o): Filename longer than 260 characters"
// O CMake 3.31.6 traz o ninja 1.12.1, que aceita (com LongPathsEnabled=1 no Windows).
//
// Instale a versão no SDK: sdkmanager "cmake/3.31.6"
// Uso no app.json: ["./plugins/cmake-recente", { "versao": "3.31.6" }]
const { withProjectBuildGradle } = require("expo/config-plugins");

const MARCA = "// cmake-recente";

module.exports = function cmakeRecente(config, { versao = "3.31.6" } = {}) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy" || cfg.modResults.contents.includes(MARCA)) return cfg;
    // Vale para o app e para todas as bibliotecas Android que compilam código nativo.
    const bloco = `${MARCA}: ver plugins/cmake-recente.js
subprojects {
  ["com.android.application", "com.android.library"].each { id ->
    plugins.withId(id) {
      android.externalNativeBuild.cmake.version = "${versao}"
    }
  }
}

`;
    // Precisa vir antes do plugin raiz do React Native, que força a avaliação dos
    // subprojetos (depois disso o Gradle não aceita mais trocar a versão).
    const raizRN = 'apply plugin: "com.facebook.react.rootproject"';
    const c = cfg.modResults.contents;
    cfg.modResults.contents = c.includes(raizRN) ? c.replace(raizRN, bloco + raizRN) : c + "\n" + bloco;
    return cfg;
  });
};
