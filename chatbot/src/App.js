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
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  const send = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    // agrega mensaje del usuario
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");

    // responde siempre "n/a"
    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: "n/a" }]);
    }, 250);
  };

  return (
    <div className="chat-wrap">
      <header className="chat-header">
        <div className="chat-title">Chat Demo</div>
        <div className="chat-subtitle">Bot responde siempre "n/a"</div>
      </header>

      <main className="chat-main" ref={listRef}>
        {messages.map((m, i) => (
          <Message key={i} role={m.role} text={m.text} />
        ))}
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
        <button className="chat-send" type="submit" disabled={!input.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
