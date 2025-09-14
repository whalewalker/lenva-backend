import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quiz } from '@/models';
import { AbstractRepository } from '@/repo/abstract.repository';

@Injectable()
export class QuizzesRepository extends AbstractRepository<Quiz> {
    constructor(@InjectModel(Quiz.name) quizModel: Model<Quiz>) {
        super(quizModel, Quiz.name);
    }
}