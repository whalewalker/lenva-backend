import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '@/ai/ai.service';
import { AIPromptService } from '@/common/services/ai-prompt.service';
import { SchemaService } from '@/common/services/schema.service';
import { TextExtractionService } from '@/common/services/text-extraction.service';
import { CourseResponse } from '@/common/types';

export interface ContentGenerationRequest {
  file: Express.Multer.File;
  difficulty?: 'easy' | 'medium' | 'hard';
}

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly aiService: AIService,
    private readonly schemaService: SchemaService,
    private readonly textExtractionService: TextExtractionService,
    private readonly aiPromptService : AIPromptService,
  ) {}

  async generateCourse(
    request: ContentGenerationRequest,
  ): Promise<CourseResponse> {
    try {
      this.logger.log(
        `Starting course generation for file: ${request.file.originalname}`,
      );

      const [extractedText, courseSchema, aiPrompt] = await Promise.all([
        this.textExtractionService.extractTextFromFile(request.file),
        Promise.resolve(this.schemaService.getSchema('course')),
        this.aiPromptService.getProcessedTemplate("course", {difficulty: request.difficulty || 'easy'})
      ]);

      if (!courseSchema) {
        throw new Error('Course schema not found');
      }

      const course = await this.aiService.generate<CourseResponse>({
        prompt: aiPrompt,
        input: extractedText.text,
      })

      this.logger.log(
        `Course generation completed successfully for ${request.file.originalname}`,
      );

      return course;
    } catch (error) {
      this.logger.error('Content generation failed:', error);
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }
}
