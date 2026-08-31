# Memento — Societal Innovation & Collaboration Platform
> **Smart India Hackathon (SIH 2026) · Problem Statement 26043**

A crowdsourcing and societal challenge resolution platform for Jharkhand. Connects grassroots citizens with university research labs, engineering student teams, and CSR industry partners for verified problem solving.

---

## 🏗️ Architecture Overview

The repository is structured as an orchestrated monorepo:
- **`frontend/`**: Vite + React (TypeScript) SPA with Lucide icons and Chart.js analytics.
- **`backend/`**: NestJS REST API Gateway with Google AI Studio (Gemma 2 / Gemini) classification engine, local Ollama failover, and Supabase PostgreSQL with RLS.
- **`backend/supabase/migrations/`**: Database migrations (`001` through `006`) with RLS policies and indexes.

---

## ⚡ Quick Start for Developers

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/chowdhurysambu10-alt/SIH_26_memento.git
cd SIH_26_memento

# Install root, backend, and frontend dependencies
npm run install:all
```

### 2. Environment Setup
Create `backend/.env` (copy from `backend/.env.example`):
```bash
cp backend/.env.example backend/.env
```
Fill in your Supabase project keys and Google AI Studio API key.

### 3. Run the Whole Platform Locally
```bash
# Runs both NestJS backend (port 3000) and React frontend (port 5173) in parallel
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **Swagger Documentation**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

## 🚀 Key Features

1. **Crowdsourced Challenge Submission**: Citizens submit civic, water, healthcare, and education problems with media evidence.
2. **Automated AI Triage & Scoring**: Real-time category assignment, duplicate detection, and severity scoring (1-100).
3. **Top Problems Dashboard**: Dynamic ranking by citizen support upvotes (1-vote-per-user system) and severity.
4. **Institutional Claim Portal**: Universities and research teams claim problems for academic capstone and R&D projects.
5. **AI Reviewer Audit**: Human-in-the-loop override interface with complete audit logs.
