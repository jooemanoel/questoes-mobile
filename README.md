# Questões Rápidas (React Native)

Questões de **Certo ou Errado** no estilo Cebraspe para Android, feita em React Native
com Expo (SDK 58). Equivalente ao [questoes-rapidas](https://github.com/jooemanoel/questoes-rapidas)
(Vue/PWA): usa a mesma API ([questoes-rapidas-api](https://github.com/jooemanoel/questoes-rapidas-api)),
as mesmas regras de sessão e de histórico e as mesmas cores.

## Instalação

Baixe o APK da [última release](https://github.com/jooemanoel/questoes-rapidas-rn/releases/latest)
direto no celular e abra o arquivo. Requer Android 7.0 ou superior.

## Comandos

```bash
npm install
npm start          # servidor de desenvolvimento: ler o QR code com o app Expo Go no celular
npm run android    # compila e instala no emulador/celular via USB (precisa do Android SDK)
npm run lint       # ESLint (regras do Expo)
npm run icones     # regera os ícones e a splash em assets/
```

### API

Por padrão o app usa a API publicada (`https://questoes-rapidas-api.vercel.app`). Para
usar outra (por exemplo, a API rodando no seu computador), copie o
[.env.example](.env.example) para `.env.local` e ajuste `EXPO_PUBLIC_API_URL`. No emulador
Android, o `localhost` do computador é `10.0.2.2`; num celular, use o IP do computador na
rede local. O valor é embutido no app na hora do build.

## Gerar o APK

### Opção 1: na nuvem com EAS (não precisa de Android SDK)

```bash
npx eas-cli@latest login         # conta gratuita em expo.dev
npm run apk                      # = eas build -p android --profile apk
```

No primeiro build o EAS pergunta se pode criar o projeto e a chave de assinatura;
responda que sim. Ao final, ele mostra um link (e um QR code) para baixar o `.apk`.
O perfil `production` do [eas.json](eas.json) gera `.aab` para a Play Store.

### Opção 2: local (precisa do Android SDK)

Os requisitos são os mesmos do [biblia-simples-rn](https://github.com/jooemanoel/biblia-simples-rn#op%C3%A7%C3%A3o-2--local-precisa-do-android-sdk):
JDK 17 a 21, Android SDK com `cmake/3.31.6` e caminhos longos ativos no Windows.

```bash
npm run apk:local
# APK em android/app/build/outputs/apk/release/app-release.apk
```

O `prebuild --clean` apaga e recria a pasta `android/` a partir do [app.json](app.json)
(ela não é versionada: não edite à mão), então copie o APK para outro lugar antes de gerar
outro. Sem uma chave própria, o release local é assinado com a chave de depuração: serve
para instalar no seu celular, não para publicar na loja. O plugin
[plugins/cmake-recente.js](plugins/cmake-recente.js) é o mesmo do biblia-simples-rn.

## Estrutura

```
App.js                            tela única: cabeçalho, etapas e rolagem
src/estado/useQuestionario.js     estado e regras da sessão (= composable da versão Vue)
src/servicos/api.js               acesso à API e cópia local das questões
src/servicos/historico.js         questões já respondidas
src/servicos/armazenamento.js     gravação no aparelho (expo-sqlite/kv-store)
src/componentes/                  escolha da disciplina, questão, crítica, placar, botão
src/estilos.js                    cores e estilos (equivale ao estilo.css)
```

## Diferenças em relação à versão Vue

| | Vue (PWA) | React Native |
|---|---|---|
| Dados locais | `localStorage` | `expo-sqlite/kv-store` (mesmas chaves e formato) |
| Tópicos do edital | cache do navegador / service worker | última cópia salva no aparelho: abre sem internet |
| Confirmação | `confirm()` | `Alert` nativo |
| Atalhos | `C`, `E` e `Enter` no teclado | botão "voltar" do Android volta à escolha da disciplina |
| Rolagem | página inteira | volta ao topo a cada questão e desce até a crítica ao responder |
| Rede | sem limite de tempo | desiste após 15 s, com mensagem de erro clara |
