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

  // 📌 Función que llama a tu backend
  const enviarAlBackend = async (textoUsuario) => {
    
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: textoUsuario }
          ]
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(`${data.code} ${data.error}`);
  

  return data.text || "Sin respuesta";
     };

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    // agrega mensaje del usuario
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);

    // obtiene respuesta real del backend
    const reply = await enviarAlBackend(text);

    // agrega respuesta del bot
    setMessages((m) => [...m, { role: "bot", text: reply }]);
    setLoading(false);
  };

  return (
    <div className="chat-wrap">
      <header className="chat-header">
        <div className="chat-title">Chatbot MARSI BIONICS</div>
        <div className="chat-subtitle">Conectado a API OpenAI vía backend</div>
      </header>

      <main className="chat-main" ref={listRef}>
        {messages.map((m, i) => (
          <Message key={i} role={m.role} text={m.text} />
        ))}
        {loading && (
          <div className="msg msg-bot">
            <div className="msg-author">Bot</div>
            <div className="msg-bubble">Escribiendo...</div>
          </div>
        )}
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
