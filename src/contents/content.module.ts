import { Module } from "@nestjs/common";
import { ContentService } from "./content.service";
import { CommonModule } from "@/common/common.module";
import { AiModule } from "@/ai/ai.module";


@Module({
    imports: [
        CommonModule,
        AiModule,
    ],
    providers: [
        ContentService,
    ],
    exports: [
        ContentService,
    ],
})
export class ContentModule {}