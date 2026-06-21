/**
 * Build the publishable @huksley/trello-cli package into ./dist.
 *
 *   1. esbuild bundles each entry point and its (dependency-free) import graph
 *      into a single self-contained ESM file:
 *        - index.ts → dist/index.js   the library entry
 *        - cli.ts   → dist/cli.js     the `trello-cli` executable (shebang kept)
 *   2. tsc emits the type declarations (esbuild doesn't generate .d.ts);
 *      rewriteRelativeImportExtensions turns the `./client.ts` imports into
 *      `./client.js` in the emitted .d.ts so consumers resolve them.
 *   3. dist/cli.js is marked executable so the `bin` works when run directly.
 */

import * as esbuild from "esbuild";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));
const p = (...s) => path.join(root, ...s);

fs.rmSync(p("dist"), { recursive: true, force: true });

const shared = {
  bundle: true,
  platform: "node",
  format: "esm",
  // Floor matches package.json "engines"; the built JS runs on Node 18+.
  target: "node18",
  logLevel: "info",
  legalComments: "none",
};

console.log("• bundling index.ts → dist/index.js");
await esbuild.build({
  ...shared,
  entryPoints: [p("index.ts")],
  outfile: p("dist", "index.js"),
});

console.log("• bundling cli.ts → dist/cli.js");
await esbuild.build({
  ...shared,
  entryPoints: [p("cli.ts")],
  outfile: p("dist", "cli.js"),
});

console.log("• emitting declarations → dist/*.d.ts");
execFileSync(process.execPath, [p("node_modules", "typescript", "bin", "tsc"), "-p", p("tsconfig.build.json")], {
  stdio: "inherit",
  cwd: root,
});

// The source imports siblings as `./client.ts` (allowImportingTsExtensions). TS 6
// rewrites that to `.js` in emitted JS but NOT in the emitted .d.ts, so patch the
// declarations: a `./client.js` specifier resolves to the sibling `./client.d.ts`,
// which is the specifier published NodeNext packages are expected to use.
for (const file of fs.readdirSync(p("dist")).filter(f => f.endsWith(".d.ts"))) {
  const src = fs.readFileSync(p("dist", file), "utf8");
  const fixed = src.replace(/(from\s+["']\.\.?\/[^"']+)\.ts(["'])/g, "$1.js$2");
  if (fixed !== src) {
    fs.writeFileSync(p("dist", file), fixed);
  }
}

// The bin must be executable when invoked via its shebang (e.g. `npx trello-cli`).
fs.chmodSync(p("dist", "cli.js"), 0o755);

console.log("✓ done — dist/index.js, dist/cli.js, dist/*.d.ts");
