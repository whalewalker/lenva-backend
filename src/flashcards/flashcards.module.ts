import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Flashcard, FlashcardSchema } from '../models/flashcard.model';
import { FlashcardDeck, FlashcardDeckSchema } from '../models/flashcard-deck.model';
import { FlashcardsService } from './flashcards.service';
import { FlashcardsController } from './flashcards.controller';
import { FlashcardsRepository } from './flashcards.repository';
import { FlashcardDeckRepository } from './flashcard-deck.repository';
import { ContentModule } from '../contents/content.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Flashcard.name, schema: FlashcardSchema },
      { name: FlashcardDeck.name, schema: FlashcardDeckSchema }
    ]),
    ContentModule
  ],
  controllers: [FlashcardsController],
  providers: [FlashcardsService, FlashcardsRepository, FlashcardDeckRepository],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
