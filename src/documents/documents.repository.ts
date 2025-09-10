import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from '@/repo/abstract.repository';
import { DocumentUpload, DocumentUploadDocument } from '@/models/upload.model';

@Injectable()
export class DocumentsRepository extends AbstractRepository<DocumentUploadDocument> {
  constructor(
    @InjectModel(DocumentUpload.name)
    protected readonly documentModel: Model<DocumentUploadDocument>,
  ) {
    super(documentModel, DocumentUpload.name);
  }
}
