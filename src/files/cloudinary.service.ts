import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export interface CompressionOptions {
  imageQuality?: 'auto:low' | 'auto:eco' | 'auto:good' | 'auto:best' | number;
  imageMaxWidth?: number;
  imageMaxHeight?: number;
  videoQuality?: 'auto:low' | 'auto:eco' | 'auto:good' | 'auto:best';
  videoMaxWidth?: number;
  videoMaxHeight?: number;
  enableWebP?: boolean;
  enableAVIF?: boolean;
  progressive?: boolean;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(
    private readonly configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'lenva-documents',
    compressionOptions?: CompressionOptions
  ): Promise<{ url: string; publicId: string; viewableUrl: string; originalSize: number }> {
    try {
      this.logger.log(`Processing file: ${file.originalname} (${file.size} bytes)`);

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);

      const timestamp = Date.now();
      const cleanFileName = file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      
      const uploadOptions: any = {
        folder,
        public_id: `${timestamp}_${cleanFileName}`,
        overwrite: true,
        resource_type: this.getResourceType(file.mimetype),
      };

      // Apply compression based on file type
      if (file.mimetype.startsWith('image/')) {
        this.applyImageCompression(uploadOptions, compressionOptions);
      } else if (file.mimetype.startsWith('video/')) {
        this.applyVideoCompression(uploadOptions, compressionOptions);
      } else if (file.mimetype === 'application/pdf') {
        this.applyPdfCompression(uploadOptions, compressionOptions);
      }

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              this.logger.error('Cloudinary upload failed:', error);
              reject(new Error(`Cloudinary upload failed: ${error.message || JSON.stringify(error)}`));
            } else {
              resolve(result);
            }
          }
        );

        stream.pipe(uploadStream);
      });

      this.logger.log(`File uploaded successfully: ${result.public_id}`);
      this.logger.log(`Final file size: ${result.bytes} bytes (${this.formatBytes(result.bytes)})`);
      
      const compressionRatio = ((file.size - result.bytes) / file.size * 100);
      if (compressionRatio > 0) {
        this.logger.log(`Compression achieved: ${compressionRatio.toFixed(2)}% reduction`);
      }

      const viewableUrl = this.generateViewableUrl(result.secure_url, file.mimetype);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        viewableUrl,
        originalSize: file.size,
      };
    } catch (error) {
      this.logger.error('Failed to upload file to Cloudinary:', error);
      throw new Error('Failed to upload file to Cloudinary');
    }
  }

  private applyImageCompression(uploadOptions: any, options?: CompressionOptions): void {
    // Base optimization settings
    uploadOptions.quality = options?.imageQuality || 'auto:eco';
    uploadOptions.fetch_format = 'auto'; // Auto-select best format (WebP, AVIF, etc.)
    
    const transformations: any[] = [];

    // Resize transformation
    if (options?.imageMaxWidth || options?.imageMaxHeight) {
      transformations.push({
        width: options.imageMaxWidth || 1920,
        height: options.imageMaxHeight || 1080,
        crop: 'limit'
      });
    }

    // Quality and format transformation
    const qualityTransform: any = {
      quality: options?.imageQuality || 'auto:eco',
      format: 'auto'
    };

    // Enable progressive JPEG for better loading experience
    if (options?.progressive !== false) {
      qualityTransform.flags = 'progressive';
    }

    transformations.push(qualityTransform);

    // Advanced format support
    if (options?.enableWebP !== false) {
      uploadOptions.format = 'auto'; // Will choose WebP when supported
    }

    if (options?.enableAVIF) {
      uploadOptions.format = 'auto'; // Will choose AVIF when supported and better
    }

    uploadOptions.transformation = transformations;
  }

  private applyVideoCompression(uploadOptions: any, options?: CompressionOptions): void {
    uploadOptions.quality = options?.videoQuality || 'auto:eco';
    uploadOptions.video_codec = 'h264'; // Most compatible codec
    
    const transformations: any[] = [];

    // Video resizing and quality
    transformations.push({
      width: options?.videoMaxWidth || 1280,
      height: options?.videoMaxHeight || 720,
      crop: 'limit',
      quality: options?.videoQuality || 'auto:eco',
      video_codec: 'h264'
    });

    // Additional video optimizations
    uploadOptions.transformation = transformations;
    uploadOptions.eager = [
      { 
        quality: 'auto:low', 
        format: 'mp4',
        video_codec: 'h264',
        streaming_profile: 'hd' 
      }
    ];
  }

  private applyPdfCompression(uploadOptions: any, options?: CompressionOptions): void {
    uploadOptions.transformation = [
      { 
        quality: options?.imageQuality || 'auto:eco',
        format: 'auto',
        flags: 'progressive'
      }
    ];
    
    // Generate thumbnail for preview
    uploadOptions.eager = [
      {
        page: 1,
        format: 'jpg',
        quality: 'auto:eco',
        width: 400,
        height: 600,
        crop: 'fill'
      }
    ];
  }

  async uploadWithCustomCompression(
    file: Express.Multer.File,
    folder: string = 'lenva-documents',
    customTransformations: any[] = []
  ): Promise<{ url: string; publicId: string; viewableUrl: string; originalSize: number }> {
    try {
      this.logger.log(`Processing file with custom transformations: ${file.originalname}`);

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);

      const timestamp = Date.now();
      const cleanFileName = file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      
      const uploadOptions: any = {
        folder,
        public_id: `${timestamp}_${cleanFileName}`,
        overwrite: true,
        resource_type: this.getResourceType(file.mimetype),
        transformation: customTransformations,
      };

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              this.logger.error('Cloudinary upload failed:', error);
              reject(new Error(`Cloudinary upload failed: ${error.message || JSON.stringify(error)}`));
            } else {
              resolve(result);
            }
          }
        );

        stream.pipe(uploadStream);
      });

      this.logger.log(`File uploaded successfully with custom transformations: ${result.public_id}`);

      const viewableUrl = this.generateViewableUrl(result.secure_url, file.mimetype);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        viewableUrl,
        originalSize: file.size,
      };
    } catch (error) {
      this.logger.error('Failed to upload file with custom transformations:', error);
      throw new Error('Failed to upload file to Cloudinary');
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      this.logger.log(`Deleting file from Cloudinary: ${publicId}`);
      
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`File deleted successfully: ${publicId}`);
    } catch (error) {
      this.logger.error('Failed to delete file from Cloudinary:', error);
      throw new Error('Failed to delete file from Cloudinary');
    }
  }

  async getFileInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      this.logger.error('Failed to get file info from Cloudinary:', error);
      throw new Error('Failed to get file info from Cloudinary');
    }
  }

  // Generate multiple compressed versions of an image
  async generateResponsiveVersions(
    file: Express.Multer.File,
    folder: string = 'lumen-documents'
  ): Promise<{ 
    url: string; 
    publicId: string; 
    viewableUrl: string; 
    originalSize: number;
    responsiveUrls: { [key: string]: string } 
  }> {
    try {
      this.logger.log(`Generating responsive versions for: ${file.originalname}`);

      const uploadResult = await this.uploadFile(file, folder, {
        imageQuality: 'auto:good',
        imageMaxWidth: 1920,
        imageMaxHeight: 1080
      });

      // Generate different sizes using Cloudinary's on-the-fly transformations
      const responsiveUrls = {
        thumbnail: uploadResult.url.replace('/upload/', '/upload/w_150,h_150,c_fill,q_auto:eco/'),
        small: uploadResult.url.replace('/upload/', '/upload/w_480,h_320,c_limit,q_auto:eco/'),
        medium: uploadResult.url.replace('/upload/', '/upload/w_768,h_512,c_limit,q_auto:good/'),
        large: uploadResult.url.replace('/upload/', '/upload/w_1200,h_800,c_limit,q_auto:good/'),
        xlarge: uploadResult.url.replace('/upload/', '/upload/w_1920,h_1080,c_limit,q_auto:best/')
      };

      return {
        ...uploadResult,
        responsiveUrls
      };
    } catch (error) {
      this.logger.error('Failed to generate responsive versions:', error);
      throw new Error('Failed to generate responsive versions');
    }
  }

  private getResourceType(mimetype: string): string {
    if (mimetype.startsWith('image/')) {
      return 'image';
    } else if (mimetype.startsWith('video/')) {
      return 'video';
    } else {
      return 'raw';
    }
  }

  private generateViewableUrl(originalUrl: string, mimetype: string): string {
    if (mimetype.startsWith('image/')) {
      return originalUrl;
    }

    if (mimetype.startsWith('video/')) {
      return originalUrl;
    }

    if (mimetype === 'application/pdf') {
      return originalUrl.replace('/upload/', '/upload/pg_1,fl_progressive/');
    }

    if (this.isViewableDocument(mimetype)) {
      return originalUrl;
    }

    return originalUrl.replace('/upload/', '/upload/fl_attachment/');
  }

  private isViewableDocument(mimetype: string): boolean {
    const viewableTypes = [
      'text/plain',
      'application/json',
      'text/html',
      'text/css',
      'application/javascript',
      'text/xml',
      'application/xml',
      'text/csv',
      'application/rtf',
      'text/markdown'
    ];
    return viewableTypes.includes(mimetype);
  }

  private isOfficeDocument(mimetype: string): boolean {
    const officeTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation'
    ];
    return officeTypes.includes(mimetype);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}