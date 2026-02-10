import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Language } from '@prisma/client';

/**
 * Get the language for which the request was made.
 * @returns The language (fr, en, es, de, zh).
 *
 * @example
 * ```typescript
 * public async getLinks(@GetLanguage() language: Language) {
 *   ...
 * }
 * ```
 */
export const GetLanguage = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.headers['x-language'] as Language;
});
