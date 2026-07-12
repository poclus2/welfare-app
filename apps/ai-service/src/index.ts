import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import 'dotenv/config'

const app = Fastify({ logger: true })

// ─── Plugins ─────────────────────────────────────────────────────────────────
await app.register(cors, {
  origin: [
    process.env.STOREFRONT_URL ?? 'http://localhost:3000',
    process.env.ADMIN_URL ?? 'http://localhost:3001',
  ],
  credentials: true,
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'welfare_jwt_super_secret_change_in_prod',
})

// ─── Auth Middleware (Coach = membres uniquement) ────────────────────────────
app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
  } catch {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'My Skin Coach est réservé aux membres inscrits. Connectez-vous pour accéder à votre coach IA.',
    })
  }
})

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async () => ({ status: 'ok', service: 'My Skin Coach AI' }))

// ─── Routes ──────────────────────────────────────────────────────────────────

// TODO: /chat   → streaming conversationnel
// TODO: /analyze → analyse profil de peau
// TODO: /routine → get/set routine personnalisée

// Placeholder route pour tester
app.get('/coach/hello', {
  preHandler: [(app as any).authenticate],
  handler: async (request: any) => {
    const user = request.user
    return {
      message: `Bonjour ! Je suis votre Skin Coach. Comment puis-je vous aider aujourd'hui ?`,
      user_id: user.sub,
    }
  },
})

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.AI_SERVICE_PORT ?? '4000')
const HOST = process.env.AI_SERVICE_HOST ?? '0.0.0.0'

try {
  await app.listen({ port: PORT, host: HOST })
  console.log(`\n🧬 My Skin Coach AI Service running on http://localhost:${PORT}\n`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
