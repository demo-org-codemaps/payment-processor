import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ValidationError } from 'class-validator';
import * as helmet from 'helmet';
import { CONSTANTS } from './app.constants';
import { AppModule } from './app.module';
import { RequestIdMiddleware } from './core';
import { setupLogger } from './logger';
import { ValidationFailedException } from './shared';
import { setupSwagger } from './swagger';
import { MicroserviceOptions } from '@nestjs/microservices';
import { grpcConfig } from './core/config';
import { PAYMENT_PACKAGE_NAME } from './generated/src/protos/payment';
import { initializeConfig, logAuthLibEnv } from '@demoorg/auth-library/dist';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';

async function bootstrap() {
  initializeConfig();
  logAuthLibEnv();
  const app = await NestFactory.create(AppModule, {
    logger: setupLogger(),
  });

  app.setGlobalPrefix(CONSTANTS.API_VERSION);

  const configService = app.get(ConfigService);
  const environment = configService.get<string>('NODE_ENV');

  if (environment === CONSTANTS.ENVIRONMENT.PRODUCTION) {
    app.use(helmet());
  }

  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
  });

  app.use(RequestIdMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      validateCustomDecorators: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new ValidationFailedException(validationErrors);
      },
    })
  );

  app.useGlobalInterceptors(new ResponseInterceptor());

  /** Swagger configuration */
  setupSwagger(app);

  // GRPC microservice configuration
  app.connectMicroservice<MicroserviceOptions>(grpcConfig(configService, PAYMENT_PACKAGE_NAME));
  await app.startAllMicroservices();

  const port = configService.get<number>('port');
  await app.listen(port);
}
bootstrap();
