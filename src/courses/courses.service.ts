import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { Course, StudentCourse, User } from '@/models';
import { Difficulty } from '@/common/types';
import { CloudinaryService } from '@/files/cloudinary.service';
import { UploadCourseRequest } from './courses.dto';
import { createHash } from 'crypto';
import {
  ContentGenerationRequest,
  ContentService,
} from '@/contents/content.service';
import { CoursesRepository } from './courses.repository';
import { RedisService } from '@/common/services/redis.service';
import { DocumentsService } from '@/documents/documents.service';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);
  private static readonly COURSE_CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    private readonly courseRepository: CoursesRepository,
    private readonly contentService: ContentService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
    private readonly documentsService: DocumentsService,
  ) { }

  async createStudentCourse(
    request: UploadCourseRequest,
    user: User,
  ) {
    try {
      this.logger.log(
        `Creating course from uploaded file: ${request.file.originalname}`,
      );

      // Generate document hash based on file content
      const documentHash = createHash('sha256')
        .update(request.file.buffer)
        .digest('hex');

      // Check if document already exists
      let document = await this.documentsService.findByHash(documentHash, user._id);
      
      if (!document) {
        // Create new document
        document = await this.documentsService.createDocument(
          request.file,
          user._id
        );
      } else {
        this.logger.log(`Document already exists with hash: ${documentHash}`);
      }

      // Check if there's an existing course with this document
      const existingCourse = await this.courseRepository.findByOneOrNull({
        createdById: user._id,
        documentId: new Types.ObjectId(document._id),
      });

      if (existingCourse) {
        if (existingCourse.ai?.processingStatus === 'completed') {
          this.logger.log(`Course already exists and completed for document: ${document._id}`);
          return existingCourse;
        } else if (existingCourse.ai?.processingStatus === 'failed') {
          this.logger.log(`Reprocessing failed course for document: ${document._id}`);
          // Update the existing course to retry processing
          const retryUpdate = {
            ai: { processingStatus: 'pending' },
          };
          const updatedCourse = await this.courseRepository.findOneAndUpdate(
            { _id: existingCourse._id },
            retryUpdate
          );
          
          // Emit event to retry processing
          this.eventEmitter.emit('course.uploaded', {
            file: request.file,
            user,
            fileUrl: document.fileUrl,
            difficulty: request.difficulty,
            courseId: updatedCourse._id,
            documentId: document._id,
          });
          
          return updatedCourse;
        } else {
          // Course is still processing
          this.logger.log(`Course is still processing for document: ${document._id}`);
          return existingCourse;
        }
      }

      const sanitizedName = request.file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 20);

      // Create basic course details
      const courseDetails = {
        title: sanitizedName,
        level: request.difficulty,
        createdById: user._id,
        documentId: new Types.ObjectId(document._id),
        thumbnailUrl: document.thumbnailUrl || document.coverImageUrl || document.fileUrl,
        coverImageUrl: document.coverImageUrl || document.thumbnailUrl || document.fileUrl,
        enrollmentRequired: false,
        courseType: 'student',
        status: 'draft',
        visibility: 'private',
        ai: { processingStatus: 'pending'},
      } as Partial<Course> | Partial<StudentCourse>;

      // Create a course entry with pending status
      const course = await this.courseRepository.create(courseDetails as unknown as Course);

      // Cache the course details in Redis
      await this.redisService.set(
        `course:${course._id}`,
        JSON.stringify(course),
        CoursesService.COURSE_CACHE_TTL,
      );

      // Emit an event to create course asynchronously
      this.eventEmitter.emit('course.uploaded', {
        file: request.file,
        user,
        fileUrl: document.fileUrl,
        difficulty: request.difficulty,
        courseId: course._id,
        documentId: document._id,
      });

      this.logger.log(
        `Course creation initiated for file: ${request.file.originalname}`,
      );
      return course;
    } catch (error) {
      this.logger.error('Failed to create course from upload:', error);
      throw new Error(`Failed to create course`);
    }
  }

  @OnEvent('course.uploaded')
  async handleCourseUploadedEvent(payload: {
    file: Express.Multer.File;
    user: User;
    fileUrl: string;
    difficulty: Difficulty;
    courseId: string;
    documentId: string;
  }) {
    try {
      this.logger.log(
        `Processing uploaded course for user: ${payload.user._id}, file: ${payload.file.originalname}`,
      );

      const contentRequest: ContentGenerationRequest = {
        file: payload.file,
        difficulty: payload.difficulty,
      };

      const result =
        await this.contentService.generateCourse(contentRequest);

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

      const course = await this.courseRepository.findOneAndUpdate({_id: payload.courseId }, courseData);

      // Update document processing status
      await this.documentsService.updateProcessingStatus(payload.documentId, 'completed');

      // Invalidate the cache
      await this.redisService.delete(`course:${course._id}`);
      await this.redisService.set(`course:${course._id}`, JSON.stringify(course), CoursesService.COURSE_CACHE_TTL);

      this.logger.log(
        `Course created successfully with ID: ${course._id} from uploaded file event`,
      );

      // Emit an event to create chapters asynchronously
      this.eventEmitter.emit('course.chapters.create', {
        courseId: course._id,
        userId: payload.user._id,
        chapters: result.chapters,
        difficulty: payload.difficulty,
      });
    } catch (error) {
      this.logger.error('Error processing uploaded course event:', error);
      // Update course status to 'failed' in case of error
      await this.courseRepository.findOneAndUpdate(
        { _id: payload.courseId },
        {
          ai: {
            processingStatus: 'failed',
            lastProcessedAt: new Date(),
          },
        },
      );
      // Update document processing status
      await this.documentsService.updateProcessingStatus(
        payload.documentId, 
        'failed', 
        error.message
      );
      // Invalidate the cache
      await this.redisService.delete(`course:${payload.courseId}`);
    }
  }

  async findById(id: string): Promise<Course> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid course ID format');
    }

    // Check Redis cache first
    const cachedCourse = await this.redisService.get(`course:${id}`);
    if (cachedCourse) {
      this.logger.log(`Cache hit for course ID: ${id}`);
      return JSON.parse(cachedCourse) as Course;
    }
    const course = await this.courseRepository.findOne({ _id: id });
    return course;
  }

  async findByUserId(userId: string): Promise<Course[]> {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }
    return await this.courseRepository.find({ createdById: userId });
  }

  async update(id: string, courseData: Partial<Course>): Promise<Course> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid course ID format`);
    }

    await this.redisService.delete(`course:${id}`);

    const course = await this.courseRepository.findOneAndUpdate(
      { _id: id },
      { ...courseData, updatedAt: new Date() },
    );

    await this.redisService.set(`course:${course._id}`, JSON.stringify(course), CoursesService.COURSE_CACHE_TTL);

    return course;
  }
}
