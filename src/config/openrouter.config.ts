import { registerAs } from '@nestjs/config';

export default registerAs('openrouter', () => ({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'deepseek/deepseek-chat-v3.1:free',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || '8000', 10),
  temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || '0.7'),
}));
