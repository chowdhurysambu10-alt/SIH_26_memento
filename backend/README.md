# Societal Innovation Collaboration Portal - Backend API

> **Smart India Hackathon (SIH) Backend Solution**  
> Scalable, AI-driven backend for crowdsourcing societal challenges across Jharkhand, classifying and deduplicating them using Google AI Studio Gemma models (with self-hosted Ollama fallback), and routing them to universities and industry partners for collaborative execution.

---

## 🏛️ Architecture & Tech Stack (100% Free Tiers)

- **Backend Framework**: Node.js + NestJS (TypeScript)
- **Database & Auth**: [Supabase](https://supabase.com) (Free Tier PostgreSQL + Row Level Security + Supabase Auth)
- **Media & File Storage**: Supabase Storage (`challenge-media` bucket)
- **Realtime Push Notifications**: Supabase Realtime Channels (Postgres CDC WebSockets)
- **AI Classification & Deduplication**: [Google AI Studio](https://aistudio.google.com) (Gemma 2 9B / 27B free tier) + Swappable **Ollama** Fallback Layer
- **API Documentation**: OpenAPI / Swagger UI (`@nestjs/swagger`)

---

## 📂 Project Structure

```text
SIH_26_memento/
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql         # Postgres tables, enums, indexes, constraints
│       ├── 002_rls_policies.sql           # Granular Row-Level Security per role
│       ├── 003_seed_data.sql              # 10 Jharkhand categories & university seeds
│       └── 004_triggers_and_realtime.sql  # Audit triggers, realtime publications, notifications
├── src/
│   ├── common/
│   │   ├── constants/                     # UserRole, ChallengeStatus, InstitutionType
│   │   ├── decorators/                    # @Roles(), @CurrentUser(), @Public()
│   │   ├── filters/                       # AllExceptionsFilter { statusCode, message, errorCode }
│   │   ├── guards/                        # SupabaseAuthGuard, RolesGuard
│   │   ├── interceptors/                  # TransformInterceptor
│   │   └── state-machine/                 # ChallengeStateMachine logic & unit tests
│   ├── config/                            # Environment configuration loader
│   ├── modules/
│   │   ├── supabase/                      # Supabase Admin & User-scoped clients, Storage uploads
│   │   ├── auth/                          # Signup (with role assignment) & Login
│   │   ├── users/                         # User profiles & institutional verification
│   │   ├── ai/                            # LLM Abstraction (GemmaApiProvider, OllamaProvider, ClassificationService)
│   │   ├── challenges/                    # Challenge CRUD, media upload, AI routing, overrides
│   │   ├── collaboration/                 # Teams, proposals, industry engagements, milestones
│   │   ├── notifications/                 # Notifications management & real-time dispatcher
│   │   └── analytics/                     # Dashboard overview, categories, districts & leaderboard
│   ├── app.module.ts
│   └── main.ts                            # Bootstrap, global pipes, CORS, Swagger UI
├── API_CONTRACT.md                        # Complete API specifications & payload schemas
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v18+` or `v20+` (Tested on `v24.x`)
- Free Supabase Project ([supabase.com](https://supabase.com))
- Free Google AI Studio API Key ([aistudio.google.com](https://aistudio.google.com))

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
PORT=3000
NODE_ENV=development

# Supabase Free Tier Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
SUPABASE_STORAGE_BUCKET=challenge-media

# AI Classification (Google AI Studio Gemma)
DEFAULT_AI_PROVIDER=gemma
GEMMA_API_KEY=your-google-ai-studio-gemini-or-gemma-key
GEMMA_MODEL=gemma-2-9b-it
GEMMA_API_URL=https://generativelanguage.googleapis.com/v1beta/models

# Ollama Fallback (Optional self-hosted instance)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma2:9b
```

### 3. Run Database Migrations in Supabase
Execute the SQL files located in `supabase/migrations/` sequentially in your Supabase SQL Editor:
1. `001_initial_schema.sql`
2. `002_rls_policies.sql`
3. `003_seed_data.sql`
4. `004_triggers_and_realtime.sql`

### 4. Install Dependencies & Start Server
```bash
npm install
npm run start:dev
```
- API Server: `http://localhost:3000/api/v1`
- Swagger UI Documentation: `http://localhost:3000/api/docs`

---

## 🧪 Running Automated Tests

Run the test suite covering State Machine transition logic and AI Classification / Fallback behavior:
```bash
npm test
```

---

## ⚠️ Free-Tier Guidelines & Limitations

1. **Google AI Studio Gemma API Rate Limits (15 RPM free tier)**:
   - Built-in failover: If Google AI Studio returns HTTP 429 or times out, `ClassificationService` automatically falls back to your self-hosted Ollama Gemma instance or the local heuristic rule engine, ensuring zero service interruptions.
2. **Supabase Inactivity Pausing (Free Tier)**:
   - Free Supabase projects pause after 7 days of inactivity. Setting up a free GitHub Action cron job to ping `GET /api/v1/analytics/overview` keeps the database warm.
3. **No Heavy Redis/BullMQ Required**:
   - Background event notifications and audit logging are managed natively inside PostgreSQL using triggers and Supabase Realtime publication.

---

## 📄 API Specifications
Refer to [API_CONTRACT.md](./API_CONTRACT.md) for full endpoint request/response payloads, role access matrix, and WebSocket subscription code snippets.
