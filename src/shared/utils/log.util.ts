import { Request, Response } from 'express';
import { CONSTANTS } from '../../app.constants';
import { ApiLog } from '../dtos';

export class LogUtil {
  public static getRequestData(request: Request): ApiLog {
    const apiLog = this.getApiLogFromRequest(request);
    apiLog.body = JSON.stringify(request.body);
    apiLog.headers = JSON.stringify(request.headers);
    return apiLog;
  }

  public static isLogAllowed(request: Request): boolean {
    if (request.url.includes('health')) {
      return false;
    }
    return true;
  }

  public static getResponseData(request: Request, response: Response): ApiLog {
    const apiLog = this.getApiLogFromRequest(request);
    apiLog.statusCode = response.statusCode;
    return apiLog;
  }

  public static getApiLogFromRequest(request: Request): ApiLog {
    const apiLog = new ApiLog();
    apiLog.method = request.method;
    apiLog.url = request.url;
    apiLog.ip = request.ip;
    apiLog.requestId = request.header(CONSTANTS.HEADERS.X_REQUEST_ID);
    apiLog.host = request.hostname;
    return apiLog;
  }

  public static getRequestLog(requestData: ApiLog): string {
    let log = '\n=========================== REQUEST BEGIN ================================================';
    log += '\nMethod=[' + requestData.method + ' - ' + requestData.url + ']';
    log += '\nHeaders=[' + requestData.headers + ']';
    log += '\nRequestPayload=[' + requestData.body + ']';
    log += '\n============================= REQUEST END =================================================';
    return log;
  }

  public static getResponseLog(responseData: ApiLog): string {
    let log = '\n=========================== RESPONSE BEGIN ================================================';
    log += '\nStatusCode=[' + responseData.statusCode + ']';
    log += '\nMethod=[' + responseData.method + ' - ' + responseData.url + ']';

    if (responseData.responseTime) {
      log += '\nResponseTime=[' + responseData.responseTime + ' Milliseconds]';
    }

    log += '\nResponseBody=[' + responseData.body + ']';
    log += '\n============================= RESPONSE END =================================================';
    return log;
  }

  public static isEasypaisaRequest(request: Request): boolean {
    return request.url.includes('easypaisa/BillInquiry') || request.url.includes('easypaisa/BillPayment');
  }

  /**
   * masks Easypaisa's username and password in-place
   * @param requestData
   */
  public static maskEasypaisaCredentials(requestData: ApiLog): void {
    const requestBody = JSON.parse(requestData.body);
    const { username, password } = requestBody;

    if (username) {
      requestBody.username = '*'.repeat(8);
    }
    if (password) {
      requestBody.password = '*'.repeat(8);
    }

    requestData.body = JSON.stringify(requestBody);
  }

  /**
   * masks if authorization token exists in headers by mutating the passed object
   * @param requestData
   */
  public static maskHeadersAuthorizationTokenIfExists(requestData: ApiLog): void {
    const requestHeaders = JSON.parse(requestData.headers);
    if (requestHeaders?.authorization) {
      requestHeaders.authorization = '*'.repeat(8);
      requestData.headers = JSON.stringify(requestHeaders);
    }
  }

  public static maskParamsAuthorizationTokenIfExists(data: string): string {
    if (data && data.includes('authorization')) {
      const tokenStartIndex = data.indexOf('authorization":"') + 'authorization":"'.length;
      const tokenEndIndex = data.substring(tokenStartIndex).indexOf('"');
      const token = '*'.repeat(8);
      return data.substring(0, tokenStartIndex) + token + data.substring(tokenStartIndex + tokenEndIndex);
    }
    return data;
  }
}
