import { Inject, Logger } from '@nestjs/common';
import { LogUtil } from '../../shared';

interface LoggerParams {
  type?: 'log' | 'verbose' | 'warn' | 'debug';
  inputs?: boolean;
  outputs?: boolean;
  throwError?: boolean;
  skipLogDetails?: boolean;
}

const defaultParams: Required<LoggerParams> = {
  type: 'log',
  inputs: true,
  outputs: true,
  throwError: true,
  skipLogDetails: false,
};

export const LogDecorator = (params?: LoggerParams) => {
  const injectLogger = Inject(Logger);
  const options: Required<LoggerParams> = {
    type: params?.type || defaultParams.type,
    inputs: params?.inputs === undefined ? defaultParams.inputs : params.inputs,
    outputs: params?.outputs === undefined ? defaultParams.outputs : params.outputs,
    throwError: params?.throwError === undefined ? defaultParams.throwError : params.throwError,
    skipLogDetails: params?.skipLogDetails === undefined ? defaultParams.skipLogDetails : params.skipLogDetails,
  };

  return (target: any, propertyKey: string, propertyDescriptor: PropertyDescriptor) => {
    injectLogger(target, 'logger'); // this is the same as using constructor(private readonly logger: Logger) in a class
    const { throwError, type, inputs, outputs, skipLogDetails } = options;
    //get original method
    const originalMethod = propertyDescriptor.value;

    //redefine descriptor value within own function block
    propertyDescriptor.value = async function (...args: any[]) {
      const logger: Logger = this.logger;
      const logIdentifier = `${target.constructor.name}.${propertyKey}()`;
      try {
        if (skipLogDetails) {
          logger[type](`${logIdentifier} EXECUTING WITHOUT LOGGING`);
          return await originalMethod.apply(this, args);
        } else {
          inputs &&
            logger[type](
              `${logIdentifier} [ENTRY PARAMS] >>>  ${LogUtil.maskParamsAuthorizationTokenIfExists(
                JSON.stringify(args)
              )}`
            );
          const res = await originalMethod.apply(this, args);
          outputs &&
            logger[type](
              `${logIdentifier} [RETURN DATA] >>> ${LogUtil.maskParamsAuthorizationTokenIfExists(JSON.stringify(res))}`
            );
          return res;
        }
      } catch (error) {
        logger.error(`${logIdentifier} [ERROR DATA] >>> ${error.message}`, error.stack);
        // rethrow error, so it can bubble up
        if (throwError) {
          throw error;
        }
      }
    };
  };
};
