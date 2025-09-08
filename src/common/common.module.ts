import { Module } from "@nestjs/common";
import { RedisService } from "./services/redis.service";
import { TextExtractionService } from "./services/text-extraction.service";
import { AIPromptService } from "./services/ai-prompt.service";
import { SchemaService } from "./services/schema.service";

@Module({
    imports: [
    ],
    providers: [
        RedisService,
        TextExtractionService,
        AIPromptService,
        SchemaService,
    ],
    exports: [
        RedisService,
        TextExtractionService,
        AIPromptService,
        SchemaService,
    ],
})
export class CommonModule {}