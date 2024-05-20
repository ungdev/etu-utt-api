import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Request } from 'express';
import { Language } from '@prisma/client';
import { getTranslation } from "./utils";

@Injectable()
export class TranslationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const headerLanguage = context.switchToHttp().getRequest<Request>().header('language');
    const language = ['fr', 'en', 'de', 'es', 'zh'].includes(headerLanguage) ? (headerLanguage as Language) : 'fr';
    context.switchToHttp().getRequest<Request>().headers['language'] = language;
    return next.handle().pipe(map((item) => this.transform(item, language)));
  }

  transform(data: any, language: Language) {
    if (typeof data !== 'object' || data === null || data instanceof Date) {
      return data;
    }
    if (
      Object.keys(data).length === 5 &&
      ['fr', 'en', 'de', 'es', 'zh'].every((key) => Object.keys(data).includes(key))
    ) {
      return getTranslation(data, language);
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.transform(item, language));
    }
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, this.transform(value, language)]));
  }
}
