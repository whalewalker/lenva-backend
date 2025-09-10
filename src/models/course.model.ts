import { AbstractDocument } from '@/repo/abstract.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';


// Base Course Schema
@Schema({ 
  collection: 'courses', 
  timestamps: true,
  discriminatorKey: 'courseType'
})
export class Course extends AbstractDocument{
  @Prop({ required: true, enum: ['student', 'educator', 'admin'] })
  courseType: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  slug?: string;

  @Prop()
  description?: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop({ type: [String] })
  tags?: string[];

  @Prop()
  subject?: string;

  @Prop({ enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' })
  level: string;

  @Prop({ enum: ['draft', 'published', 'archived'], default: 'draft' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  createdById: string;

  @Prop({ enum: ['private', 'group', 'public'], default: 'private' })
  visibility: string;

  @Prop()
  fileHash?: string;

  @Prop({
    type: {
      chapters: { type: Number, default: 0 },
      quizzes: { type: Number, default: 0 },
      flashcards: { type: Number, default: 0 }
    }
  })
  contentStats: {
    chapters: number;
    quizzes: number;
    flashcards: number;
  };

  @Prop({
    type: {
      lastProcessedAt: { type: Date },
      processingStatus: { 
        type: String, 
        enum: ['idle', 'pending', 'processing', 'failed', 'completed'], 
        default: 'idle' 
      },
      jobId: { type: String },
      fileHash: { type: String }
    }
  })
  ai: {
    lastProcessedAt?: Date;
    processingStatus: string;
  };

  @Prop({ type: [String], default: [] })
  learningObjectives: string[];

  @Prop({ type: [String], default: [] })
  keyConcepts: string[];

  @Prop()
  estimatedDuration?: string;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

// Create indexes
CourseSchema.index({ courseType: 1 });
CourseSchema.index({ createdById: 1 });
CourseSchema.index({ classId: 1 }, { sparse: true });
CourseSchema.index({ status: 1, visibility: 1 });
CourseSchema.index({ tags: 1 });
CourseSchema.index({ subject: 1, level: 1 });

// Student Course Schema
@Schema({collection: 'student_courses'})
export class StudentCourse extends Course {
  @Prop({ default: false })
  enrollmentRequired: boolean;
}

export const StudentCourseSchema = SchemaFactory.createForClass(StudentCourse);

// Educator Course Schema
@Schema({collection: 'educator_courses'})
export class EducatorCourse extends Course {
  @Prop({ type: Types.ObjectId, ref: 'classes', required: true })
  classId: string;

  @Prop({ default: true })
  enrollmentRequired: boolean;
}

export const EducatorCourseSchema = SchemaFactory.createForClass(EducatorCourse);

// Admin Course Schema
@Schema({collection: 'admin_courses'})
export class AdminCourse extends Course {
  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: true })
  enrollmentRequired: boolean;

  @Prop({ enum: ['all', 'students_only', 'educators_only'], default: 'all' })
  audience: string;
}

export const AdminCourseSchema = SchemaFactory.createForClass(AdminCourse);

// Add slug index only to the base schema to avoid duplicates
CourseSchema.index({ slug: 1 }, { unique: true, sparse: true });
