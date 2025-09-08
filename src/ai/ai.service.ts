import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GenerateOptions {
  prompt: string;
  input: string;
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('openrouter.apiKey');
    this.baseUrl = this.configService.get<string>('openrouter.baseUrl');
    this.defaultModel = this.configService.get<string>('openrouter.defaultModel');
    
    if (!this.apiKey) {
      this.logger.warn('OPENROUTER_API_KEY not configured. AI generation will not work.');
    }
  }

  async generate<T = any>(options: GenerateOptions): Promise<T> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    this.logger.log('Generating content with OpenRouter...');

    try {
      const messages = [
        {
          role: 'system' as const,
          content: options.prompt,
        },
        {
          role: 'user' as const,
          content: options.input,
        },
      ];

      const response = await this.makeRequest({
        model: this.defaultModel,
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 6000,
      });

      const generatedContent = response.choices[0]?.message?.content;
      if (!generatedContent) {
        throw new Error('No content generated from OpenRouter');
      }

      return this.parse<T>(generatedContent);
    } catch (error) {
      this.logger.error('Generation failed:', error);
      throw new Error(`Generation failed: ${error.message}`);
    }
  }

  parse<T = any>(content: string): T {
    try {
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const jsonMatch = jsonRegex.exec(content);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Failed to parse AI response:', error);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  private async makeRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.configService.get<string>('openrouter.appUrl'),
          'X-Title': 'Lenva Learning Platform',
        },
        body: JSON.stringify({
          model: request.model || this.defaultModel,
          messages: request.messages,
          temperature: request.temperature || this.configService.get<number>('openrouter.temperature'),
          max_tokens: request.max_tokens || this.configService.get<number>('openrouter.maxTokens'),
          stream: request.stream || false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      this.logger.log(`OpenRouter API request successful. Tokens used: ${result.usage?.total_tokens || 'unknown'}`);
      
      return result;
    } catch (error) {
      this.logger.error('OpenRouter API request failed:', error);
      throw new Error(`OpenRouter API request failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.warn('OpenRouter health check failed:', error);
      return false;
    }
  }
}
