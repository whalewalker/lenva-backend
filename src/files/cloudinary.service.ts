import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export interface UploadResult {
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly folder = 'lenva-documents';

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    try {
      this.logger.log(`Uploading file: ${file.originalname} (${file.size} bytes)`);

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);

      const timestamp = Date.now();
      const extension = file.originalname.split('.').pop() || '';
      const nameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '');
      const cleanFileName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      
      const publicId = `${this.folder}/${timestamp}_${cleanFileName}${extension ? '.' + extension : ''}`;

      const uploadOptions: any = {
        public_id: publicId,
        resource_type: this.getResourceType(file.mimetype),
        overwrite: true,
      };

      if (file.mimetype.startsWith('image/')) {
        uploadOptions.format = 'auto';
        uploadOptions.quality = 'auto:good';
      }

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              this.logger.error('Cloudinary upload error:', error);
              reject(new Error(`Upload failed: ${error.message}`));
            } else {
              resolve(result);
            }
          }
        );
        stream.pipe(uploadStream);
      });

      this.logger.log(`File uploaded successfully: ${result.public_id}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: file.originalname,
        fileSize: result.bytes,
        fileType: file.mimetype,
      };

    } catch (error) {
      this.logger.error('Failed to upload file:', error);
      throw new Error('File upload failed');
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`File deleted: ${publicId}`);
    } catch (error) {
      this.logger.error('Failed to delete file:', error);
      throw new Error('File deletion failed');
    }
  }

  private getResourceType(mimetype: string): 'image' | 'video' | 'raw' {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'raw';
  }
}