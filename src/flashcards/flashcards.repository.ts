import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Flashcard, FlashcardDocument } from '@/models';

@Injectable()
export class FlashcardsRepository {
    constructor(
        @InjectModel(Flashcard.name) 
        private readonly flashcardModel: Model<FlashcardDocument>
    ) {}

    async create(flashcardData: Partial<Flashcard>): Promise<Flashcard> {
        const flashcard = new this.flashcardModel(flashcardData);
        return await flashcard.save();
    }

    async findById(id: string): Promise<Flashcard | null> {
        return await this.flashcardModel.findById(id).exec();
    }

    async find(filter: any): Promise<Flashcard[]> {
        return await this.flashcardModel.find(filter).exec();
    }

    async findOne(filter: any): Promise<Flashcard | null> {
        return await this.flashcardModel.findOne(filter).exec();
    }

    async updateById(id: string, updateData: Partial<Flashcard>): Promise<Flashcard | null> {
        return await this.flashcardModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    async deleteById(id: string): Promise<Flashcard | null> {
        return await this.flashcardModel.findByIdAndDelete(id).exec();
    }

    async insertMany(flashcards: Partial<Flashcard>[]): Promise<any[]> {
        return await this.flashcardModel.insertMany(flashcards);
    }
}