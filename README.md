# Zenlink

## Quick Start

### Prerequisites

1. **PostgreSQL** - Local instance running (default: `localhost:5432`)
2. **OpenAI API Key** - Get from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. **Java 17+** and **Node.js** installed

### Setup

1. **Set OpenAI API Key** (required):
   ```bash
   # On Windows (PowerShell)
   $env:OPENAI_API_KEY="sk-proj-..."
   
   # On Linux/Mac
   export OPENAI_API_KEY="sk-proj-..."
   ```
   
   Or create a `.env` file in the project root:
   ```
   OPENAI_API_KEY=sk-proj-...
   OPENAI_MODEL=gpt-5-nano
   OPENAI_MAX_OUTPUT_TOKENS=600
   OPENAI_TEMPERATURE=0.3
   ```

2. **Install dependencies**:
   ```bash
   # Backend
   ./mvnw clean install
   
   # Frontend
   cd frontend
   npm install
   ```

3. **Run the application**:
   ```bash
   # Terminal 1: Backend (from repo root)
   ./mvnw spring-boot:run
   
   # Terminal 2: Frontend (from frontend/)
   cd frontend
   npm run dev
   ```

4. **Access the app**: Open [http://localhost:5173](http://localhost:5173)

## Backend: local Postgres setup (no Docker)

This project is currently intended to run against a **local PostgreSQL** instance.

### Run the backend

From repo root:

```bash
./mvnw spring-boot:run
```

### Fix: `permission denied for schema public`

If you see:
- **`ERROR: permission denied for schema public`**

it means the DB user you configured (e.g. `zenlink_user`) can connect, but **cannot create tables**. Since `spring.jpa.hibernate.ddl-auto=update`, Hibernate will try to create tables and fail.

Run the bootstrap SQL as a superuser:

```bash
psql -U postgres -f db/postgres/bootstrap.sql
```

## AI Features

All AI features use **OpenAI GPT-5 nano** via a unified backend endpoint:
- `/api/ai/chat` - Non-streaming JSON endpoint (used by preview widget, AI page)
- `/api/ai/chat/stream` - Streaming endpoint (used by full chat interface)

**Important**: Never expose `OPENAI_API_KEY` to the client. All OpenAI calls happen server-side only.
