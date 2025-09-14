import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '@/ai/ai.service';
import { AIProvider } from '@/ai/interfaces/ai-service.interface';
import { AIPromptService } from '@/common/services/ai-prompt.service';
import { SchemaService } from '@/common/services/schema.service';
import { TextExtractionService } from '@/common/services/text-extraction.service';
import { CourseResponse, Difficulty } from '@/common/types';

export interface ContentGenerationRequest {
  file: Express.Multer.File;
  difficulty?: Difficulty;
}

export interface QuizGenerationRequest {
  chapterTitle: string;
  chapterContent: string;
  difficulty: Difficulty;
  count?: number;
}

export interface FlashcardGenerationRequest {
  chapterTitle: string;
  chapterContent: string;
  difficulty: Difficulty;
  count?: number;
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
        this.schemaService.getSchema('course'),
        this.aiPromptService.getProcessedTemplate("course", {difficulty: request.difficulty || 'easy'})
      ]);

      if (!courseSchema) {
        throw new Error('Course schema not found');
      }

      const course = await this.aiService.generate<CourseResponse>({
        prompt: aiPrompt,
        input: extractedText.text,
      }, AIProvider.MISTRAL);

      this.logger.log(
        `Course generation completed successfully for ${request.file.originalname}`,
      );

      return course;
    } catch (error) {
      this.logger.error('Content generation failed:', error);
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  async generateQuiz(request: QuizGenerationRequest): Promise<any> {
    try {
      this.logger.log(`Starting quiz generation for chapter: ${request.chapterTitle}`);

      const [quizSchema, aiPrompt] = await Promise.all([
        this.schemaService.getSchema('quiz'),
        this.aiPromptService.getProcessedTemplate("quiz", {
          title: request.chapterTitle,
          difficulty: request.difficulty,
          count: request.count || 6,
          content: request.chapterContent
        })
      ]);

      if (!quizSchema) {
        throw new Error('Quiz schema not found');
      }

      const quiz = await this.aiService.generate({
        prompt: aiPrompt,
        input: request.chapterContent,
      }, AIProvider.MISTRAL);

      this.logger.log(`Quiz generation completed successfully for ${request.chapterTitle}`);
      return quiz;
    } catch (error) {
      this.logger.error('Quiz generation failed:', error);
      throw new Error(`Quiz generation failed: ${error.message}`);
    }
  }

  async generateFlashcards(request: FlashcardGenerationRequest): Promise<any> {
    try {
      this.logger.log(`Starting flashcard generation for chapter: ${request.chapterTitle}`);

      const [flashcardsSchema, aiPrompt] = await Promise.all([
        this.schemaService.getSchema('flashcards'),
        this.aiPromptService.getProcessedTemplate("flashcards", {
          title: request.chapterTitle,
          difficulty: request.difficulty,
          count: request.count || 10,
          content: request.chapterContent
        })
      ]);

      if (!flashcardsSchema) {
        throw new Error('Flashcards schema not found');
      }

      const flashcards = await this.aiService.generate({
        prompt: aiPrompt,
        input: request.chapterContent,
      }, AIProvider.MISTRAL);

      this.logger.log(`Flashcard generation completed successfully for ${request.chapterTitle}`);
      return flashcards;
    } catch (error) {
      this.logger.error('Flashcard generation failed:', error);
      throw new Error(`Flashcard generation failed: ${error.message}`);
    }
  }
}
