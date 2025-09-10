import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AIService } from './ai.service';
import { OpenRouterService } from './services/openrouter.service';
import { MistralApiService } from './services/mistral.service';
import { AiServiceFactory } from './services/ai-service.factory';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule,
    HttpModule,
    CommonModule,
  ],
  providers: [
    OpenRouterService,
    MistralApiService,
    AiServiceFactory,
    AIService,
  ],
  exports: [
    AIService,
    AiServiceFactory,
  ],
})
export class AiModule {}