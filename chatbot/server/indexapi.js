// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// usar el modelo
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Revisar salud del server---
app.get('/health', (_req, res) => res.send('ok'));

// --- Chat (JSON) ---
app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [], model } = req.body;
    const modelToUse = model || 'gpt-5-mini'; 

    
    const input = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const result = await client.responses.create({ model: modelToUse, input });

 
    const text =
      result.output_text ??
      result.output?.[0]?.content?.[0]?.text ??
      '';

    return res.json({ ok: true, text });
  } catch (err) {
    console.error('ERROR /api/chat:', err);

    // error de cuota 429
    const status =
      err?.status ||
      err?.response?.status ||
      (typeof err?.message === 'string' && err.message.startsWith('429') ? 429 : 500);

    const message =
      err?.response?.data?.error?.message ||
      err?.message ||
      'Server error';

    return res.status(status).json({
      ok: false,
      code: status,
      error: message,
    });
  }
});

// CHAT SSE 
app.post('/api/chat-stream', async (req, res) => {
  try {
    const { messages = [], model } = req.body;
    const modelToUse = model || 'gpt-5-mini';
    const input = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 15000);
    const stream = await client.responses.stream({ model: modelToUse, input });

    try {
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          res.write(`data: ${event.delta}\n\n`);
        } else if (event.type === 'response.error') {
          res.write(`data: [ERROR] ${event.error?.message || 'unknown'}\n\n`);
        } else if (event.type === 'response.completed') {
          res.write('data: [DONE]\n\n');
        }
      }
    } catch (e) {
      res.write(`data: [ERROR] ${e?.message ?? 'unknown'}\n\n`);
    } finally {
      clearInterval(keepAlive);
      res.end();
    }
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ ok: false, code: 500, error: err?.message ?? 'Server error' });
    }
    res.write(`data: [ERROR] ${err?.message ?? 'unknown'}\n\n`);
    res.end();
  }
});

// --- Puertos y endpoints  ---
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API en http://localhost:${PORT}`);
  console.log('   • GET  /health');
  console.log('   • POST /api/chat');
  console.log('   • POST /api/chat-stream');
});
