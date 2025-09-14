import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { FlashcardsRepository } from './flashcards.repository';
import { FlashcardDeckRepository } from './flashcard-deck.repository';
import { Flashcard } from '../models/flashcard.model';
import { FlashcardDeck } from '../models/flashcard-deck.model';
import { ApiResponse } from '@/common/dto/response.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { ContentService } from '@/contents/content.service';
import { Difficulty } from '@/common/types';
import { Types } from 'mongoose';

interface FlashcardFilters {
  courseId?: string;
  difficulty?: string;
}

@Injectable()
export class FlashcardsService {
  private readonly logger = new Logger(FlashcardsService.name);

  constructor(
    private readonly flashcardsRepository: FlashcardsRepository,
    private readonly flashcardDeckRepository: FlashcardDeckRepository,
    private readonly contentService: ContentService,
  ) {}

  @OnEvent('chapter.flashcard.generate')
  async handleFlashcardGenerationEvent(payload: {
    chapterId: string;
    courseId: string;
    userId: string;
    chapterTitle: string;
    chapterContent: string;
    difficulty: Difficulty;
  }) {
    try {
      this.logger.log(`Starting flashcard generation for chapter: ${payload.chapterId}`);
      
      const deckTitle = `${payload.chapterTitle} - Flashcards`;
      
      const deck = await this.flashcardDeckRepository.create({
        courseId: new Types.ObjectId(payload.courseId),
        chapterId: new Types.ObjectId(payload.chapterId),
        title: deckTitle,
        createdById: new Types.ObjectId(payload.userId),
        tags: ['auto-generated', payload.difficulty],
      });

      this.logger.log(`Flashcard deck created: ${deck._id} for chapter: ${payload.chapterId}`);

      const flashcardData = await this.contentService.generateFlashcards({
        chapterTitle: payload.chapterTitle,
        chapterContent: payload.chapterContent,
        difficulty: payload.difficulty,
        count: 10,
      });

      const flashcards = flashcardData.flashcards?.map((card: any) => ({
        flashcardType: 'basic',
        deckId: deck._id,
        courseId: new Types.ObjectId(payload.courseId),
        chapterId: new Types.ObjectId(payload.chapterId),
        createdById: new Types.ObjectId(payload.userId),
        front: card.front,
        back: card.back,
        tags: ['auto-generated'],
      })) || [];

      await this.flashcardsRepository.insertMany(flashcards);

      this.logger.log(`${flashcards.length} flashcards generated successfully for chapter: ${payload.chapterId}`);
    } catch (error) {
      this.logger.error(`Failed to generate flashcards for chapter: ${payload.chapterId}`, error);
    }
  }

  async create(flashcardData: Partial<Flashcard>): Promise<ApiResponse<Flashcard>> {
    const flashcard = await this.flashcardsRepository.create(flashcardData);
    return ApiResponse.success(flashcard, 'Flashcard created successfully');
  }

  async findAll(filters?: FlashcardFilters): Promise<ApiResponse<Flashcard[]>> {
    const query: any = {};
    
    if (filters?.courseId) {
      if (!Types.ObjectId.isValid(filters.courseId)) {
        return ApiResponse.success([], 'No flashcards found - invalid course ID');
      }
      query.courseId = filters.courseId;
    }
    
    if (filters?.difficulty) {
      query.difficulty = filters.difficulty;
    }
    
    const flashcards = await this.flashcardsRepository.find(query);
    return ApiResponse.success(flashcards, 'Flashcards retrieved successfully');
  }

  async findById(id: string): Promise<ApiResponse<Flashcard | null>> {
    if (!Types.ObjectId.isValid(id)) {
      return ApiResponse.success(null, 'Invalid flashcard ID format');
    }
    const flashcard = await this.flashcardsRepository.findOne({ _id: id });
    return ApiResponse.success(flashcard, flashcard ? 'Flashcard found' : 'Flashcard not found');
  }

  async findByCourseId(courseId: string): Promise<ApiResponse<Flashcard[]>> {
    if (!Types.ObjectId.isValid(courseId)) {
      return ApiResponse.success([], 'Invalid course ID format');
    }
    const flashcards = await this.flashcardsRepository.find({ courseId });
    return ApiResponse.success(flashcards, 'Course flashcards retrieved successfully');
  }

  async update(id: string, flashcardData: Partial<Flashcard>): Promise<ApiResponse<Flashcard>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid flashcard ID format`);
    }
    
    const flashcard = await this.flashcardsRepository.findOne({ _id: id });
    if (!flashcard) {
      throw new NotFoundException(`Flashcard with ID ${id} not found`);
    }
    
    return ApiResponse.success(flashcard, 'Flashcard updated successfully');
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid flashcard ID format`);
    }
    
    const result = await this.flashcardsRepository.findOne({ _id: id });
    if (!result) {
      throw new NotFoundException(`Flashcard with ID ${id} not found`);
    }
    
    return ApiResponse.success(undefined, 'Flashcard deleted successfully');
  }
}
