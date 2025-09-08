import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Flashcard, FlashcardDocument } from '../models/flashcard.model';

interface FlashcardFilters {
  courseId?: string;
  difficulty?: string;
}

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectModel(Flashcard.name)
    private readonly flashcardModel: Model<FlashcardDocument>,
  ) {}

  async create(flashcardData: Partial<Flashcard>): Promise<Flashcard> {
    const flashcard = new this.flashcardModel(flashcardData);
    return await flashcard.save();
  }

  async findAll(filters?: FlashcardFilters): Promise<Flashcard[]> {
    const query: any = {};
    
    if (filters?.courseId) {
      if (!Types.ObjectId.isValid(filters.courseId)) {
        return [];
      }
      query.courseId = filters.courseId;
    }
    
    if (filters?.difficulty) {
      query.difficulty = filters.difficulty;
    }
    
    return await this.flashcardModel.find(query).exec();
  }

  async findById(id: string): Promise<Flashcard | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.flashcardModel.findById(id).exec();
  }

  async findByCourseId(courseId: string): Promise<Flashcard[]> {
    if (!Types.ObjectId.isValid(courseId)) {
      return [];
    }
    return await this.flashcardModel.find({ courseId }).exec();
  }

  async update(id: string, flashcardData: Partial<Flashcard>): Promise<Flashcard> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid flashcard ID format`);
    }
    
    const flashcard = await this.flashcardModel.findByIdAndUpdate(id, flashcardData, { new: true }).exec();
    if (!flashcard) {
      throw new NotFoundException(`Flashcard with ID ${id} not found`);
    }
    
    return flashcard;
  }

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid flashcard ID format`);
    }
    
    const result = await this.flashcardModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Flashcard with ID ${id} not found`);
    }
  }
}
