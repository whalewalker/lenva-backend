import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserFlashcardStateDocument = UserFlashcardState & Document;

@Schema({ collection: 'user_flashcard_state', timestamps: true })
export class UserFlashcardState {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'flashcards', required: true })
  flashcardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'flashcard_decks', required: true })
  deckId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'courses', required: true })
  courseId: Types.ObjectId;

  @Prop({ default: 2.5 })
  easeFactor: number;

  @Prop({ default: 0 })
  repetition: number;

  @Prop({ default: 1 })
  intervalDays: number;

  @Prop({ type: Date })
  nextReviewDate?: Date;

  @Prop({ type: Date })
  lastReviewDate?: Date;

  @Prop({ enum: ['again', 'hard', 'good', 'easy'] })
  lastPerformance?: string;

  @Prop({ default: false })
  isDue: boolean;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const UserFlashcardStateSchema = SchemaFactory.createForClass(UserFlashcardState);

// Create indexes
UserFlashcardStateSchema.index({ userId: 1, flashcardId: 1 }, { unique: true });
UserFlashcardStateSchema.index({ nextReviewDate: 1 });
