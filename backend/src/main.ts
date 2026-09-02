import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Exception Filter for uniform error response format { statusCode, message, errorCode }
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Transform Interceptor for uniform data output
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Societal Innovation Collaboration Portal API')
    .setDescription(
      `Backend API for crowdsourcing, AI classifying (Gemma 2), routing, and collaboratively solving local societal challenges across Jharkhand.\n\n` +
      `Features:\n` +
      `- **Authentication & RLS**: 8 Roles (Citizen, PRI/ULB, University Admin, Faculty, Student, Industry Partner, Govt Viewer, Super Admin)\n` +
      `- **AI Routing Engine**: Google AI Studio Gemma API\n` +
      `- **Lifecycle State Machine**: submitted ➔ under_review ➔ routed ➔ team_formed ➔ in_progress ➔ completed ➔ validated\n` +
      `- **Collaboration**: University Teams, Industry Proposals, and Milestone Deliverable Workflows\n` +
      `- **Realtime Notifications**: Supabase Realtime event push\n` +
      `- **Analytics**: Heatmaps and institutional leaderboards`,
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Societal Innovation Portal - Swagger API Docs',
  });

  await app.listen(port);
  logger.log(`Application successfully started on: http://localhost:${port}`);
  logger.log(`Swagger OpenAPI Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
