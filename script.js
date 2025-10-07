// ======= CONFIGURAÇÕES =======
let tempoRestante = 600; // 10 min. (mude para 1800 = 30 min, 3600 = 1h)
let cronometroId = null;

// ======= ESTADO =======
let perguntas = [];
let idx = 0;                  // índice da questão atual
let respostas = [];           // para cada questão: string (dissertativa) ou número (índice da alternativa)
const $ = (s) => document.querySelector(s);

// ======= UTIL =======
const fmt = (t) => {
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = (t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

function mostrarErro(msg) {
  const el = $("#start-screen");
  el.innerHTML = `<p style="color:#b42318;"><strong>Erro:</strong> ${msg}</p>`;
}

// ======= CRONÔMETRO =======
function iniciarCronometro() {
  const timerEl = $("#timer");
  timerEl.textContent = `⏱️ Tempo restante: ${fmt(tempoRestante)}`;
  cronometroId = setInterval(() => {
    tempoRestante--;
    timerEl.textContent = `⏱️ Tempo restante: ${fmt(tempoRestante)}`;
    if (tempoRestante <= 0) {
      clearInterval(cronometroId);
      finalizar("⏰ Tempo esgotado!");
    }
  }, 1000);
}

function letraFromIndex(i){ return String.fromCharCode(65 + i); } // 0→A, 1→B...
function indexFromLetra(L){
  if (typeof L !== "string") return -1;
  const s = L.trim().toUpperCase();
  return /^[A-Z]$/.test(s) ? (s.charCodeAt(0) - 65) : -1;
}

// Descobre o índice correto do gabarito (aceita letra "A-D", índice 0..n ou texto da alternativa)
function resolveGabaritoIndex(q){
  if (!Array.isArray(q.alternativas)) return -1;
  if (typeof q.gabarito === "number") return q.gabarito;
  if (typeof q.gabarito === "string"){
    const s = q.gabarito.trim();
    const byLetter = indexFromLetra(s);
    if (byLetter >= 0) return byLetter;
    const byText = q.alternativas.findIndex(a => String(a).trim() === s);
    if (byText >= 0) return byText;
  }
  return -1;
}

// Converte a resposta do usuário para índice (aceita letra, índice ou texto)
function resolveRespostaIndex(q, resp){
  if (!Array.isArray(q.alternativas)) return -1;
  if (typeof resp === "number") return resp;
  if (typeof resp === "string"){
    const s = resp.trim();
    const byLetter = indexFromLetra(s);
    if (byLetter >= 0) return byLetter;
    const byText = q.alternativas.findIndex(a => String(a).trim() === s);
    if (byText >= 0) return byText;
    const asNum = Number(s);
    if (!Number.isNaN(asNum)) return asNum;
  }
  return -1;
}

// ======= RENDERIZAÇÃO DE UMA QUESTÃO =======
function render() {
  const q = perguntas[idx];
  if (!q) { mostrarErro("Não há questão para exibir."); return; }

  // enunciado
  $("#question-text").textContent = q.pergunta || q.enunciado || "(sem enunciado)";

  // imagem (opcional)
  const img = $("#question-image");
  if (q.imagem) {
    img.src = q.imagem;
    img.alt = "Imagem da questão";
    img.classList.remove("hidden");
  } else {
    img.classList.add("hidden");
    img.removeAttribute("src");
    img.removeAttribute("alt");
  }

  // área de respostas
  const ul = $("#options");
  ul.innerHTML = "";

  // Limpa qualquer textarea anterior
  const oldText = document.getElementById("resposta-dissertativa");
  if (oldText) oldText.remove();

  // Decide pelo tipo
  const tipo = (q.tipo || "").toLowerCase();

  if (tipo === "dissertativa") {
    // Campo de texto para resposta aberta
    const ta = document.createElement("textarea");
    ta.id = "resposta-dissertativa";
    ta.rows = 8;
    ta.placeholder = "Digite sua resposta aqui...";
    ta.style.width = "100%";
    ta.style.padding = "10px";
    ta.style.border = "1px solid #e5d5b8";
    ta.style.borderRadius = "8px";
    ta.style.boxSizing = "border-box";
    ta.value = typeof respostas[idx] === "string" ? respostas[idx] : "";
    ta.addEventListener("input", () => {
      respostas[idx] = ta.value;
    });
    // Insere logo abaixo das alternativas (a UL está vazia mesmo)
    ul.parentNode.insertBefore(ta, ul.nextSibling);

  } // ==== OBJETIVA (múltipla escolha) ====
// Garante que as alternativas aparecem como radios e salvam o índice marcado
ul.innerHTML = ""; // zera a UL caso venha de outra questão

q.alternativas.forEach((textoAlt, iAlt) => {
  const li = document.createElement("li");

  const idRadio = `q${idx}-alt${iAlt}`;

  const input = document.createElement("input");
  input.type = "radio";
  input.name = `q${idx}`;       // MESMO name para todas as alternativas da mesma questão
  input.id = idRadio;
  input.value = iAlt;           // valor = índice da alternativa
  input.checked = (respostas[idx] === iAlt);

  // >>> ESTE É O PONTO-CHAVE: salva o índice escolhido (0..n)
  input.addEventListener("change", () => {
    respostas[idx] = iAlt;
  });

  const label = document.createElement("label");
  label.setAttribute("for", idRadio);
  label.innerHTML = `<strong>${String.fromCharCode(65 + iAlt)})</strong> ${escapeHtml(textoAlt)}`;

  li.appendChild(input);
  li.appendChild(label);
  ul.appendChild(li);
});
 {
    // Múltipla escolha (default)
    if (!Array.isArray(q.alternativas) || q.alternativas.length === 0) {
      mostrarErro("Questão de múltipla escolha sem 'alternativas'. Verifique o questions.json.");
      return;
    }
    q.alternativas.forEach((alt, i) => {
      const id = `q${idx}-alt${i}`;
      const li = document.createElement("li");
      li.innerHTML = `
        <input type="radio" id="${id}" name="q${idx}" ${respostas[idx] === i ? "checked" : ""}>
        <label for="${id}"><strong>${String.fromCharCode(65+i)}.</strong> ${alt}</label>
      `;
input.addEventListener("change", () => {
  respostas[idxPergunta] = iAlternativa; // salva o índice (0..n)
});

      ul.appendChild(li);
    });
  }

  // botões
  $("#prev-btn").disabled = idx === 0;
  const ultima = idx === (perguntas.length - 1);
  $("#next-btn").classList.toggle("hidden", ultima);
  $("#finish-btn").classList.toggle("hidden", !ultima);
}

// ======= NAVEGAÇÃO =======
function proxima() { if (idx < perguntas.length - 1) { idx++; render(); } }
function anterior() { if (idx > 0) { idx--; render(); } }

function normalizar(txt) {
  return String(txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}

function confereAceitaveis(respostaUsuario, aceitaveis) {
  if (!respostaUsuario || !Array.isArray(aceitaveis) || aceitaveis.length === 0) return false;
  const resp = normalizar(respostaUsuario);
  return aceitaveis.some(padrao => {
    const p = normalizar(padrao);
    try {
      // Se o padrão parecer uma regex (contém metacaracteres), use como regex
      const isRegex = /[.*+?^${}()|[\]\\]/.test(p);
      if (isRegex) {
        const re = new RegExp(p, "i"); // já normalizado; o "i" aqui é redundante
        return re.test(resp);
      }
      // Caso contrário, procura substring simples
      return resp.includes(p);
    } catch {
      return resp.includes(p);
    }
  });
}

function letraFromIndex(i){ return String.fromCharCode(65 + i); } // 0->A, 1->B...
function indexFromLetra(L){
  if (typeof L !== "string") return -1;
  const m = L.trim().toUpperCase().match(/^[A-Z]$/);
  return m ? (L.toUpperCase().charCodeAt(0) - 65) : -1;
}

/* Descobre o índice correto do gabarito da questão objetiva:
   - aceita "A"/"B"/...  ou  número 0..n  ou  o texto da alternativa */
function resolveGabaritoIndex(q){
  if (!Array.isArray(q.alternativas)) return -1;

  if (typeof q.gabarito === "number") {
    return q.gabarito; // já é índice
  }
  if (typeof q.gabarito === "string") {
    const g = q.gabarito.trim();
    const byLetter = indexFromLetra(g);
    if (byLetter >= 0) return byLetter;
    const byText = q.alternativas.findIndex(a => String(a).trim() === g);
    if (byText >= 0) return byText;
  }
  return -1;
}

/* Converte a resposta do usuário em índice (0..n),
   aceitando letra, índice ou texto da alternativa */
function resolveRespostaIndex(q, resp){
  if (!Array.isArray(q.alternativas)) return -1;

  if (typeof resp === "number") return resp;
  if (typeof resp === "string") {
    const r = resp.trim();
    const byLetter = indexFromLetra(r);
    if (byLetter >= 0) return byLetter;
    const byText = q.alternativas.findIndex(a => String(a).trim() === r);
    if (byText >= 0) return byText;
    const asNum = Number(r);
    if (!Number.isNaN(asNum)) return asNum;
  }
  return -1;
}

// ======= FINALIZAÇÃO =======
function finalizar(mensagem = null) {
  if (cronometroId) clearInterval(cronometroId);

  let acertos = 0;
  const review = $("#review");
  review.innerHTML = "";

perguntas.forEach((q, i) => {
  const tipo = (q.tipo || "").toLowerCase();
  let blocoUsuario = "";
  let blocoCorreta = "";

  if (tipo === "dissertativa") {
    const resp = (typeof respostas[i] === "string" && respostas[i].trim().length) ? respostas[i].trim() : "—";

    // se tiver palavras-chave aceitáveis, corrige automaticamente
    let acertou = false;
    if (Array.isArray(q.aceitaveis) && q.aceitaveis.length > 0) {
      acertou = confereAceitaveis(resp, q.aceitaveis);
    }
    if (acertou) acertos++;

    blocoUsuario = `<div style="color:${acertou ? '#0b7a41' : '#b42318'}"><strong>Sua resposta:</strong> ${escapeHtml(resp)}</div>`;
    blocoCorreta = `<div class="correct"><strong>Gabarito:</strong> ${escapeHtml(q.gabarito || "")}</div>`;

  } else if (Array.isArray(q.alternativas)) {
    // OBJETIVA
    const correctIdx = resolveGabaritoIndex(q);
    const respIdx = resolveRespostaIndex(q, respostas[i]);

    const acertou = (correctIdx >= 0 && respIdx === correctIdx);
    if (acertou) acertos++;

    const respLabel = (respIdx >= 0)
      ? `${letraFromIndex(respIdx)} - ${escapeHtml(q.alternativas[respIdx])}`
      : "—";

    const gabaritoLabel = (correctIdx >= 0)
      ? `${letraFromIndex(correctIdx)} - ${escapeHtml(q.alternativas[correctIdx])}`
      : escapeHtml(q.gabarito || "");

    blocoUsuario = `<div style="color:${acertou ? '#0b7a41' : '#b42318'}"><strong>Sua resposta:</strong> ${respLabel}</div>`;
    blocoCorreta = `<div class="correct"><strong>Gabarito:</strong> ${gabaritoLabel}</div>`;
  }

  // aqui você já deve estar montando o <li> da revisão:
  li.innerHTML = `${escapeHtml(q.pergunta)}
    ${q.imagem ? `<div class="img-wrap"><img src="${escapeHtml(q.imagem)}" class="imagem" /></div>` : ""}
    ${blocoUsuario}
    ${blocoCorreta}`;
});




    const li = document.createElement("li");
    li.innerHTML = `
      <div><strong>${i + 1})</strong> ${q.pergunta || q.enunciado || ""}</div>
      ${temImg}
      ${blocoUsuario}
      ${blocoCorreta}
      ${q.complemento ? `<div class="muted">${escapeHtml(q.complemento)}</div>` : ""}
    `;
    review.appendChild(li);
  });

  $("#score").innerHTML = `
  <h3>Nota: ${acertos}/${perguntas.length}</h3>
  ${mensagem ? `<p>${mensagem}</p>` : ""}
`;


  $("#quiz").classList.add("hidden");
  $("#start-screen").classList.add("hidden");
  $("#end-screen").classList.remove("hidden");
}

// Pequena ajuda para evitar HTML acidental nas respostas
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
// Normaliza: minúsculas e sem acentos
function normalizar(txt) {
  return String(txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}

// Confere grupos de palavras-chave aceitáveis
// Cada item de "aceitaveis" pode ser:
// - um array ["palavra1", "palavra2", ...] => TODAS devem aparecer
// - ou uma string "palavra" => basta aparecer
function confereAceitaveis(respostaUsuario, aceitaveis) {
  if (!respostaUsuario || !Array.isArray(aceitaveis) || aceitaveis.length === 0) return false;
  const resp = normalizar(respostaUsuario);

  return aceitaveis.some(grupo => {
    if (Array.isArray(grupo)) {
      return grupo.every(palavra => resp.includes(normalizar(palavra)));
    } else {
      return resp.includes(normalizar(grupo));
    }
  });
}

// ======= INICIALIZAÇÃO =======
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("questions.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      mostrarErro("Nenhuma questão encontrada em questions.json.");
      return;
    }

    perguntas = data;
    respostas = data.map(q => ((q.tipo || "").toLowerCase() === "dissertativa" ? "" : null));
    idx = 0;

    $("#start-btn").addEventListener("click", () => {
      $("#start-screen").classList.add("hidden");
      $("#quiz").classList.remove("hidden");
      iniciarCronometro();
      render();
    });
    $("#next-btn").addEventListener("click", proxima);
    $("#prev-btn").addEventListener("click", anterior);
    $("#finish-btn").addEventListener("click", () => finalizar());

  } catch (e) {
    mostrarErro("Falha ao carregar questions.json. Verifique o nome, o caminho e o formato. " + e.message);
  }
});


