import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create a default user if it doesn't exist
  const defaultUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'temp-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
  })
  console.log('Created/updated default user:', defaultUser.email)

  // Delete existing tools to avoid duplicates
  await prisma.tool.deleteMany()

  // Create initial tools
  const tools = [
    {
      name: 'calculator',
      displayName: 'Calculator',
      description: 'Perform mathematical calculations',
      category: 'Math',
      parameters: [
        {
          name: 'expression',
          type: 'string',
          description: 'Math expression to evaluate',
          required: true,
        },
      ],
      isBuiltin: true,
    },
    {
      name: 'webSearch',
      displayName: 'Web Search',
      description: 'Search the web for information',
      category: 'Search',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'Search query',
          required: true,
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of results',
          required: false,
        },
      ],
      isBuiltin: true,
    },
    {
      name: 'fileReader',
      displayName: 'File Reader',
      description: 'Read content from files',
      category: 'File Management',
      parameters: [
        {
          name: 'path',
          type: 'string',
          description: 'File path to read',
          required: true,
        },
      ],
      isBuiltin: true,
    },
    {
      name: 'fileWriter',
      displayName: 'File Writer',
      description: 'Write content to files',
      category: 'File Management',
      parameters: [
        {
          name: 'path',
          type: 'string',
          description: 'File path to write',
          required: true,
        },
        {
          name: 'content',
          type: 'string',
          description: 'Content to write',
          required: true,
        },
      ],
      isBuiltin: true,
    },
    {
      name: 'httpRequest',
      displayName: 'HTTP Request',
      description: 'Make HTTP requests to external APIs',
      category: 'API Integration',
      parameters: [
        {
          name: 'url',
          type: 'string',
          description: 'URL to request',
          required: true,
        },
        {
          name: 'method',
          type: 'string',
          description: 'HTTP method (GET, POST, etc.)',
          required: false,
        },
        {
          name: 'headers',
          type: 'object',
          description: 'Request headers',
          required: false,
        },
        {
          name: 'body',
          type: 'string',
          description: 'Request body',
          required: false,
        },
      ],
      isBuiltin: true,
    },
    {
      name: 'emailSender',
      displayName: 'Email Sender',
      description: 'Send emails',
      category: 'Communication',
      parameters: [
        {
          name: 'to',
          type: 'string',
          description: 'Recipient email address',
          required: true,
        },
        {
          name: 'subject',
          type: 'string',
          description: 'Email subject',
          required: true,
        },
        {
          name: 'body',
          type: 'string',
          description: 'Email body',
          required: true,
        },
      ],
      isBuiltin: true,
    },
    {
      name: 'dataQuery',
      displayName: 'Database Query',
      description: 'Query databases',
      category: 'Data',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'SQL or query string',
          required: true,
        },
        {
          name: 'database',
          type: 'string',
          description: 'Database name',
          required: false,
        },
      ],
      isBuiltin: true,
    },
    {
      name: 'jsonParser',
      displayName: 'JSON Parser',
      description: 'Parse and manipulate JSON data',
      category: 'Data',
      parameters: [
        {
          name: 'json',
          type: 'string',
          description: 'JSON string to parse',
          required: true,
        },
        {
          name: 'path',
          type: 'string',
          description: 'JSONPath to extract',
          required: false,
        },
      ],
      isBuiltin: true,
    },
    {
      name: 'weatherFetch',
      displayName: 'Weather Data',
      description: 'Get weather information',
      category: 'API Integration',
      parameters: [
        {
          name: 'location',
          type: 'string',
          description: 'City or coordinates',
          required: true,
        },
      ],
      isBuiltin: true,
    },
    {
      name: 'translator',
      displayName: 'Language Translator',
      description: 'Translate text between languages',
      category: 'Communication',
      parameters: [
        {
          name: 'text',
          type: 'string',
          description: 'Text to translate',
          required: true,
        },
        {
          name: 'targetLanguage',
          type: 'string',
          description: 'Target language code',
          required: true,
        },
        {
          name: 'sourceLanguage',
          type: 'string',
          description: 'Source language code',
          required: false,
        },
      ],
      isBuiltin: true,
    },
  ]

  for (const tool of tools) {
    await prisma.tool.create({
      data: tool,
    })
    console.log(`Created tool: ${tool.displayName}`)
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })