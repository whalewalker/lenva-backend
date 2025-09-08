import { IsString, IsOptional, IsEnum, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Difficulty } from '@/common/types';

export class CreateCourseDto {
  @ApiProperty({ description: 'Course title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Course description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Course subject' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ 
    description: 'Course difficulty level',
    enum: ['beginner', 'intermediate', 'advanced']
  })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  level?: string;

  @ApiPropertyOptional({ 
    description: 'Course status',
    enum: ['draft', 'published', 'archived']
  })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Course visibility',
    enum: ['private', 'group', 'public']
  })
  @IsOptional()
  @IsEnum(['private', 'group', 'public'])
  visibility?: string;

  @ApiPropertyOptional({ description: 'Course tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Course thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ 
    description: 'Course type',
    enum: ['student', 'educator', 'admin']
  })
  @IsEnum(['student', 'educator', 'admin'])
  courseType: string;

  @IsMongoId()
  createdById: Types.ObjectId;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({ description: 'Course title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Course description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Course subject' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ 
    description: 'Course difficulty level',
    enum: ['beginner', 'intermediate', 'advanced']
  })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  level?: string;

  @ApiPropertyOptional({ 
    description: 'Course status',
    enum: ['draft', 'published', 'archived']
  })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Course visibility',
    enum: ['private', 'group', 'public']
  })
  @IsOptional()
  @IsEnum(['private', 'group', 'public'])
  visibility?: string;

  @ApiPropertyOptional({ description: 'Course tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Course thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

export interface UploadCourseRequest {
  file: Express.Multer.File;
  difficulty?: Difficulty;
}