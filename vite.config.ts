// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import path from "node:path";
import fs from "node:fs";

// Load all env vars (no prefix) into process.env so server routes can read
// SUPABASE_SERVICE_ROLE_KEY and other non-VITE_ secrets at SSR time.
const serverEnv = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

// Bridge plugin: TanStack's preview-server-plugin (used by the prerender step)
// looks for `dist/server/server.js`, but the Cloudflare preset emits
// `dist/server/index.mjs` which expects an `env` arg with ASSETS bindings.
// Without this shim, prerender of `/` 500s and the build fails. Write a tiny
// wrapper that supplies an empty env so the Nitro handler can run.
const serverEntryShimPlugin = {
  name: "kukapay:server-entry-shim",
  apply: "build" as const,
  closeBundle: {
    order: "post" as const,
    handler() {
      const dir = path.resolve(process.cwd(), "dist/server");
      const shim = path.join(dir, "server.js");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        shim,
        [
          `import cf from "./index.mjs";`,
          `const noopEnv = {};`,
          `const noopCtx = { waitUntil: () => {}, passThroughOnException: () => {} };`,
          `// Cloudflare's augmentReq sets request.ip and may extend request.runtime.`,
          `// The incoming srvx NodeRequest already exposes a runtime.node binding —`,
          `// don't clobber it. Only add the slots Cloudflare needs that are missing.`,
          `function adaptRequest(req) {`,
          `  try {`,
          `    if (!Object.getOwnPropertyDescriptor(req, "ip")) {`,
          `      Object.defineProperty(req, "ip", { value: undefined, writable: true, configurable: true });`,
          `    }`,
          `    if (!Object.getOwnPropertyDescriptor(req, "waitUntil")) {`,
          `      Object.defineProperty(req, "waitUntil", { value: () => {}, writable: true, configurable: true });`,
          `    }`,
          `  } catch {}`,
          `  return req;`,
          `}`,
          `// Resolve the fetch handler regardless of which Nitro preset was used:`,
          `//   - Cloudflare preset  → cf is { fetch(req, env, ctx) {} }`,
          `//   - node-server preset → cf is an async function(req, env, ctx) or`,
          `//                          a h3/srvx app object without a .fetch property`,
          `// This shim normalises both shapes so the TanStack prerender step always`,
          `// gets a valid fetch handler at dist/server/server.js.`,
          `const fetchHandler =`,
          `  typeof cf === "function"`,
          `    ? cf`,
          `    : typeof cf?.fetch === "function"`,
          `      ? cf.fetch.bind(cf)`,
          `      : typeof cf?.default?.fetch === "function"`,
          `        ? cf.default.fetch.bind(cf.default)`,
          `        : null;`,
          `if (!fetchHandler) {`,
          `  throw new Error(`,
          `    "[server-entry-shim] Cannot resolve a fetch handler from dist/server/index.mjs. " +`,
          `    "Received: " + JSON.stringify(Object.keys(cf ?? {}))`,
          `  );`,
          `}`,
          `export default {`,
          `  async fetch(request, env, context) {`,
          `    try {`,
          `      const res = await fetchHandler(adaptRequest(request), env ?? noopEnv, context ?? noopCtx);`,
          `      if (!res.ok) {`,
          `        const body = await res.clone().text().catch(() => "<unreadable>");`,
          `        console.error("[server-entry-shim] non-ok response", res.status, body.slice(0, 5000));`,
          `      }`,
          `      return res;`,
          `    } catch (err) {`,
          `      console.error("[server-entry-shim] SSR throw:", err && err.stack || err);`,
          `      return new Response(String(err && err.stack || err), { status: 500, headers: { "content-type": "text/plain" } });`,
          `    }`,
          `  },`,
          `};`,
          ``,
        ].join("\n"),
      );
    },
  },
};

// NOTE: do NOT pass `tanstackStart` here — the @lovable.dev wrapper already configures it,
// and overriding clobbers the client-entry plugin (blank screen, no <script> emitted).
// SSR error wrapping is handled via wrangler.jsonc `main: "src/server.ts"` in production.
export default defineConfig({
  nitro: {
    output: {
      dir: "dist",
      serverDir: "dist/server",
      publicDir: "dist/client",
    },
  },
  tanstackStart: {
    spa: {
      enabled: true
    },
    prerender: {
      enabled: false
    }
  },
  vite: {
    resolve: {
      alias: {
        "entities/lib/decode.js": path.resolve(__dirname, "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(__dirname, "node_modules/entities/lib/encode.js"),
        entities: path.resolve(__dirname, "node_modules/entities"),
      },
    },
    plugins: [serverEntryShimPlugin],
  },
});
