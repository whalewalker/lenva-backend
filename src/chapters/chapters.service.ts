import { Injectable, Logger } from '@nestjs/common';
import { ChaptersRepository } from './chapters.repository';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '@/common/services/redis.service';
import { IChapter, Difficulty } from '@/common/types';
import { Chapter } from '@/models';
import { ApiResponse } from '@/common/dto/response.dto';

@Injectable()
export class ChaptersService {
  private readonly logger = new Logger(ChaptersService.name);
  private static readonly CHAPTER_CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    private readonly chaptersRepository: ChaptersRepository,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('course.chapters.create')
  async handleChapterCreationEvent(payload: {
    courseId: string;
    userId: string;
    chapters: IChapter[];
    difficulty: Difficulty;
  }) {
    this.logger.log(
      `Handling chapter creation event for course: ${payload.courseId}`,
    );

    if (!payload.chapters || payload.chapters.length === 0) {
      this.logger.warn(`No chapters provided for course: ${payload.courseId}`);
      return;
    }

    // Create chapters from the provided chapter data
    await Promise.all(
      payload.chapters.map(async (chapterData, idx) => {
        const chapter = await this.chaptersRepository.create({
          courseId: payload.courseId,
          title: chapterData.title || `Chapter ${idx + 1}`,
          content: chapterData.content || '',
          description: chapterData.description || '',
          estimatedDuration: chapterData.estimatedDuration || '1 mins',
          order: idx + 1,
        });

        // Cache each chapter in Redis
        await this.redisService.set(
          `chapter:${chapter._id}`,
          JSON.stringify(chapter),
          ChaptersService.CHAPTER_CACHE_TTL,
        );

        this.logger.log(
          `Created and cached chapter ${chapter._id} for course: ${payload.courseId}`,
        );

        this.eventEmitter.emit('chapter.quiz.generate', {
          chapterId: chapter._id,
          courseId: payload.courseId,
          userId: payload.userId,
          chapterTitle: chapter.title,
          chapterContent: chapter.content,
          difficulty: payload.difficulty,
        });

        this.eventEmitter.emit('chapter.flashcard.generate', {
          chapterId: chapter._id,
          courseId: payload.courseId,
          userId: payload.userId,
          chapterTitle: chapter.title,
          chapterContent: chapter.content,
          difficulty: payload.difficulty,
        });
      }),
    );

    this.logger.log(
      `Successfully created ${payload.chapters.length} chapters for course: ${payload.courseId}`,
    );
  }

  async findById(id: string): Promise<ApiResponse<Chapter>> {
    const cachedChapter = await this.redisService.get(`chapter:${id}`);
    if (cachedChapter) {
      return ApiResponse.success(JSON.parse(cachedChapter), 'Chapter retrieved from cache');
    }

    const chapter = await this.chaptersRepository.findOne({ _id: id });
    await this.redisService.set(
      `chapter:${chapter._id}`,
      JSON.stringify(chapter),
      ChaptersService.CHAPTER_CACHE_TTL,
    );
    return ApiResponse.success(chapter, 'Chapter retrieved successfully');
  }

  async findByCourseId(courseId: string): Promise<ApiResponse<Chapter[]>> {
    const cachedChapters = await this.redisService.get(
      `course:${courseId}:chapters`,
    );

    let chapters: Chapter[] = [];

    if(cachedChapters) {
         chapters = JSON.parse(cachedChapters);
         if(chapters && chapters.length > 0) {
           return ApiResponse.success(chapters, 'Chapters retrieved from cache');
         }
    }

    chapters = await this.chaptersRepository.find({ courseId });
    if(chapters.length === 0) {
        this.logger.warn(`No chapters found for course: ${courseId}`);
        return ApiResponse.success(chapters, 'No chapters found for course');
      }
    await this.redisService.set(
      `course:${courseId}:chapters`,
      JSON.stringify(chapters),
      ChaptersService.CHAPTER_CACHE_TTL,
    );
    return ApiResponse.success(chapters, 'Chapters retrieved successfully');
  }
}
