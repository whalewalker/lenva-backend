import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Runnable } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { IAiService, GenerateOptions, ChainOptions, ModelConfig } from '../interfaces/ai-service.interface';

@Injectable()
export class OpenRouterService implements IAiService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly model: ChatOpenAI;
  private readonly modelConfig: ModelConfig;

  constructor(private readonly configService: ConfigService) {
    this.modelConfig = {
      modelName: this.configService.get<string>('openrouter.defaultModel'),
      temperature: this.configService.get<number>('openrouter.temperature') || 0.3,
      maxTokens: this.configService.get<number>('openrouter.maxTokens') || 8000,
      streaming: false,
    };

    this.model = new ChatOpenAI({
      apiKey: this.configService.get<string>('openrouter.apiKey'),
      modelName: this.modelConfig.modelName,
      temperature: this.modelConfig.temperature,
      maxTokens: this.modelConfig.maxTokens,
      streaming: this.modelConfig.streaming,
      configuration: {
        baseURL: this.configService.get<string>('openrouter.baseUrl'),
        defaultHeaders: {
          'HTTP-Referer': this.configService.get<string>('openrouter.appUrl'),
          'X-Title': 'Lenva Learning Platform',
        },
      },
    });

    if (!this.configService.get<string>('openrouter.apiKey')) {
      this.logger.warn('OPENROUTER_API_KEY not configured. AI generation will not work.');
    }
  }

  async generate<T = any>(options: GenerateOptions): Promise<T> {
    try {
      // Create a model instance with request-specific options
      const requestMaxTokens = options.maxTokens || this.modelConfig.maxTokens;
      const requestTemperature = options.temperature ?? this.modelConfig.temperature;

      // Ensure maxTokens doesn't exceed reasonable limits (leave room for input)
      const safeMaxTokens = Math.min(requestMaxTokens, 8000);

      const model = new ChatOpenAI({
        apiKey: this.configService.get<string>('openrouter.apiKey'),
        modelName: this.modelConfig.modelName,
        temperature: requestTemperature,
        maxTokens: safeMaxTokens,
        streaming: false,
        configuration: {
          baseURL: this.configService.get<string>('openrouter.baseUrl'),
          defaultHeaders: {
            'HTTP-Referer': this.configService.get<string>('openrouter.appUrl'),
            'X-Title': 'Lenva Learning Platform',
          },
        },
      });

      // Use direct message invocation to avoid template parsing issues
      const messages = [
        new SystemMessage(options.prompt),
        new HumanMessage(options.input)
      ];

      this.logger.log(`Generating with maxTokens: ${safeMaxTokens}, temperature: ${requestTemperature}`);
      const result = await model.invoke(messages);
      return this.parseResult<T>({ text: result.content });
    } catch (error) {
      this.logger.error('Generation failed:', error);
      throw error;
    }
  }

  async createChain(options: ChainOptions = {}): Promise<Runnable> {
    const { chainType = 'simple' } = options;

    switch (chainType) {
      case 'conversation':
        return this.createConversationChain();
      case 'simple':
      default:
        return this.createSimpleChain();
    }
  }

  async runChain<T = any>(chain: Runnable, input: any): Promise<T> {
    try {
      const result = await chain.invoke(input);
      return this.parseResult<T>({ text: result });
    } catch (error) {
      this.logger.error('Chain execution failed:', error);
      throw new Error(`Chain execution failed: ${error.message}`);
    }
  }

  async *streamGenerate(options: GenerateOptions): AsyncGenerator<string, void, unknown> {
    const streamingModel = new ChatOpenAI({
      ...this.model,
      streaming: true,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", options.prompt],
      ["human", "{input}"],
    ]);

    const outputParser = new StringOutputParser();
    const chain = prompt.pipe(streamingModel).pipe(outputParser);

    const stream = await chain.stream({ input: options.input });

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  private async createSimpleChain(options?: GenerateOptions): Promise<Runnable> {
    const prompt = options
      ? ChatPromptTemplate.fromMessages([
          ["system", options.prompt],
          ["human", "{input}"],
        ])
      : ChatPromptTemplate.fromMessages([
          ["system", "You are a helpful AI assistant."],
          ["human", "{input}"],
        ]);

    const outputParser = new StringOutputParser();
    return prompt.pipe(this.model).pipe(outputParser);
  }

  private async createConversationChain(): Promise<Runnable> {
    // For conversation chains in LCEL, we use a simple prompt template
    // Memory management would need to be handled at a higher level
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are a helpful AI assistant. Continue the conversation naturally."],
      ["human", "{input}"],
    ]);

    const outputParser = new StringOutputParser();
    return prompt.pipe(this.model).pipe(outputParser);
  }

  private parseResult<T = any>(result: any): T {
    const content = result.text || result.response || JSON.stringify(result);

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

  async healthCheck(): Promise<boolean> {
    try {
      const testChain = await this.createSimpleChain();
      const result = await this.runChain(testChain, { input: "Hello" });
      return !!result;
    } catch (error) {
      this.logger.warn('OpenRouter health check failed:', error);
      return false;
    }
  }

  getModelConfig(): ModelConfig {
    return this.modelConfig;
  }
}