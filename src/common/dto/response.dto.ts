import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T = any> {
  @ApiProperty({
    description: 'Response message indicating the result of the operation',
    example: 'Operation completed successfully'
  })
  message: string;

  @ApiProperty({
    description: 'The actual data returned by the operation'
  })
  data: T;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2024-09-13T10:30:00.000Z'
  })
  timestamp: string;

  constructor(message: string, data: T = null) {
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message: string = 'Operation completed successfully'): ApiResponse<T> {
    return new ApiResponse(message, data);
  }

  static error<T = null>(message: string, data: T = null): ApiResponse<T> {
    return new ApiResponse(message, data);
  }
}

export class PaginationMeta {
  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  currentPage: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10
  })
  pageSize: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 100
  })
  totalItems: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10
  })
  totalPages: number;

  constructor(currentPage: number, pageSize: number, totalItems: number) {
    this.currentPage = currentPage;
    this.pageSize = pageSize;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(totalItems / pageSize);
  }
}

export class PaginatedData<T> {
  @ApiProperty({
    description: 'Array of items for the current page',
    isArray: true
  })
  items: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMeta
  })
  pagination: PaginationMeta;

  constructor(items: T[], currentPage: number, pageSize: number, totalItems: number) {
    this.items = items;
    this.pagination = new PaginationMeta(currentPage, pageSize, totalItems);
  }
}

export class PaginatedResponse<T = any> extends ApiResponse<PaginatedData<T>> {
  constructor(items: T[], currentPage: number, pageSize: number, totalItems: number, message: string = 'Data retrieved successfully') {
    const paginatedData = new PaginatedData(items, currentPage, pageSize, totalItems);
    super(message, paginatedData);
  }

  static create<T>(
    items: T[],
    currentPage: number,
    pageSize: number,
    totalItems: number,
    message?: string
  ): PaginatedResponse<T> {
    return new PaginatedResponse(items, currentPage, pageSize, totalItems, message);
  }
}