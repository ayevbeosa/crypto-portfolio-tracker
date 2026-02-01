import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    cors: true,
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    }),
  );

  // Compression Middleware
  app.use(compression());

  // CORS Configuration
  app.enableCors({
    origin:
      nodeEnv === 'production'
        ? ['https://yourdomain.com'] // Replace with production domain
        : [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:4200',
          ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global API Prefix
  app.setGlobalPrefix(apiPrefix);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: nodeEnv === 'production',
    }),
  );

  // Swagger Documentation Setup
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Crypto Portfolio Tracker API')
      .setDescription(
        'A comprehensive cryptocurrency portfolio tracking system with real-time price updates, analytics, and alerts.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag(
        'Authentication',
        'User authentication and authorization endpoints',
      )
      .addTag('Users', 'User management endpoints')
      .addTag('Portfolios', 'Portfolio management endpoints')
      .addTag('Transactions', 'Transaction management endpoints')
      .addTag('Crypto', 'Cryptocurrency data and prices')
      .addTag('Alerts', 'Price alert management')
      .addTag('Analytics', 'Portfolio analytics and insights')
      // .addServer(`http://localhost:${port}/${apiPrefix}`, 'Local Development')
      // .addServer(`https://api.yourdomain.com/${apiPrefix}`, 'Production')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Crypto Portfolio Tracker API Docs',
    });

    logger.log(
      `📚 Swagger documentation available at: http://localhost:${port}/api/docs`,
    );
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  // Start the server
  await app.listen(port);

  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`📡 Health check: http://localhost:${port}/${apiPrefix}/health`);

  // Log startup info
  if (nodeEnv === 'development') {
    logger.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║  🔐 Crypto Portfolio Tracker API                          ║
    ║                                                           ║
    ║  📚 API Docs:  http://localhost:${port}/api/docs             ║
    ║  🔌 API Base:  http://localhost:${port}/${apiPrefix}               ║
    ║  🌍 Env:       ${nodeEnv.padEnd(43)}║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    `);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();
