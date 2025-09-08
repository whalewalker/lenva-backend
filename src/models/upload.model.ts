import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UploadDocument = Upload & Document;

@Schema({ collection: 'uploads', timestamps: true })
export class Upload {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'courses' })
  courseId?: Types.ObjectId;

  @Prop({ required: true, enum: ['pdf', 'text', 'url', 'file'] })
  type: string;

  @Prop()
  title?: string;

  @Prop()
  fileUrl?: string;

  @Prop()
  rawText?: string;

  @Prop({ type: Object })
  metadata?: any;

  @Prop({ default: false })
  processed: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const UploadSchema = SchemaFactory.createForClass(Upload);

// Create indexes
UploadSchema.index({ userId: 1, createdAt: -1 });
UploadSchema.index({ courseId: 1 });
