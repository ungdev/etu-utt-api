import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RawLink, Translation } from '../prisma/types';
import { Link } from './link.interface';

@Injectable()
export class LinkService {
  constructor(private readonly prisma: PrismaService) {}

  public getLinks(): Promise<Link[]> {
    return this.prisma.normalize.link.findMany({});
  }

  public async idExists(id: string): Promise<boolean> {
    return (await this.prisma.link.count({ where: { id } })) > 0;
  }

  public async linkExists(link: string): Promise<boolean> {
    return (await this.prisma.link.count({ where: { link } })) > 0;
  }

  public create(name: Translation, tooltip: Translation, link: string): Promise<Link> {
    return this.prisma.normalize.link.create({ data: { name: {create: name}, tooltip: {create: tooltip}, link } })
  }

  public update(id: string, { name, tooltip, link }: { name?: Translation, tooltip?: Translation, link?: string }): Promise<Link> {
    return this.prisma.normalize.link.update({ where: { id }, data: { name: {create: name}, tooltip: {create: tooltip}, link } });
  }
}