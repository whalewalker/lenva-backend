import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz, QuizDocument } from '../models/quiz.model';

interface QuizFilters {
  courseId?: string;
}

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
  ) {}

  async create(quizData: Partial<Quiz>): Promise<Quiz> {
    const quiz = new this.quizModel(quizData);
    return await quiz.save();
  }

  async findAll(filters?: QuizFilters): Promise<Quiz[]> {
    const query: any = {};
    
    if (filters?.courseId) {
      if (!Types.ObjectId.isValid(filters.courseId)) {
        return [];
      }
      query.courseId = filters.courseId;
    }
    
    return await this.quizModel.find(query).exec();
  }

  async findById(id: string): Promise<Quiz | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.quizModel.findById(id).exec();
  }

  async findByCourseId(courseId: string): Promise<Quiz[]> {
    if (!Types.ObjectId.isValid(courseId)) {
      return [];
    }
    return await this.quizModel.find({ courseId }).exec();
  }

  async update(id: string, quizData: Partial<Quiz>): Promise<Quiz> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid quiz ID format`);
    }
    
    const quiz = await this.quizModel.findByIdAndUpdate(id, quizData, { new: true }).exec();
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    
    return quiz;
  }

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid quiz ID format`);
    }
    
    const result = await this.quizModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
  }

  async publish(id: string): Promise<Quiz> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid quiz ID format`);
    }
    
    const quiz = await this.quizModel.findByIdAndUpdate(
      id, 
      { status: 'published' }, 
      { new: true }
    ).exec();
    
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    
    return quiz;
  }
}
