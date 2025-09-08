import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReminderSettingsDocument = ReminderSettings & Document;

@Schema({ collection: 'reminder_settings', timestamps: true })
export class ReminderSettings {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId;

  @Prop({ default: true })
  flashcardReminders: boolean;

  @Prop({ default: true })
  quizReminders: boolean;

  @Prop({ default: '09:00' })
  preferredReminderTime: string;

  @Prop({ type: [String], default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] })
  reminderDays: string[];

  @Prop({ default: 20 })
  maxDailyFlashcards: number;

  @Prop({ enum: ['flashcards_only', 'quiz_only', 'mixed'], default: 'mixed' })
  studyMode: string;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ReminderSettingsSchema = SchemaFactory.createForClass(ReminderSettings);

// Create indexes
ReminderSettingsSchema.index({ userId: 1 }, { unique: true });
