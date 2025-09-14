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
import { FlashcardsService } from './flashcards.service';
import { Flashcard } from '../models/flashcard.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/types';
import { User } from '../models/user.model';

@ApiTags('flashcards')
@Controller('flashcards')
@UseInterceptors(ClassSerializerInterceptor)
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EDUCATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new flashcard' })
  @ApiResponse({ status: 201, description: 'Flashcard created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient role' })
  async create(@Body() createFlashcardDto: Partial<Flashcard>) {
    // Note: Flashcards are tied to courses, not directly to users
    return await this.flashcardsService.create(createFlashcardDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all flashcards' })
  @ApiResponse({ status: 200, description: 'List of flashcards retrieved successfully' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID' })
  @ApiQuery({ name: 'difficulty', required: false, description: 'Filter by difficulty' })
  async findAll(
    @Query('courseId') courseId?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return await this.flashcardsService.findAll({ courseId, difficulty });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get flashcard by ID' })
  @ApiResponse({ status: 200, description: 'Flashcard found' })
  @ApiResponse({ status: 404, description: 'Flashcard not found' })
  async findOne(@Param('id') id: string) {
    const result = await this.flashcardsService.findById(id);
    return result;
  }

  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get flashcards by course ID' })
  @ApiResponse({ status: 200, description: 'Flashcards found' })
  async findByCourseId(@Param('courseId') courseId: string) {
    return await this.flashcardsService.findByCourseId(courseId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update flashcard' })
  @ApiResponse({ status: 200, description: 'Flashcard updated successfully' })
  @ApiResponse({ status: 404, description: 'Flashcard not found' })
  async update(
    @Param('id') id: string,
    @Body() updateFlashcardDto: Partial<Flashcard>,
    @CurrentUser() user: User,
  ) {
    // For flashcards, we check if the user owns the course the flashcard belongs to
    const flashcardResult = await this.flashcardsService.findById(id);
    if (!flashcardResult.data) {
      throw new Error('Flashcard not found');
    }
    
    // For now, allow educators and admins to update
    if (user.role !== UserRole.EDUCATOR && user.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized to update this flashcard');
    }
    
    return await this.flashcardsService.update(id, updateFlashcardDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete flashcard' })
  @ApiResponse({ status: 200, description: 'Flashcard deleted successfully' })
  @ApiResponse({ status: 404, description: 'Flashcard not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    // For flashcards, we check if the user owns the course the flashcard belongs to
    const flashcardResult = await this.flashcardsService.findById(id);
    if (!flashcardResult.data) {
      throw new Error('Flashcard not found');
    }
    
    // For now, allow educators and admins to delete
    if (user.role !== UserRole.EDUCATOR && user.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized to delete this flashcard');
    }
    
    return await this.flashcardsService.delete(id);
  }
}
