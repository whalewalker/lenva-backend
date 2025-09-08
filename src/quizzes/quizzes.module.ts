import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from '../models/quiz.model';
import { Question, QuestionSchema } from '../models/question.model';
import { QuizAttempt, QuizAttemptSchema } from '../models/quiz-attempt.model';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: QuizAttempt.name, schema: QuizAttemptSchema }
    ])
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
