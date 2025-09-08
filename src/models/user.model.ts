import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserRole } from '@/common/types';
import { AbstractDocument } from '@/repo/abstract.schema';


@Schema({ collection: 'users', timestamps: true })
export class User extends AbstractDocument {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false })
  passwordHash?: string;

  @Prop({ required: false })
  refreshToken?: string;

  @Prop({
    type: {
      provider: { type: String, enum: ['google'], required: false },
      providerUserId: { type: String, required: false },
      tokens: { type: Object, required: false }
    },
    required: false
  })
  oauth?: {
    provider?: string;
    providerUserId?: string;
    tokens?: any;
  };

  @Prop({ required: true, enum: ['student', 'educator', 'admin'] })
  role: UserRole;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  username?: string;

  @Prop({
    type: {
      bio: { type: String },
      avatarUrl: { type: String },
      preferences: {
        type: {
          studyMode: { type: String, enum: ['flashcards_only', 'quiz_only', 'mixed'], default: 'mixed' },
          preferredDifficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
          topics: [{ type: String }]
        }
      }
    }
  })
  profile?: {
    bio?: string;
    avatarUrl?: string;
    preferences?: {
      studyMode?: string;
      preferredDifficulty?: string;
      topics?: string[];
    };
  };
  avatar: any;

  @Prop({
    type: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastStudyDate: { type: Date }
    }
  })
  streak?: {
    current: number;
    longest: number;
    lastStudyDate?: Date;
  };

  @Prop({ type: Date })
  lastActiveAt?: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1 });
