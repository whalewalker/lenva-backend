import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizAttemptDocument = QuizAttempt & Document;

@Schema({ collection: 'quiz_attempts', timestamps: true })
export class QuizAttempt {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'courses', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'quizzes', required: true })
  quizId: Types.ObjectId;

  @Prop({
    type: {
      courseType: { type: String, enum: ['student', 'educator', 'admin'] },
      quizType: { type: String, enum: ['practice', 'timed', 'exam', 'scheduled', 'adaptive'] },
      createdById: { type: Types.ObjectId, ref: 'users' }
    }
  })
  context: {
    courseType: string;
    quizType: string;
    createdById?: Types.ObjectId;
  };

  @Prop({ enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' })
  status: string;

  @Prop({ type: Number })
  score?: number;

  @Prop({ type: Number })
  percentage?: number;

  @Prop({ default: 0 })
  correctCount: number;

  @Prop({ default: 0 })
  totalQuestions: number;

  @Prop({ default: 0 })
  timeSpentSeconds: number;

  @Prop({ type: Date, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({
    type: [{
      questionId: { type: Types.ObjectId, ref: 'questions' },
      response: { type: Object },
      isCorrect: { type: Boolean },
      timeTakenSeconds: { type: Number }
    }]
  })
  answers?: Array<{
    questionId: Types.ObjectId;
    response: any;
    isCorrect: boolean;
    timeTakenSeconds: number;
  }>;

  @Prop()
  feedback?: string;

  @Prop({ type: Object })
  metadata?: any;
}

export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);

// Create indexes
QuizAttemptSchema.index({ userId: 1, quizId: 1, startedAt: -1 });
QuizAttemptSchema.index({ courseId: 1 });
QuizAttemptSchema.index({ status: 1 });
