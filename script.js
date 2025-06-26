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

// --- Estado local ---
let daysUsed = 0;
let reflectionsDone = 0;
let goalsDone = 0;

// --- Funciones de utilidad ---
function updateProgressPanel() {
  usageDaysEl.textContent = daysUsed;
  reflectionsEl.textContent = reflectionsDone;
  goalsEl.textContent = `${goalsDone}/${goalsDone}`;
}

// --- Borrar chat y resetear contadores ---
clearChatBtn.addEventListener('click', () => {
  chatBox.innerHTML = '';
  daysUsed = 0;
  reflectionsDone = 0;
  goalsDone = 0;
  updateProgressPanel();
});

sendReflectionBtn.addEventListener('click', () => {
  const text = reflectionTextarea.value.trim();
  if (!text) return;

  /* Change: Ahora, la reflexión se añade al historial, no al chat */ 
  const historyUl = document.getElementById('reflection-history');
  const li = document.createElement('li');
  li.textContent = text;
  historyUl.appendChild(li);

  // Actualizar contadores
  reflectionsDone++;
  if (daysUsed < 1) daysUsed = 1;
  updateProgressPanel();

  // Cerrar sidebar para que veas el historial
  sidebar.classList.remove('open');

  // Limpiar textarea
  reflectionTextarea.value = '';
});

// --- Sidebar open/close ---
openSidebarBtn.addEventListener('click', () => sidebar.classList.add('open'));
closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));

// --- Tema claro/oscuro ---
themeToggle.addEventListener('change', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('light');
    themeToggle.checked = true;
  }
});

// --- Manejar envío de chat ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  // Mensaje del usuario
  const userDiv = document.createElement('div');
  userDiv.className = 'user';
  userDiv.textContent = message;
  chatBox.appendChild(userDiv);
  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;

  // Contar uso de día
  if (daysUsed < 1) {
    daysUsed = 1;
    updateProgressPanel();
  }

  // ==== LÓGICA IA (NO TOCAR) ====
  // Muestra “Escribiendo...”
  chatBox.innerHTML += `<div class="bot typing">Escribiendo...</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch("https://c6c8-2803-a3e0-1a01-1520-408c-8607-3a11-559c.ngrok-free.app/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer no-key-needed"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct-v0.3:2",
        messages: [
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.6
      })
    });
    const data = await res.json();
    const typingDiv = document.querySelector(".typing");
    if (typingDiv) typingDiv.remove();

    const reply = data?.choices?.[0]?.message?.content?.trim() || "Sin respuesta del modelo";
    chatBox.innerHTML += `<div class="bot">${reply}</div>`;
  } catch (err) {
    console.error("Error:", err);
    const typingDiv = document.querySelector(".typing");
    if (typingDiv) typingDiv.remove();
    chatBox.innerHTML += `<div class="bot error">Error de conexión con el servidor</div>`;
  }
  // ==== FIN LÓGICA IA ====

  chatBox.scrollTop = chatBox.scrollHeight;
});

// --- Inicializar ---
updateProgressPanel();

