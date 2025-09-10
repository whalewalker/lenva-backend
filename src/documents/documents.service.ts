import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { DocumentUpload } from '@/models/upload.model';
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
    folder: string = 'lenva-documents',
  ): Promise<DocumentUpload> {
    try {
      // Generate document hash based on file content
      const documentHash = createHash('sha256')
        .update(file.buffer)
        .digest('hex');

      // Check if document already exists
      const existingDocument = await this.documentsRepository.findByOneOrNull({
        documentHash,
        userId: new Types.ObjectId(userId),
      });

      if (existingDocument) {
        this.logger.log(`Document already exists with hash: ${documentHash}`);
        return existingDocument;
      }

      // Generate a unique short string for the document
      const documentShortId = this.generateShortId();
      
      // Get file extension
      const fileExtension = file.originalname.split('.').pop() || 'unknown';
      
      // Create custom folder path: lenva-document/userId/documentShortId.extension
      const customFolder = `lenva-document/${userId}`;
      const customPublicId = `${customFolder}/${documentShortId}.${fileExtension}`;

      // Upload file to Cloudinary with custom public ID
      const uploadResult = await this.cloudinaryService.uploadFile(
        file,
        customPublicId
      );

      // Determine document type based on MIME type
      const documentType = this.getDocumentType(file.mimetype);

      // Create document record with specific ID that matches the short ID
      const documentData = {
        _id: documentShortId, // Use the short ID as the document ID
        userId: new Types.ObjectId(userId),
        title: file.originalname.replace(/\.[^/.]+$/, ''), // Remove file extension
        fileName: uploadResult.fileName,
        originalName: file.originalname,
        fileUrl: uploadResult.url,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileExtension: file.mimetype,
        documentHash,
        coverImageUrl: '',
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
    return this.documentsRepository.findByOneOrNull({
      documentHash,
      userId: new Types.ObjectId(userId),
    });
  }

  async findById(id: string): Promise<DocumentUpload> {
    return this.documentsRepository.findOne({ _id: id });
  }

  async updateProcessingStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    error?: string,
  ): Promise<DocumentUpload> {
    const updateData: any = {
      processingStatus: status,
      processed: status === 'completed',
    };

    if (error) {
      updateData.processingError = error;
    }

    return this.documentsRepository.findOneAndUpdate({ _id: id }, updateData);
  }

  private generateShortId(): string {
    // Generate a unique short string (8 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private getDocumentType(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('text/')) return 'text';
    
    // Office documents
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
