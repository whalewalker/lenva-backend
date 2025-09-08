import { Course } from "@/models";
import { AbstractRepository } from "@/repo/abstract.repository";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class CoursesRepository extends AbstractRepository<Course> {
    constructor(@InjectModel(Course.name) private readonly courseModel: Model<Course>) {
        super(courseModel, Course.name);
    }
}