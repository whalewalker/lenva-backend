export enum UserRole {
  STUDENT = 'student',
  EDUCATOR = 'educator',
  ADMIN = 'admin',
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
    streak?: number;
    joinDate: string;
    educatorIds?: string[];
    managedStudentIds?: string[];
    groupIds?: string[];
  };
  access_token: string;
  refresh_token: string;
}

// AI Service Types
export interface AIGenerationRequest {
  documentId?: string;
  content?: string;
  numCards?: number;
  numQuestions?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  topicFocus?: string;
  questionTypes?: string[];
  courseTitle?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  tags: string[];
  difficulty: string;
  confidenceScore: number;
}

export interface FlashcardResponse {
  flashcardSetId: string;
  documentId?: string;
  flashcards: Flashcard[];
  metadata: {
    totalCards: number;
    sourceDocument?: string;
    difficulty: string;
    topicFocus?: string;
    chunksUsed?: number;
    generationModel: string;
  };
}

export interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'text';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  difficulty: string;
}

export interface QuizResponse {
  quizId: string;
  documentId?: string;
  questions: Question[];
  metadata: {
    totalQuestions: number;
    sourceDocument?: string;
    difficulty: string;
    questionTypes: string[];
    chunksUsed?: number;
    generationModel: string;
  };
}

export interface IChapter {
  id: string;
  title: string;
  description: string;
  content: string;
  learningObjectives: string[];
  keyConcepts: string[];
  estimatedDuration: string;
}

export interface CourseResponse {
  courseId: string;
  documentId?: string;
  title: string;
  description: string;
  learningObjectives: string[];
  keyConcepts: string[];
  tags: string[];
  chapters: IChapter[];
  prerequisites: string[];
  difficultyLevel: string;
  estimatedTotalDuration: string;
  metadata: {
    sourceDocument?: string;
    totalChapters: number;
    chunksUsed?: number;
    generationModel: string;
  };
}

export interface ComprehensiveResponse {
  documentId?: string;
  course: CourseResponse;
  flashcards: FlashcardResponse;
  quiz: QuizResponse;
  metadata: {
    sourceDocument?: string;
    totalChapters: number;
    totalFlashcards: number;
    totalQuizQuestions: number;
    difficulty: string;
    chunksUsed?: number;
    generationModel: string;
  };
}

export type Visibility = 'private' | 'group' | 'public';

export type Status = 'draft' | 'published' | 'archived';

export type Type = 'student' | 'educator' | 'admin';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
