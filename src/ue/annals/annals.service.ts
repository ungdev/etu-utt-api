import { Injectable } from '@nestjs/common';
import { createWriteStream, createReadStream } from 'fs';
import { writeFile } from 'fs/promises';
import sharp from 'sharp';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';
import { MulterWithMime } from '../../upload.interceptor';
import { CreateAnnalReqDto } from './dto/req/create-annal-req.dto';
import { UpdateAnnalReqDto } from './dto/req/update-annal-req.dto';
import { ConfigModule } from '../../config/config.module';
import { User } from '../../users/interfaces/user.interface';
import { Semester } from '@prisma/client';

@Injectable()
export class AnnalsService {
  constructor(
    readonly prisma: PrismaService,
    readonly config: ConfigModule,
  ) {}

  async getUeAnnalMetadata(user: User, ueCode: string, isModerator: boolean) {
    const ueof = await this.prisma.ueof.findMany({
      where: {
        ueId: ueCode,
        available: true,
      },
      include: {
        openSemester: true,
      },
    });
    const semesters = !isModerator
      ? (
          await this.prisma.userUeSubscription.findMany({
            where: {
              userId: user.id,
              ueof: {
                ueId: ueCode,
              },
            },
          })
        ).map((subscription) => subscription.semesterId)
      : [...ueof.reduce((prev, nxt) => new Set([...prev, ...nxt.openSemester]), new Set<Semester>())].map(
          (semester) => semester.code,
        );
    const annalType = await this.prisma.ueAnnalType.findMany();
    return {
      types: annalType,
      semesters,
    };
  }

  async doesAnnalTypeExist(typeId: string) {
    return (
      (await this.prisma.ueAnnalType.count({
        where: {
          id: typeId,
        },
      })) > 0
    );
  }

  async createAnnalFile(user: User, params: CreateAnnalReqDto) {
    const subscription = await this.prisma.userUeSubscription.findFirst({
      where: {
        semesterId: params.semester,
        userId: user.id,
        ueof: {
          ueId: params.ueCode,
        },
      },
    });
    // Create upload/file entry
    return this.prisma.ueAnnal.create({
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
        ueof: {
          connect: {
            code: subscription.ueofCode ?? params.ueof,
          },
        },
      },
    });
  }

  async uploadAnnalFile(file: MulterWithMime, fileEntryId: string, rotation: 0 | 1 | 2 | 3) {
    const dbFilter = {
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
    };
    const fileEntry = await this.prisma.ueAnnal.findUnique(dbFilter);
    // We won't wait for the file to be processed to send the response.
    // Files do not need to be processed instantly and will only be displayed to all users when processed
    const promise = (async () => {
      // Create callback when file is uploaded
      const registerUploadComplete = () =>
        this.prisma.ueAnnal.update({
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
        file.multer.buffer = await sharp(file.multer.buffer).png().toBuffer();
        file.mime = 'image/png';
      }
      // It is always more enjoyable for a user to have all files in the same format
      // The file format chosen is PDF as it can include original exam files, keeping them clean
      // Our library pdfkit only supports PNG and JPEG images
      if (file.mime === 'image/png' || file.mime === 'image/jpeg') {
        const metadata = await sharp(file.multer.buffer).metadata();
        const size = [metadata.width, metadata.height];
        if (rotation) {
          // Rotate the picture if asked by the user
          file.multer.buffer = await sharp(file.multer.buffer)
            .rotate(rotation * 90)
            .toBuffer();
          size.reverse();
        }

        // Create the PDF document
        const pdf = new PDFDocument({
          margin: 0,
          size,
          compress: true,
          info: {
            Title: `${fileEntry.type.name} ${fileEntry.ueof.code} - ${fileEntry.semesterId}`,
            Creator: 'EtuUTT',
            Producer: 'EtuUTT',
          },
        });
        pdf.image(file.multer.buffer, 0, 0);
        // Write document
        pdf.pipe(createWriteStream(`${this.config.ANNAL_UPLOAD_DIR}/${fileEntry.id}.pdf`));
        pdf.end();
        // Register processing as complete
        await registerUploadComplete();
      }
      if (file.mime === 'application/pdf') {
        // Write document
        await writeFile(`${this.config.ANNAL_UPLOAD_DIR}/${fileEntry.id}.pdf`, file.multer.buffer);
        // Register processing as complete
        await registerUploadComplete();
      }
    })().catch(async () => {
      // Delete file if an error occured
      // TODO: send notification to the uploader
      this.prisma.ueAnnal.delete({
        where: {
          id: fileEntry.id,
        },
      });
    });
    // Jest cannot run async code
    if (process.env.NODE_ENV === 'test') await promise;
    return fileEntry;
  }

  async getUeAnnalsList(user: User, ueCode: string, includeAll: boolean) {
    return (
      await this.prisma.ueAnnal.findMany({
        where: {
          ueof: {
            ue: {
              code: ueCode,
            },
          },
          deletedAt: includeAll ? undefined : null,
          ...(includeAll
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
      })
    ).mappedSort((annal) => [
      annal.semesterId.slice(1),
      annal.semesterId.slice(0, 1) === 'A' ? 1 : 0, // P should be listed before A
      annal.type.name,
      annal.createdAt.getTime(),
    ]);
  }

  async isAnnalAccessible(userId: string, annalId: string, includeAll: boolean) {
    return (
      (await this.prisma.ueAnnal.count({
        where: {
          id: annalId,
          deletedAt: includeAll ? undefined : null,
          ...(includeAll
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
                      id: userId,
                    },
                  },
                ],
              }),
        },
      })) === 1
    );
  }

  async getUeAnnal(annalId: string, userId: string, includeAll: boolean) {
    return this.prisma.ueAnnal.findUnique({
      where: {
        id: annalId,
        deletedAt: includeAll ? undefined : null,
        ...(includeAll
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
                    id: userId,
                  },
                },
              ],
            }),
      },
    });
  }

  async getUeAnnalFile(annalId: string, userId: string, includeAll: boolean) {
    const metadata = await this.prisma.ueAnnal.findUnique({
      where: {
        id: annalId,
        deletedAt: includeAll ? undefined : null,
        ...(includeAll
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
                    id: userId,
                  },
                },
              ],
            }),
      },
    });
    if (!metadata) return null;
    return {
      metadata,
      stream: createReadStream(`${this.config.ANNAL_UPLOAD_DIR}/${metadata.id}.pdf`),
    };
  }

  async isUeAnnalSender(userId: string, annalId: string) {
    return (
      (await this.prisma.ueAnnal.count({
        where: {
          id: annalId,
          senderId: userId,
        },
      })) === 1
    );
  }

  async updateAnnalMetadata(annalId: string, metadata: UpdateAnnalReqDto) {
    return this.prisma.ueAnnal.update({
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
    });
  }

  async deleteAnnal(annalId: string) {
    return this.prisma.ueAnnal.update({
      where: {
        id: annalId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
