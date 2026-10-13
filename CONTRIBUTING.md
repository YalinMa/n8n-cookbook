# Contributing

Thanks for helping make n8n easier to learn!

## Adding a recipe

1. Create `examples/NN-short-name/` (next free number, kebab-case).
2. Build the workflow in n8n, then **⋯ → Download** to export the JSON as `workflow.json`.
3. Before committing, clean the export:
   - Remove the `credentials` block from every node. Users attach their own.
   - Remove `pinData`, `meta.instanceId`, `id`, `versionId` and `active` (or leave `pinData` as `{}`).
   - Make sure no API keys, tokens or personal data appear anywhere (URLs, headers, Code nodes).
   - Give every node a descriptive name ("Get Forecast", not "HTTP Request1").
   - Add a sticky note that sums up the recipe in 3–5 lines.
   - Prefer free, key-less public APIs so people can run it immediately.
   - If the workflow uses a schedule, also add a **Manual Trigger** for testing.
4. Write `README.md` following the existing recipes: summary table, ASCII flow, *What you'll learn*, *Setup*, *Try it*, *How it works*, *Ideas to extend*, *Troubleshooting*.
5. Add a row to the recipe table in the main `README.md`.
6. Run the checks:

   ```bash
   node scripts/validate.mjs
   ./scripts/test-in-n8n.sh      # optional: imports and runs everything in a real n8n
   ```

## Fixing a recipe

Open an issue or PR describing what broke (n8n version, error message). n8n evolves quickly, so node updates are very welcome.
