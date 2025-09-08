import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FlashcardReviewDocument = FlashcardReview & Document;

@Schema({ collection: 'flashcard_reviews', timestamps: true })
export class FlashcardReview {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'courses', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'flashcard_decks', required: true })
  deckId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'flashcards', required: true })
  flashcardId: Types.ObjectId;

  @Prop({ required: true, enum: ['again', 'hard', 'good', 'easy'] })
  result: string;

  @Prop({ default: 0 })
  responseTimeMs: number;

  @Prop({ default: 2.5 })
  easeFactor: number;

  @Prop({ default: 0 })
  repetition: number;

  @Prop({ default: 1 })
  intervalDays: number;

  @Prop({ type: Date })
  nextReviewDate?: Date;

  @Prop({ default: false })
  isRetired: boolean;

  @Prop({ type: Date, default: Date.now })
  reviewedAt: Date;
}

export const FlashcardReviewSchema = SchemaFactory.createForClass(FlashcardReview);

// Create indexes
FlashcardReviewSchema.index({ userId: 1, flashcardId: 1, reviewedAt: -1 });
FlashcardReviewSchema.index({ nextReviewDate: 1 });
