import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProgressDocument = Progress & Document;

@Schema({ collection: 'progress', timestamps: true })
export class Progress {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'courses', required: true })
  courseId: Types.ObjectId;

  @Prop({
    type: [{
      chapterId: { type: Types.ObjectId, ref: 'chapters' },
      completed: { type: Boolean, default: false },
      completedAt: { type: Date }
    }]
  })
  chapterProgress: Array<{
    chapterId: Types.ObjectId;
    completed: boolean;
    completedAt?: Date;
  }>;

  @Prop({ default: 0 })
  totalStudyMinutes: number;

  @Prop({ default: 0 })
  totalFlashcardsReviewed: number;

  @Prop({ default: 0 })
  totalQuizzesTaken: number;

  @Prop({ default: 0 })
  streakDays: number;

  @Prop({ type: Date })
  lastStudyDate?: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);

// Create indexes
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
