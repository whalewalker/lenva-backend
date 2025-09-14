import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CoursesModule } from '../courses/courses.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { FlashcardsModule } from '../flashcards/flashcards.module';
import { QuizzesModule } from '../quizzes/quizzes.module';

@Module({
  imports: [
    CoursesModule,
    ChaptersModule,
    FlashcardsModule,
    QuizzesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}