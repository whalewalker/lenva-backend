import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Flashcard, FlashcardSchema } from '../models/flashcard.model';
import { FlashcardsService } from './flashcards.service';
import { FlashcardsController } from './flashcards.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Flashcard.name, schema: FlashcardSchema }])],
  controllers: [FlashcardsController],
  providers: [FlashcardsService],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
