import { FilterQuery, Model, Types, UpdateQuery } from "mongoose";
import { AbstractDocument } from "./abstract.schema";
import { Logger, NotFoundException } from "@nestjs/common";

export abstract class AbstractRepository<T extends AbstractDocument> {
    protected readonly logger: Logger;
    protected readonly modelName: string;

    constructor(protected readonly model: Model<T>, protected readonly name: string) {
        this.logger = new Logger(name + 'Repository');
        this.modelName = name;
    }


    async create(document: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T> {
        const createdDocument = new this.model({
            ...document,
            _id: new Types.ObjectId(),
        });
        return (await createdDocument.save()).toJSON() as unknown as T;
    }

    async findOne(filter: FilterQuery<T>, projection?: Record<string, any>): Promise<T> {
        const document = await this.model.findOne(filter, projection)
            .lean<T>(true);

        if (!document) {
            this.logger.warn(`${this.modelName} not found with filter: ${JSON.stringify(filter)}`);
            throw new NotFoundException(`${this.modelName} not found`);
        }
        return document;
    }

    async findOneOrNull(filter: FilterQuery<T>, projection?: Record<string, any>): Promise<T | null> {
        return this.model.findOne(filter, projection)
            .lean<T>(true);
    }

    async findOneAndUpdate(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<T> {
        const updatedDocument = await this.model.findOneAndUpdate(filter, { ...update, updatedAt: new Date() }, { new: true })
            .lean<T>(true);

        if (!updatedDocument) {
            this.logger.warn(`${this.modelName} not found with filter: ${JSON.stringify(filter)}`);
            throw new NotFoundException(`${this.modelName} not found`);
        }

        return updatedDocument;
    }

    async find(filter: FilterQuery<T>, projection?: Record<string, any>): Promise<T[]> {
        return this.model.find({...filter}, projection).lean<T[]>(true);
    }

    async delete(filter: FilterQuery<T>): Promise<T> {
        return await this.model.findOneAndDelete(filter).lean<T>(true);
    }
}