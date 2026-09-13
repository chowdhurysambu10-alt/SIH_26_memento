import { Module } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { GemmaApiProvider } from './providers/gemma-api.provider';

@Module({
  providers: [ClassificationService, GemmaApiProvider],
  exports: [ClassificationService],
})
export class AiModule {}
