import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
import { UnAuthorizedException } from '../../shared';
import { CONSTANTS } from '../../app.constants';
import { verify, createPublicKey } from 'crypto';

const KEY =
  '-----BEGIN CERTIFICATE-----\n' +
  'MIIGfzCCBWegAwIBAgIEXVHeTDANBgkqhkiG9w0BAQsFADBSMQswCQYDVQQGEwJT\n' +
  'QTENMAsGA1UEChMEU0FNQTEbMBkGA1UECxMSU0FNQSBlVHJ1c3QgQ2VudGVyMRcw\n' +
  'FQYDVQQDEw5TQU1BIFNoYXJlZCBDQTAeFw0yMjAyMjExMTI3MTVaFw0yNDAyMjEx\n' +
  'MTU3MTVaMF4xCzAJBgNVBAYTAlNBMQ0wCwYDVQQKEwRTQU1BMRswGQYDVQQLExJT\n' +
  'QU1BIGVUcnVzdCBDZW50ZXIxFDASBgNVBAsTC1NBTUEgRG9tYWluMQ0wCwYDVQQD\n' +
  'EwRlZmFhMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0y1D5WVv0K78\n' +
  '2TT7or3izBqq50cX0oHVbJ0EX6w5W5DYjpXBnjdCEkIA3jv7Kt6T+40qnZW0QSXG\n' +
  'Lx6qZp6HqRDJgpHIpq/zCGeabIyOwK2NujKIVyFI8QZ3DsZSrt2qgT6Ga3INrKkX\n' +
  'ubZ6WyCtxVd7vAtGVWtTWcBBuaZvH0xqmrmQlvBadfokwfqS8heq7Dqx2ZebLvgM\n' +
  'odztgwIV8bPXYz7fcshp1rlqIjGk3ugM7LvT4VBbP1wH8U3F134so9nEQ5QTWzQX\n' +
  'C3KyBcf6WyRQ6zWLbd1jPR7S3UGq9EmvROIa5cYgz4G7zZwKH2Wzj0zQzo/8N3tg\n' +
  'mLJEQZ+HsQIDAQABo4IDTzCCA0swCwYDVR0PBAQDAgP4MFgGCWCGSAGG+mseAQRL\n' +
  'DElUaGUgcHJpdmF0ZSBrZXkgY29ycmVzcG9uZGluZyB0byB0aGlzIGNlcnRpZmlj\n' +
  'YXRlIG1heSBoYXZlIGJlZW4gZXhwb3J0ZWQuMB0GA1UdJQQWMBQGCCsGAQUFBwMB\n' +
  'BggrBgEFBQcDAjCBxAYDVR0gBIG8MIG5MIG2Bg0rBgEEAYGHHQEBBgABMIGkMIGh\n' +
  'BggrBgEFBQcCAjCBlBqBkVRoaXMgY2VydGlmaWNhdGUgaGFzIGJlZW4gaXNzdWVk\n' +
  'IGJ5IFNBTUEgZVRydXN0IENlbnRlci4gU0FNQSBkb2VzIG5vdCBhY2NlcHQgYW55\n' +
  'IGxpYWJpbGl0eSBmb3IgYW55IGNsYWltIGV4Y2VwdCBhcyBleHByZXNzbHkgcHJv\n' +
  'dmlkZWQgaW4gdGhpcyBDUC4wDwYDVR0RBAgwBoIEZWZhYTCCAVYGA1UdHwSCAU0w\n' +
  'ggFJMIHaoIHXoIHUhmZodHRwOi8vcGtpZnJvbnQtcDEuZXRydXN0LWNlbnRlci5z\n' +
  'YW1hLmdvdi5zYS9DUkwvc2FtYV9zaGFyZWRfY2Ffc2FtYV9ldHJ1c3RfY2VudGVy\n' +
  'X21hX2Nfc2FfY3JsZmlsZS5jcmyGamxkYXA6Ly9QS0lDQS1EUi9jbj1TQU1BJTIw\n' +
  'U2hhcmVkJTIwQ0Esb3U9U0FNQSUyMGVUcnVzdCUyMENlbnRlcixvPVNBTUEsYz1T\n' +
  'QT9jZXJ0aWZpY2F0ZVJldm9jYXRpb25MaXN0P2Jhc2UwaqBooGakZDBiMQswCQYD\n' +
  'VQQGEwJTQTENMAsGA1UEChMEU0FNQTEbMBkGA1UECxMSU0FNQSBlVHJ1c3QgQ2Vu\n' +
  'dGVyMRcwFQYDVQQDEw5TQU1BIFNoYXJlZCBDQTEOMAwGA1UEAxMFQ1JMMTAwKwYD\n' +
  'VR0QBCQwIoAPMjAyMjAyMjExMTI3MTVagQ8yMDIzMDcxNzExNTcxNVowHwYDVR0j\n' +
  'BBgwFoAUVMwso2AIJir4u/8qKvZ164nEQQEwHQYDVR0OBBYEFJ8yAp5TQ4b9JSiF\n' +
  'aVqx3JDWCtwSMAkGA1UdEwQCMAAwGQYJKoZIhvZ9B0EABAwwChsEVjguMwMCBLAw\n' +
  'DQYJKoZIhvcNAQELBQADggEBAESNPpgKaNpdwAy3BmWXzvAKjI5K7ECu41yytnG2\n' +
  'xF6Nkzm7+v5w/dExeylMh995wt7Y9vDVkGaYkoUNfANGmteEKVuBuo2UXLw8PQRG\n' +
  '3OrlxcEmOdbKPrxr5e+QsVN5JE4shheYd7jt/rMXXTJpGUi4aHEN4BpEo6AKED+w\n' +
  'DDMtZvWcrfCxG/g/qmND/jB0TluM/a5sDG3+zF2qjGYXt7Luc4NTf1WTPiisdny/\n' +
  'WRsqKmY3usso9N/OrUCK9ZcM01YJCq7sqjcC6j0+SSuqwez9xErnzu68375yPomb\n' +
  'e/lTiaDkrDrHzJmPe61tEiochcfNWm97TXoiKVNO9PSYr9g=\n' +
  '-----END CERTIFICATE-----';
@Injectable()
export class SignatureAuthStrategy extends PassportStrategy(Strategy, CONSTANTS.SIGNATURE_AUTH) {
  constructor(private readonly logger: Logger) {
    super();
  }

  async validate(request: Request): Promise<any> {
    const { body } = request;
    if (process.env.APP_ENV === 'development' || process.env.APP_ENV === 'stage') {
      return body;
    }
    const {
      headers: { signature },
    } = request;
    if (!signature) {
      throw new UnAuthorizedException('MISSING_SIGNATURE');
    }
    this.logger.log(`EEFA_SIGNATURE ${signature}`);
    const algorithm = 'sha256WithRSAEncryption';
    const data = JSON.stringify(body);
    const publicKeys = createPublicKey(KEY).export({
      format: 'pem',
      type: 'spki',
    });
    return verify(algorithm, Buffer.from(data), publicKeys, Buffer.from(signature as string, 'base64'));
  }
}
