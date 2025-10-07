// ======= CONFIGURAÇÃO DO TEMPO =======
let tempoRestante = 600; // 10 min (mude para 1800 = 30 min, etc.)
let cronometroId = null;

// ======= ESTADO =======
let perguntas = [];
let idx = 0;                  // índice da questão atual
let respostas = [];           // respostas do usuário (índice da alternativa ou null)

// ======= UTIL =======
const $ = (s) => document.querySelector(s);
const fmt = (t) => {
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = (t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

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
  $("#progress").textContent = `Questão ${idx + 1} de ${perguntas.length}`;
  $("#question-text").textContent = q.pergunta || q.enunciado;

  // Imagem (opcional)
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

  // Alternativas
  const ul = $("#options");
  ul.innerHTML = "";
  (q.alternativas || []).forEach((alt, i) => {
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

  // Botões
  $("#prev-btn").disabled = idx === 0;
  const ultima = idx === (perguntas.length - 1);
  $("#next-btn").classList.toggle("hidden", ultima);
  $("#finish-btn").classList.toggle("hidden", !ultima);
}

function proxima() {
  if (idx < perguntas.length - 1) {
    idx++;
    render();
  }
}
function anterior() {
  if (idx > 0) {
    idx--;
    render();
  }
}

// ======= FINALIZAÇÃO =======
function finalizar(mensagem = null) {
  if (cronometroId) clearInterval(cronometroId);

  // Corrigir
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
        Sua resposta: ${user != null ? `${String.fromCharCode(65+user)}. ${(q.alternativas||[])[user]}` : "—"}
      </div>
      <div class="correct">Correta: ${String.fromCharCode(65+correta)}. ${(q.alternativas||[])[correta]}</div>
      <div class="muted">${q.explicacao || ""}</div>
    `;
    review.appendChild(li);
  });

  $("#score").innerHTML = `<h3>Nota: ${acertos}/${perguntas.length}</h3>${mensagem ? `<p>${mensagem}</p>` : ""}`;

  // Trocar telas
  $("#quiz").classList.add("hidden");
  $("#start-screen").classList.add("hidden");
  $("#end-screen").classList.remove("hidden");
}

// ======= BOOT =======
document.addEventListener("DOMContentLoaded", async () => {
  // Carrega banco
  const res = await fetch("questions.json", { cache: "no-store" });
  perguntas = await res.json();

  // Preparar estado
  const n = perguntas.length;
  respostas = Array(n).fill(null);
  idx = 0;

  // Eventos
  $("#start-btn").addEventListener("click", () => {
    $("#start-screen").classList.add("hidden");
    $("#quiz").classList.remove("hidden");
    iniciarCronometro();
    render();
  });
  $("#next-btn").addEventListener("click", proxima);
  $("#prev-btn").addEventListener("click", anterior);
  $("#finish-btn").addEventListener("click", () => finalizar());
});
