import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ collection: 'questions', timestamps: true })
export class Question {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'quizzes', required: true })
  quizId: Types.ObjectId;

  @Prop({ default: 0 })
  order: number;

  @Prop({
    required: true,
    enum: ['multiple_choice', 'multi_select', 'true_false', 'short_answer', 'fill_blank', 'matching', 'cloze']
  })
  type: string;

  @Prop({ required: true })
  text: string;

  @Prop({
    type: {
      imageUrl: { type: String },
      audioUrl: { type: String },
      videoUrl: { type: String }
    }
  })
  media?: {
    imageUrl?: string;
    audioUrl?: string;
    videoUrl?: string;
  };

  @Prop({
    type: [{
      label: { type: String },
      value: { type: String },
      isCorrect: { type: Boolean }
    }]
  })
  options?: Array<{
    label: string;
    value: string;
    isCorrect: boolean;
  }>;

  @Prop({
    type: {
      index: { type: Number },
      indices: [{ type: Number }],
      text: { type: String },
      pairs: [[{ type: String }]]
    }
  })
  answer?: {
    index?: number;
    indices?: number[];
    text?: string;
    pairs?: string[][];
  };

  @Prop()
  explanation?: string;

  @Prop({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficulty: string;

  @Prop({ type: [String] })
  tags?: string[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// Create indexes
QuestionSchema.index({ quizId: 1, order: 1 });
QuestionSchema.index({ difficulty: 1 });
