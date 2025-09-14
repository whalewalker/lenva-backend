export interface StudentDashboardData {
  overview: {
    totalCourses: number;
    coursesInProgress: number;
    coursesCompleted: number;
    totalStudyTime: number;
  };
  recentActivities: {
    type: 'course_started' | 'chapter_completed' | 'quiz_taken' | 'flashcard_reviewed';
    title: string;
    courseTitle: string;
    timestamp: Date;
  }[];
  progressOverview: {
    courseId: string;
    courseTitle: string;
    progress: number;
    lastAccessed: Date;
  }[];
  studyStreak: {
    current: number;
    longest: number;
    lastStudyDate: Date;
  };
}

export interface StudentCourseDashboardData {
  courseInfo: {
    id: string;
    title: string;
    progress: number;
    estimatedDuration: string;
    difficulty: string;
  };
  chaptersProgress: {
    total: number;
    completed: number;
    current: string;
    chapters: {
      id: string;
      title: string;
      completed: boolean;
      progress: number;
    }[];
  };
  assessmentStats: {
    quizzesCompleted: number;
    averageScore: number;
    flashcardsReviewed: number;
    flashcardsTotal: number;
  };
  recentActivity: {
    lastAccessed: Date;
    timeSpent: number;
    activitiesCompleted: number;
  };
}