#!/usr/bin/env node
// Writes test-only variants of some workflows (used by test-in-n8n.sh).
// Usage: node scripts/make-test-variants.mjs <repoRoot> <outDir>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [root, out] = process.argv.slice(2);
const load = (p) => JSON.parse(readFileSync(join(root, 'examples', p), 'utf8'));
const save = (name, wf) => writeFileSync(join(out, `variant-${name}.json`), JSON.stringify(wf));

// 03: same workflow, email node disabled.
{
  const wf = load('03-rss-news-digest-email/workflow.json');
  wf.id = 'cookbookvariant03';
  wf.name += ' [test: email disabled]';
  wf.nodes.find((n) => n.name === 'Send Digest Email').disabled = true;
  save('03', wf);
}

// 10b: flip the failOnPurpose switch.
{
  const wf = load('10-error-handling-and-alerts/flaky-workflow-demo.json');
  wf.id = 'cookbookvariant10b';
  wf.name = '10b · Error Handling Demo [test: fail on purpose]';
  wf.nodes.find((n) => n.name === 'Settings').parameters.assignments.assignments[0].value = true;
  save('10b', wf);
}

// 10a: replace the Error Trigger with Manual Trigger → sample payload.
{
  const wf = load('10-error-handling-and-alerts/error-alert-workflow.json');
  wf.id = 'cookbookvariant10a';
  wf.name += ' [test: sample error]';
  const trigger = wf.nodes.find((n) => n.name === 'Error Trigger');
  trigger.type = 'n8n-nodes-base.code';
  trigger.typeVersion = 2;
  trigger.parameters = {
    jsCode: `return [{ json: {
      execution: {
        id: '231', url: 'https://n8n.example.com/workflow/1/executions/231',
        error: { message: 'Stopped on purpose (data source: fallback).' },
        lastNodeExecuted: 'Stop and Error', mode: 'trigger',
      },
      workflow: { id: '1', name: '10b · Error Handling Demo' },
    } }];`,
  };
  wf.nodes.push({
    parameters: {}, id: 'test-manual-trigger', name: 'Manual Trigger',
    type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [-200, 100],
  });
  wf.connections['Manual Trigger'] = { main: [[{ node: 'Error Trigger', type: 'main', index: 0 }]] };
  save('10a', wf);
}

// 04: Google Sheets disabled (no Google credential here); everything else as-is.
{
  const wf = load('04-contact-form-to-google-sheets/workflow.json');
  wf.id = 'cookbookvariant04';
  wf.name += ' [test: sheets disabled]';
  wf.nodes.find((n) => n.name === 'Append Row to Sheet').disabled = true;
  save('04', wf);
}

// 09: OpenAI Chat Model wired to a credential that points at scripts/mock-openai.mjs.
{
  const wf = load('09-ai-support-ticket-triage/workflow.json');
  wf.id = 'cookbookvariant09';
  wf.name += ' [test: mock OpenAI]';
  wf.nodes.find((n) => n.name === 'OpenAI Chat Model').credentials = {
    openAiApi: { id: 'cookbookmockai01', name: 'Mock OpenAI' },
  };
  save('09', wf);
  writeFileSync(join(out, 'mock-credential.json'), JSON.stringify([{
    id: 'cookbookmockai01',
    name: 'Mock OpenAI',
    type: 'openAiApi',
    data: { apiKey: 'sk-test-not-a-real-key', url: `http://127.0.0.1:${process.env.MOCK_OPENAI_PORT || 5690}/v1` },
  }]));
}
