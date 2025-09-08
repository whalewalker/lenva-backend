import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AIService } from './ai.service';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule,
  ],
  providers: [
    AIService,
  ],
  exports: [
    AIService,
  ],
})
export class AiModule {}
