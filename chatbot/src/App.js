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

const SYSTEM_PROMPT =
  "Eres un asistente del SGC de MARSI BIONICS. Responde de forma breve, clara y con pasos si procede.";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hola, soy un bot. Pregúntame algo." }
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  /** ⬇️ Utilidad: mapea tu historial UI -> historial LLM (system|user|assistant) */
  const toLLMMessages = (uiMessages, nextUserText) => {
    const base = [{ role: "system", content: SYSTEM_PROMPT }];

    const mapped = uiMessages.map(m => ({
      role: m.role === "bot" ? "assistant" : "user",
      content: m.text
    }));

    // añadimos lo que el usuario acaba de escribir
    if (nextUserText?.trim()) {
      mapped.push({ role: "user", content: nextUserText.trim() });
    }

    return [...base, ...mapped];
  };

  // Llama a tu backend con TODO el historial
  const enviarAlBackend = async (llmMessages) => {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: llmMessages })
    });

    let data = {};
    try { data = await resp.json(); } catch (_) {}

    if (!resp.ok || data?.ok === false) {
      const code = data?.code ?? resp.status;
      const msg  = data?.error ?? resp.statusText ?? "Error";
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

    // índice donde quedará el placeholder "Escribiendo..."
    const writingIndex = messages.length + 1;

    // pintamos ya el mensaje del usuario y el placeholder
    setMessages(prev => [
      ...prev,
      { role: "user", text },
      { role: "bot",  text: "Escribiendo..." }
    ]);

    try {
      const llmMessages = toLLMMessages(messages, text);
      const reply = await enviarAlBackend(llmMessages);

      setMessages(prev => {
        const updated = [...prev];
        updated[writingIndex] = { role: "bot", text: reply };
        return updated;
      });
    } catch (err) {
      console.error("❌ Error Api Chat:", err);
      setMessages(prev => {
        const updated = [...prev];
        updated[writingIndex] = { role: "bot", text: `⚠️ Error: ${err.message}` };
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
        {messages.map((m, i) => <Message key={i} role={m.role} text={m.text} />)}
      </main>

      <form className="chat-inputbar" onSubmit={send}>
        <input
          className="chat-input"
          placeholder="Escribe tu mensaje…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) send(e); }}
          autoFocus
        />
        <button className="chat-send" type="submit" disabled={!input.trim() || loading}>
          {loading ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
