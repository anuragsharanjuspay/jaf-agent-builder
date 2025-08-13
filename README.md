# JAF Agent Builder

A no-code visual builder for creating AI agents using the Juspay Agent Framework (JAF).

## Features

- 🎨 **Visual Agent Configuration** - Configure agents through intuitive forms without writing code
- 🔧 **Tool Integration** - Select and configure tools for your agents from a built-in library
- 📚 **Knowledge Management** - Add documents, URLs, and APIs as knowledge sources
- 💾 **JAF Export** - Export agents as production-ready JAF TypeScript code
- 🚀 **Direct Execution** - Test and run agents directly from the UI
- 👥 **Team Collaboration** - Share agents with your team (coming soon)

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **UI Components**: shadcn/ui + Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Type Safety**: TypeScript + Zod validation
- **Forms**: React Hook Form

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository and navigate to the agent builder:
```bash
cd ui/agent-builder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. (Optional) Seed the database with sample tools:
```bash
npx prisma db seed
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
agent-builder/
├── app/                    # Next.js app router pages
│   ├── agents/            # Agent management pages
│   ├── api/               # API routes
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── agents/           # Agent-specific components
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── lib/                   # Utilities and types
│   ├── types.ts          # TypeScript type definitions
│   ├── jaf-transformer.ts # JAF code generation
│   └── utils.ts          # Utility functions
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## Usage

### Creating an Agent

1. Navigate to the Agents page
2. Click "Create New Agent"
3. Fill in the agent configuration:
   - Name and description
   - Select the AI model
   - Write the system prompt
   - Select tools from the library
   - Add knowledge sources
4. Save the agent

### Exporting to JAF

1. Open an agent from the list
2. Click the "Export" button
3. Choose export format:
   - **JAF TypeScript**: Production-ready JAF code
   - **JSON**: Configuration as JSON

### Testing Agents

1. From the agent list, click "Test" on any agent
2. Enter test inputs in the chat interface
3. View the agent's responses and tool usage

## API Endpoints

- `GET /api/agents` - List all agents
- `POST /api/agents` - Create new agent
- `GET /api/agents/:id` - Get agent details
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `GET /api/agents/:id/export` - Export agent as JAF code
- `POST /api/agents/:id/execute` - Execute agent (coming soon)

## Database Schema

The application uses the following main models:

- **Agent**: Core agent configuration
- **Tool**: Available tools and their schemas
- **KnowledgeSource**: Documents and data sources
- **AgentExecution**: Execution history and logs

## Development

### Adding New Tools

Tools can be added by creating entries in the Tool table with:
- Unique name and display name
- Category for organization
- Parameters as Zod schema (JSON)
- Implementation details

### Extending the UI

The UI is built with shadcn/ui components. To add new components:

```bash
npx shadcn@latest add [component-name]
```

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Database Migrations

```bash
npx prisma migrate deploy
```

### Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for authentication (when enabled)
- `NEXTAUTH_URL` - Application URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT

## Acknowledgments

Built on top of the [Juspay Agent Framework (JAF)](https://github.com/xynehq/jaf)