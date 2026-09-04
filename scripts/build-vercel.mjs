import { execSync } from "child_process";
import { mkdirSync, writeFileSync, rmSync, cpSync } from "fs";
import { build } from "esbuild";
import { resolve } from "path";

// 1. Build the app (produces dist/client/ and dist/server/)
console.log("Building app...");
execSync("npm run build", { stdio: "inherit" });

// 2. Set up .vercel/output structure (Vercel Build Output API v3)
rmSync(".vercel/output", { recursive: true, force: true });
mkdirSync(".vercel/output/functions/index.func", { recursive: true });
mkdirSync(".vercel/output/static", { recursive: true });

// 3. Static assets served directly by Vercel CDN
cpSync("dist/client", ".vercel/output/static", { recursive: true });

// 4. Bundle server + all node_modules into a single self-contained CJS file.
//    CJS format avoids the "Dynamic require" error that ESM bundles produce
//    when packages internally use require().
console.log("Bundling server for Vercel...");
await build({
  entryPoints: [resolve("dist/server/server.js")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: ".vercel/output/functions/index.func/server.bundle.cjs",
  external: ["node:*", "fsevents"],
  logLevel: "error",
  absWorkingDir: process.cwd(),
});

// 5. Vercel function entry (CJS) — adapts Web Standard fetch handler to Node.js req/res
writeFileSync(
  ".vercel/output/functions/index.func/index.js",
  `
const bundle = require('./server.bundle.cjs')
const server = bundle.default || bundle

module.exports = async function handler(req, res) {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['host'] || 'localhost'
  const url = new URL(req.url, proto + '://' + host)

  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (v != null) headers.set(k, Array.isArray(v) ? v.join(', ') : String(v))
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    ...(hasBody ? { body: req, duplex: 'half' } : {})
  })

  const response = await server.fetch(request, {}, {})

  res.statusCode = response.status
  for (const [k, v] of response.headers) res.setHeader(k, v)
  res.end(Buffer.from(await response.arrayBuffer()))
}
`.trim(),
);

// 6. Vercel function metadata
writeFileSync(
  ".vercel/output/functions/index.func/.vc-config.json",
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.js",
      launcherType: "Nodejs",
    },
    null,
    2,
  ),
);

// 7. Routing: static files first, then SSR function for everything else
writeFileSync(
  ".vercel/output/config.json",
  JSON.stringify(
    {
      version: 3,
      routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/index" }],
    },
    null,
    2,
  ),
);

console.log("✓ Vercel output ready");
