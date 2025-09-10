import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiService, AIProvider } from '../interfaces/ai-service.interface';
import { OpenRouterService } from './openrouter.service';
import { MistralApiService } from './mistral.service';

@Injectable()
export class AiServiceFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly openRouterService: OpenRouterService,
    private readonly mistralApiService: MistralApiService,
  ) {}

  getAiService(provider?: AIProvider): IAiService {
    const selectedProvider = provider || this.configService.get<AIProvider>('ai.defaultProvider') || AIProvider.OPENROUTER;

    switch (selectedProvider) {
      case AIProvider.MISTRAL:
        return this.mistralApiService;
      case AIProvider.OPENROUTER:
      default:
        return this.openRouterService;
    }
  }

  async createAdvancedChain(provider: AIProvider, chainConfig: any) {
    const service = this.getAiService(provider);
    return await service.createChain(chainConfig);
  }

  async getAvailableProviders(): Promise<AIProvider[]> {
    const available: AIProvider[] = [];

    if (this.configService.get<string>('openrouter.apiKey')) {
      available.push(AIProvider.OPENROUTER);
    }

    if (this.configService.get<string>('mistral.apiKey')) {
      available.push(AIProvider.MISTRAL);
    }

    return available;
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const providers = await this.getAvailableProviders();

    for (const provider of providers) {
      try {
        const service = this.getAiService(provider);
        results[provider] = await service.healthCheck();
      } catch (error) {
        results[provider] = false;
      }
    }

    return results;
  }
}