import { and, asc, desc, eq } from 'drizzle-orm/expressions';

import { LobeChatDatabase } from '@/database/type';
import { ModelProvider } from '@/libs/agent-runtime';
import {
  AiProviderDetailItem,
  AiProviderListItem,
  CreateAiProviderParams,
  UpdateAiProviderConfigParams,
} from '@/types/aiProvider';

import { AiProviderSelectItem, aiProviders } from '../../schemas';

type DecryptUserKeyVaults = (encryptKeyVaultsStr: string | null) => Promise<any>;

type EncryptUserKeyVaults = (keyVaults: string) => Promise<string>;

export class AiProviderModel {
  private userId: string;
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase, userId: string) {
    this.userId = userId;
    this.db = db;
  }

  create = async (
    { keyVaults: userKey, ...params }: CreateAiProviderParams,
    encryptor?: EncryptUserKeyVaults,
  ) => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const defaultSerialize = (s: string) => s;
    const encrypt = encryptor ?? defaultSerialize;
    const keyVaults = await encrypt(JSON.stringify(userKey));

    const [result] = await this.db
      .insert(aiProviders)
      .values({
        ...params,
        // each new ai provider we will set it to enabled by default
        enabled: true,
        keyVaults,
        userId: this.userId,
      })
      .returning();

    return result;
  };

  delete = async (id: string) => {
    return this.db
      .delete(aiProviders)
      .where(and(eq(aiProviders.id, id), eq(aiProviders.userId, this.userId)));
  };

  deleteAll = async () => {
    return this.db.delete(aiProviders).where(eq(aiProviders.userId, this.userId));
  };

  query = async () => {
    return this.db.query.aiProviders.findMany({
      orderBy: [desc(aiProviders.updatedAt)],
      where: eq(aiProviders.userId, this.userId),
    });
  };

  getAiProviderList = async (): Promise<AiProviderListItem[]> => {
    const result = await this.db
      .select({
        description: aiProviders.description,
        enabled: aiProviders.enabled,
        id: aiProviders.id,
        logo: aiProviders.logo,
        name: aiProviders.name,
        source: aiProviders.source,
      })
      .from(aiProviders)
      .where(eq(aiProviders.userId, this.userId))
      .orderBy(asc(aiProviders.sort), desc(aiProviders.updatedAt));

    return result as AiProviderListItem[];
  };

  findById = async (id: string) => {
    return this.db.query.aiProviders.findFirst({
      where: and(eq(aiProviders.id, id), eq(aiProviders.userId, this.userId)),
    });
  };

  update = async (id: string, value: Partial<AiProviderSelectItem>) => {
    return this.db
      .update(aiProviders)
      .set({ ...value, updatedAt: new Date() })
      .where(and(eq(aiProviders.id, id), eq(aiProviders.userId, this.userId)));
  };

  updateConfig = async (
    id: string,
    value: UpdateAiProviderConfigParams,
    encryptor?: EncryptUserKeyVaults,
  ) => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const defaultSerialize = (s: string) => s;
    const encrypt = encryptor ?? defaultSerialize;
    const keyVaults = await encrypt(JSON.stringify(value.keyVaults));

    return this.db
      .update(aiProviders)
      .set({ ...value, keyVaults, updatedAt: new Date() })
      .where(and(eq(aiProviders.id, id), eq(aiProviders.userId, this.userId)));
  };

  toggleProviderEnabled = async (id: string, enabled: boolean) => {
    const isBuiltin = Object.values(ModelProvider).includes(id as any);

    return this.db
      .insert(aiProviders)
      .values({
        enabled,
        id,
        source: isBuiltin ? 'builtin' : 'custom',
        updatedAt: new Date(),
        userId: this.userId,
      })
      .onConflictDoUpdate({
        set: { enabled },
        target: [aiProviders.id, aiProviders.userId],
      });
  };

  updateOrder = async (sortMap: { id: string; sort: number }[]) => {
    await this.db.transaction(async (tx) => {
      const updates = sortMap.map(({ id, sort }) => {
        const isBuiltin = Object.values(ModelProvider).includes(id as any);

        return tx
          .insert(aiProviders)
          .values({
            enabled: true,
            id,
            sort,
            source: isBuiltin ? 'builtin' : 'custom',
            updatedAt: new Date(),
            userId: this.userId,
          })
          .onConflictDoUpdate({
            set: { sort, updatedAt: new Date() },
            target: [aiProviders.id, aiProviders.userId],
          });
      });

      await Promise.all(updates);
    });
  };

  getAiProviderById = async (
    id: string,
    decryptor: DecryptUserKeyVaults,
  ): Promise<AiProviderDetailItem> => {
    const query = this.db
      .select({
        checkModel: aiProviders.checkModel,
        config: aiProviders.config,
        enabled: aiProviders.enabled,
        id: aiProviders.id,
        keyVaults: aiProviders.keyVaults,
        name: aiProviders.name,
        source: aiProviders.source,
      })
      .from(aiProviders)
      .where(and(eq(aiProviders.id, id), eq(aiProviders.userId, this.userId)))
      .limit(1);

    const [result] = await query;

    if (!result) {
      // if the provider is builtin but not init, we will insert it to the db
      if (this.isBuiltInProvider(id)) {
        await this.db.insert(aiProviders).values({ id, source: 'builtin', userId: this.userId });

        const resultAgain = await query;

        return { ...resultAgain[0] };
      }

      throw new Error(`provider ${id} not found`);
    }

    const decrypt = decryptor ?? JSON.parse;

    const keyVaults = await decrypt(result.keyVaults);

    return { ...result, keyVaults } as AiProviderDetailItem;
  };

  getAiProviderKeyVaults = async (decryptor: DecryptUserKeyVaults) => {
    const result = await this.db
      .select({
        id: aiProviders.id,
        keyVaults: aiProviders.keyVaults,
      })
      .from(aiProviders)
      .where(and(eq(aiProviders.userId, this.userId)));

    const decrypt = decryptor ?? JSON.parse;
    let providerKeyVaults: Record<string, object> = {};

    for (const item of result) {
      providerKeyVaults[item.id] = await decrypt(item.keyVaults);
    }

    return providerKeyVaults;
  };

  private isBuiltInProvider = (id: string) => Object.values(ModelProvider).includes(id as any);
}