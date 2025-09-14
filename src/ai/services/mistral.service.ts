import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMistralAI } from '@langchain/mistralai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Runnable } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { AbortController } from 'node-abort-controller';
import { IAiService, GenerateOptions, ChainOptions, ModelConfig } from '../interfaces/ai-service.interface';

@Injectable()
export class MistralApiService implements IAiService {
  private readonly logger = new Logger(MistralApiService.name);
  private readonly model: ChatMistralAI;
  private readonly modelConfig: ModelConfig;
  private readonly useFallback: boolean;
  private activeGenerations = new Map<string, AbortController>();

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('mistral.apiKey') || '';
    this.useFallback = !apiKey;

    this.modelConfig = {
      modelName: 'mistral-small-latest',
      temperature: 0.7,
      maxTokens: 120000,
      streaming: false,
    };

    if (!this.useFallback) {
      this.model = new ChatMistralAI({
        apiKey,
        modelName: this.modelConfig.modelName,
        temperature: this.modelConfig.temperature,
        maxTokens: this.modelConfig.maxTokens,
        streaming: this.modelConfig.streaming,
      });
    }

    this.logger.log(
      `Mistral API Service initialized with model: ${this.modelConfig.modelName}`,
    );
  }

  async generate<T = any>(options: GenerateOptions): Promise<T> {
    if (this.useFallback) {
      throw new Error('Mistral API key not configured');
    }

    this.logger.log('Generating content with Mistral...');

    try {
      // Use direct message invocation to avoid template parsing issues
      const messages = [
        new SystemMessage(options.prompt),
        new HumanMessage(options.input)
      ];

      const result = await this.model.invoke(messages);
      return this.parseResult<T>({ text: result.content });
    } catch (error) {
      this.logger.error('Generation failed:', error);
      throw error;
    }
  }

  async createChain(options: ChainOptions = {}): Promise<Runnable> {
    if (this.useFallback) {
      throw new Error('Mistral API key not configured');
    }

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
    if (this.useFallback) {
      throw new Error('Mistral API key not configured');
    }

    const streamingModel = new ChatMistralAI({
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
    let systemMessage = "You are a helpful AI assistant.";
    if (options?.prompt) {
      // Escape any braces that aren't template variables to prevent LangChain parsing issues
      systemMessage = options.prompt.replace(/\{(?!\{input\})/g, '{{').replace(/(?<!\{input)\}/g, '}}');
    }

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemMessage],
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

  getModel(): string {
    return this.modelConfig.modelName;
  }

  isUsingFallback(): boolean {
    return this.useFallback;
  }

  cancelGeneration(generationId: string): boolean {
    const abortController = this.activeGenerations.get(generationId);
    if (abortController) {
      abortController.abort();
      this.activeGenerations.delete(generationId);
      this.logger.log(`Successfully cancelled generation: ${generationId}`);
      return true;
    }
    this.logger.warn(`No active generation found for ID: ${generationId}`);
    return false;
  }

  isGenerationActive(generationId: string): boolean {
    return this.activeGenerations.has(generationId);
  }

  getActiveGenerationIds(): string[] {
    return Array.from(this.activeGenerations.keys());
  }

  getModelConfig(): ModelConfig {
    return this.modelConfig;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (this.useFallback) {
        return false;
      }

      // Simple health check by generating a minimal response
      const testOptions: GenerateOptions = {
        prompt: "Respond with 'OK' only.",
        input: "test",
        temperature: 0,
        maxTokens: 10,
      };

      await this.generate(testOptions);
      return true;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
}