import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { Course, StudentCourse, User } from '@/models';
import { Difficulty } from '@/common/types';
import { UploadCourseRequest } from './courses.dto';
import { createHash } from 'crypto';
import {
  ContentGenerationRequest,
  ContentService,
} from '@/contents/content.service';
import { CoursesRepository } from './courses.repository';
import { RedisService } from '@/common/services/redis.service';
import { DocumentsService } from '@/documents/documents.service';
import { PaginatedQuery } from '@/common/dto/paginated-query.dto';
import { PaginatedResponse, ApiResponse } from '@/common/dto/response.dto';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);
  private static readonly COURSE_CACHE_TTL = 3600;

  constructor(
    private readonly courseRepository: CoursesRepository,
    private readonly contentService: ContentService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
    private readonly documentsService: DocumentsService,
  ) {}

  async createStudentCourse(
    request: UploadCourseRequest,
    user: User,
  ): Promise<ApiResponse<Course>> {
    try {
      this.logger.log(
        `Creating course from uploaded file: ${request.file.originalname}`,
      );

      const documentHash = createHash('sha256')
        .update(request.file.buffer)
        .digest('hex');

      let document = await this.documentsService.findByHash(
        documentHash,
        user._id,
      );

      if (!document) {
        document = await this.documentsService.createDocument(
          request.file,
          user._id,
        );
      } else {
        this.logger.log(`Document already exists with hash: ${documentHash}`);
      }

      const existingCourse = await this.courseRepository.findOneOrNull({
        createdById: user._id,
        documentId: new Types.ObjectId(document._id),
      });

      if (existingCourse) {
        if (existingCourse.ai?.processingStatus === 'completed') {
          this.logger.log(
            `Course already exists and completed for document: ${document._id}`,
          );
          return ApiResponse.success(
            existingCourse,
            'Course already exists and completed',
          );
        } else if (existingCourse.ai?.processingStatus === 'failed') {
          this.logger.log(
            `Reprocessing failed course for document: ${document._id}`,
          );
          const retryUpdate = {
            ai: { processingStatus: 'pending' },
          };
          const updatedCourse = await this.courseRepository.findOneAndUpdate(
            { _id: existingCourse._id },
            retryUpdate,
          );

          this.eventEmitter.emit('course.uploaded', {
            file: request.file,
            user,
            difficulty: request.difficulty,
            courseId: updatedCourse._id,
          });

          return ApiResponse.success(
            updatedCourse,
            'Reprocessing failed course',
          );
        } else {
          this.logger.log(
            `Course is still processing for document: ${document._id}`,
          );
          return ApiResponse.success(
            existingCourse,
            'Course is still processing',
          );
        }
      }

      const courseDetails = {
        title: 'New Course',
        level: request.difficulty,
        createdById: user._id,
        documentId: new Types.ObjectId(document._id),
        fileUrl: document.fileUrl,
        enrollmentRequired: false,
        courseType: 'student',
        status: 'draft',
        visibility: 'private',
        ai: { processingStatus: 'pending' },
      } as Partial<Course> | Partial<StudentCourse>;

      const course = await this.courseRepository.create(
        courseDetails as unknown as Course,
      );

      await this.redisService.set(
        `course:${course._id}`,
        JSON.stringify(course),
        CoursesService.COURSE_CACHE_TTL,
      );

      this.logger.log(
        `Course creation initiated for file: ${request.file.originalname}`,
      );

      this.eventEmitter.emit('course.uploaded', {
        file: request.file,
        user,
        difficulty: request.difficulty,
        courseId: course._id,
      });

      return ApiResponse.success(course, 'Course creation initiated');
    } catch (error) {
      this.logger.error('Failed to create course from upload:', error);
      throw new Error(`Failed to create course`);
    }
  }

  @OnEvent('course.uploaded')
  async handleCourseUploadedEvent(payload: {
    file: Express.Multer.File;
    user: User;
    difficulty: Difficulty;
    courseId: string;
  }) {
    try {
      this.logger.log(
        `Processing uploaded course for user: ${payload.user._id}, file: ${payload.file.originalname}`,
      );

      const contentRequest: ContentGenerationRequest = {
        file: payload.file,
        difficulty: payload.difficulty,
      };

      const result = await this.contentService.generateCourse(contentRequest);

      const courseData = {
        title: result.title,
        description: result.description,
        subject: 'General',
        level: result.difficultyLevel,
        estimatedDuration: result.estimatedTotalDuration,
        learningObjectives: result.learningObjectives || [],
        keyConcepts: result.keyConcepts || [],
        tags: result.tags || [],
        contentStats: {
          chapters: result.chapters?.length || 0,
          quizzes: 0,
          flashcards: 0,
        },
        ai: {
          processingStatus: 'completed',
          lastProcessedAt: new Date(),
        },
      };

      const course = await this.courseRepository.findOneAndUpdate(
        { _id: payload.courseId },
        courseData,
      );

      await this.redisService.delete(`course:${course._id}`);
      await this.redisService.set(
        `course:${course._id}`,
        JSON.stringify(course),
        CoursesService.COURSE_CACHE_TTL,
      );

      this.logger.log(
        `Course created successfully with ID: ${course._id} from uploaded file event`,
      );

      this.eventEmitter.emit('course.chapters.create', {
        courseId: course._id,
        userId: payload.user._id,
        chapters: result.chapters,
        difficulty: payload.difficulty,
      });
    } catch (error) {
      this.logger.error('Error processing uploaded course event:', error);
      await this.courseRepository.findOneAndUpdate(
        { _id: payload.courseId },
        {
          ai: {
            processingStatus: 'failed',
            lastProcessedAt: new Date(),
          },
        },
      );
      await this.redisService.delete(`course:${payload.courseId}`);
    }
  }

  async findById(id: string): Promise<ApiResponse<Course>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid course ID format');
    }

    const cachedCourse = await this.redisService.get(`course:${id}`);
    if (cachedCourse) {
      this.logger.log(`Cache hit for course ID: ${id}`);
      return ApiResponse.success(
        JSON.parse(cachedCourse) as Course,
        'Course retrieved from cache',
      );
    }
    const course = await this.courseRepository.findOne({ _id: id });
    return ApiResponse.success(course, 'Course retrieved successfully');
  }

  async findByUserId(
    filter: PaginatedQuery & { userId: string },
  ): Promise<PaginatedResponse<Course>> {
    const queryWithUserId: PaginatedQuery = {
      ...filter,
      filters: {
        createdById: filter.userId,
      },
    };

    const result = await this.courseRepository.findPaginated(queryWithUserId, {
      title: 1,
      level: 1,
      status: 1,
      updatedAt: 1,
      estimatedDuration: 1,
      contentStats: 1,
      'ai.processingStatus': 1,
      courseType: 1,
    });

    return PaginatedResponse.create(
      result.items,
      result.currentPage,
      result.pageSize,
      result.totalItems,
      'Courses retrieved successfully',
    );
  }

  async update(
    id: string,
    courseData: Partial<Course>,
  ): Promise<ApiResponse<Course>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid course ID format`);
    }

    await this.redisService.delete(`course:${id}`);

    const course = await this.courseRepository.findOneAndUpdate(
      { _id: id },
      { courseData },
    );

    await this.redisService.set(
      `course:${course._id}`,
      JSON.stringify(course),
      CoursesService.COURSE_CACHE_TTL,
    );

    return ApiResponse.success(course, 'Course updated successfully');
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid course ID format`);
    }

    await this.redisService.delete(`course:${id}`);

    await this.courseRepository.delete({ _id: id });
    return ApiResponse.success(undefined, 'Course deleted successfully');
  }

  async find(query: PaginatedQuery): Promise<PaginatedResponse<Course>> {
    const result = await this.courseRepository.findPaginated(query, {
      title: 1,
      level: 1,
      status: 1,
      updatedAt: 1,
      estimatedDuration: 1,
      contentStats: 1,
      'ai.processingStatus': 1,
      visibility: 1,
      courseType: 1,
    });

    return PaginatedResponse.create(
      result.items,
      result.currentPage,
      result.pageSize,
      result.totalItems,
      'Courses retrieved successfully',
    );
  }
}
