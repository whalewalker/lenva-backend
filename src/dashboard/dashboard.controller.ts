import {
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../models/user.model';

@ApiTags('dashboard')
@Controller('dashboard')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('student')
  @ApiOperation({ summary: 'Get student dashboard overview' })
  @ApiResponse({ status: 200, description: 'Student dashboard data retrieved successfully' })
  async getStudentDashboard(@CurrentUser() user: User) {
    return await this.dashboardService.getStudentDashboard(user._id);
  }

  @Get('student/course/:courseId')
  @ApiOperation({ summary: 'Get student course-specific dashboard' })
  @ApiResponse({ status: 200, description: 'Student course dashboard data retrieved successfully' })
  async getStudentCourseDashboard(
    @Param('courseId') courseId: string,
    @CurrentUser() user: User,
  ) {
    return await this.dashboardService.getStudentCourseDashboard(user._id, courseId);
  }
}