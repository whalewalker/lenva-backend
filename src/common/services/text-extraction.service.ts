import { Injectable, Logger } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export interface ExtractedText {
  text: string;
  metadata: {
    filename: string;
    fileType: string;
    pageCount?: number;
    extractedAt: string;
  };
}

@Injectable()
export class TextExtractionService {
  private readonly logger = new Logger(TextExtractionService.name);

  /**
   * Extract text from a file buffer based on its MIME type
   */
  async extractTextFromFile(
    file: Express.Multer.File,
  ): Promise<ExtractedText> {
    try {
      this.logger.log(`Extracting text from file: ${file.originalname} (${file.mimetype})`);

      let extractedText: string;
      let metadata: any = {};

      switch (file.mimetype) {
        case 'application/pdf':
          extractedText = await this.extractFromPDF(file.buffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          extractedText = await this.extractFromDOCX(file.buffer);
          break;
        case 'text/plain':
          extractedText = await this.extractFromTXT(file.buffer);
          break;
        default:
          throw new Error(`Unsupported file type: ${file.mimetype}`);
      }

      // Clean and normalize the extracted text
      const cleanedText = this.cleanText(extractedText);

      // Log content size for monitoring
      const contentLength = cleanedText.length;
      this.logger.log(`Extracted text length: ${contentLength} characters`);
      
      if (contentLength > 500000) { // ~125k tokens
        this.logger.warn(`Large content detected (${contentLength} chars). This may exceed API token limits.`);
      }

      const result: ExtractedText = {
        text: cleanedText,
        metadata: {
          filename: file.originalname,
          fileType: file.mimetype,
          pageCount: metadata.pageCount,
          extractedAt: new Date().toISOString(),
        },
      };

      this.logger.log(
        `Successfully extracted text from ${file.originalname} (${cleanedText.length} characters)`
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to extract text from ${file.originalname}:`, error);
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF buffer
   */
  private async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      this.logger.error('PDF parsing failed:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Extract text from DOCX buffer
   */
  private async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      this.logger.error('DOCX parsing failed:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }

  /**
   * Extract text from TXT buffer
   */
  private async extractFromTXT(buffer: Buffer): Promise<string> {
    try {
      return buffer.toString('utf-8');
    } catch (error) {
      this.logger.error('TXT parsing failed:', error);
      throw new Error('Failed to parse TXT file');
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    if (!text) return '';

    return (
      text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove special characters but keep basic punctuation
        .replace(/[^\w\s.,!?;:\-()[\]{}"']/g, '')
        // Normalize line breaks
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Remove multiple consecutive line breaks
        .replace(/\n\s*\n/g, '\n')
        .trim()
    );
  }
}
