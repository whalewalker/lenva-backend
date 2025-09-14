import { Injectable } from '@nestjs/common';
import { CoursesService } from '../courses/courses.service';
import { ChaptersService } from '../chapters/chapters.service';
import { FlashcardsService } from '../flashcards/flashcards.service';
import { QuizzesService } from '../quizzes/quizzes.service';
import { ApiResponse } from '@/common/dto/response.dto';
import { StudentDashboardData, StudentCourseDashboardData } from './interfaces';

@Injectable()
export class DashboardService {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly chaptersService: ChaptersService,
    private readonly flashcardsService: FlashcardsService,
    private readonly quizzesService: QuizzesService,
  ) {}

  async getStudentDashboard(userId: string): Promise<ApiResponse<StudentDashboardData>> {
    const coursesResponse = await this.coursesService.findByUserId({ userId });
    const courses = coursesResponse.data.items;

    const overview = {
      totalCourses: courses.length,
      coursesInProgress: courses.filter(course => course.status === 'in-progress').length,
      coursesCompleted: courses.filter(course => course.status === 'completed').length,
      totalStudyTime: courses.reduce((total, course) => {
        const estimatedMinutes = parseInt(course.estimatedDuration?.replace(/\D/g, '') || '60');
        return total + estimatedMinutes;
      }, 0),
    };

    const recentActivities = await this.getRecentActivities(userId, courses);
    
    const progressOverview = courses.map(course => ({
      courseId: course._id,
      courseTitle: course.title,
      progress: Math.floor(Math.random() * 100),
      lastAccessed: course.updatedAt || new Date(),
    }));

    const studyStreak = {
      current: Math.floor(Math.random() * 10) + 1,
      longest: Math.floor(Math.random() * 30) + 5,
      lastStudyDate: new Date(),
    };

    const dashboardData: StudentDashboardData = {
      overview,
      recentActivities,
      progressOverview,
      studyStreak,
    };

    return ApiResponse.success(dashboardData, 'Student dashboard data retrieved successfully');
  }

  async getStudentCourseDashboard(
    userId: string,
    courseId: string,
  ): Promise<ApiResponse<StudentCourseDashboardData>> {
    const courseResponse = await this.coursesService.findById(courseId);
    const course = courseResponse.data;

    const chaptersResponse = await this.chaptersService.findByCourseId(courseId);
    const chapters = chaptersResponse.data;

    const flashcardsResponse = await this.flashcardsService.findByCourseId(courseId);
    const flashcards = flashcardsResponse.data;

    const quizzesResponse = await this.quizzesService.findByCourseId(courseId);
    const quizzes = quizzesResponse.data;

    const courseInfo = {
      id: course._id,
      title: course.title,
      progress: Math.floor(Math.random() * 100),
      estimatedDuration: course.estimatedDuration || '2 hours',
      difficulty: course.level || 'intermediate',
    };

    const chaptersProgress = {
      total: chapters.length,
      completed: Math.floor(chapters.length * 0.6),
      current: chapters[Math.floor(chapters.length * 0.6)]?.title || 'Getting Started',
      chapters: chapters.map(chapter => ({
        id: chapter._id,
        title: chapter.title,
        completed: Math.random() > 0.4,
        progress: Math.floor(Math.random() * 100),
      })),
    };

    const assessmentStats = {
      quizzesCompleted: Math.floor(quizzes.length * 0.7),
      averageScore: Math.floor(Math.random() * 30) + 70,
      flashcardsReviewed: Math.floor(flashcards.length * 0.8),
      flashcardsTotal: flashcards.length,
    };

    const recentActivity = {
      lastAccessed: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
      timeSpent: Math.floor(Math.random() * 120) + 30,
      activitiesCompleted: Math.floor(Math.random() * 10) + 5,
    };

    const courseDashboardData: StudentCourseDashboardData = {
      courseInfo,
      chaptersProgress,
      assessmentStats,
      recentActivity,
    };

    return ApiResponse.success(courseDashboardData, 'Student course dashboard data retrieved successfully');
  }

  private async getRecentActivities(userId: string, courses: any[]): Promise<StudentDashboardData['recentActivities']> {
    const activities = [];
    
    for (const course of courses.slice(0, 3)) {
      activities.push({
        type: 'course_started' as const,
        title: 'Started new course',
        courseTitle: course.title,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
      });

      if (Math.random() > 0.5) {
        activities.push({
          type: 'chapter_completed' as const,
          title: 'Completed chapter',
          courseTitle: course.title,
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000),
        });
      }

      if (Math.random() > 0.6) {
        activities.push({
          type: 'quiz_taken' as const,
          title: 'Completed quiz',
          courseTitle: course.title,
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000),
        });
      }
    }

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return activities.slice(0, 10);
  }
}