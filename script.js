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

// Estado de progreso y reflexiones
let daysUsed = 0;
let reflectionsDone = 0;
let goalsDone = 0;

// --- “Personalidad” y conversación en texto plano ---
const SYSTEM_PROMPT = 
  "Eres Mentor IA, un asistente amable y motivador. Responde de forma cercana, ofrece consejos y preguntas de seguimiento.";
let conversationHistory = [];  // esta será una lista de objetos {role, content}

// --- Utilidades de reflexiones y progreso ---
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
function updateProgressPanel() {
  usageDaysEl.textContent = daysUsed;
  reflectionsEl.textContent = reflectionsDone;
  goalsEl.textContent = `${goalsDone}/${goalsDone}`;
}

// --- Build prompt de completions ---
function buildPrompt() {
  // Inicia con el sistema
  let p = SYSTEM_PROMPT + "\n\n";
  // Añade cada turno
  conversationHistory.forEach(entry => {
    if (entry.role === 'user') {
      p += `Usuario: ${entry.content}\n`;
    } else if (entry.role === 'assistant') {
      p += `Asistente: ${entry.content}\n`;
    }
  });
  // Dejamos al asistente listo para responder
  p += "Asistente:";
  return p;
}

// --- Eventos de UI ---
// Reset total
clearChatBtn.addEventListener('click', () => {
  chatBox.innerHTML = '';
  daysUsed = reflectionsDone = goalsDone = 0;
  localStorage.removeItem('reflections');
  conversationHistory = [];
  loadReflections();
  updateProgressPanel();
});

// Enviar reflexión
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

// Sidebar open/close
openSidebarBtn.addEventListener('click', () => {
  sidebar.classList.add('open');
  document.querySelector('.main').classList.add('shifted');
});
closeSidebarBtn.addEventListener('click', () => {
  sidebar.classList.remove('open');
  document.querySelector('.main').classList.remove('shifted');
});

// Tema
themeToggle.addEventListener('change', () => {
  document.body.classList.toggle('light');
  localStorage.setItem(
    'theme',
    document.body.classList.contains('light') ? 'light' : 'dark'
  );
});

// Inicialización
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
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

  // Mostrar mensaje del usuario
  const userDiv = document.createElement('div');
  userDiv.className = 'user';
  userDiv.textContent = message;
  chatBox.appendChild(userDiv);

  // Añadir al historial
  conversationHistory.push({ role: 'user', content: message });

  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;
  if (daysUsed < 1) {
    daysUsed = 1;
    updateProgressPanel();
  }

  // Indicador
  chatBox.innerHTML += `<div class="bot typing">Escribiendo...</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    // Llamada a completions en lugar de chat/completions
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
          stop: ["Usuario:", "Asistente:"]  // opcional para cortar bien
        })
      }
    );
    const data = await res.json();
    // Quitar indicador
    const typingDiv = document.querySelector(".typing");
    if (typingDiv) typingDiv.remove();

    const reply = (data.choices?.[0]?.text || "").trim() || "Sin respuesta";

    // Mostrar respuesta
    chatBox.innerHTML += `<div class="bot">${reply}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    // Guardar en historial
    conversationHistory.push({ role: 'assistant', content: reply });

  } catch (err) {
    console.error("Error:", err);
    const typingDiv = document.querySelector(".typing");
    if (typingDiv) typingDiv.remove();
    chatBox.innerHTML += `<div class="bot error">Error de conexión</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

/*ultimo cambio*/