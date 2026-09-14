import { spawn } from "node:child_process";
import net from "node:net";

process.env.PORT = "4173";

const isPortFree = () =>
  new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(4173, "127.0.0.1");
  });

// Repeated double-clicks are intentional. Reuse the first preview server
// instead of failing with EADDRINUSE before Edge is opened.
if (await isPortFree()) await import("./server.mjs");

setTimeout(() => {
  const edge = spawn(
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    ["http://127.0.0.1:4173/"],
    { detached: true, stdio: "ignore", windowsHide: false },
  );
  edge.unref();
}, 350);
