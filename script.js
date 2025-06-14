const form = document.getElementById("form");
const input = document.getElementById("input");
const chatBox = document.getElementById("chat");
const themeToggle = document.getElementById("toggle-theme");

// Evento de envío del formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  // Mostrar mensaje del usuario
  chatBox.innerHTML += `<div class="user">${message}</div>`;
  input.value = "";
  chatBox.innerHTML += `<div class="bot typing">Escribiendo...</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch("https://933c-187-102-208-244.ngrok-free.app/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer no-key-needed"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528-qwen3-8b",
        prompt: `Usuario: ${message}\nAsistente:`,
        max_tokens: 150,
        temperature: 0.6,
        stop: ["Usuario:", "Asistente:"]
      })
    });

    const data = await res.json();
    const typingDiv = document.querySelector(".typing");
    if (typingDiv) typingDiv.remove();

    const reply = data?.choices?.[0]?.text?.trim();
    chatBox.innerHTML += `<div class="bot">${reply || "Sin respuesta del modelo"}</div>`;
  } catch (err) {
    console.error("Error:", err);
    const typingDiv = document.querySelector(".typing");
    if (typingDiv) typingDiv.remove();
    chatBox.innerHTML += `<div class="bot error">Error de conexión con el servidor</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
});

// Toggle de tema claro/oscuro
themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
});

// Restaurar tema al cargar
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeToggle.checked = true;
  }
});
