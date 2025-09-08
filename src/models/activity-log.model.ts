import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityLogDocument = ActivityLog & Document;

@Schema({ collection: 'activity_logs', timestamps: true })
export class ActivityLog {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'login', 'logout', 'view_course', 'start_quiz', 'submit_quiz',
      'review_flashcard', 'complete_chapter', 'upload_content', 'ai_generate'
    ]
  })
  action: string;

  @Prop({
    type: {
      courseId: { type: Types.ObjectId, ref: 'courses' },
      quizId: { type: Types.ObjectId, ref: 'quizzes' },
      chapterId: { type: Types.ObjectId, ref: 'chapters' },
      flashcardId: { type: Types.ObjectId, ref: 'flashcards' },
      classId: { type: Types.ObjectId, ref: 'classes' }
    }
  })
  context?: {
    courseId?: Types.ObjectId;
    quizId?: Types.ObjectId;
    chapterId?: Types.ObjectId;
    flashcardId?: Types.ObjectId;
    classId?: Types.ObjectId;
  };

  @Prop({ type: Object })
  metadata?: any;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

// Create indexes
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
