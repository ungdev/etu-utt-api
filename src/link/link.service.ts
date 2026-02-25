import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Translation } from '../prisma/types';
import { Link } from './link.interface';

@Injectable()
export class LinkService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all links in the database.
   */
  public getLinks(): Promise<Link[]> {
    return this.prisma.normalize.link.findMany({});
  }

  /**
   * Checks if there is a link with a given id in the database.
   * @param id Id to search.
   */
  public async idExists(id: string): Promise<boolean> {
    return (await this.prisma.link.count({ where: { id } })) > 0;
  }

  /**
   * Checks if an hyperlink exists in the database.
   * @param hyperlink Hyperlink to search.
   */
  public async hyperlinkExists(hyperlink: string): Promise<boolean> {
    return (await this.prisma.link.count({ where: { hyperlink } })) > 0;
  }

  /**
   * Creates a new link in the database.
   * @param name Name of the new link.
   * @param tooltip Small description of the new link.
   * @param hyperlink Hyperlink of the new link.
   * @returns The new link.
   */
  public create(name: Translation, tooltip: Translation, hyperlink: string): Promise<Link> {
    return this.prisma.normalize.link.create({ data: { name: {create: name}, tooltip: {create: tooltip}, hyperlink } })
  }

  /**
   * Updates an existing link.
   * @param id Id of the link to modify.
   * @param name Name of the link to modify, or undefined if that shouldn't be modified.
   * @param tooltip New tooltip of the link, or undefined if that shouldn't be modified.
   * @param hyperlink New hyperlink of the link, or undefined if that shouldn't be modified.
   * @returns The updated link.
   */
  public update(id: string, { name, tooltip, hyperlink }: { name?: Translation, tooltip?: Translation, hyperlink?: string }): Promise<Link> {
    return this.prisma.normalize.link.update({ where: { id }, data: { name: {create: name}, tooltip: {create: tooltip}, hyperlink } });
  }
}