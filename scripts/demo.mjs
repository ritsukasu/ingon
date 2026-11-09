// Cross-platform launcher: starts the mock model + Next dev server with .env.demo.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const env = { ...process.env };
for (const line of readFileSync(".env.demo", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2];
}
const run = (args) => spawn(process.execPath, args, { stdio: "inherit", env });
const procs = [run(["scripts/mock-llm.mjs"]), run(["node_modules/next/dist/bin/next", "dev"])];
const stop = () => procs.forEach((p) => p.kill());
process.on("SIGINT", stop);
process.on("exit", stop);
