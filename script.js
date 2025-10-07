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

  } else {
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
      li.querySelector("input").addEventListener("change", () => {
        respostas[idx] = i;
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

// ======= FINALIZAÇÃO =======
function finalizar(mensagem = null) {
  if (cronometroId) clearInterval(cronometroId);

  let acertos = 0;
  const review = $("#review");
  review.innerHTML = "";

  perguntas.forEach((q, i) => {
    const tipo = (q.tipo || "").toLowerCase();
    const temImg = q.imagem ? `<img src="${q.imagem}" alt="Imagem da questão" style="max-width:100%;border-radius:8px;margin:8px 0;">` : "";
    let blocoUsuario = "";
    let blocoCorreta = "";

    if (tipo === "dissertativa") {
      const resp = (typeof respostas[i] === "string" && respostas[i].trim().length) ? respostas[i].trim() : "—";
      blocoUsuario = `<div><strong>Sua resposta:</strong> ${escapeHtml(resp)}</div>`;
      blocoCorreta = `<div class="correct"><strong>Gabarito:</strong> ${escapeHtml(q.gabarito || "")}</div>`;
    } else {
      const user = typeof respostas[i] === "number" ? respostas[i] : null;
      const correta = typeof q.correta === "number" ? q.correta : null;
      const certo = (user !== null && correta !== null && user === correta);
      if (certo) acertos++;

      blocoUsuario = `
        <div style="color:${certo ? '#0b7a41' : '#b42318'}">
          Sua resposta: ${user != null ? `${String.fromCharCode(65+user)}. ${(q.alternativas||[])[user]}` : "—"}
        </div>
      `;
      blocoCorreta = `
        <div class="correct">
          Correta: ${correta != null ? `${String.fromCharCode(65+correta)}. ${(q.alternativas||[])[correta]}` : "(não definida no JSON)"}
        </div>
        ${q.gabarito ? `<div class="muted">${escapeHtml(q.gabarito)}</div>` : ""}
      `;
    }

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
    <h3>Nota (objetivas): ${acertos}/${perguntas.filter(q => (q.tipo || "").toLowerCase() !== "dissertativa").length}</h3>
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
