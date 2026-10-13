#!/usr/bin/env node
// A tiny fake OpenAI Chat Completions server, used by test-in-n8n.sh to run the
// AI recipes end to end without a real API key. It is NOT an LLM: it follows
// simple keyword rules so the tests are deterministic.
//  - Recipe 09 (Information Extractor): returns category/priority/sentiment/summary.
//  - Recipe 15 (AI Agent): calls the currency tool, then the calculator, then answers.
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

// Tool results arrive as text; they may be JSON, JSON inside a string, or an array of one object.
function parseToolJson(t) {
  let v = t;
  for (let i = 0; i < 3 && typeof v === 'string'; i++) { try { v = JSON.parse(v); } catch { return null; } }
  if (Array.isArray(v)) v = v[0];
  if (v && typeof v.response === 'string') return parseToolJson(v.response);
  return v;
}

const text = (m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? ''));
const toolCall = (name, args) => ({
  role: 'assistant', content: null,
  tool_calls: [{ id: `call_${name}_${Date.now()}`, type: 'function', function: { name, arguments: JSON.stringify(args) } }],
});

const CODES = { euro: 'EUR', euros: 'EUR', eur: 'EUR', yen: 'JPY', jpy: 'JPY', dollar: 'USD', dollars: 'USD', usd: 'USD', pound: 'GBP', pounds: 'GBP', gbp: 'GBP', franc: 'CHF', francs: 'CHF', chf: 'CHF' };

function agentReply(payload) {
  const tools = (payload.tools ?? []).map((t) => t.function.name);
  const currencyTool = tools.find((n) => /currency|rate/i.test(n));
  const calcTool = tools.find((n) => /calc/i.test(n));
  const msgs = payload.messages ?? [];
  const users = msgs.filter((m) => m.role === 'user');
  const question = text(users[users.length - 1] ?? {});
  // Tool results that belong to the current question (after the last user message)
  const lastUser = msgs.lastIndexOf(users[users.length - 1]);
  const toolResults = msgs.slice(lastUser + 1).filter((m) => m.role === 'tool').map(text);

  // "250 euros" → amount 250, base EUR. A follow-up without a number ("And in dollars?")
  // reuses amount and base from the earlier turn, which the agent only sees thanks to memory.
  const codesIn = (t) => (t.toLowerCase().match(/[a-z]+/g) ?? []).map((w) => CODES[w]).filter(Boolean);
  const amountAndBase = (t) => {
    const m = t.toLowerCase().match(/(\d+(?:\.\d+)?)\s*([a-z]+)/);
    return m && CODES[m[2]] ? { amount: Number(m[1]), base: CODES[m[2]] } : null;
  };
  const found = amountAndBase(question) ?? users.map(text).reverse().map(amountAndBase).find(Boolean);
  const amount = found?.amount;
  const base = found?.base;
  const target = codesIn(question).find((c) => c !== base);

  if (!currencyTool || !base || !target) {
    return { role: 'assistant', content: 'I can help with currency conversions and maths. Try "How many yen is 250 euros?"' };
  }
  if (toolResults.length === 0) return toolCall(currencyTool, { base, symbols: target });
  const rateData = parseToolJson(toolResults[0]);
  if (!rateData?.rates?.[target]) return { role: 'assistant', content: `Sorry, the currency tool failed: ${toolResults[0].slice(0, 200)}` };
  if (toolResults.length === 1 && calcTool) {
    return toolCall(calcTool, { input: `${amount} * ${rateData.rates[target]}` });
  }
  const result = (toolResults[toolResults.length - 1].match(/-?\d+(\.\d+)?/) ?? ['NaN'])[0];
  return { role: 'assistant', content: `${amount} ${base} is about ${Number(result).toFixed(2)} ${target} (ECB rate ${rateData.rates[target]} on ${rateData.date}).` };
}

createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const payload = body ? JSON.parse(body) : {};
    const tools = (payload.tools ?? []).map((t) => t.function?.name);
    let message;
    let label;
    if (tools.some((n) => /currency|rate|calc/i.test(n))) {
      message = agentReply(payload);
      label = message.tool_calls ? `tool → ${message.tool_calls[0].function.name} ${message.tool_calls[0].function.arguments}` : `answer → ${message.content}`;
    } else {
      const userText = (payload.messages ?? []).filter((m) => m.role === 'user').map(text).join('\n');
      const [category, priority, sentiment, summary] = classify(userText);
      const result = { category, priority, sentiment, summary };
      const tool = tools[0];
      message = tool
        ? toolCall(tool, result)
        : { role: 'assistant', content: '```json\n' + JSON.stringify(result) + '\n```' };
      label = category;
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      id: 'chatcmpl-mock', object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: payload.model,
      choices: [{ index: 0, message, finish_reason: message.tool_calls ? 'tool_calls' : 'stop' }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }));
    console.log(`${req.method} ${req.url} → ${label}`);
  });
}).listen(port, '127.0.0.1', () => console.log(`mock OpenAI on :${port}`));
