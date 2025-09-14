import { Module } from "@nestjs/common";
import { ChaptersService } from "./chapters.service";
import { ChaptersController } from "./chapters.controller";
import { ChaptersRepository } from "./chapters.repository";
import { ModelsModule } from "@/models/models.module";
import { CommonModule } from "@/common/common.module";

@Module({
    imports: [ModelsModule, CommonModule],
    controllers: [ChaptersController],
    providers: [ChaptersService, ChaptersRepository],
    exports: [ChaptersService],
})
export class ChaptersModule {}