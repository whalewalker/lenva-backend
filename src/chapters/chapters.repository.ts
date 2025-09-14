
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chapter } from '@/models';
import { AbstractRepository } from '@/repo/abstract.repository';

@Injectable()
export class ChaptersRepository extends AbstractRepository<Chapter> {
    constructor(@InjectModel(Chapter.name) chapterModel: Model<Chapter>) {
        super(chapterModel, Chapter.name);
    }
}