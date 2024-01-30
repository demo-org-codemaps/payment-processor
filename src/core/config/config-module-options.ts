import appConfig from './app.config';
import { ConfigModuleOptions } from '@nestjs/config/dist/interfaces';
import * as Joi from 'joi';
import { CONSTANTS } from '../../app.constants';

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  envFilePath: '.env',
  load: [appConfig],
  validationSchema: Joi.object({
    NODE_ENV: Joi.string()
      .valid(CONSTANTS.ENVIRONMENT.DEVELOPMENT, CONSTANTS.ENVIRONMENT.PRODUCTION, CONSTANTS.ENVIRONMENT.TEST)
      .default(CONSTANTS.ENVIRONMENT.DEVELOPMENT),
    PAYMENT_APP_PORT: Joi.number().required(),

    WALLET_ENDPOINT: Joi.string().required(),

    CORS_WHITELIST: Joi.string().required(),

    PAYMENT_DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().optional(),
    PAYMENT_DB_NAME: Joi.string().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),

    JWT_SECRET_KEY: Joi.string().required(),
    JWT_ACCESS_TOKEN_EXPIRY_IN_SEC: Joi.number().required(),

    BNPL_WALLET_ENDPOINT: Joi.string().required(),
    USER_ENDPOINT: Joi.string().required(),
    OPE_ENDPOINT: Joi.string().required(),
    EEFA_ENDPOINT: Joi.string().required(),
    EEFA_USER: Joi.string().required(),
    EEFA_ENTITY_ACTIVITY_ID: Joi.string().required(),
    EEFA_PASS: Joi.string().required(),

    AWS_SES_EMAIL: Joi.string().required(),
    BULK_TOPUP_CC_EMAILS: Joi.string().required(),
    REGION: Joi.string().required(),

    SENTRY_DSN: Joi.string().required(),
    EXPIRE_TOPUP_INTENT: Joi.string().required(),
    EASYPAISA_USERNAME: Joi.string().required(),
    EASYPAISA_PASSWORD: Joi.string().required(),
    EASYPAISA_BANK_MNEMONIC: Joi.string().required(),
  }),
};
