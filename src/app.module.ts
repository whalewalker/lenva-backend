import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { AiModule } from './ai/ai.module';
import { ModelsModule } from './models/models.module';

import databaseConfig from './config/database.config';
import openrouterConfig from './config/openrouter.config';
import { FilesModule } from './files/files.module';
import { CommonModule } from './common/common.module';
import { ContentModule } from './contents/content.module';
import { ChaptersModule } from './chapters/chapters.module';
import { DocumentsModule } from './documents/documents.module';
import mistralConfig from './config/mistral.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, openrouterConfig, mistralConfig],
    }),

    ScheduleModule.forRoot(),

    EventEmitterModule.forRoot(),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI') || 'mongodb://localhost:27017/lenva',
      }),
      inject: [ConfigService],
    }),

    ModelsModule,

    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),

    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    AuthModule,
    UsersModule,
    CoursesModule,
    ChaptersModule,
    FlashcardsModule,
    QuizzesModule,
    AiModule,
    FilesModule,
    CommonModule,
    ContentModule,
    DocumentsModule,
  ],
})
export class AppModule {}
