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
   * @param public If non-connected people can access the link it.
   * @param position 0-based position of the link.
   * @returns The new link.
   */
  public async create(name: Translation, tooltip: Translation, hyperlink: string, public_: boolean, position = undefined): Promise<Link> {
    const linkCount = await this.count();
    if (position === undefined || position > linkCount) {
      position = linkCount;
    } else {
      await this.prisma.link.updateMany({ where: { position: { gte: position } }, data: { position: { increment: 1 } } });
    }
    return this.prisma.normalize.link.create({ data: { position: position, name: { create: name }, tooltip: { create: tooltip }, hyperlink, public: public_ } })
  }

  /**
   * Updates an existing link.
   * @param id Id of the link to modify.
   * @param name Name of the link to modify, or undefined if that shouldn't be modified.
   * @param tooltip New tooltip of the link, or undefined if that shouldn't be modified.
   * @param hyperlink New hyperlink of the link, or undefined if that shouldn't be modified.
   * @param position 0-based position of the link.
   * @param public_ If the link is visible for not-connected users.
   * @returns The updated link.
   */
  public async update(id: string, { name, tooltip, hyperlink, position, public_ }: { name?: Translation, tooltip?: Translation, hyperlink?: string, position?: number, public_?: boolean }): Promise<Link> {
    if (position !== undefined) {
      await this.prisma.link.updateMany({ where: { position: { gte: position } }, data: { position: { increment: 1 } } });
    }
    return this.prisma.normalize.link.update({ where: { id }, data: { name: { create: name }, tooltip: { create: tooltip }, hyperlink, position, public: public_ } });
  }

  /**
   * Deletes a link. All links after this one (with a greater position) will see their position decrease by 1.
   * @param id Id of the link to delete.
   */
  public async delete(id: string): Promise<Link> {
    const link = await this.prisma.normalize.link.delete({ where: { id } });
    await this.prisma.link.updateMany({ where: { position: { gt: link.position } }, data: { position: { decrement: 1 } } });
    return link;
  }

  public count(): Promise<number> {
    return this.prisma.link.count();
  }
}