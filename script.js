// Utilidades
const $ = (sel) => document.querySelector(sel);

const START_TIME_SECONDS = 30 * 60; // 30:00
let state = {
  pool: [],          // todas as questões carregadas
  questions: [],     // as 20 sorteadas
  idx: 0,            // índice da questão atual
  answers: [],       // índice marcado pelo usuário (ou null)
  timeLeft: START_TIME_SECONDS,
  timerId: null
};

// Embaralhar array in-place (Fisher–Yates)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Formata mm:ss
function fmt(t) {
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = (t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function startTimer() {
  const timerEl = $("#timer");
  timerEl.textContent = `Tempo restante: ${fmt(state.timeLeft)}`;
  state.timerId = setInterval(() => {
    state.timeLeft--;
    timerEl.textContent = `Tempo restante: ${fmt(state.timeLeft)}`;
    if (state.timeLeft <= 0) {
      clearInterval(state.timerId);
      finish();
    }
  }, 1000);
}

function renderQuestion() {
  const q = state.questions[state.idx];
  $("#question-text").textContent = q.enunciado;
  $("#progress").textContent = `Questão ${state.idx + 1} de ${state.questions.length}`;

  const ul = $("#options");
  ul.innerHTML = "";

  q.alternativas.forEach((alt, i) => {
    const li = document.createElement("li");
    const id = `opt-${state.idx}-${i}`;
    li.innerHTML = `
      <input type="radio" id="${id}" name="q${state.idx}" ${state.answers[state.idx] === i ? 'checked' : ''}/>
      <label for="${id}"><strong>${String.fromCharCode(65+i)}.</strong> ${alt}</label>
    `;
    li.querySelector('input').addEventListener('change', () => {
      state.answers[state.idx] = i;
    });
    ul.appendChild(li);
  });

  // Última questão vira "Finalizar"
  $("#next-btn").textContent = (state.idx === state.questions.length - 1) ? "Finalizar" : "Próxima";
}

function next() {
  if (state.idx < state.questions.length - 1) {
    state.idx++;
    renderQuestion();
  } else {
    finish();
  }
}

function finish() {
  // Para o cronômetro (se ainda rodando)
  if (state.timerId) clearInterval(state.timerId);

  // Calcula pontuação
  let acertos = 0;
  state.questions.forEach((q, i) => {
    if (state.answers[i] === q.correta) acertos++;
  });

  // Monta revisão
  const review = $("#review");
  review.innerHTML = "";
  state.questions.forEach((q, i) => {
    const li = document.createElement("li");
    const user = state.answers[i];
    const correta = q.correta;
    const certo = user === correta;

    li.innerHTML = `
      <div><strong>${i+1})</strong> ${q.enunciado}</div>
      <div class="${certo ? 'correct' : 'wrong'}">
        Sua resposta: ${user != null ? `${String.fromCharCode(65+user)}. ${q.alternativas[user]}` : '—'}
      </div>
      <div class="correct">
        Correta: ${String.fromCharCode(65+correta)}. ${q.alternativas[correta]}
      </div>
      <div class="muted">${q.explicacao || ''}</div>
    `;
    review.appendChild(li);
  });

  $("#score").innerHTML = `<h3>Nota: ${acertos}/${state.questions.length}</h3>`;
  // Troca telas
  $("#quiz").classList.add("hidden");
  $("#start-screen").classList.add("hidden");
  $("#end-screen").classList.remove("hidden");
}

// Bootstrap
async function init() {
  // Carrega banco de questões
  const res = await fetch('questions.json', { cache: 'no-store' });
  state.pool = await res.json();

  // Eventos
  $("#start-btn").addEventListener("click", () => {
    // Sorteia 20 ou menos, se o banco tiver menos de 20
    const pool = shuffle([...state.pool]);
    state.questions = pool.slice(0, Math.min(20, pool.length));
    state.answers = Array(state.questions.length).fill(null);
    state.idx = 0;
    state.timeLeft = START_TIME_SECONDS;

    $("#start-screen").classList.add("hidden");
    $("#quiz").classList.remove("hidden");

    startTimer();
    renderQuestion();
  });

  $("#next-btn").addEventListener("click", next);
}

document.addEventListener("DOMContentLoaded", init);
