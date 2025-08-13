import { Tool } from '@xynehq/jaf'
import {
  ToolExecutionContext,
  calculatorParamsSchema,
  CalculatorParams,
  webSearchParamsSchema,
  WebSearchParams,
  weatherParamsSchema,
  WeatherParams,
  jsonParserParamsSchema,
  JsonParserParams,
  emailSenderParamsSchema,
  EmailSenderParams,
  dataQueryParamsSchema,
  DataQueryParams,
  translatorParamsSchema,
  TranslatorParams,
  fileReaderParamsSchema,
  FileReaderParams,
  fileWriterParamsSchema,
  FileWriterParams,
  httpRequestParamsSchema,
  HttpRequestParams,
  SearchResult,
  WeatherData,
  DatabaseRecord,
} from './jaf-types'

// Calculator Tool
export const calculatorTool: Tool<CalculatorParams, ToolExecutionContext> = {
  schema: {
    name: 'calculator',
    description: 'Perform mathematical calculations',
    parameters: calculatorParamsSchema,
  },
  execute: async ({ expression }: CalculatorParams): Promise<string> => {
    try {
      // Basic safety check - only allow numbers and basic math operators
      if (!/^[\d\s+\-*/().]+$/.test(expression)) {
        throw new Error('Invalid expression')
      }
      // Use Function constructor for safer eval
      const result = new Function('return ' + expression)() as number
      return `Result: ${result}`
    } catch {
      return `Error: Invalid mathematical expression`
    }
  },
}

// Web Search Tool (mock implementation)
export const webSearchTool: Tool<WebSearchParams, ToolExecutionContext> = {
  schema: {
    name: 'webSearch',
    description: 'Search the web for information',
    parameters: webSearchParamsSchema,
  },
  execute: async ({ query, limit = 5 }: WebSearchParams): Promise<string> => {
    // Mock search results for demonstration
    const mockResults: SearchResult[] = [
      { title: `Result 1 for "${query}"`, snippet: 'This is a mock search result...', url: 'https://example.com/1' },
      { title: `Result 2 for "${query}"`, snippet: 'Another mock result with relevant information...', url: 'https://example.com/2' },
      { title: `Result 3 for "${query}"`, snippet: 'More information about your query...', url: 'https://example.com/3' },
    ].slice(0, limit)
    
    return JSON.stringify(mockResults, null, 2)
  },
}

// Weather Tool (mock implementation)
export const weatherTool: Tool<WeatherParams, ToolExecutionContext> = {
  schema: {
    name: 'weatherFetch',
    description: 'Get weather information',
    parameters: weatherParamsSchema,
  },
  execute: async ({ location }: WeatherParams): Promise<string> => {
    // Mock weather data
    const mockWeather: WeatherData = {
      location,
      temperature: Math.floor(Math.random() * 30) + 10,
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 20) + 5,
    }
    
    return `Weather in ${location}: ${mockWeather.temperature}°C, ${mockWeather.condition}, Humidity: ${mockWeather.humidity}%, Wind: ${mockWeather.windSpeed} km/h`
  },
}

// JSON Parser Tool
export const jsonParserTool: Tool<JsonParserParams, ToolExecutionContext> = {
  schema: {
    name: 'jsonParser',
    description: 'Parse and manipulate JSON data',
    parameters: jsonParserParamsSchema,
  },
  execute: async ({ json, path }: JsonParserParams): Promise<string> => {
    try {
      const parsed = JSON.parse(json) as Record<string, unknown>
      
      if (path) {
        // Simple path extraction (e.g., "user.name")
        const keys = path.split('.')
        let result: unknown = parsed
        for (const key of keys) {
          if (typeof result === 'object' && result !== null && key in result) {
            result = (result as Record<string, unknown>)[key]
          } else {
            return `Path "${path}" not found in JSON`
          }
        }
        return JSON.stringify(result, null, 2)
      }
      
      return JSON.stringify(parsed, null, 2)
    } catch (error) {
      return `Error parsing JSON: ${error instanceof Error ? error.message : 'Invalid JSON'}`
    }
  },
}

// Email Sender Tool (mock implementation)
export const emailSenderTool: Tool<EmailSenderParams, ToolExecutionContext> = {
  schema: {
    name: 'emailSender',
    description: 'Send emails',
    parameters: emailSenderParamsSchema,
  },
  execute: async ({ to, subject, body }: EmailSenderParams): Promise<string> => {
    // Mock email sending
    console.log(`[Mock Email] To: ${to}, Subject: ${subject}, Body: ${body}`)
    return `Email sent successfully to ${to} with subject "${subject}"`
  },
}

