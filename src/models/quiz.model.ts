import { AbstractDocument } from '@/repo/abstract.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizDocument = Quiz & Document;

// Base Quiz Schema
@Schema({ 
  collection: 'quizzes', 
  timestamps: true,
  discriminatorKey: 'quizType'
})
export class Quiz  extends AbstractDocument {
  @Prop({ required: true, enum: ['practice', 'timed', 'exam', 'scheduled', 'adaptive'] })
  quizType: string;

  @Prop({ type: Types.ObjectId, ref: 'courses', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'chapters' })
  chapterId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  createdById: Types.ObjectId;

  @Prop({ enum: ['private', 'group', 'public'], default: 'private' })
  visibility: string;

  @Prop({
    type: {
      gradingMode: { type: String, enum: ['points', 'percentage'], default: 'percentage' },
      passMark: { type: Number, default: 0.7 }
    }
  })
  scoring: {
    gradingMode: string;
    passMark: number;
  };

  @Prop({ default: 0 })
  questionCount: number;

  @Prop({ type: [String] })
  tags?: string[];

  @Prop({ type: Object })
  metadata?: any;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

// Create indexes
QuizSchema.index({ courseId: 1 });
QuizSchema.index({ chapterId: 1 }, { sparse: true });
QuizSchema.index({ quizType: 1 });
QuizSchema.index({ createdById: 1 });
QuizSchema.index({ visibility: 1 });

// Practice Quiz Schema
@Schema({collection: 'practice_quizzes'})
export class PracticeQuiz extends Quiz {
  // No additional fields for practice quiz
}

export const PracticeQuizSchema = SchemaFactory.createForClass(PracticeQuiz);

// Timed Quiz Schema
@Schema({collection: 'timed_quizzes'})
export class TimedQuiz extends Quiz {
  @Prop({ required: true })
  timeLimitSeconds: number;
}

export const TimedQuizSchema = SchemaFactory.createForClass(TimedQuiz);

// Exam Quiz Schema
@Schema({collection: 'exam_quizzes'})
export class ExamQuiz extends Quiz {
  @Prop({ required: true })
  timeLimitSeconds: number;

  @Prop({ required: true })
  totalMarks: number;

  @Prop({ default: true })
  shuffleQuestions: boolean;

  @Prop({ default: false })
  showFeedback: boolean;
}

export const ExamQuizSchema = SchemaFactory.createForClass(ExamQuiz);

// Scheduled Quiz Schema
@Schema({collection: 'scheduled_quizzes'})
export class ScheduledQuiz extends Quiz {
  @Prop({ required: true })
  windowStart: Date;

  @Prop({ required: true })
  windowEnd: Date;

  @Prop()
  timeLimitSeconds?: number;
}

export const ScheduledQuizSchema = SchemaFactory.createForClass(ScheduledQuiz);

// Adaptive Quiz Schema
@Schema({collection: 'adaptive_quizzes'})
export class AdaptiveQuiz extends Quiz {
  @Prop({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
  initialDifficulty: string;

  @Prop({ enum: ['irt', 'rule_based'], default: 'rule_based' })
  adaptationStrategy: string;
}

export const AdaptiveQuizSchema = SchemaFactory.createForClass(AdaptiveQuiz);
