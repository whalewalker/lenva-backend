import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EnrollmentDocument = Enrollment & Document;

@Schema({ collection: 'enrollments', timestamps: true })
export class Enrollment {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'courses', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: ['student'], default: 'student' })
  role: string;

  @Prop({ enum: ['active', 'completed', 'dropped', 'banned'], default: 'active' })
  status: string;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;

  @Prop({ type: Date })
  completedAt?: Date;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

// Create indexes
EnrollmentSchema.index({ courseId: 1, userId: 1 }, { unique: true });
EnrollmentSchema.index({ status: 1 });
