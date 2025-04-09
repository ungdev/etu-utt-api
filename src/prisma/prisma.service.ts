import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigModule } from '../config/config.module';
import { generateCustomUserModel } from '../users/interfaces/user.interface';
import { omit } from '../utils';
import { generateCustomCommentModel } from '../ue/comments/interfaces/comment.interface';
import { generateCustomCriterionModel } from '../ue/interfaces/criterion.interface';
import { generateCustomRateModel } from '../ue/interfaces/rate.interface';
import { generateCustomUeModel } from '../ue/interfaces/ue.interface';
import { generateCustomUeAnnalModel } from '../ue/annals/interfaces/annal.interface';
import { generateCustomUeCommentReplyModel } from '../ue/comments/interfaces/comment-reply.interface';
import { generateCustomAssoModel } from '../assos/interfaces/asso.interface';
import { generateCustomCreditCategoryModel } from '../ue/credit/interfaces/credit-category.interface';
import { generateCustomApplicationModel } from '../auth/application/interfaces/application.interface';

@Injectable()
export class PrismaService extends PrismaClient<ReturnType<typeof prismaOptions>> {
  readonly normalize: ReturnType<typeof createNormalizedEntitiesUtility>;

  constructor(config: ConfigModule) {
    super(prismaOptions(config));
    this.normalize = createNormalizedEntitiesUtility(this);
  }
}

const prismaOptions = (config: ConfigModule) => ({
  datasources: {
    db: {
      url: config.DATABASE_URL,
    },
  },
});

/**
 * @typedef {import('@prisma/client').Prisma.UserDelegate} UserDelegate
 */

function createNormalizedEntitiesUtility(prisma: PrismaClient) {
  return {
    /**
     * @type {UserDelegate['findMany']}
     */
    user: generateCustomUserModel(prisma),
    ueComment: generateCustomCommentModel(prisma),
    ueStarCriterion: generateCustomCriterionModel(prisma),
    ueCommentReply: generateCustomUeCommentReplyModel(prisma),
    ueStarVote: generateCustomRateModel(prisma),
    ue: generateCustomUeModel(prisma),
    ueAnnal: generateCustomUeAnnalModel(prisma),
    asso: generateCustomAssoModel(prisma),
    ueCreditCategory: generateCustomCreditCategoryModel(prisma),
    apiApplication: generateCustomApplicationModel(prisma),
  };
}

// UTILITIES TO GENERATE CUSTOM MODEL FUNCTIONS
type MayBePromise<T> = T | Promise<T>;
type ModelNameType = keyof PrismaClient;
type FunctionNameType<ModelName extends ModelNameType> = {
  [K in keyof PrismaClient[ModelName]]: PrismaClient[ModelName][K] extends (arg: any) => void ? K : never;
}[Exclude<keyof PrismaClient[ModelName], 'groupBy'>]; // Don't ask why, but groupBy produces a circular dependency. Anyway, this function seems mostly useless.
export type RequestType<
  ModelName extends ModelNameType,
  FunctionName extends FunctionNameType<ModelName> = FunctionNameType<ModelName>,
> = PrismaClient[ModelName][FunctionName] extends (arg: infer P extends object) => void ? P : never;
export type UserFriendlyRequestType<
  ModelName extends ModelNameType,
  FunctionName extends FunctionNameType<ModelName>,
  CustomArgs extends object,
> = Omit<RequestType<ModelName, FunctionName>, 'select' | 'include' | 'orderBy'> &
  (Record<string, never> extends CustomArgs ? { args?: never } : { args: CustomArgs });
export type Formatter<RawEntity, FormattedEntity, QueryArgs extends object> = (
  prisma: PrismaClient,
  raw: RawEntity,
  args: QueryArgs,
) => MayBePromise<FormattedEntity>;

function generateCustomModelFunction<
  ModelName extends ModelNameType,
  FunctionName extends FunctionNameType<ModelName>,
  Raw,
  Formatted extends Awaited<any>,
  QueryArgs extends object,
>(
  prisma: PrismaClient,
  modelName: ModelName,
  functionName: FunctionName,
  selectFilter: Partial<RequestType<ModelName, FunctionName>>,
  format: Formatter<Raw, Formatted, QueryArgs>,
  queryUpdater: (
    query: RequestType<ModelName, FunctionName>,
    args: QueryArgs,
  ) => MayBePromise<RequestType<ModelName, FunctionName>>,
): (params: UserFriendlyRequestType<ModelName, FunctionName, QueryArgs>) => Promise<Formatted> {
  return async (args) => {
    const res = await (prisma[modelName][functionName] as (arg: RequestType<ModelName, FunctionName>) => Raw)(
      await queryUpdater(
        {
          ...omit(args, 'args'),
          ...selectFilter,
        } as RequestType<ModelName, FunctionName>,
        args.args,
      ),
    );
    return res ? format(prisma, res, args.args) : (res as null);
  };
}

const singleValueMethods = ['findUnique', 'update', 'findFirst', 'create', 'delete', 'upsert'] as const;
const multiValueMethods = ['findMany'] as const;

export function generateCustomModel<
  ModelName extends ModelNameType,
  Raw,
  Formatted,
  QueryArgs extends Record<string, any>,
>(
  prisma: PrismaClient,
  modelName: ModelName,
  selectFilter: Partial<RequestType<ModelName, FunctionNameType<ModelName>>>,
  format: Formatter<Raw, Formatted, QueryArgs>,
  queryUpdater: (
    query: RequestType<ModelName, FunctionNameType<ModelName>>,
    args: QueryArgs,
  ) => MayBePromise<RequestType<ModelName, FunctionNameType<ModelName>>> = (query) => query,
) {
  const customModel: {
    [K in (typeof singleValueMethods)[number]]?: (
      arg: UserFriendlyRequestType<ModelName, FunctionNameType<ModelName> & K, QueryArgs>,
    ) => Promise<Formatted>;
  } & {
    [K in (typeof multiValueMethods)[number]]?: (
      arg: UserFriendlyRequestType<ModelName, FunctionNameType<ModelName> & K, QueryArgs>,
    ) => Promise<Formatted[]>;
  } = {};
  for (const functionName of singleValueMethods) {
    customModel[functionName] = generateCustomModelFunction(
      prisma,
      modelName,
      functionName as FunctionNameType<ModelName>,
      omit(selectFilter, 'orderBy' as keyof typeof selectFilter) as Partial<
        RequestType<ModelName, FunctionNameType<ModelName>>
      >,
      format,
      queryUpdater,
    );
  }
  for (const functionName of multiValueMethods) {
    customModel[functionName] = generateCustomModelFunction(
      prisma,
      modelName,
      functionName as FunctionNameType<ModelName>,
      selectFilter,
      (prisma, values: Raw[], args: QueryArgs) => Promise.all(values.map((value) => format(prisma, value, args))),
      queryUpdater,
    );
  }
  return customModel as Required<typeof customModel>;
}
