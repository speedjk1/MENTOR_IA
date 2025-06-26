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

let daysUsed = 0;
let reflectionsDone = 0;
let goalsDone = 0;

// --- Función: cargar reflexiones desde localStorage ---
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

// --- Función: actualizar panel de progreso ---
function updateProgressPanel() {
  usageDaysEl.textContent = daysUsed;
  reflectionsEl.textContent = reflectionsDone;
  goalsEl.textContent = `${goalsDone}/${goalsDone}`;
}

// --- Borrar chat y resetear todo ---
clearChatBtn.addEventListener('click', () => {
  chatBox.innerHTML = '';
  daysUsed = 0;
  reflectionsDone = 0;
  goalsDone = 0;
  localStorage.removeItem('reflections');
  loadReflections();
  updateProgressPanel();
});

// --- Enviar reflexión ---
sendReflectionBtn.addEventListener('click', () => {
  const text = reflectionTextarea.value.trim();
  if (!text) return;

  // Añadir al DOM
  const li = document.createElement('li');
  li.textContent = text;
  historyUl.appendChild(li);

  // Guardar en localStorage
  const stored = JSON.parse(localStorage.getItem('reflections') || '[]');
  stored.push(text);
  localStorage.setItem('reflections', JSON.stringify(stored));

  // Actualizar contadores
  reflectionsDone = stored.length;
  if (daysUsed < 1) daysUsed = 1;
  updateProgressPanel();

  // Cerrar sidebar y limpiar textarea
  sidebar.classList.remove('open');
  document.querySelector('.main').classList.remove('shifted');
  reflectionTextarea.value = '';
});

// --- Apertura/Cierre de sidebar con desplazamiento del main ---
openSidebarBtn.addEventListener('click', () => {
  sidebar.classList.add('open');
  document.querySelector('.main').classList.add('shifted');
});
closeSidebarBtn.addEventListener('click', () => {
  sidebar.classList.remove('open');
  document.querySelector('.main').classList.remove('shifted');
});

// --- Tema claro/oscuro ---
themeToggle.addEventListener('change', () => {
  document.body.classList.toggle('light');
  localStorage.setItem(
    'theme',
    document.body.classList.contains('light') ? 'light' : 'dark'
  );
});
window.addEventListener('DOMContentLoaded', () => {
  // Cargar tema
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
    themeToggle.checked = true;
  }
  // Cargar reflexiones y progreso
  loadReflections();
  updateProgressPanel();
});

// --- Manejo del chat y LÓGICA IA (NO TOCAR esta sección) ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  // Mostrar mensaje de usuario
  const userDiv = document.createElement('div');
  userDiv.className = 'user';
  userDiv.textContent = message;
  chatBox.appendChild(userDiv);
  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;

  // Asegurar días de uso
  if (daysUsed < 1) {
    daysUsed = 1;
    updateProgressPanel();
  }

  // Indicador “Escribiendo…”
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
        model: "mistralai/mistral-7b-instruct-v0.3",
        messages: [
          { role: "user", content: message }
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

  chatBox.scrollTop = chatBox.scrollHeight;
});
// === FIN sección IA ===