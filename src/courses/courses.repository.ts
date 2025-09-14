import { Course } from "@/models";
import { AbstractRepository } from "@/repo/abstract.repository";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PaginatedQuery } from "@/common/dto/paginated-query.dto";
import { PaginationHelper, PaginationResult, SearchOptions } from "@/common/utils/pagination.helper";

@Injectable()
export class CoursesRepository extends AbstractRepository<Course> {
    constructor(@InjectModel(Course.name) courseModel: Model<Course>) {
        super(courseModel, Course.name);
    }

    async findPaginated(
        query: PaginatedQuery,
        projection?: Record<string, any>
    ): Promise<PaginationResult<Course>> {
        const searchOptions: SearchOptions = {
            textSearchFields: [
                'title',
                'description',
                'learningObjectives',
                'keyConcepts',
                'subject',
                'tags'
            ],
            dateField: 'createdAt',
            allowedSortFields: [
                'title',
                'createdAt',
                'updatedAt',
                'level',
                'status',
                'estimatedDuration'
            ]
        };

        return PaginationHelper.paginate(
            this.model,
            query,
            searchOptions,
            projection
        );
    }
    async countByFilters(filters: Record<string, any> = {}): Promise<number> {
        return this.model.countDocuments(filters);
    }
}