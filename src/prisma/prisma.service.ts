import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigModule } from '../config/config.module';
import { generateCustomUserModel } from '../users/interfaces/user.interface';
import { omit } from '../utils';
import { generateCustomCommentModel } from '../ue/interfaces/comment.interface';
import { generateCustomCriterionModel } from '../ue/interfaces/criterion.interface';
import { generateCustomUECommentReplyModel } from '../ue/interfaces/comment-reply.interface';
import { generateCustomRateModel } from '../ue/interfaces/rate.interface';
import { generateCustomUEModel } from '../ue/interfaces/ue.interface';

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
    },
  });
}

// UTILITIES TO GENERATE CUSTOM MODEL FUNCTIONS
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
> = Omit<RequestType<ModelName, FunctionName>, 'select' | 'include' | 'orderBy'>;

function generateCustomModelFunction<
  ModelName extends ModelNameType,
  FunctionName extends FunctionNameType<ModelName>,
  Raw,
  Formatted,
  FormatterArgs extends any[],
>(
  prisma: PrismaClient,
  modelName: ModelName,
  functionName: FunctionName,
  selectFilter: Partial<RequestType<ModelName, FunctionName>>,
  format: (raw: Raw, ...args: FormatterArgs) => Formatted,
): (params: UserFriendlyRequestType<ModelName, FunctionName>, ...args: FormatterArgs) => Promise<Formatted> {
  return async (args, ...formatterArgs) => {
    const res = await (prisma[modelName][functionName] as (arg: RequestType<ModelName, FunctionName>) => Raw)({
      ...args,
      ...selectFilter,
    } as RequestType<ModelName, FunctionName>);
    return res ? format(res, ...formatterArgs) : (res as null);
  };
}

const singleValueMethods = ['findUnique', 'update', 'findFirst', 'create', 'delete', 'upsert'] as const;
const multiValueMethods = ['findMany'] as const;

export function generateCustomModel<ModelName extends ModelNameType, Raw, Formatted, FormatterArgs extends any[]>(
  prisma: PrismaClient,
  modelName: ModelName,
  selectFilter: Partial<RequestType<ModelName, FunctionNameType<ModelName>>>,
  format: (param: Raw, ...args: FormatterArgs) => Formatted,
) {
  const customModel: {
    [K in (typeof singleValueMethods)[number]]?: (
      arg: UserFriendlyRequestType<ModelName, FunctionNameType<ModelName> & K>,
      ...formatterArgs: FormatterArgs
    ) => Promise<Formatted>;
  } & {
    [K in (typeof multiValueMethods)[number]]?: (
      arg: UserFriendlyRequestType<ModelName, FunctionNameType<ModelName> & K>,
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
    );
  }
  for (const functionName of multiValueMethods) {
    customModel[functionName] = generateCustomModelFunction(
      prisma,
      modelName,
      functionName as FunctionNameType<ModelName>,
      selectFilter,
      (values: Raw[], ...args: FormatterArgs) => values.map((value) => format(value, ...args)),
    );
  }
  return customModel as Required<typeof customModel>;
}
