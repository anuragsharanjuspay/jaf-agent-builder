# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages and routes
  - `app/agents/`, `app/tools/`, `app/settings/`: feature pages
  - `app/api/…`: REST endpoints (agents, tools, export, execute)
- `components/`: Reusable UI and feature components (`agents/`, `ui/`, `layout/`)
- `lib/`: Core logic, types, and JAF integration (`jaf-*.ts`, `types.ts`, `db.ts`)
- `prisma/`: Database schema, migrations, and seed
- `public/`: Static assets

## Build, Test, and Development Commands
- `npm run dev`: Start the Next.js dev server
- `npm run build`: Generate production build (runs `prisma generate` first)
- `npm start`: Run the production server
- `npm run lint`: Lint with ESLint (Next core-web-vitals)
- Database:
  - `npx prisma migrate dev`: Apply local migrations
  - `npm run prisma:generate`: Generate Prisma client
  - `npm run prisma:seed` or `npx prisma db seed`: Seed sample data
- Manual API checks (after `dev`/`start`): `node test-api.js`, `node test-playground.js`

## Coding Style & Naming Conventions
- **Language**: TypeScript + React (App Router)
- **Linting**: ESLint (`next/core-web-vitals`, TypeScript). Fix issues before PRs.
- **Styling**: Tailwind CSS; prefer utility-first classes.
- **Files**: lower-kebab-case for files (`jaf-transformer.ts`); components export PascalCase functions.
- **Imports**: Use relative paths; keep feature-local code near its page/components.

## Testing Guidelines
- No formal test runner configured. Use the provided node scripts and manual UI verification.
- Ensure API flows: create → get → update → export → list → delete pass (`test-api.js`).
- For playground/agent execution, verify flows with `test-playground.js` and the UI pages.
- Add lightweight utility tests if introducing critical logic (e.g., pure functions in `lib/`).

## Commit & Pull Request Guidelines
- Follow concise, imperative commits. Preferred prefixes observed: `feat:`, `refactor:`, `fix:`.
- PRs should include: clear description, scope, screenshots for UI changes, migration notes, and any env updates.
- Requirements: pass `npm run lint`, run prisma migrations/seed locally, and ensure manual tests succeed.
- Link related issues and note breaking changes explicitly.

## Security & Configuration Tips
- Never commit secrets. Use `.env` (see `.env.example`). Required: `DATABASE_URL`, `DIRECT_URL`; add service API keys via Settings UI when applicable.
- Update `.env.example` and docs when adding new configuration.

### Database Layer (Prisma + PostgreSQL)
- **Singleton Pattern**: Database connections use `/lib/db.ts` singleton to prevent connection pool issues
- **Models**: User, Team, Agent, Tool, KnowledgeSource, AgentExecution
- **Environment**: Requires `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in `.env`

### API Routes (Next.js App Router)
All API routes use the Prisma singleton from `/lib/db.ts`:
- `/api/agents` - CRUD operations for agents
- `/api/agents/[id]` - Individual agent operations
- `/api/agents/[id]/export` - Export agent as JAF TypeScript or JSON

### Core Libraries
- **Type Definitions**: `/lib/types.ts` - Zod schemas and TypeScript types for agents, tools, knowledge sources
- **JAF Transformer**: `/lib/jaf-transformer.ts` - Converts UI configurations to JAF-compatible TypeScript code
- **UI Components**: `/components/ui/` - shadcn/ui components with Tailwind CSS

### Agent Configuration Flow
1. User creates agent via form (`/components/agents/agent-form.tsx`)
2. Configuration validated with Zod schemas
3. Stored in PostgreSQL via Prisma
4. Can be exported as JAF TypeScript code or JSON
5. JAF code includes tool definitions, Zod schemas, and agent configuration

## Key Implementation Details

### Agent Export System
- Generates production-ready JAF TypeScript code with proper imports
- Automatically creates Zod schemas for tool parameters
- Handles tool selection and implementation stubs
- Supports both TypeScript and JSON export formats

### Tool Management
- Tools stored with Zod schema parameters as JSON
- Categories: Search, Math, Data, Communication, File Management, API Integration, Custom
- Built-in vs custom tool distinction
- Tools linked to agents via string array of IDs

### Knowledge Sources
- Types: document, url, api
- Stored as references with settings
- Associated with agents via foreign key

## Current Limitations & TODOs
- User authentication temporarily uses hardcoded `temp-user-id`
- Agent execution endpoint (`/api/agents/[id]/execute`) not yet implemented
- Team collaboration features pending
- Some TypeScript types need explicit annotations (see diagnostics in route.ts)

## Repository Structure
- Main branch: `main`
- Remote: `https://github.com/anuragsharanjuspay/jaf-agent-builder.git`
- Working directory: `/Users/anurag.sharan/repos/faf/ui/agent-builder`