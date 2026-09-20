import { Module } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { GemmaApiProvider } from './providers/gemma-api.provider';
import { ImageValidationService } from './image-validation.service';

@Module({
  controllers: [],
  providers: [ClassificationService, GemmaApiProvider, ImageValidationService],
  exports: [ClassificationService, ImageValidationService],
})
export class AiModule {}

