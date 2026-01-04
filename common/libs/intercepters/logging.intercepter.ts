import {
  Logger,
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';
import { tap, catchError, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const time = Date.now() - start;
        this.logger.log(`${method} ${url} ${response.statusCode} - ${time}ms`);
      }),
      catchError((err) => {
        const time = Date.now() - start;
        const statusCode = err?.status ?? response.statusCode ?? 500;

        this.logger.error(
          `${method} ${url} ${statusCode} - ${time}ms - Error: ${err.message}`,
          err.stack,
        );
        return throwError(() => err);
      }),
    );
  }
}
