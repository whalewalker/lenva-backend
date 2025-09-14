import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AbstractDocument } from '@/repo/abstract.schema';

export type DocumentUploadDocument = DocumentUpload & Document;

@Schema({ collection: 'documents', timestamps: true })
export class DocumentUpload extends AbstractDocument {

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ required: true })
  fileExtension: string;

  @Prop({ required: true, unique: true })
  documentHash: string;

  @Prop()
  cloudinaryPublicId?: string;

  @Prop({ required: true, enum: ['pdf', 'text', 'url', 'image', 'video', 'audio', 'document', 'other'] })
  type: string;

  @Prop()
  rawText?: string;

  @Prop({ type: Object })
  metadata?: {
    pageCount?: number;
    duration?: number;
    dimensions?: {
      width: number;
      height: number;
    };
    author?: string;
    subject?: string;
    keywords?: string[];
    [key: string]: any;
  };

  @Prop({ default: false })
  processed: boolean;

  @Prop({ enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' })
  processingStatus: string;

  @Prop()
  processingError?: string;
}

export const DocumentUploadSchema = SchemaFactory.createForClass(DocumentUpload);

// Create indexes
DocumentUploadSchema.index({ userId: 1, createdAt: -1 });
DocumentUploadSchema.index({ type: 1 });
DocumentUploadSchema.index({ processingStatus: 1 });
DocumentUploadSchema.index({ fileName: 1 });
DocumentUploadSchema.index({ mimeType: 1 });
DocumentUploadSchema.index({ documentHash: 1 });
