// Monta o caderno para imprimir como uma página HTML, que o expo-print converte em PDF
// (ou manda para a impressão do Android). O layout é o mesmo do questoes-web
// (CadernoImpressao.vue): questões numeradas e agrupadas por disciplina e, em página
// nova, o gabarito e os comentários.
//
// Todo texto que vem das questões passa por escapar(): "List<Integer>" precisa sair
// como está, e não virar uma tag.
import { agruparPorDisciplina } from "./selecao";

/** "A", "B", "C"... para a alternativa de índice i. */
const letra = (i) => String.fromCharCode(65 + i);

const ENTIDADES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

/**
 * O comentário começa com "Gabarito: X." ou "Certo."/"Errado.", que o título da entrada
 * já mostra. Tira esse começo só quando ele confere com o gabarito.
 */
export function comentarioSemGabarito(questao, multiplaEscolha) {
  const texto = questao.comentario || "";
  const prefixo = multiplaEscolha
    ? new RegExp(`^Gabarito:\\s*${questao.gabarito}\\.\\s*`)
    : questao.gabarito === "C"
      ? /^Certo\.\s*/
      : /^Errado\.\s*/;
  return texto.replace(prefixo, "") || "Sem comentário.";
}

/**
 * concurso: { nome, banca, formato }
 * caderno:  { simulado, quantidade, questoes, geradoEm }
 * topicos:  lista plana do conteudo.json
 * rotulo:   nome da seleção ("2.1 LEGISLAÇÃO…" ou "Simulado da prova (40 questões)")
 */
export function montarHtmlCaderno({ concurso, caderno, topicos, rotulo }) {
  const multipla = concurso.formato === "multipla-escolha";
  const tituloDe = new Map(topicos.map((t) => [t.id, t.titulo]));
  const grupos = agruparPorDisciplina(caderno.questoes, topicos);
  const numeradas = grupos.flatMap((g) => g.questoes);
  const total = caderno.questoes.length;
  const naoRevisadas = caderno.questoes.filter((q) => !q.revisada).length;
  const data = caderno.geradoEm.toLocaleDateString("pt-BR");

  const avisoIa =
    naoRevisadas === total
      ? " As questões foram geradas por IA e ainda não foram revisadas."
      : naoRevisadas > 0
        ? ` ${naoRevisadas} das questões foram geradas por IA e ainda não foram revisadas.`
        : "";

  const questao = ({ numero, questao: q }) => `
    <div class="questao">
      <p class="numero">${numero}</p>
      <div class="corpo">
        ${q.textoBase ? `<blockquote class="texto-base">${escapar(q.textoBase)}</blockquote>` : ""}
        ${q.codigo ? `<pre class="codigo"><code>${escapar(q.codigo)}</code></pre>` : ""}
        <p class="enunciado">${escapar(q.enunciado)}</p>
        ${
          q.alternativas.length
            ? `<ol class="alternativas">${q.alternativas
                .map((texto, i) => `<li><span class="letra">(${letra(i)})</span><span>${escapar(texto)}</span></li>`)
                .join("")}</ol>`
            : `<p class="certo-errado">( &nbsp; ) Certo &nbsp;&nbsp;&nbsp; ( &nbsp; ) Errado</p>`
        }
      </div>
    </div>`;

  const intervalo = (g) => (g.primeira === g.ultima ? `Questão ${g.primeira}` : `Questões ${g.primeira} a ${g.ultima}`);

  const comentario = ({ numero, questao: q }) => {
    const gabarito = multipla ? q.gabarito : q.gabarito === "C" ? "Certo" : "Errado";
    const topico = tituloDe.get(q.topicoId);
    return `
    <div class="comentario">
      <p class="comentario-titulo"><strong>${numero}. Gabarito: ${gabarito}</strong>
        <span class="referencia">${escapar(q.id)}${topico ? ` · ${escapar(topico)}` : ""}</span></p>
      <p class="comentario-texto">${escapar(comentarioSemGabarito(q, multipla))}</p>
    </div>`;
  };

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(`Caderno - ${concurso.nome} - ${caderno.simulado ? "Simulado" : rotulo}`)}</title>
<style>${CSS}</style>
</head>
<body>
  <header class="cabecalho">
    <p class="concurso">${escapar(concurso.nome)}</p>
    <h1>${escapar(caderno.simulado ? "Simulado da prova" : rotulo)}</h1>
    <p class="dados">${total} ${total === 1 ? "questão" : "questões"} · ${multipla ? "múltipla escolha" : "Certo ou Errado"} · gerado em ${data}</p>
    <p class="instrucao">${
      multipla ? "Em cada questão, assinale a única alternativa correta." : "Julgue cada item como certo (C) ou errado (E)."
    } O gabarito e os comentários estão no final do caderno.</p>
    <p class="aviso">Material de estudo, não é prova oficial${
      concurso.banca ? ` da banca ${escapar(concurso.banca)}` : ""
    }.${avisoIa}</p>
  </header>

  ${grupos
    .map(
      (g) => `
  <section class="disciplina">
    <h2>${escapar(g.titulo)} <span class="intervalo">${intervalo(g)}</span></h2>
    ${g.questoes.map(questao).join("")}
  </section>`
    )
    .join("")}

  <section class="gabarito">
    <h2>Gabarito</h2>
    <ol class="grade">${numeradas
      .map(({ numero, questao: q }) => `<li><span class="grade-numero">${numero}</span> ${escapar(q.gabarito)}</li>`)
      .join("")}</ol>
    <h2>Comentários</h2>
    ${numeradas.map(comentario).join("")}
  </section>
