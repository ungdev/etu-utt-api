import { Injectable } from '@nestjs/common';
import { ConfigService } from '@/config/config.service.js';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { OffreUECollection, UesListWithNext } from '@/webhooks/interfaces/eu.interface.js';

@Injectable()
export class DnumService {
  constructor(
    readonly config: ConfigService,
    readonly httpService: HttpService,
  ) {}

  async login(): Promise<string> {
    const res = await lastValueFrom(
      this.httpService.get(this.config.API_DNUM_AUTH_URL, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        params: {
          login: this.config.API_DNUM_LOGIN,
          password: this.config.API_DNUM_PASSWORD,
        },
      }),
    );

    const resData: { token: string } = res.data;

    return resData.token;
  }

  async getUes(token: string, url: string = this.config.API_DNUM_UES_URL): Promise<UesListWithNext> {
    const res = await lastValueFrom(
      this.httpService.get(url, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }),
    );

    const resData: OffreUECollection = res.data;

    return {
      ues: resData.member,
      next: resData.view?.['hydra:next'] ?? null,
    };
  }
}
