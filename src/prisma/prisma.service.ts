import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigModule } from '../config/config.module';
import { generateCustomUserModel } from '../users/interfaces/user.interface';
import { omit } from '../utils';
import { generateCustomCommentModel } from '../ue/comments/interfaces/comment.interface';
import { generateCustomCriterionModel } from '../ue/interfaces/criterion.interface';
import { generateCustomRateModel } from '../ue/interfaces/rate.interface';
import { generateCustomUEModel } from '../ue/interfaces/ue.interface';
import { generateCustomUEAnnalModel } from '../ue/annals/interfaces/annal.interface';
import { generateCustomUECommentReplyModel } from '../ue/comments/interfaces/comment-reply.interface';
import { generateCustomAssoModel } from '../assos/interfaces/asso.interface';
import {generateCustomCreditCategoryModel} from "../ue/credit/interfaces/credit-category.interface";

// This interface is used to tell typescript that, even tho it does not understand it, PrismaService IS actually a ReturnType<typeof createPrismaClientExtension>
// TS cannot infer it alone as the construction of the class is made using reflection.
// We can't use a type there, or else typescript will complain about the fact that PrismaService is defined twice.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PrismaService extends ReturnType<typeof createPrismaClientExtension> {}

@Injectable()
export class PrismaService implements ReturnType<typeof createPrismaClientExtension> {
  readonly withDefaultBehaviour: PrismaClient;
  constructor(config: ConfigModule) {
    this.withDefaultBehaviour = createPrismaClient(config);
    const prisma = createPrismaClientExtension(this.withDefaultBehaviour);
    return new Proxy(this, {
      // So, basically, every time a property will be accessed, this function will be called :
      // - target is equivalent to this
      // - prop is the name of the property
      // - receiver is something else, we don't need it here and I don't want to search the internet
      // What we do here is :
      // - try to return the property as normal. For example, if we do prismaService.withDefaultBehaviour, this will act as normal
      // - if we can't find a value for it, return the same value but for the prisma client.
      // That way, we are simulating an inheritance, but without actually doing one : the class that needs to be extended is generated in the constructor
      get(target, prop, receiver) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        return Reflect.get(prisma, prop, receiver);
      },
    });
  }
}

function createPrismaClient(config: ConfigModule) {
  return new PrismaClient({
    datasources: {
      db: {
        url: config.DATABASE_URL,
      },
    },
  });
}

function createPrismaClientExtension(prisma: ReturnType<typeof createPrismaClient>) {
  return prisma.$extends({
    model: {
      user: generateCustomUserModel(prisma),
      uEComment: generateCustomCommentModel(prisma),
      uEStarCriterion: generateCustomCriterionModel(prisma),
      uECommentReply: generateCustomUECommentReplyModel(prisma),
      uEStarVote: generateCustomRateModel(prisma),
      uE: generateCustomUEModel(prisma),
      uEAnnal: generateCustomUEAnnalModel(prisma),
      asso: generateCustomAssoModel(prisma),
      uECreditCategory: generateCustomCreditCategoryModel(prisma),
    },
  });
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
export type Formatter<RawEntity, FormattedEntity, FormatterArgs extends any[]> = (
  prisma: ReturnType<typeof createPrismaClient>,
  raw: RawEntity,
  ...args: FormatterArgs
) => MayBePromise<FormattedEntity>;

function generateCustomModelFunction<
  ModelName extends ModelNameType,
  FunctionName extends FunctionNameType<ModelName>,
  Raw,
  Formatted extends Awaited<any>,
  FormatterArgs extends any[],
  QueryArgs extends object,
>(
  prisma: PrismaClient,
  modelName: ModelName,
  functionName: FunctionName,
  selectFilter: Partial<RequestType<ModelName, FunctionName>>,
  format: Formatter<Raw, Formatted, FormatterArgs>,
  queryUpdater: (
    query: RequestType<ModelName, FunctionName>,
    args: QueryArgs,
  ) => MayBePromise<RequestType<ModelName, FunctionName>>,
): (params: UserFriendlyRequestType<ModelName, FunctionName, QueryArgs>, ...args: FormatterArgs) => Promise<Formatted> {
  return async (args, ...formatterArgs) => {
    const res = await (prisma[modelName][functionName] as (arg: RequestType<ModelName, FunctionName>) => Raw)(
      await queryUpdater(
        {
          ...omit(args, 'args'),
          ...selectFilter,
        } as RequestType<ModelName, FunctionName>,
        args.args,
      ),
    );
    return res ? format(prisma, res, ...formatterArgs) : (res as null);
  };
}

const singleValueMethods = ['findUnique', 'update', 'findFirst', 'create', 'delete', 'upsert'] as const;
const multiValueMethods = ['findMany'] as const;

export function generateCustomModel<
  ModelName extends ModelNameType,
  Raw,
  Formatted,
  FormatterArgs extends any[],
  QueryArgs extends object,
>(
  prisma: PrismaClient,
  modelName: ModelName,
  selectFilter: Partial<RequestType<ModelName, FunctionNameType<ModelName>>>,
  format: Formatter<Raw, Formatted, FormatterArgs>,
  queryUpdater: (
    query: RequestType<ModelName, FunctionNameType<ModelName>>,
    args: QueryArgs,
  ) => MayBePromise<RequestType<ModelName, FunctionNameType<ModelName>>> = (query) => query,
) {
  const customModel: {
    [K in (typeof singleValueMethods)[number]]?: (
      arg: UserFriendlyRequestType<ModelName, FunctionNameType<ModelName> & K, QueryArgs>,
      ...formatterArgs: FormatterArgs
    ) => Promise<Formatted>;
  } & {
    [K in (typeof multiValueMethods)[number]]?: (
      arg: UserFriendlyRequestType<ModelName, FunctionNameType<ModelName> & K, QueryArgs>,
      ...formatterArgs: FormatterArgs
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
      (prisma, values: Raw[], ...args: FormatterArgs) =>
        Promise.all(values.map((value) => format(prisma, value, ...args))),
      queryUpdater,
    );
  }
  return customModel as Required<typeof customModel>;
}
