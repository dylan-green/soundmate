#!/usr/bin/env sh
# Build the self-contained server artifact for @soundmate/app: dist/app.
#
# The artifact is fully self-contained — every dependency (external packages AND the
# @soundmate/common workspace package) is materialized as real files inside its own
# node_modules. Drop it on any host with Node installed, no monorepo present, and run:
#     node dist/app/index.js   (or, from inside dist/app: npm start)
#
# Pipeline (app depends on common, so common is built + integrated first):
#   1. tsc compiles @soundmate/common → its package-local ./dist (.js + .d.ts).
#   2. tsc compiles @soundmate/app → its package-local ./dist (resolving @soundmate/common
#      via its built package + exports map, not the .ts source).
#   3. `pnpm deploy` clones a production node_modules + the compiled dist into a scratch dir
#      (externals + @soundmate/common as real files, only relative symlinks within the dir).
#   4. We flatten that into dist/app: compiled JS at the root, the real node_modules, and a
#      minimal run-only manifest. Nothing from src/ is copied, so .env* never leaks in.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/app"
TMP="$ROOT/dist/.app-deploy-tmp"

# 1. Compile common (shared types) → its package-local ./dist.
pnpm --filter @soundmate/common exec tsc -p tsconfig.json

# 2. Compile the app → its package-local ./dist (common resolves via its built package).
pnpm --filter @soundmate/app exec tsc -p tsconfig.build.json

# 3. Materialize a production node_modules + the compiled dist via pnpm deploy.
rm -rf "$TMP"
pnpm --filter @soundmate/app deploy --prod "$TMP"

# 4. Flatten into the final artifact: compiled JS at the root + real node_modules.
rm -rf "$OUT"
mkdir -p "$OUT"
cp -R "$TMP/dist/." "$OUT/"
cp -R "$TMP/node_modules" "$OUT/node_modules"

# pnpm leaves a self-reference for the app workspace package that symlinks back into the
# monorepo (.pnpm/node_modules/@soundmate/app -> ../../src/packages/app). The app is the
# artifact's root entry and is never imported by its own package name, so the link is unused
# — prune it so NO symlink in the artifact escapes the bundle (true "runs anywhere").
rm -f "$OUT/node_modules/.pnpm/node_modules/@soundmate/app"

# Minimal manifest: keep name/version/type/deps from the deploy (its workspace dep is
# already rewritten + materialized), but point main/start at the flattened entry and
# drop devDependencies. node_modules is prebuilt, so the artifact is run-only — never installed.
node -e "const p=require('$TMP/package.json'); const fs=require('fs'); const out={name:p.name,version:p.version,private:true,type:'module',main:'index.js',scripts:{start:'node index.js'},dependencies:p.dependencies||{}}; fs.writeFileSync('$OUT/package.json', JSON.stringify(out,null,2)+'\n');"

rm -rf "$TMP"

echo "Server artifact ready: dist/app  (run: node dist/app/index.js)"
