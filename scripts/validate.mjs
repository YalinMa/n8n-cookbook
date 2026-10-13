#!/usr/bin/env node
// Static checks for every workflow in examples/*/*.json.
// Usage: node scripts/validate.mjs
// No dependencies. Exits with code 1 if any check fails.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const examplesDir = join(root, 'examples');

const TRIGGER_TYPES = /(Trigger|\.webhook)$/;
const CONNECTION_TYPES = new Set(['main', 'ai_languageModel', 'ai_tool', 'ai_memory', 'ai_outputParser']);
const SECRET_PATTERNS = [/sk-[A-Za-z0-9]{20,}/, /xox[bp]-[A-Za-z0-9-]+/, /ghp_[A-Za-z0-9]{20,}/, /AKIA[0-9A-Z]{16}/];

let failures = 0;
let checked = 0;

function fail(file, msg) {
  failures++;
  console.log(`  ✗ ${msg}`);
}

function validateWorkflow(file) {
  const rel = relative(root, file);
  console.log(`\n${rel}`);
  const before = failures;
  const raw = readFileSync(file, 'utf8');

  let wf;
  try {
    wf = JSON.parse(raw);
  } catch (e) {
    return fail(file, `invalid JSON: ${e.message}`);
  }

  if (typeof wf.name !== 'string' || !wf.name) fail(file, 'missing workflow "name"');
  if (!Array.isArray(wf.nodes) || wf.nodes.length === 0) return fail(file, 'missing "nodes" array');
  if (typeof wf.connections !== 'object' || wf.connections === null) return fail(file, 'missing "connections" object');

  const names = new Set();
  const ids = new Set();
  for (const node of wf.nodes) {
    const label = node.name ?? '(unnamed)';
    for (const key of ['id', 'name', 'type', 'typeVersion', 'position', 'parameters']) {
      if (node[key] === undefined) fail(file, `node "${label}" is missing "${key}"`);
    }
    if (names.has(node.name)) fail(file, `duplicate node name "${node.name}"`);
    if (ids.has(node.id)) fail(file, `duplicate node id "${node.id}"`);
    names.add(node.name);
    ids.add(node.id);
    if (!Array.isArray(node.position) || node.position.length !== 2) fail(file, `node "${label}" has an invalid position`);
    if (node.credentials) fail(file, `node "${label}" ships with credentials — remove them so users pick their own`);
  }

  const triggers = wf.nodes.filter((n) => TRIGGER_TYPES.test(n.type) && !n.disabled);
  if (triggers.length === 0) fail(file, 'no trigger node found');

  const hasIncoming = new Set();
  for (const [source, outputs] of Object.entries(wf.connections)) {
    if (!names.has(source)) fail(file, `connection from unknown node "${source}"`);
    for (const [type, branches] of Object.entries(outputs)) {
      if (!CONNECTION_TYPES.has(type)) fail(file, `unknown connection type "${type}" on "${source}"`);
      for (const branch of branches) {
        for (const target of branch ?? []) {
          if (!names.has(target.node)) fail(file, `"${source}" connects to unknown node "${target.node}"`);
          if (target.type !== type) fail(file, `"${source}" → "${target.node}" type mismatch (${type} vs ${target.type})`);
          hasIncoming.add(target.node);
        }
      }
    }
  }

  // Every non-trigger, non-sticky node should be reachable from somewhere.
  for (const node of wf.nodes) {
    const isSticky = node.type === 'n8n-nodes-base.stickyNote';
    const isTrigger = TRIGGER_TYPES.test(node.type);
    const isSubNode = Object.keys(wf.connections[node.name] ?? {}).some((t) => t.startsWith('ai_'));
    if (!isSticky && !isTrigger && !isSubNode && !hasIncoming.has(node.name)) {
      fail(file, `node "${node.name}" is not connected to anything`);
    }
  }

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(raw)) fail(file, `looks like it contains a secret (${pattern})`);
  }

  checked++;
  if (failures === before) console.log(`  ✓ ${wf.nodes.length} nodes, ${triggers.length} trigger(s)`);
}

const exampleDirs = readdirSync(examplesDir)
  .filter((d) => statSync(join(examplesDir, d)).isDirectory())
  .sort();

for (const dir of exampleDirs) {
  const full = join(examplesDir, dir);
  for (const readme of ['README.md', 'README.zh-CN.md']) {
    if (!existsSync(join(full, readme))) {
      failures++;
      console.log(`\nexamples/${dir}\n  ✗ missing ${readme}`);
    }
  }
  const jsonFiles = readdirSync(full).filter((f) => f.endsWith('.json'));
  if (jsonFiles.length === 0) {
    failures++;
    console.log(`\nexamples/${dir}\n  ✗ no workflow JSON file`);
  }
  for (const f of jsonFiles) validateWorkflow(join(full, f));
}

// Every English Markdown document needs a Simplified Chinese twin (X.md → X.zh-CN.md),
// and both must link to each other in the language switcher under the title.
function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.') || e.name === 'node_modules') return [];
    const p = join(dir, e.name);
    return e.isDirectory() ? markdownFiles(p) : e.name.endsWith('.md') ? [p] : [];
  });
}
let docPairs = 0;
for (const en of markdownFiles(root).filter((f) => !f.endsWith('.zh-CN.md'))) {
  const zh = en.replace(/\.md$/, '.zh-CN.md');
  const rel = relative(root, en);
  const enName = en.split('/').pop();
  const zhName = zh.split('/').pop();
  if (!existsSync(zh)) {
    failures++;
    console.log(`\n${rel}\n  ✗ missing Chinese version ${zhName}`);
    continue;
  }
  if (!readFileSync(en, 'utf8').includes(`(${zhName})`)) {
    failures++;
    console.log(`\n${rel}\n  ✗ no language switcher link to ${zhName}`);
  }
  if (!readFileSync(zh, 'utf8').includes(`(${enName})`)) {
    failures++;
    console.log(`\n${relative(root, zh)}\n  ✗ no language switcher link to ${enName}`);
  }
  docPairs++;
}
console.log(`\n${docPairs} English/Chinese document pair(s) checked`);

console.log(`\n${checked} workflow file(s) in ${exampleDirs.length} example(s) checked — ${failures === 0 ? 'all good ✅' : `${failures} problem(s) ❌`}`);
process.exit(failures === 0 ? 0 : 1);
