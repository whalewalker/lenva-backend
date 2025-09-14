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
@UseGuards(JwtAuthGuard, RolesGuard)
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
  async create(@Body() createQuizDto: Partial<Quiz>) {
    return await this.quizzesService.create(createQuizDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all quizzes' })
  @ApiResponse({ status: 200, description: 'List of quizzes retrieved successfully' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID' })
  async findAll(@Query('courseId') courseId?: string) {
    return await this.quizzesService.findAll({ courseId });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quiz by ID' })
  @ApiResponse({ status: 200, description: 'Quiz found' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async findOne(@Param('id') id: string) {
    const result = await this.quizzesService.findById(id);
    return result;
  }

  @Get('course/:courseId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quizzes by course ID' })
  @ApiResponse({ status: 200, description: 'Quizzes found' })
  async findByCourseId(@Param('courseId') courseId: string) {
    return await this.quizzesService.findByCourseId(courseId);
  }

  @Roles(UserRole.EDUCATOR, UserRole.ADMIN)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update quiz' })
  @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async update(
    @Param('id') id: string,
    @Body() updateQuizDto: Partial<Quiz>,
    @CurrentUser() user: User,
  ) {
    return await this.quizzesService.update(id, updateQuizDto);
  }

  @Roles(UserRole.EDUCATOR, UserRole.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete quiz' })
  @ApiResponse({ status: 200, description: 'Quiz deleted successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return await this.quizzesService.delete(id);
  }

  @Post(':id/publish')
  @Roles(UserRole.EDUCATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish quiz' })
  @ApiResponse({ status: 200, description: 'Quiz published successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async publish(@Param('id') id: string, @CurrentUser() user: User) {
    return await this.quizzesService.publish(id);
  }
}
