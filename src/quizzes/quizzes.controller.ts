import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { Quiz } from '../models/quiz.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/types';
import { User } from '../models/user.model';

@ApiTags('quizzes')
@Controller('quizzes')
@UseInterceptors(ClassSerializerInterceptor)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EDUCATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new quiz' })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' })
  async create(@Body() createQuizDto: Partial<Quiz>, @CurrentUser() user: User) {
    // Note: Quizzes are tied to courses, not directly to users
    return await this.quizzesService.create(createQuizDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all quizzes' })
  @ApiResponse({ status: 200, description: 'List of quizzes retrieved successfully' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID' })
  async findAll(@Query('courseId') courseId?: string) {
    return await this.quizzesService.findAll({ courseId });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quiz by ID' })
  @ApiResponse({ status: 200, description: 'Quiz found' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async findOne(@Param('id') id: string) {
    const quiz = await this.quizzesService.findById(id);
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    return quiz;
  }

  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quizzes by course ID' })
  @ApiResponse({ status: 200, description: 'Quizzes found' })
  async findByCourseId(@Param('courseId') courseId: string) {
    return await this.quizzesService.findByCourseId(courseId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update quiz' })
  @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async update(
    @Param('id') id: string,
    @Body() updateQuizDto: Partial<Quiz>,
    @CurrentUser() user: User,
  ) {
    // For quizzes, we check if the user owns the course the quiz belongs to
    const quiz = await this.quizzesService.findById(id);
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    
    // TODO: Add course ownership check here
    // For now, allow educators and admins to update
    if (user.role !== UserRole.EDUCATOR && user.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized to update this quiz');
    }
    
    return await this.quizzesService.update(id, updateQuizDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete quiz' })
  @ApiResponse({ status: 200, description: 'Quiz deleted successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    // For quizzes, we check if the user owns the course the quiz belongs to
    const quiz = await this.quizzesService.findById(id);
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    
    // TODO: Add course ownership check here
    // For now, allow educators and admins to delete
    if (user.role !== UserRole.EDUCATOR && user.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized to delete this quiz');
    }
    
    await this.quizzesService.delete(id);
    return { message: 'Quiz deleted successfully' };
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish quiz' })
  @ApiResponse({ status: 200, description: 'Quiz published successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async publish(@Param('id') id: string, @CurrentUser() user: User) {
    // For quizzes, we check if the user owns the course the quiz belongs to
    const quiz = await this.quizzesService.findById(id);
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    
    // TODO: Add course ownership check here
    // For now, allow educators and admins to publish
    if (user.role !== UserRole.EDUCATOR && user.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized to publish this quiz');
    }
    
    return await this.quizzesService.publish(id);
  }
}
