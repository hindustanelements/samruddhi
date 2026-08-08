import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const processes = [];

function start(name, cwd, command, args) {
  const child = spawn(command, args, {
    cwd,
    stdio: ["inherit", "pipe", "pipe"],
    shell: false
  });

  processes.push(child);

  const prefix = `[${name}]`;
  child.stdout.on("data", (chunk) => process.stdout.write(`${prefix} ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`${prefix} ${chunk}`));
  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`${prefix} stopped by ${signal}`);
      return;
    }
    if (code) {
      console.error(`${prefix} exited with code ${code}`);
      stopAll();
    }
  });
}

function stopAll() {
  for (const child of processes) {
    if (!child.killed) child.kill();
  }
}

process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stopAll();
  process.exit(0);
});

const backendDir = join(root, "backend");
const frontendDir = join(root, "frontend");
const nextCli = join(frontendDir, "node_modules", "next", "dist", "bin", "next");

if (!existsSync(nextCli)) {
  console.error("Next.js CLI not found. Run npm run install:all first.");
  process.exit(1);
}

start("api", backendDir, process.execPath, ["src/index.js"]);
start("web", frontendDir, process.execPath, [nextCli, "dev"]);