// Database Query Tool (mock implementation)
export const dataQueryTool: Tool<DataQueryParams, ToolExecutionContext> = {
  schema: {
    name: 'dataQuery',
    description: 'Query databases',
    parameters: dataQueryParamsSchema,
  },
  execute: async ({ query, database = 'default' }: DataQueryParams): Promise<string> => {
    // Mock database query
    const mockData: DatabaseRecord[] = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ]
    
    return `Query executed on ${database}: ${query}\nResults: ${JSON.stringify(mockData, null, 2)}`
  },
}

// Translator Tool (mock implementation)
export const translatorTool: Tool<TranslatorParams, ToolExecutionContext> = {
  schema: {
    name: 'translator',
    description: 'Translate text between languages',
    parameters: translatorParamsSchema,
  },
  execute: async ({ text, targetLanguage, sourceLanguage = 'auto' }: TranslatorParams): Promise<string> => {
    // Mock translation
    const mockTranslations: Record<string, string> = {
      'es': `[Traducción al español]: ${text}`,
      'fr': `[Traduction en français]: ${text}`,
      'de': `[Deutsche Übersetzung]: ${text}`,
      'ja': `[日本語訳]: ${text}`,
    }
    
    return mockTranslations[targetLanguage] || `[Translation to ${targetLanguage} from ${sourceLanguage}]: ${text}`
  },
}

// File Reader Tool (mock implementation)
export const fileReaderTool: Tool<FileReaderParams, ToolExecutionContext> = {
  schema: {
    name: 'fileReader',
    description: 'Read content from files',
    parameters: fileReaderParamsSchema,
  },
  execute: async ({ path }: FileReaderParams): Promise<string> => {
    // Mock file reading
    return `[Mock] Contents of ${path}:\nThis is mock file content.\nLine 2 of the file.\nLine 3 of the file.`
  },
}

// File Writer Tool (mock implementation)
export const fileWriterTool: Tool<FileWriterParams, ToolExecutionContext> = {
  schema: {
    name: 'fileWriter',
    description: 'Write content to files',
    parameters: fileWriterParamsSchema,
  },
  execute: async ({ path, content }: FileWriterParams): Promise<string> => {
    // Mock file writing
    console.log(`[Mock Write] Writing to ${path}: ${content}`)
    return `Successfully wrote ${content.length} characters to ${path}`
  },
}

// HTTP Request Tool
export const httpRequestTool: Tool<HttpRequestParams, ToolExecutionContext> = {
  schema: {
    name: 'httpRequest',
    description: 'Make HTTP requests to external APIs',
    parameters: httpRequestParamsSchema,
  },
  execute: async ({ url, method = 'GET', headers = {}, body }: HttpRequestParams): Promise<string> => {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      }
      
      if (body && method !== 'GET') {
        options.body = body
      }
      
      const response = await fetch(url, options)
      const data = await response.text()
      
      return `Response (${response.status}): ${data.substring(0, 500)}${data.length > 500 ? '...' : ''}`
    } catch (error) {
      return `Error making HTTP request: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  },
}

// Properly typed tool registry
type ToolType = 
  | typeof calculatorTool
  | typeof webSearchTool
  | typeof weatherTool
  | typeof jsonParserTool
  | typeof emailSenderTool
  | typeof dataQueryTool
  | typeof translatorTool
  | typeof fileReaderTool
  | typeof fileWriterTool
  | typeof httpRequestTool

// Tool registry with proper typing
export const toolRegistry: Record<string, ToolType> = {
  calculator: calculatorTool,
  webSearch: webSearchTool,
  weatherFetch: weatherTool,
  jsonParser: jsonParserTool,
  emailSender: emailSenderTool,
  dataQuery: dataQueryTool,
  translator: translatorTool,
  fileReader: fileReaderTool,
  fileWriter: fileWriterTool,
  httpRequest: httpRequestTool,
}

// Get tools by IDs with proper typing
export function getToolsByIds(toolIds: string[]): ToolType[] {
  return toolIds
    .map(id => toolRegistry[id])
    .filter((tool): tool is ToolType => tool !== undefined)
}