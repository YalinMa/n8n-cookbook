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

// 12: a linked pair. 12b's "Workflow" dropdown must point at 12a's id, which
// only exists after import, so both get fixed test ids.
{
  const child = load('12-reusable-notification-subworkflow/notification-subworkflow.json');
  child.id = 'cookbookvariant12a';
  child.name += ' [test: linked]';
  save('12a', child);
  const parent = load('12-reusable-notification-subworkflow/order-events-workflow.json');
  parent.id = 'cookbookvariant12b';
  parent.name += ' [test: linked]';
  parent.nodes.find((n) => n.name === 'Notify via Sub-workflow').parameters.workflowId.value = child.id;
  save('12b', parent);
}

// 14 and 18: read the sample files from the working tree (served locally)
// instead of raw.githubusercontent.com, so uncommitted changes are tested.
const FILES = `http://127.0.0.1:${process.env.FILES_PORT || 5699}/`;
for (const [folder, name] of [['14-clean-and-dedupe-contact-list', '14'], ['18-pdf-invoice-parser', '18']]) {
  const raw = readFileSync(join(root, 'examples', folder, 'workflow.json'), 'utf8')
    .replaceAll('https://raw.githubusercontent.com/YalinMa/n8n-cookbook/main/examples/', FILES);
  const wf = JSON.parse(raw);
  wf.id = `cookbookvariant${name}`;
  wf.name += ' [test: local file]';
  save(name, wf);
}

// 15: AI agent wired to the mock OpenAI credential.
{
  const wf = load('15-ai-agent-with-tools-and-memory/workflow.json');
  wf.id = 'cookbookvariant15';
  wf.name += ' [test: mock OpenAI]';
  wf.nodes.find((n) => n.name === 'OpenAI Chat Model').credentials = {
    openAiApi: { id: 'cookbookmockai01', name: 'Mock OpenAI' },
  };
  save('15', wf);
}

// 19: the one-time "create table" step runs from a webhook, because the
// Data Tables module is only loaded by a running n8n server, not by `n8n execute`.
{
  const wf = load('19-mini-crm-with-data-tables/workflow.json');
  wf.id = 'cookbookvariant19';
  wf.name += ' [test: setup webhook]';
  const setup = wf.nodes.find((n) => n.name === 'Run Once: Create Table');
  Object.assign(setup, {
    type: 'n8n-nodes-base.webhook', typeVersion: 2,
    parameters: { path: 'crm/setup', options: {} },
    webhookId: '19000000-0000-4000-8000-0000000000cc',
  });
  save('19', wf);
}

// 10 live: a real production failure must start the (published) error workflow.
// 10b fails on purpose, is started by a webhook, and has 10a set as its Error Workflow.
{
  const alert = load('10-error-handling-and-alerts/error-alert-workflow.json');
  alert.id = 'cookbookvariant10alive';
  alert.name += ' [test: live]';
  save('10a-live', alert);
  const demo = load('10-error-handling-and-alerts/flaky-workflow-demo.json');
  demo.id = 'cookbookvariant10blive';
  demo.name = '10b · Error Handling Demo [test: live failure]';
  demo.settings.errorWorkflow = alert.id;
  demo.nodes.find((n) => n.name === 'Settings').parameters.assignments.assignments[0].value = true;
  Object.assign(demo.nodes.find((n) => n.name === 'Manual Trigger'), {
    type: 'n8n-nodes-base.webhook', typeVersion: 2,
    parameters: { path: 'fail-demo', options: {} },
    webhookId: '10b00000-0000-4000-8000-0000000000cc',
  });
  save('10b-live', demo);
}
