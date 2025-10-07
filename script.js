// ======= CONFIG =======
let tempoRestante = 600; // 10 min
let cronometroId = null;

let perguntas = [];
let idx = 0;
let respostas = [];

// ======= UTILS =======
const $ = (s) => document.querySelector(s);
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

// ======= RENDER =======
function render() {
  const q = perguntas[idx];
  if (!q) { mostrarErro("Não há questão para exibir."); return; }

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

  // alternativas
  const ul = $("#options");
  ul.innerHTML = "";
  if (!Array.isArray(q.alternativas)) {
    mostrarErro("A questão não tem 'alternativas' como array.");
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

  // botões
  $("#prev-btn").disabled = idx === 0;
  const ultima = idx === (perguntas.length - 1);
  $("#next-btn").classList.toggle("hidden", ultima);
  $("#finish-btn").classList.toggle("hidden", !ultima);
}

function proxima() { if (idx < perguntas.length - 1) { idx++; render(); } }
function anterior() { if (idx > 0) { idx--; render(); } }

// ======= FINAL =======
function finalizar(mensagem = null) {
  if (cronometroId) clearInterval(cronometroId);

  let acertos = 0;
  const review = $("#review");
  review.innerHTML = "";

  perguntas.forEach((q, i) => {
    const correta = q.correta;
    const user = respostas[i];
    if (user === correta) acertos++;

    const li = document.createElement("li");
    li.innerHTML = `
      <div><strong>${i + 1})</strong> ${q.pergunta || q.enunciado}</div>
      ${q.imagem ? `<img src="${q.imagem}" alt="Imagem da questão" style="max-width:100%;border-radius:8px;margin:8px 0;">` : ""}
      <div style="color:${user === correta ? '#0b7a41' : '#b42318'}">
        Sua resposta: ${user != null ? `${String.fromCharCode(65+user)}. ${q.alternativas[user]}` : "—"}
      </div>
      <div class="correct">Correta: ${String.fromCharCode(65+correta)}. ${q.alternativas[correta]}</div>
      <div class="muted">${q.explicacao || ""}</div>
    `;
    review.appendChild(li);
  });

  $("#score").innerHTML = `<h3>Nota: ${acertos}/${perguntas.length}</h3>${mensagem ? `<p>${mensagem}</p>` : ""}`;
  $("#quiz").classList.add("hidden");
  $("#start-screen").classList.add("hidden");
  $("#end-screen").classList.remove("hidden");
}

// ======= BOOT =======
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("questions.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      mostrarErro("Nenhuma questão encontrada no questions.json.");
      return;
    }

    perguntas = data;
    respostas = Array(perguntas.length).fill(null);
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
    mostrarErro("Falha ao carregar questions.json. Verifique o nome, o caminho e o JSON. " + e.message);
  }
});
