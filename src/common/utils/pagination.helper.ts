import { Model } from 'mongoose';
import { PaginatedQuery } from '@/common/dto/paginated-query.dto';
import { AbstractDocument } from '@/repo/abstract.schema';

export interface PaginationResult<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
}

export interface SearchOptions {
  textSearchFields?: string[];
  dateField?: string;
  allowedSortFields?: string[];
}

export class PaginationHelper {
  static buildQuery<T extends AbstractDocument>(
    query: PaginatedQuery,
    options: SearchOptions = {}
  ): { filter: any; sort: Record<string, 1 | -1> } {
    const filter: any = {};

    // Apply generic filters
    if (query.filters && Object.keys(query.filters).length > 0) {
      Object.entries(query.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          this.applyFilter(filter, key, value);
        }
      });
    }

    // Apply date range filtering
    this.applyDateFilter(filter, query, options.dateField || 'createdAt');

    // Apply text search
    this.applyTextSearch(filter, query, options);

    // Build sort
    const sort = this.buildSort(query, options);

    return { filter, sort };
  }

  private static applyFilter(filter: any, key: string, value: any): void {
    if (Array.isArray(value)) {
      filter[key] = { $in: value };
    } else if (typeof value === 'string' && value.includes(',')) {
      filter[key] = { $in: value.split(',').map(v => v.trim()) };
    } else {
      filter[key] = value;
    }
  }

  private static applyDateFilter(filter: any, query: PaginatedQuery, dateField: string): void {
    if (query.startDate || query.endDate) {
      filter[dateField] = {};
      if (query.startDate) {
        filter[dateField].$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter[dateField].$lte = new Date(query.endDate);
      }
    }
  }

  private static applyTextSearch(filter: any, query: PaginatedQuery, options: SearchOptions): void {
    if (!query.search?.trim()) return;

    if (query.searchFields?.length > 0) {
      filter.$or = query.searchFields.map(field => ({
        [field]: { $regex: query.search, $options: 'i' }
      }));
    } else if (options.textSearchFields?.length > 0) {
      filter.$or = options.textSearchFields.map(field => ({
        [field]: { $regex: query.search, $options: 'i' }
      }));
    } else {
      filter.$text = { $search: query.search };
    }
  }

  private static buildSort(query: PaginatedQuery, options: SearchOptions): Record<string, 1 | -1> {
    const sort: Record<string, 1 | -1> = {};
    const sortField = query.sortBy || 'updatedAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    
    if (options.allowedSortFields && !options.allowedSortFields.includes(sortField)) {
      sort['updatedAt'] = -1;
    } else {
      sort[sortField] = sortOrder;
    }

    return sort;
  }

  static async paginate<T extends AbstractDocument>(
    model: Model<T>,
    query: PaginatedQuery,
    options: SearchOptions = {},
    projection?: Record<string, any>
  ): Promise<PaginationResult<T>> {
    const { filter, sort } = this.buildQuery<T>(query, options);
    
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const [totalItems, items] = await Promise.all([
      model.countDocuments(filter),
      model
        .find(filter, projection)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean<T[]>(true)
    ]);

    return {
      items,
      totalItems,
      currentPage: page,
      pageSize
    };
  }

  static async aggregatePaginate<T>(
    model: Model<any>,
    pipeline: any[],
    query: PaginatedQuery,
    options: SearchOptions = {}
  ): Promise<PaginationResult<T>> {
    const { filter, sort } = this.buildQuery(query, options);
    
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (page - 1) * pageSize;

    if (Object.keys(filter).length > 0) {
      pipeline.unshift({ $match: filter });
    }

    const countPipeline = [...pipeline, { $count: 'totalItems' }];
    
    pipeline.push(
      { $sort: sort },
      { $skip: skip },
      { $limit: pageSize }
    );

    const [countResult, items] = await Promise.all([
      model.aggregate(countPipeline),
      model.aggregate(pipeline)
    ]);

    const totalItems = countResult.length > 0 ? countResult[0].totalItems : 0;

    return {
      items,
      totalItems,
      currentPage: page,
      pageSize
    };
  }
}