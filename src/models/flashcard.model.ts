import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FlashcardDocument = Flashcard & Document;

// Base Flashcard Schema
@Schema({ 
  collection: 'flashcards', 
  timestamps: true,
  discriminatorKey: 'flashcardType'
})
export class Flashcard {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true, enum: ['basic', 'cloze', 'image'] })
  flashcardType: string;

  @Prop({ type: Types.ObjectId, ref: 'flashcard_decks', required: true })
  deckId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'courses', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'chapters' })
  chapterId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  createdById: Types.ObjectId;

  @Prop({ type: [String] })
  tags?: string[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const FlashcardSchema = SchemaFactory.createForClass(Flashcard);

// Create indexes
FlashcardSchema.index({ deckId: 1 });
FlashcardSchema.index({ courseId: 1 });
FlashcardSchema.index({ chapterId: 1 }, { sparse: true });

// Basic Flashcard Schema
@Schema()
export class BasicFlashcard extends Flashcard {
  @Prop({ required: true })
  front: string;

  @Prop({ required: true })
  back: string;
}

export const BasicFlashcardSchema = SchemaFactory.createForClass(BasicFlashcard);

// Cloze Flashcard Schema
@Schema()
export class ClozeFlashcard extends Flashcard {
  @Prop({ required: true })
  text: string;

  @Prop({ type: [String] })
  clozes: string[];
}

export const ClozeFlashcardSchema = SchemaFactory.createForClass(ClozeFlashcard);

// Image Flashcard Schema
@Schema()
export class ImageFlashcard extends Flashcard {
  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  prompt: string;

  @Prop({ required: true })
  answer: string;
}

export const ImageFlashcardSchema = SchemaFactory.createForClass(ImageFlashcard);
