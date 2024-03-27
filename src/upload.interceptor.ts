import { UploadedFile, UseInterceptors, ParseFilePipe, Injectable } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AppException, ERROR_CODE } from './exceptions';
import type { MimeType } from 'file-type';

export type MulterWithMime = {
  mime: MimeType;
  multer: Express.Multer.File;
};

/**
 * A pipe that validates the file type and size.
 * It uses magic numbers to check file type (instead of file extension).
 */
@Injectable()
class FileValidationPipe extends ParseFilePipe {
  #mimeTypes: string[];
  #maxSize: number;

  constructor(mimeTypes: string[], maxSize: number) {
    super({});
    this.#mimeTypes = mimeTypes;
    this.#maxSize = maxSize;
  }

  async transform(file: Express.Multer.File) {
    if (!file) throw new AppException(ERROR_CODE.NO_FILE_PROVIDED);
    if (this.#maxSize < file.size) throw new AppException(ERROR_CODE.FILE_TOO_HEAVY, `${this.#maxSize} bytes`);
    // Using dynamic import using a Function to avoid typescript
    // to turn it into a require statement. Indeed file-type is
    // an ecmascript module and cannot be loaded with a 'require'
    // function.
    const fileType = (await new Function("return import('file-type')")()) as typeof import('file-type');
    const fileTypeResult = await fileType.fileTypeFromBuffer(file.buffer);
    // Check file type using magic codes, also check local extension was correct.
    // The file is supposed to be renamed during upload but we check the extension to avoid a potential security issue.
    if (
      !fileTypeResult ||
      !this.#mimeTypes.includes(fileTypeResult.mime) ||
      !file.originalname.endsWith(`.${fileTypeResult.ext}`)
    )
      throw new AppException(ERROR_CODE.FILE_INVALID_TYPE, this.#mimeTypes.join(', '));
    return { mime: fileTypeResult.mime, multer: await super.transform(file) };
  }
}

export enum FileSize {
  Byte = 1,
  KiloByte = Byte * 1024,
  MegaByte = KiloByte * 1024,
}

/**
 * @example
 * Simple upload route
 * ```
 * @UploadRoute('file')
 * async upload(
 *   @UserFile(['application/pdf'], 8 * FileSize.MegaByte)
 *   file: Promise<MulterWithMime>,
 * ) {
 *   writeFileSync('test.pdf', (await file).multer.buffer);
 *   return { mimeType: (await file).mime };
 * }
 * ```
 *
 * To access uploaded files, a route as following can be used:
 * ```
 * @Get('test')
 * @Header('Content-Type', 'application/pdf')
 * @Header('Content-Disposition', 'attachment; filename=test.pdf')
 * async test() {
 *   const file = createReadStream('test.pdf');
 *   return new StreamableFile(file);
 * }
 * ```
 */
export const UploadRoute = (fieldName: string) =>
  UseInterceptors(
    FileInterceptor(fieldName, {
      storage: memoryStorage(),
    }),
  );

export const UserFile = (fileTypes: MimeType[], maxByteSize: number) =>
  UploadedFile(new FileValidationPipe(fileTypes, maxByteSize));
