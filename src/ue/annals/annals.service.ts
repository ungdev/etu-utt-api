import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { createWriteStream, createReadStream } from 'fs';
import { writeFile } from 'fs/promises';
import sharp from 'sharp';
import { PrismaService } from '../../prisma/prisma.service';
import { MulterWithMime } from '../../upload.interceptor';
import { CreateAnnal } from './dto/create-annal.dto';
import { UpdateAnnal } from './dto/update-annal.dto';
import { SelectUEAnnalFile, FormatAnnal } from './interfaces/annal.interface';
import { ConfigModule } from '../../config/config.module';

@Injectable()
export class AnnalsService {
  constructor(readonly prisma: PrismaService, readonly config: ConfigModule) {}

  async getUEAnnalMetadata(user: User, ueCode: string, isModerator: boolean) {
    const ue = await this.prisma.uE.findUnique({
      where: {
        code: ueCode,
      },
      include: {
        openSemester: true,
      },
    });
    const semesters = !isModerator
      ? (
          await this.prisma.userUESubscription.findMany({
            where: {
              userId: user.id,
              ueId: ue.id,
            },
          })
        ).map((subscription) => subscription.semesterId)
      : ue.openSemester.map((semester) => semester.code);
    const annalType = await this.prisma.uEAnnalType.findMany();
    return {
      types: annalType,
      semesters,
    };
  }

  async createAnnalFile(user: User, params: CreateAnnal) {
    // Create upload/file entry
    return this.prisma.uEAnnal
      .create(
        SelectUEAnnalFile({
          data: {
            type: {
              connect: {
                id: params.typeId,
              },
            },
            semester: {
              connect: {
                code: params.semester,
              },
            },
            sender: {
              connect: {
                id: user.id,
              },
            },
            ue: {
              connect: {
                code: params.ueCode,
              },
            },
          },
        }),
      )
      .then(FormatAnnal);
  }

  async uploadAnnalFile(file: MulterWithMime, fileEntryId: string, rotation: -1 | 1 | 0) {
    const dbFilter = SelectUEAnnalFile({
      where: {
        id: fileEntryId,
      },
      select: {
        ue: {
          select: {
            code: true,
          },
        },
      },
    });
    dbFilter.select.ue = { select: { code: true } };
    const fileEntry = await this.prisma.uEAnnal.findUnique(dbFilter);
    let rootDirectory = this.config.ANNAL_UPLOAD_DIR;
    if (rootDirectory.endsWith('/')) rootDirectory = rootDirectory.slice(0, -1);
    // We won't wait for the file to be processed to send the response.
    // Files do not need to be processed instantly and will only be displayed to all users when processed
    const promise = (async () => {
      // Create callback when file is uploaded
      const registerUploadComplete = () =>
        this.prisma.uEAnnal.update({
          where: {
            id: fileEntry.id,
          },
          data: {
            uploadComplete: true,
          },
        });
      // Add support for WebP, AVIF and TIFF
      // We convert the picture to PNG in order to be able to add it in the pdf
      if (file.mime === 'image/webp' || file.mime === 'image/avif' || file.mime === 'image/tiff') {
        const sharp = await import('sharp');
        file.multer.buffer = (await (sharp as any)(file.multer.buffer).png().toBuffer()) as Buffer;
        file.mime = 'image/png';
      }
      // It is always more enjoyable for a user to have all files in the same format
      // The file format chosen is PDF as it can include original exam files, keeping them clean
      // Our library pdfkit only supports PNG and JPEG images
      if (file.mime === 'image/png' || file.mime === 'image/jpeg') {
        const sharp = await import('sharp');
        const metadata = (await (sharp as any)(file.multer.buffer).metadata()) as sharp.Metadata;
        const size = [metadata.width, metadata.height];
        if (rotation) {
          // Rotate the picture if asked by the user
          file.multer.buffer = await ((sharp as any)(file.multer.buffer) as sharp.Sharp)
            .rotate(rotation * 90)
            .toBuffer();
          size.reverse();
        }

        const PDFDocument = (await import('pdfkit')) as unknown as PDFKit.PDFDocument;
        // Create the PDF document
        const pdf = new PDFDocument({
          margin: 0,
          size,
          compress: true,
          info: {
            Title: `${fileEntry.type.name} ${fileEntry.ue.code} - ${fileEntry.semesterId}`,
            Creator: 'EtuUTT',
            Producer: 'EtuUTT',
          },
        });
        pdf.image(file.multer.buffer, 0, 0);
        // Write document
        pdf.pipe(createWriteStream(`${rootDirectory}/${fileEntry.id}.pdf`));
        pdf.end();
        // Register processing as complete
        await registerUploadComplete();
      }
      if (file.mime === 'application/pdf') {
        // Write document
        await writeFile(`${rootDirectory}/${fileEntry.id}.pdf`, file.multer.buffer);
        // Register processing as complete
        await registerUploadComplete();
      }
    })().catch(async () => {
      // Delete file if an error occured
      // TODO: send notification to the uploader
      this.prisma.uEAnnal.delete({
        where: {
          id: fileEntry.id,
        },
      });
    });
    // Jest cannot run async code
    if (process.env.NODE_ENV === 'test') await promise;
    return FormatAnnal(fileEntry);
  }

