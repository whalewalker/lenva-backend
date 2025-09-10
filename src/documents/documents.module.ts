import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentUpload, DocumentUploadSchema } from '@/models/upload.model';
import { FilesModule } from '@/files/files.module';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentUpload.name, schema: DocumentUploadSchema },
    ]),
    FilesModule,
  ],
  providers: [DocumentsService, DocumentsRepository],
  exports: [DocumentsService, DocumentsRepository],
})
export class DocumentsModule {}
