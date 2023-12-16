import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { DMMF } from '@prisma/client/runtime/library';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
  }

  /**
   * Clears entirely the database.
   */
  async cleanDb() {
    // We can't delete each table one by one, because of foreign key constraints
    const tablesCleared = [] as string[];
    // _runtimeDataModel.models basically contains a JS-ified version of the schema.prisma
    for (const modelName of Object.keys((this as any)._runtimeDataModel.models)) {
      // Check the table hasn't been already cleaned
      if (tablesCleared.includes(modelName)) continue;
      await this.clearTableWithCascade(modelName, tablesCleared);
    }
  }

  private async clearTableWithCascade(modelName: string, tablesCleared: string[]) {
    // No, the full type of the model is not even exported :(
    // (type RuntimeDataModel in prisma/client/runtime/library)
    const model: Omit<DMMF.Model, 'name'> = (this as any)._runtimeDataModel.models[modelName];
    for (const field of Object.values(model.fields)) {
      // First, check that the field is a relation, and not a normal String, or Int, or any normal SQL type
      // We then check that this is not a self-referencing relation, to avoid infinite loops
      // The way we verify that this is not the part of the relation that is referenced is by checking the length of relationFromFields : if it has a length, the table contains the FK, if not, that's the other table
      // Plot twist : Prisma allows for ManyToMany relations. That means that, to avoid infinitely looping, we verify the other relation in the opposite direction (with the same name) holds the FK
      if (
        field.kind === 'object' &&
        field.type !== modelName &&
        field.relationFromFields.length === 0 &&
        !tablesCleared.includes(field.type) &&
        (this as any)._runtimeDataModel.models[field.type].fields.find(
          (f: DMMF.Field) => f.relationName === field.relationName,
        ).relationFromFields.length !== 0
      ) {
        // After all these checks, simply delete rows from the other table first to avoid foreign key constraint errors
        await this.clearTableWithCascade(field.type, tablesCleared);
      }
    }
    // And finally, once it's safe to do it, delete the rows, and mark it as cleared
    await this[modelName].deleteMany();
    tablesCleared.push(modelName);
  }
}
