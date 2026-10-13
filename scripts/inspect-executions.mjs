#!/usr/bin/env node
// Prints a per-node summary of executions stored in a test n8n database.
// Usage: node scripts/inspect-executions.mjs <database.sqlite> <workflow name filter> [nodes to print...]
// Needs Node 22.5+ (node:sqlite) and the `flatted` package that ships with n8n.
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'node:module';

const [dbPath, filter, ...show] = process.argv.slice(2);
const require = createRequire(process.env.N8N_MODULES ? process.env.N8N_MODULES + '/' : import.meta.url);
const { parse } = require('flatted');

const db = new DatabaseSync(dbPath, { readOnly: true });
const rows = db.prepare(`
  SELECT e.id, e.status, w.name, d.data
  FROM execution_entity e
  JOIN workflow_entity w ON w.id = e.workflowId
  JOIN execution_data d ON d.executionId = e.id
  WHERE w.name LIKE ?
  ORDER BY e.id`).all(`%${filter}%`);

let failed = 0;
for (const row of rows) {
  const data = parse(row.data);
  console.log(`    execution ${row.id} (${row.name}): ${row.status}`);
  if (row.status !== 'success') failed++;
  for (const [node, runs] of Object.entries(data.resultData.runData)) {
    const r = runs[runs.length - 1];
    const outputs = (r.data?.main ?? []).map((o) => (o ?? []).length);
    console.log(`      · ${node.padEnd(28)} items out: [${outputs.join(', ')}]${r.error ? '  ERROR: ' + r.error.message : ''}`);
    if (show.includes(node)) {
      for (const branch of r.data?.main ?? []) for (const item of branch ?? []) console.log(`          ${JSON.stringify(item.json).slice(0, 300)}`);
    }
  }
}
process.exit(rows.length > 0 && failed === 0 ? 0 : 1);
