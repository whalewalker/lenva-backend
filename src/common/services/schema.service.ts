import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';
import courseSchema from '../schemas/ai/course.schema';
import chapterSchema from '../schemas/ai/chapter.schema';
import flashcardsSchema from '../schemas/ai/flashcards.schema';
import quizSchema from '../schemas/ai/quiz.schema';
import questionsSchema from '../schemas/ai/questions.schema';

@Injectable()
export class SchemaService implements OnModuleInit {
  private readonly logger = new Logger(SchemaService.name);
  private static readonly SCHEMA_CACHE_TTL = 86400; // 24 hours in seconds
  private static readonly SCHEMA_KEY_PREFIX = 'schema:';
  private isInitialized = false;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit(): Promise<void> {
    await this.initializeSchemas();
  }

  async getSchema(templateName: string): Promise<object | null> {
    try {
      if (!this.isInitialized) {
        await this.initializeSchemas();
      }

      const cacheKey = `${SchemaService.SCHEMA_KEY_PREFIX}${templateName}`;
      const cachedSchema = await this.redisService.get(cacheKey);
      
      if (cachedSchema) {
        return JSON.parse(cachedSchema);
      }
      
      this.logger.warn(`Schema not found in cache: ${templateName}`);
      return null;
    } catch (error) {
      this.logger.error(`Error retrieving schema ${templateName}:`, error);
      return null;
    }
  }

  async getSchemaAsJsonString(templateName: string): Promise<string> {
    const schemaDefinition = await this.getSchema(templateName);
    if (!schemaDefinition) {
      return '';
    }
    return JSON.stringify(schemaDefinition, null, 2);
  }

  private async initializeSchemas(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const schemas = {
        course: courseSchema,
        chapter: chapterSchema,
        flashcards: flashcardsSchema,
        quiz: quizSchema,
        questions: questionsSchema,
      };

      const setPromises = Object.entries(schemas).map(async ([name, schema]) => {
        const cacheKey = `${SchemaService.SCHEMA_KEY_PREFIX}${name}`;
        await this.redisService.set(
          cacheKey,
          JSON.stringify(schema),
          SchemaService.SCHEMA_CACHE_TTL
        );
      });

      await Promise.all(setPromises);

      this.isInitialized = true;
      this.logger.log(`Initialized ${Object.keys(schemas).length} schema validators in Redis cache`);
    } catch (error) {
      this.logger.error('Error loading schemas to Redis:', error);
      throw error;
    }
  }
}
