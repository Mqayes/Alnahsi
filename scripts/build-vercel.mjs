import { execSync } from 'child_process'
import { cpSync, mkdirSync, writeFileSync, rmSync } from 'fs'

// 1. Build the app (produces dist/client/ and dist/server/)
console.log('Building app...')
execSync('npm run build', { stdio: 'inherit' })

// 2. Set up .vercel/output structure (Vercel Build Output API v3)
rmSync('.vercel/output', { recursive: true, force: true })
mkdirSync('.vercel/output/functions/index.func', { recursive: true })
mkdirSync('.vercel/output/static', { recursive: true })

// 3. Static assets served directly by Vercel CDN
cpSync('dist/client', '.vercel/output/static', { recursive: true })

// 4. Server files become the serverless function
cpSync('dist/server', '.vercel/output/functions/index.func', { recursive: true })

// 5. ESM package marker so Node.js treats .js files as ES modules
writeFileSync('.vercel/output/functions/index.func/package.json', JSON.stringify({ type: 'module' }))

// 6. Vercel function entry — adapts Web Standard fetch handler to Node.js req/res
writeFileSync('.vercel/output/functions/index.func/index.js', `
import server from './server.js'

export default async function handler(req, res) {
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
`.trim())

// 7. Vercel function metadata
writeFileSync('.vercel/output/functions/index.func/.vc-config.json', JSON.stringify({
  runtime: 'nodejs22.x',
  handler: 'index.js',
  launcherType: 'Nodejs'
}, null, 2))

// 8. Routing: static files first, then SSR function
writeFileSync('.vercel/output/config.json', JSON.stringify({
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index' }
  ]
}, null, 2))

console.log('✓ Vercel output ready')
