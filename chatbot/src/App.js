import React, { useState, useRef, useEffect } from "react";

function Message({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={`msg ${isUser ? "msg-user" : "msg-bot"}`}>
      <div className="msg-author">{isUser ? "Tú" : "Bot"}</div>
      <div className="msg-bubble">{text}</div>
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hola, soy un bot. Pregúntame algo." }
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading]);

  // Llama a tu backend y lanza Error si el backend responde con ok:false o resp !ok
  const enviarAlBackend = async (textoUsuario) => {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: textoUsuario }]
      })
    });

    // Intentar leer siempre el JSON (tanto en éxito como en error)
    let data = {};
    try {
      data = await resp.json();
    } catch (_) {
      // si no hay JSON, dejar data vacío y continuar
    }

    if (!resp.ok || data?.ok === false) {
      // Construye un mensaje claro (e.g. "429 You exceeded your current quota")
      const code = data?.code ?? resp.status;
      const msg = data?.error ?? resp.statusText ?? "Error";
      throw new Error(`${code} ${msg}`);
    }

    return data.text || "Sin respuesta";
  };

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    // Índice donde quedará el "Escribiendo..." (placeholder)
    // Añadimos de una vez el mensaje del usuario y el placeholder del bot.
    const writingIndex = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "bot", text: "Escribiendo..." }
    ]);

    try {
      const reply = await enviarAlBackend(text);

      // Reemplaza el "Escribiendo..." por la respuesta real
      setMessages((prev) => {
        const updated = [...prev];
        updated[writingIndex] = { role: "bot", text: reply };
        return updated;
      });
    } catch (err) {
      console.error("❌ Error Api Chatgpt:", err);

      // Reemplaza el "Escribiendo..." por el mensaje de error del backend
      setMessages((prev) => {
        const updated = [...prev];
        updated[writingIndex] = {
          role: "bot",
          text: `⚠️ Error: ${err.message}`
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-wrap">
      <header className="chat-header">
        <div className="chat-title">Chatbot MARSI BIONICS</div>
        <div className="chat-subtitle">SGC</div>
      </header>

      <main className="chat-main" ref={listRef}>
        {messages.map((m, i) => (
          <Message key={i} role={m.role} text={m.text} />
        ))}
        {/* Ya no necesitamos renderizar "Escribiendo..." aquí, 
            porque ahora es un mensaje real en el array */}
      </main>

      <form className="chat-inputbar" onSubmit={send}>
        <input
          className="chat-input"
          placeholder="Escribe tu mensaje…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) send(e);
          }}
          autoFocus
        />
        <button className="chat-send" type="submit" disabled={!input.trim() || loading}>
          {loading ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