  async getUEAnnalsList(user: User, ueCode: string, isModerator: boolean) {
    return (
      await this.prisma.uEAnnal.findMany(
        SelectUEAnnalFile({
          where: {
            ue: {
              code: ueCode,
            },
            deletedAt: isModerator ? undefined : null,
            ...(isModerator
              ? {}
              : {
                  OR: [
                    {
                      uploadComplete: true,
                      validatedAt: {
                        not: null,
                      },
                      reports: {
                        none: {
                          mitigated: false,
                        },
                      },
                    },
                    {
                      sender: {
                        id: user.id,
                      },
                    },
                  ],
                }),
          },
        }),
      )
    )
      .map(FormatAnnal)
      .sort((annal1, annal2) => {
        const difference = Number(annal2.semesterId.slice(1)) - Number(annal1.semesterId.slice(1));
        if (difference != 0) return difference;
        if (annal1.semesterId.slice(0, 1) !== annal2.semesterId.slice(0, 1))
          return annal1.semesterId.slice(0, 1) === 'P' ? -1 : 1;
        const typeComparison = annal2.type.name.localeCompare(annal1.type.name);
        if (typeComparison) return typeComparison;
        return annal1.createdAt.getTime() - annal2.createdAt.getTime();
      });
  }

  async doesUEAnnalExist(userId: string, annalId: string, isModerator: boolean) {
    return (
      (await this.prisma.uEAnnal.count({
        where: {
          id: annalId,
          deletedAt: isModerator ? undefined : null,
          OR: [
            {
              uploadComplete: true,
              validatedAt: {
                not: null,
              },
              reports: {
                none: {
                  mitigated: false,
                },
              },
            },
            {
              sender: {
                id: isModerator ? undefined : userId,
              },
            },
          ],
        },
      })) === 1
    );
  }

  async getUEAnnal(annalId: string, userId: string, isModerator: boolean) {
    const rawAnnal = await this.prisma.uEAnnal.findUnique(
      SelectUEAnnalFile({
        where: {
          id: annalId,
          deletedAt: isModerator ? undefined : null,
          OR: [
            {
              uploadComplete: true,
              validatedAt: {
                not: null,
              },
              reports: {
                none: {
                  mitigated: false,
                },
              },
            },
            {
              sender: {
                id: isModerator ? undefined : userId,
              },
            },
          ],
        },
      }),
    );
    return FormatAnnal(rawAnnal);
  }

  async getUEAnnalFile(annalId: string, userId: string, isModerator: boolean) {
    const rawAnnal = await this.prisma.uEAnnal.findUnique(
      SelectUEAnnalFile({
        where: {
          id: annalId,
          deletedAt: isModerator ? undefined : null,
          OR: [
            {
              uploadComplete: true,
              validatedAt: {
                not: null,
              },
              reports: {
                none: {
                  mitigated: false,
                },
              },
            },
            {
              sender: {
                id: isModerator ? undefined : userId,
              },
            },
          ],
        },
      }),
    );
    if (!rawAnnal) return null;
    const metadata = FormatAnnal(rawAnnal);
    let rootDirectory = this.config.ANNAL_UPLOAD_DIR;
    if (rootDirectory.endsWith('/')) rootDirectory = rootDirectory.slice(0, -1);
    return {
      metadata,
      stream: createReadStream(`${rootDirectory}/${metadata.id}.pdf`),
    };
  }

  async isUEAnnalSender(userId: string, annalId: string) {
    return (
      (await this.prisma.uEAnnal.count({
        where: {
          id: annalId,
          senderId: userId,
        },
      })) === 1
    );
  }

  async updateAnnalMetadata(annalId: string, metadata: UpdateAnnal) {
    return FormatAnnal(
      await this.prisma.uEAnnal.update(
        SelectUEAnnalFile({
          where: {
            id: annalId,
          },
          data: {
            type: {
              connect: {
                id: metadata.typeId,
              },
            },
            semester: {
              connect: {
                code: metadata.semester,
              },
            },
          },
        }),
      ),
    );
  }

  async deleteAnnal(annalId: string) {
    return FormatAnnal(
      await this.prisma.uEAnnal.update(
        SelectUEAnnalFile({
          where: {
            id: annalId,
          },
          data: {
            deletedAt: new Date(),
          },
        }),
      ),
    );
  }
}
