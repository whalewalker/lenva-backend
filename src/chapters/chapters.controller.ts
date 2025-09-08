import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/auth/guards/roles.guard";
import {
  Controller,
  Get,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ChaptersService } from "./chapters.service";

@ApiTags('chapters')
@Controller('chapters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get chapter by ID' })
  @ApiResponse({ status: 200, description: 'Chapter found' })
  @ApiResponse({ status: 404, description: 'Chapter not found' })
  async findOne(@Param('id') id: string) {
    return await this.chaptersService.findById(id);
  }

  @Get('/course/:courseId')
  @ApiOperation({ summary: 'Get chapters by course ID' })
  @ApiResponse({ status: 200, description: 'Chapters found' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findByCourseId(@Param('courseId') courseId: string) {
    return await this.chaptersService.findByCourseId(courseId);
  }
}