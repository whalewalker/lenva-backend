import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema({ collection: 'classes', timestamps: true })
export class Group {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  code: string;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'users' }], default: [] })
  memberIds: Types.ObjectId[];

  @Prop({ type: Object })
  metadata?: any;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);

// Create indexes
GroupSchema.index({ code: 1 }, { unique: true });
GroupSchema.index({ ownerId: 1 });
