import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FlashcardDeckDocument = FlashcardDeck & Document;

@Schema({ collection: 'flashcard_decks', timestamps: true })
export class FlashcardDeck {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'courses', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'chapters' })
  chapterId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  createdById: Types.ObjectId;

  @Prop({ type: [String] })
  tags?: string[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const FlashcardDeckSchema = SchemaFactory.createForClass(FlashcardDeck);

// Create indexes
FlashcardDeckSchema.index({ courseId: 1 });
FlashcardDeckSchema.index({ chapterId: 1 }, { sparse: true });
FlashcardDeckSchema.index({ createdById: 1 });
