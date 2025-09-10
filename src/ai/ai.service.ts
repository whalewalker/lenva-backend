import { Injectable, Logger } from '@nestjs/common';
import { IAggregatedAiService, GenerateOptions, AIProvider, ChainOptions } from './interfaces/ai-service.interface';
import { AiServiceFactory } from './services/ai-service.factory';
import { Runnable } from '@langchain/core/runnables';

@Injectable()
export class AIService implements IAggregatedAiService {
  private readonly logger = new Logger(AIService.name);

  constructor(private readonly aiServiceFactory: AiServiceFactory) {}

  async generate<T = any>(options: GenerateOptions, provider?: AIProvider): Promise<T> {
    const requestedProvider = provider || AIProvider.OPENROUTER;
    
    try {
      const aiService = this.aiServiceFactory.getAiService(requestedProvider);
      return await aiService.generate<T>(options);
    } catch (error) {
      this.logger.warn(`Primary AI provider (${requestedProvider}) failed:`, error.message);
      
      const fallbackProvider = requestedProvider === AIProvider.MISTRAL 
        ? AIProvider.OPENROUTER 
        : AIProvider.MISTRAL;
      
      try {
        this.logger.log(`Attempting fallback to ${fallbackProvider}...`);
        const fallbackService = this.aiServiceFactory.getAiService(fallbackProvider);
        return await fallbackService.generate<T>(options);
      } catch (fallbackError) {
        this.logger.error(`Fallback AI provider (${fallbackProvider}) also failed:`, fallbackError.message);
        throw new Error(`All AI providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`);
      }
    }
  }

  async createChain(options: ChainOptions, provider?: AIProvider): Promise<Runnable> {
    const selectedProvider = provider || AIProvider.OPENROUTER;
    
    try {
      const aiService = this.aiServiceFactory.getAiService(selectedProvider);
      return await aiService.createChain(options);
    } catch (error) {
      this.logger.error(`Failed to create chain with ${selectedProvider}:`, error.message);
      throw error;
    }
  }

  async runChain<T = any>(chain: Runnable, input: any, provider?: AIProvider): Promise<T> {
    const selectedProvider = provider || AIProvider.OPENROUTER;
    
    try {
      const aiService = this.aiServiceFactory.getAiService(selectedProvider);
      return await aiService.runChain<T>(chain, input);
    } catch (error) {
      this.logger.error(`Failed to run chain with ${selectedProvider}:`, error.message);
      throw error;
    }
  }

  async *streamGenerate(options: GenerateOptions, provider?: AIProvider): AsyncGenerator<string, void, unknown> {
    const selectedProvider = provider || AIProvider.OPENROUTER;
    
    try {
      const aiService = this.aiServiceFactory.getAiService(selectedProvider);
      yield* aiService.streamGenerate(options);
    } catch (error) {
      this.logger.error(`Streaming failed with ${selectedProvider}:`, error.message);
      throw error;
    }
  }

  async generateWithRetry<T = any>(
    options: GenerateOptions, 
    maxRetries: number = 3, 
    provider?: AIProvider
  ): Promise<T> {
    let lastError: Error;
    const providersToTry = provider ? [provider] : [AIProvider.OPENROUTER, AIProvider.MISTRAL];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      for (const currentProvider of providersToTry) {
        try {
          this.logger.log(`Attempt ${attempt + 1}/${maxRetries} with provider ${currentProvider}`);
          return await this.generate<T>(options, currentProvider);
        } catch (error) {
          lastError = error;
          this.logger.warn(`Attempt ${attempt + 1} failed with ${currentProvider}:`, error.message);
          
          if (attempt < maxRetries - 1) {
            await this.delay(Math.pow(2, attempt) * 1000);
          }
        }
      }
    }

    throw new Error(`All retry attempts failed. Last error: ${lastError.message}`);
  }

  async batchGenerate<T = any>(
    requests: GenerateOptions[], 
    provider?: AIProvider,
    concurrency: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    const chunks = this.chunkArray(requests, concurrency);

    for (const chunk of chunks) {
      const promises = chunk.map(options => this.generate<T>(options, provider));
      const chunkResults = await Promise.allSettled(promises);
      
      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.error('Batch request failed:', result.reason);
          throw new Error(`Batch request failed: ${result.reason.message}`);
        }
      }
    }

    return results;
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    return await this.aiServiceFactory.healthCheckAll();
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}