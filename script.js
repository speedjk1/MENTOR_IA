const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('open-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');
const themeToggle = document.getElementById('toggle-theme');
const form = document.getElementById('form');
const input = document.getElementById('input');
const chatBox = document.getElementById('chat');
const clearChatBtn = document.getElementById('clear-chat');
const toneSelect = document.getElementById('tone');
const reflectionTextarea = document.getElementById('daily-reflection');
const sendReflectionBtn = document.getElementById('send-reflection');
const usageDaysEl = document.getElementById('usage-days');
const reflectionsEl = document.getElementById('completed-reflections');
const goalsEl = document.getElementById('goals-status');
const historyUl = document.getElementById('reflection-history');

// Estado de progreso
let daysUsed = 0;
let reflectionsDone = 0;
let goalsDone = 0;

// Prompt base
const SYSTEM_PROMPT =
  "Eres Mentor IA, un asistente amable y motivador. Responde de forma cercana, ofrece consejos y preguntas de seguimiento.";
let conversationHistory = [];

// --- Carga reflexiones previas ---
function loadReflections() {
  const stored = JSON.parse(localStorage.getItem('reflections') || '[]');
  historyUl.innerHTML = '';
  stored.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    historyUl.appendChild(li);
  });
  reflectionsDone = stored.length;
}

// --- Actualiza panel de progreso ---
function updateProgressPanel() {
  usageDaysEl.textContent = daysUsed;
  reflectionsEl.textContent = reflectionsDone;
  goalsEl.textContent = `${goalsDone}/${goalsDone}`;
}

// --- Construir prompt desde historial ---
function buildPrompt() {
  let p = SYSTEM_PROMPT + "\n\n";
  conversationHistory.forEach(entry => {
    if (entry.role === 'user') {
      p += `Usuario: ${entry.content}\n`;
    } else if (entry.role === 'assistant') {
      p += `Asistente: ${entry.content}\n`;
    }
  });
  p += "Asistente:";
  return p;
}

// --- Resetear todo ---
clearChatBtn.addEventListener('click', () => {
  chatBox.innerHTML = '';
  daysUsed = reflectionsDone = goalsDone = 0;
  localStorage.removeItem('reflections');
  conversationHistory = [];
  loadReflections();
  updateProgressPanel();
});

// --- Guardar reflexión ---
sendReflectionBtn.addEventListener('click', () => {
  const text = reflectionTextarea.value.trim();
  if (!text) return;
  const li = document.createElement('li');
  li.textContent = text;
  historyUl.appendChild(li);
  const stored = JSON.parse(localStorage.getItem('reflections') || '[]');
  stored.push(text);
  localStorage.setItem('reflections', JSON.stringify(stored));
  reflectionsDone = stored.length;
  if (daysUsed < 1) daysUsed = 1;
  updateProgressPanel();
  sidebar.classList.remove('open');
  document.querySelector('.main').classList.remove('shifted');
  reflectionTextarea.value = '';
});

// --- Sidebar ---
openSidebarBtn.addEventListener('click', () => {
  sidebar.classList.add('open');
  document.querySelector('.main').classList.add('shifted');
});
closeSidebarBtn.addEventListener('click', () => {
  sidebar.classList.remove('open');
  document.querySelector('.main').classList.remove('shifted');
});

// --- Modo claro/oscuro (INVERTIDO) ---
themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) {
    document.body.classList.remove('light'); // Oscuro
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.add('light'); // Claro
    localStorage.setItem('theme', 'light');
  }
});

// --- Inicialización ---
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    themeToggle.checked = false;
  } else {
    document.body.classList.remove('light');
    themeToggle.checked = true;
  }
  loadReflections();
  updateProgressPanel();
});

// --- Chat + completions API ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  const userDiv = document.createElement('div');
  userDiv.className = 'user';
  userDiv.textContent = message;
  chatBox.appendChild(userDiv);

  conversationHistory.push({ role: 'user', content: message });

  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;
  if (daysUsed < 1) {
    daysUsed = 1;
    updateProgressPanel();
  }

  chatBox.innerHTML += `<div class="bot typing">Escribiendo...</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch(
      "https://c6c8-2803-a3e0-1a01-1520-408c-8607-3a11-559c.ngrok-free.app/v1/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer no-key-needed"
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct-v0.3",
          prompt: buildPrompt(),
          max_tokens: 150,
          temperature: 0.6,
          stop: ["Usuario:", "Asistente:"]
        })
      }
    );
    const data = await res.json();
    const typingDiv = document.querySelector(".typing");
    if (typingDiv) typingDiv.remove();

    const reply = (data.choices?.[0]?.text || "").trim() || "Sin respuesta";

    chatBox.innerHTML += `<div class="bot">${reply}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    conversationHistory.push({ role: 'assistant', content: reply });

  } catch (err) {
    console.error("Error:", err);
    const typingDiv = document.querySelector(".typing");
    if (typingDiv) typingDiv.remove();
    chatBox.innerHTML += `<div class="bot error">Error de conexión</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});