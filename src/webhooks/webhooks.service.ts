import { Injectable } from '@nestjs/common';
import { ConfigService } from '@/config/config.service.js';
import { AppException, ERROR_CODE } from '@/exceptions.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { DnumService } from '@/dnum/dnum.service.js';
import { OffreUE, UeSyncStats } from '@/webhooks/interfaces/eu.interface.js';

@Injectable()
export class WebhooksService {
  constructor(
    readonly prisma: PrismaService,
    readonly config: ConfigService,
    readonly dnumService: DnumService,
  ) {}

  async syncUesFromDnumAPI(): Promise<UeSyncStats> {
    const stats: UeSyncStats = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    let token: string;
    try {
      token = await this.dnumService.login();
    } catch (error) {
      throw this.syncException(error);
    }

    let next: string | null = this.config.API_DNUM_UES_URL;
    do {
      let ues: OffreUE[];
      let nextPage: string | null;
      try {
        const page = await this.dnumService.getUes(token, next);
        ues = page.ues;
        nextPage = page.next;
      } catch (error) {
        throw this.syncException(error);
      }

      let existingCodes: Set<string>;
      try {
        const existingUes = await this.prisma.ueof.findMany({
          where: { code: { in: ues.map((ue) => ue.ue) } },
          select: { code: true },
        });
        existingCodes = new Set(existingUes.map((ue) => ue.code));
      } catch (error) {
        throw this.syncException(error);
      }

      const results = await Promise.allSettled(ues.map((ue) => this.upsertUe(ue)));
      results.forEach((result, index) => {
        const ueCode = ues[index].ue;
        if (result.status === 'fulfilled') {
          if (existingCodes.has(ueCode)) stats.updated++;
          else stats.created++;
        } else {
          this.addError(stats, ueCode, result.reason);
        }
      });

      next = nextPage;
    } while (next);

    return stats;
  }

  private addError(stats: UeSyncStats, ueCode: string | null, error: unknown): void {
    stats.errors.push({
      ueCode,
      message: error instanceof Error ? error.message : String(error),
    });
    stats.failed++;
  }

  private syncException(error: unknown): AppException<ERROR_CODE.WEBHOOK_SYNC_UE_FAILED> {
    const message = error instanceof Error ? error.message : String(error);
    return new AppException(ERROR_CODE.WEBHOOK_SYNC_UE_FAILED, message);
  }

  private async upsertUe(ue: OffreUE): Promise<void> {
    const ueCode = ue.ue.split('_')[0];

    if (!ueCode || ueCode.length > 8 || ue.ue.length > 20) {
      throw new Error(`Invalid UE code received from DNUM: ${ue.ue}`);
    }

    const workTime = {
      cm: this.parseHours(ue.volume_horaire_cm),
      td: this.parseHours(ue.volume_horaire_td),
      tp: this.parseHours(ue.volume_horaire_tp),
      the: this.parseHours(ue.volume_horaire_the),
    };

    await this.prisma.ueof.upsert({
      where: { code: ue.ue },
      create: {
        code: ue.ue,
        siepId: ue.id,
        available: true,
        ue: {
          connectOrCreate: {
            where: { code: ueCode },
            create: { code: ueCode },
          },
        },
        name: {
          create: {
            fr: ue.libelle,
            en: ue.libelle_en,
          },
        },
        info: {
          create: {
            language: ue.langue_enseignement,
            minors: ue.mineurs,
            objectives: {
              create: {
                fr: ue.objectifs,
                en: ue.objectifs_en,
              },
            },
            program: {
              create: {
                fr: ue.description,
                en: ue.description_en,
              },
            },
          },
        },
        workTime: { create: workTime },
      },
      update: {
        siepId: ue.id,
        available: true,
        name: {
          update: {
            fr: ue.libelle,
            en: ue.libelle_en,
          },
        },
        info: {
          update: {
            language: ue.langue_enseignement,
            minors: ue.mineurs,
            objectives: {
              update: {
                fr: ue.objectifs,
                en: ue.objectifs_en,
              },
            },
            program: {
              update: {
                fr: ue.description,
                en: ue.description_en,
              },
            },
          },
        },
        workTime: {
          upsert: {
            create: workTime,
            update: workTime,
          },
        },
      },
    });
  }

  private parseHours(value: string): number | null {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }
}
