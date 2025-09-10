import { AbstractDocument } from '@/repo/abstract.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'chapters', timestamps: true })
export class Chapter extends AbstractDocument {
  @Prop({ type: Types.ObjectId, ref: 'courses', required: true })
  courseId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  content?: string;

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  order: number;

  @Prop()
  estimatedDuration?: string;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);

// Create indexes
ChapterSchema.index({ courseId: 1, order: 1 });