</body>
</html>`;
}

// O mesmo visual do caderno do questoes-web, só com as regras de impressão.
const CSS = `
@page { size: A4; margin: 16mm 15mm 18mm; }
* { box-sizing: border-box; }
body {
  margin: 0;
  color: #1a1a1a;
  background: #fff;
  font-family: system-ui, Roboto, "Noto Sans", sans-serif;
  font-size: 10.5pt;
  line-height: 1.45;
}
p { margin: 0; }
.cabecalho { border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 18px; }
.cabecalho h1 { font-size: 15pt; margin: 2px 0 4px; }
.cabecalho p { margin: 2px 0; }
.concurso { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.04em; color: #555; }
.dados, .aviso { font-size: 9pt; color: #555; }
.instrucao { font-weight: 600; }

h2 {
  font-size: 11pt;
  margin: 22px 0 10px;
  padding: 4px 0;
  border-bottom: 1px solid #bbb;
  break-after: avoid;
  page-break-after: avoid;
}
.intervalo { font-weight: 400; font-size: 9pt; color: #555; margin-left: 8px; }

.questao {
  display: grid;
  grid-template-columns: 2.2em 1fr;
  gap: 0 6px;
  margin: 0 0 16px;
  break-inside: avoid;
  page-break-inside: avoid;
}
.numero { font-weight: 700; }
.enunciado { margin: 0 0 6px; white-space: pre-line; }
.texto-base { margin: 0 0 8px; padding: 6px 12px; border-left: 3px solid #bbb; white-space: pre-line; }
.codigo {
  margin: 0 0 8px;
  padding: 8px 10px;
  border: 1px solid #bbb;
  border-radius: 4px;
  font-family: "Droid Sans Mono", "Roboto Mono", monospace;
  font-size: 8.5pt;
  line-height: 1.35;
  white-space: pre-wrap;
}
.alternativas { list-style: none; margin: 0; padding: 0; }
.alternativas li { display: grid; grid-template-columns: 2.2em 1fr; margin: 2px 0; }
.letra { font-weight: 600; }
.certo-errado { margin-top: 4px; font-weight: 600; }

.gabarito { break-before: page; page-break-before: always; }
.gabarito > h2:first-child { margin-top: 0; }
.grade {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(4.2em, 1fr));
  gap: 4px 8px;
  font-weight: 600;
}
.grade-numero { display: inline-block; min-width: 1.8em; font-weight: 400; color: #555; }
.comentario { margin: 0 0 12px; break-inside: avoid; page-break-inside: avoid; }
.comentario-titulo { margin-bottom: 2px; }
.referencia { font-size: 9pt; color: #555; margin-left: 8px; }
.comentario-texto { white-space: pre-line; }
`;
