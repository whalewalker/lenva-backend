import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { QuizzesRepository } from './quizzes.repository';
import { Quiz } from '../models/quiz.model';
import { ApiResponse } from '@/common/dto/response.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { ContentService } from '@/contents/content.service';
import { Difficulty } from '@/common/types';
import { Types } from 'mongoose';

interface QuizFilters {
  courseId?: string;
}

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);

  constructor(
    private readonly quizzesRepository: QuizzesRepository,
    private readonly contentService: ContentService,
  ) {}

  @OnEvent('chapter.quiz.generate')
  async handleQuizGenerationEvent(payload: {
    chapterId: string;
    courseId: string;
    userId: string;
    chapterTitle: string;
    chapterContent: string;
    difficulty: Difficulty;
  }) {
    try {
      this.logger.log(`Starting quiz generation for chapter: ${payload.chapterId}`);

      const quizData = await this.contentService.generateQuiz({
        chapterTitle: payload.chapterTitle,
        chapterContent: payload.chapterContent,
        difficulty: payload.difficulty,
        count: 6,
      });

      await this.quizzesRepository.create({
        quizType: 'practice',
        courseId: new Types.ObjectId(payload.courseId),
        chapterId: new Types.ObjectId(payload.chapterId),
        title: quizData.title || `Quiz for ${payload.chapterTitle}`,
        description: quizData.description || `Test your understanding of ${payload.chapterTitle}`,
        createdById: new Types.ObjectId(payload.userId),
        visibility: 'private',
        questionCount: quizData.questions?.length || 0,
        scoring: {
          gradingMode: 'percentage',
          passMark: 0.7,
        },
        metadata: {
          questions: quizData.questions || [],
          generatedFromChapter: true,
        },
      });

      this.logger.log(`Quiz generated successfully for chapter: ${payload.chapterId}`);
    } catch (error) {
      this.logger.error(`Failed to generate quiz for chapter: ${payload.chapterId}`, error);
    }
  }

  async create(quizData: Partial<Quiz>): Promise<ApiResponse<Quiz>> {
    const quiz = await this.quizzesRepository.create(quizData as Omit<Quiz, '_id' | 'createdAt' | 'updatedAt'>);
    return ApiResponse.success(quiz, 'Quiz created successfully');
  }

  async findAll(filters?: QuizFilters): Promise<ApiResponse<Quiz[]>> {
    const query: any = {};
    
    if (filters?.courseId) {
      if (!Types.ObjectId.isValid(filters.courseId)) {
        return ApiResponse.success([], 'No quizzes found - invalid course ID');
      }
      query.courseId = filters.courseId;
    }
    
    const quizzes = await this.quizzesRepository.find(query);
    return ApiResponse.success(quizzes, 'Quizzes retrieved successfully');
  }

  async findById(id: string): Promise<ApiResponse<Quiz | null>> {
    if (!Types.ObjectId.isValid(id)) {
      return ApiResponse.success(null, 'Invalid quiz ID format');
    }
    const quiz = await this.quizzesRepository.findOneOrNull({ _id: id });
    return ApiResponse.success(quiz, quiz ? 'Quiz found' : 'Quiz not found');
  }

  async findByCourseId(courseId: string): Promise<ApiResponse<Quiz[]>> {
    if (!Types.ObjectId.isValid(courseId)) {
      return ApiResponse.success([], 'Invalid course ID format');
    }
    const quizzes = await this.quizzesRepository.find({ courseId });
    return ApiResponse.success(quizzes, 'Course quizzes retrieved successfully');
  }

  async update(id: string, quizData: Partial<Quiz>): Promise<ApiResponse<Quiz>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid quiz ID format`);
    }
    
    const quiz = await this.quizzesRepository.findOneAndUpdate({ _id: id }, quizData);
    
    return ApiResponse.success(quiz, 'Quiz updated successfully');
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid quiz ID format`);
    }
    
    const result = await this.quizzesRepository.delete({ _id: id });
    if (!result) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    
    return ApiResponse.success(undefined, 'Quiz deleted successfully');
  }

  async publish(id: string): Promise<ApiResponse<Quiz>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid quiz ID format`);
    }
    
    const quiz = await this.quizzesRepository.findOneAndUpdate({ _id: id }, { status: 'published' } as any);
    
    return ApiResponse.success(quiz, 'Quiz published successfully');
  }
}
