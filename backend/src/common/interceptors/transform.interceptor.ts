import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  statusCode: number;
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((resData) => {
        // If the handler already returned an object with meta pagination, preserve it
        if (resData && typeof resData === 'object' && 'data' in resData && 'meta' in resData) {
          return {
            statusCode,
            data: resData.data,
            meta: resData.meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          statusCode,
          data: resData,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
