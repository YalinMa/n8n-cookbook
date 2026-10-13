#!/usr/bin/env node
// Reads the output of `n8n execute --rawOutput` (stdin) and prints a per-node
// summary. Exits 1 if the execution did not finish successfully.
// Usage: n8n execute --id=X --rawOutput | node scripts/summarize-execution.mjs [nodeToShow...]
import { readFileSync } from 'node:fs';

const raw = readFileSync(0, 'utf8');
const start = raw.indexOf('\n{');
const jsonText = start >= 0 ? raw.slice(start + 1) : raw.slice(raw.indexOf('{'));
let exec;
try {
  exec = JSON.parse(jsonText);
} catch {
  console.log('    (could not parse execution output)');
  console.log(raw.split('\n').slice(-15).join('\n'));
  process.exit(1);
}

const run = exec.data.resultData;
const show = process.argv.slice(2);
for (const [node, runs] of Object.entries(run.runData)) {
  const r = runs[runs.length - 1];
  const outputs = (r.data?.main ?? []).map((o) => (o ?? []).length);
  const err = r.error ? `  ERROR: ${r.error.message}` : '';
  console.log(`    ${r.executionStatus === 'success' ? '·' : '!'} ${node.padEnd(28)} items out: [${outputs.join(', ')}]${err}`);
  if (show.includes(node)) {
    for (const branch of r.data?.main ?? []) {
      for (const item of (branch ?? []).slice(0, 3)) {
        const j = JSON.stringify(item.json);
        console.log(`        ${j.length > 400 ? j.slice(0, 400) + '…' : j}`);
        if (item.binary) console.log(`        binary: ${Object.values(item.binary).map((b) => `${b.fileName} (${b.mimeType}, ${b.fileSize ?? '?'})`).join(', ')}`);
      }
    }
  }
}
if (run.error) console.log(`    workflow error: ${run.error.message}`);
console.log(`    status: ${exec.status}`);
process.exit(exec.status === 'success' ? 0 : 1);
