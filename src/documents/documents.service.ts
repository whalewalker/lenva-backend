import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { DocumentUpload } from '@/models/document.model';
import { DocumentsRepository } from './documents.repository';
import { CloudinaryService } from '@/files/cloudinary.service';
import { createHash } from 'crypto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createDocument(
    file: Express.Multer.File,
    userId: string,
  ): Promise<DocumentUpload> {
    try {
      const documentHash = createHash('sha256')
        .update(file.buffer)
        .digest('hex');

      const existingDocument = await this.documentsRepository.findOneOrNull({
        documentHash,
        userId: new Types.ObjectId(userId),
      });

      if (existingDocument) {
        this.logger.log(`Document already exists with hash: ${documentHash}`);
        return existingDocument;
      }

      const uploadResult = await this.cloudinaryService.uploadFile(file);
      const documentType = this.getDocumentType(file.mimetype);

      const documentData = {
        userId,
        title: file.originalname.replace(/\.[^/.]+$/, ''),
        fileName: uploadResult.fileName,
        originalName: file.originalname,
        fileUrl: uploadResult.url,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileExtension: file.mimetype,
        documentHash,
        thumbnailUrl: uploadResult.url,
        cloudinaryPublicId: uploadResult.publicId,
        type: documentType,
        processed: false,
        processingStatus: 'pending',
      };

      const document = await this.documentsRepository.create(documentData as any);
      
      this.logger.log(`Document created successfully: ${document._id}`);
      return document;
    } catch (error) {
      this.logger.error('Failed to create document:', error);
      throw new Error('Failed to create document');
    }
  }

  async findByHash(documentHash: string, userId: string): Promise<DocumentUpload | null> {
    return this.documentsRepository.findOneOrNull({
      documentHash,
      userId: new Types.ObjectId(userId),
    });
  }

  async findById(id: string): Promise<DocumentUpload> {
    return this.documentsRepository.findOne({ _id: id });
  }

  private getDocumentType(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('text/')) return 'text';
    
    const officeTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    
    if (officeTypes.includes(mimeType)) return 'document';
    
    return 'other';
  }
}