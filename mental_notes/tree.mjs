import fs from "fs";
import path from "path";

const skipExact = new Set([
  ".git",
  "dist",
  "build",
  ".expo",
  ".next",
  ".vercel",
  "coverage",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "_logs",
]);
const skipPattern = /node_modules|npm-cache|\.(log|png|jpe?g|pdf|map)$/i;
const maxDepth = Number(process.argv[2]) || 4;
const maxLines = 300;
let lines = 0;
const out = [];

function walk(dir, prefix = "", depth = 0) {
  if (depth >= maxDepth) return;
  const items = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      (e) =>
        !skipExact.has(e.name) &&
        !skipPattern.test(e.name) &&
        !e.name.startsWith(".env"),
    )
    .sort(
      (a, b) =>
        b.isDirectory() - a.isDirectory() || a.name.localeCompare(b.name),
    );

  items.forEach((e, i) => {
    if (lines >= maxLines) return;
    const last = i === items.length - 1;
    out.push(prefix + (last ? "└── " : "├── ") + e.name);
    lines++;
    if (e.isDirectory())
      walk(
        path.join(dir, e.name),
        prefix + (last ? "    " : "│   "),
        depth + 1,
      );
  });
}

out.push(path.basename(process.cwd()));
walk(".");
if (lines >= maxLines)
  out.push(`... stopped at ${maxLines} lines, try a lower depth`);
fs.writeFileSync("tree.txt", out.join("\n"));
console.log(out.join("\n"));
