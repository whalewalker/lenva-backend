import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from '../files/files.module';
import { ContentModule } from '../contents/content.module';
import { CoursesRepository } from './courses.repository';
import { CommonModule } from '../common/common.module';
import { ModelsModule } from '../models/models.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    ModelsModule,
    ConfigModule,
    FilesModule,
    ContentModule,
    CommonModule,
    DocumentsModule,
  ],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    CoursesRepository,
  ],
  exports: [CoursesService],
})
export class CoursesModule {}
