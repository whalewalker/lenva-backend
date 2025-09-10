import {
  Controller,
  Get,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Post,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { User } from '@/models';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadCourseRequest } from './courses.dto';
import { Difficulty } from '@/common/types';

@ApiTags('courses')
@Controller('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
  ) {}

  @Post('/students/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a new course with file upload' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        difficulty: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'Difficulty level of the course',
        },
      },
      required: ['file'],
    },
  })
  async uploadAndCreateCourse(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
    @Body('difficulty') difficulty?: Difficulty,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const request: UploadCourseRequest = {
      file,
      difficulty,
    };

    return await this.coursesService.createStudentCourse(request, user);
  }

  @Get('/me')
  @ApiResponse({ status: 200, description: 'Courses found' })
  async findByUserId(@CurrentUser() user: User) {
    return await this.coursesService.findByUserId(user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course found' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findOne(@Param('id') id: string) {
    return await this.coursesService.findById(id);
  }
}
