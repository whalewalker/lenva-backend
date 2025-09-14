import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FlashcardDeck, FlashcardDeckDocument } from '@/models';

@Injectable()
export class FlashcardDeckRepository {
    constructor(
        @InjectModel(FlashcardDeck.name) 
        private readonly flashcardDeckModel: Model<FlashcardDeckDocument>
    ) {}

    async create(deckData: Partial<FlashcardDeck>): Promise<FlashcardDeck> {
        const deck = new this.flashcardDeckModel(deckData);
        return await deck.save();
    }

    async findById(id: string): Promise<FlashcardDeck | null> {
        return await this.flashcardDeckModel.findById(id).exec();
    }

    async find(filter: any): Promise<FlashcardDeck[]> {
        return await this.flashcardDeckModel.find(filter).exec();
    }

    async findOne(filter: any): Promise<FlashcardDeck | null> {
        return await this.flashcardDeckModel.findOne(filter).exec();
    }

    async updateById(id: string, updateData: Partial<FlashcardDeck>): Promise<FlashcardDeck | null> {
        return await this.flashcardDeckModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    async deleteById(id: string): Promise<FlashcardDeck | null> {
        return await this.flashcardDeckModel.findByIdAndDelete(id).exec();
    }
}