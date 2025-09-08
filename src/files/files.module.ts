import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  providers: [CloudinaryService],
  exports: [CloudinaryService, MulterModule],
})
export class FilesModule {}
