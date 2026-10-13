# 15 · AI Agent with Tools & Memory

> A chat assistant that **decides by itself** when to call tools (a live exchange-rate API and a calculator) and **remembers** the conversation.

| Difficulty | Time | Credentials | Nodes used |
|---|---|---|---|
| ⭐⭐⭐ Intermediate+ | 15 min | OpenAI API key (or any tool-calling chat model) | Chat Trigger, AI Agent, OpenAI Chat Model, Simple Memory, HTTP Request Tool, Calculator |

```
Chat Trigger ─▶ AI Agent ─▶ (reply shown in chat)
 (hosted chat    ▲   ▲   ▲   ▲
  page)          │   │   │   └─ ai_tool ──────── Calculator
                 │   │   └───── ai_tool ──────── Currency Rates  (HTTP Request used as a tool)
                 │   └───────── ai_memory ────── Memory          (last 10 messages per session)
                 └───────────── ai_languageModel OpenAI Chat Model
```

## What you'll learn

- The difference between a **chain** ([recipe 09](../09-ai-support-ticket-triage/): fixed steps) and an **agent** (the model chooses which tools to call, in which order, and how often)
- Turning **any HTTP API into a tool** with the *HTTP Request Tool* and `$fromAI()`
- Why agents need a **Calculator** (LLMs are unreliable at arithmetic)
- **Memory**: how follow-up questions like *"And in dollars?"* work
- Writing a **system message** with clear tool-use rules

## Setup

1. Import [`workflow.json`](workflow.json).
2. **OpenAI Chat Model → Credential → Create new → OpenAI** and paste your API key. To use another provider, replace this one node with *Anthropic*, *Google Gemini*, *Mistral*, *Ollama* or another chat model that supports **tool calling**.
3. Click **Open chat** (bottom of the canvas) to test inside the editor.
4. To share the chat page: **publish** the workflow, then open the **Chat Trigger** node and copy the *Chat URL*.

## Try it

| You type | What happens |
|---|---|
| *How many Japanese yen is 250 euros?* | Agent → **Currency Rates** (`base=EUR`, `symbols=JPY`) → **Calculator** (`250 * 177.33`) → *"250 EUR is about 44,332.50 JPY (ECB rate on 2026-10-12)."* |
| *And in US dollars?* | No amount or base currency in the question. **Memory** supplies "250 EUR" from the previous turn → Currency Rates (`USD`) → Calculator. |
| *Tell me a joke* | No tool fits → the agent politely explains what it can do (because of the system message). |

Open the **AI Agent** node after a run and look at the *Logs* panel: you'll see each tool call with its inputs and outputs. It's the best way to understand and debug agents.

## How it works

| Node | What it does |
|---|---|
| **Chat Trigger** | Public, hosted chat page. Each browser session gets a `sessionId`. |
| **AI Agent** | Tools agent. It sends the user message, the system message, the memory and the **tool descriptions** to the model. When the model requests a tool, the agent runs it and loops until the model gives a final answer. |
| **OpenAI Chat Model** | `gpt-4o-mini`, temperature 0 for consistent tool use. |
| **Memory** | *Simple Memory* keyed by `sessionId`, keeping the last 10 messages. It lives in n8n's process memory; use *Postgres* or *Redis Chat Memory* to survive restarts. |
| **Currency Rates** | A normal **HTTP Request** node used as a tool. `{{ $fromAI('base', '…', 'string') }}` tells the model it must provide this value. The **tool description** is what the model reads to decide when to use it. |
| **Calculator** | Exact maths. |

## Writing good tools

- **Name + description matter most.** Say *when* to use the tool and what each parameter means, with examples (`e.g. EUR`).
- Keep tool output **small**. Big JSON costs tokens and confuses the model.
- Give the agent **rules** in the system message ("never guess rates").
- Start with **2–5 tools**. Too many similar tools leads to wrong choices.

## Ideas to extend

- Add a **Call n8n Workflow Tool** that uses the sub-workflow from [recipe 12](../12-reusable-notification-subworkflow/) ("send this to my team").
- Add a **Data Table** tool to look up customers ([recipe 19](../19-mini-crm-with-data-tables/)).
- Embed the chat on your website: Chat Trigger → *Mode: Embedded Chat* + the `@n8n/chat` widget.

## Troubleshooting

| Symptom | Fix |
|---|---|
| The agent answers with made-up rates | Make the tool description and system message more explicit, use temperature 0, or use a stronger model. |
| `… has a "supplyData" method but no "execute" method` | You're using the legacy *HTTP Request Tool (LangChain)* node with a new AI Agent. Use the standard **HTTP Request** node as a tool, as this recipe does. |
| Follow-up questions lose context | Memory isn't connected, or each message arrives with a different `sessionId`. |
| `Tool calling is not supported` | Pick a chat model that supports tools (most current OpenAI, Anthropic, Gemini and Mistral models do). |
