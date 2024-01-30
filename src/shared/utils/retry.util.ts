import { HttpStatus } from '@nestjs/common';
import { Observable, throwError, timer, retry, timeout } from 'rxjs';

export const genericRetryStrategy =
  ({
    maxRetryAttempts = 3,
    timeoutDuration = 30 * 1000,
    excludedStatusCodes = [HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND],
  }: {
    maxRetryAttempts?: number;
    timeoutDuration?: number;
    excludedStatusCodes?: number[];
  } = {}) =>
  (obs: Observable<any>) => {
    return obs.pipe(
      timeout(timeoutDuration),
      retry({
        count: maxRetryAttempts,
        // backoff starting at 2 seconds, exponentially up to 1 minute.
        // retryCount starts a 1.
        delay: (err, retryCount) => {
          // if (err instanceof TimeoutError) return throwError(() => err); // throw timeout error as it is
          if (excludedStatusCodes.find(e => e === err.response?.status)) {
            return throwError(() => err);
          }
          const delay = Math.min(60000, 1000 * 2 ** retryCount);
          console.log(`Attempt ${retryCount}: retrying in ${delay}ms`);
          return timer(delay);
        },
      })
    );
    // return attempts.pipe(
    //   mergeMap((error, i) => {
    //     const retryAttempt = i + 1;
    //     // if maximum number of retries have been met
    //     // or response is a status code we don't wish to retry, throw error
    //     if (error instanceof TimeoutError) return throwError(() => error); // throw timeout error as it is
    //     if (retryAttempt > maxRetryAttempts || excludedStatusCodes.find(e => e === error.code)) {
    //       return throwError(() => new Error(error));
    //     }
    //     console.log(`Attempt ${retryAttempt}: retrying in ${retryAttempt * scalingDuration}ms`);
    //     // retry after 1s, 2s, etc...
    //     return timer(retryAttempt * scalingDuration);
    //   }),
    //   finalize(() => console.log('Retrying complete!')) // will execute on completion
    // );
  };
