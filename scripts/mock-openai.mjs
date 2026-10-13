#!/usr/bin/env node
// A tiny fake OpenAI Chat Completions server, used by test-in-n8n.sh to run
// recipe 09 end to end without a real API key. It "classifies" tickets with
// keyword rules and answers in the JSON shape the Information Extractor asks for.
// Usage: node scripts/mock-openai.mjs <port>
import { createServer } from 'node:http';

const port = Number(process.argv[2] || 5690);

function classify(text) {
  const t = text.toLowerCase();
  if (/refund|charged|invoice|billing/.test(t)) return ['billing', 'high', 'negative', 'Customer was charged twice and wants a refund.'];
  if (/blank page|error|crash|won't load|bug/.test(t)) return ['technical', 'high', 'negative', 'Dashboard does not load in the browser.'];
  if (/pricing|discount|plan|quote/.test(t)) return ['sales', 'medium', 'neutral', 'Prospect asks about volume discounts.'];
  return ['other', 'low', 'positive', 'Customer shares general feedback.'];
}

createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const payload = body ? JSON.parse(body) : {};
    const userText = (payload.messages ?? []).filter((m) => m.role === 'user').map((m) => JSON.stringify(m.content)).join('\n');
    const [category, priority, sentiment, summary] = classify(userText);
    const result = { category, priority, sentiment, summary };
    const tool = payload.tools?.[0]?.function?.name;
    const message = tool
      ? { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: tool, arguments: JSON.stringify(result) } }] }
      : { role: 'assistant', content: '```json\n' + JSON.stringify(result) + '\n```' };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      id: 'chatcmpl-mock', object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: payload.model,
      choices: [{ index: 0, message, finish_reason: tool ? 'tool_calls' : 'stop' }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }));
    console.log(`${req.method} ${req.url} → ${category}`);
  });
}).listen(port, '127.0.0.1', () => console.log(`mock OpenAI on :${port}`));
