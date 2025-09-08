import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecommendationProfileDocument = RecommendationProfile & Document;

@Schema({ collection: 'recommendation_profiles', timestamps: true })
export class RecommendationProfile {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Object })
  topicStrengths?: Record<string, number>;

  @Prop({ type: Object })
  topicWeaknesses?: Record<string, number>;

  @Prop({ type: Object })
  learningPatterns?: any;

  @Prop({ default: 0.7 })
  averageQuizScore: number;

  @Prop({ default: 0.8 })
  averageFlashcardAccuracy: number;

  @Prop({ default: 0 })
  totalStudyMinutes: number;

  @Prop({ type: [String] })
  preferredTopics?: string[];

  @Prop({ enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' })
  preferredDifficulty: string;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const RecommendationProfileSchema = SchemaFactory.createForClass(RecommendationProfile);

// Create indexes
RecommendationProfileSchema.index({ userId: 1 }, { unique: true });
