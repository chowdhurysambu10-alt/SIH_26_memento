import { Module } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { GemmaApiProvider } from './providers/gemma-api.provider';
import { OllamaProvider } from './providers/ollama.provider';

@Module({
  providers: [ClassificationService, GemmaApiProvider, OllamaProvider],
  exports: [ClassificationService],
})
export class AiModule {}
