import isEqual from 'fast-deep-equal';
import { SWRResponse, mutate } from 'swr';
import { StateCreator } from 'zustand/vanilla';

import { useClientDataSWR } from '@/libs/swr';
import { aiModelService } from '@/services/aiModel';
import { AiInfraStore } from '@/store/aiInfra/store';
import {
  AiModelSortMap,
  AiProviderModelListItem,
  ToggleAiModelEnableParams,
} from '@/types/aiModel';

const FETCH_AI_PROVIDER_MODEL_LIST_KEY = 'FETCH_AI_PROVIDER_MODELS';

export interface AiModelAction {
  batchUpdateAiModels: (models: AiProviderModelListItem[]) => Promise<void>;
  clearRemoteModels: (provider: string) => Promise<void>;
  fetchRemoteModelList: (providerId: string) => Promise<void>;
  internal_toggleAiModelLoading: (id: string, loading: boolean) => void;
  refreshAiModelList: () => Promise<void>;
  toggleModelEnabled: (params: Omit<ToggleAiModelEnableParams, 'providerId'>) => Promise<void>;
  updateAiModelsSort: (providerId: string, items: AiModelSortMap[]) => Promise<void>;

  useFetchAiProviderModels: (id: string) => SWRResponse<AiProviderModelListItem[]>;
}

export const createAiModelSlice: StateCreator<
  AiInfraStore,
  [['zustand/devtools', never]],
  [],
  AiModelAction
> = (set, get) => ({
  batchUpdateAiModels: async (models) => {
    const { activeAiProvider: id } = get();
    if (!id) return;

    await aiModelService.batchUpdateAiModels(id, models);
    await get().refreshAiModelList();
  },
  clearRemoteModels: async (provider) => {
    await aiModelService.clearRemoteModels(provider);
    await get().refreshAiModelList();
  },
  fetchRemoteModelList: async (providerId) => {
    const { modelsService } = await import('@/services/models');

    const data = await modelsService.getChatModels(providerId);
    if (data) {
      await get().batchUpdateAiModels(
        data.map((model) => ({
          ...model,
          abilities: {
            files: model.files,
            functionCall: model.functionCall,
            vision: model.vision,
          },
          enabled: model.enabled || false,
          source: 'remote',
          type: 'chat',
        })),
      );

      await get().refreshAiModelList();
    }
  },
  internal_toggleAiModelLoading: (id, loading) => {
    set(
      (state) => {
        if (loading) return { aiModelLoadingIds: [...state.aiModelLoadingIds, id] };

        return { aiModelLoadingIds: state.aiModelLoadingIds.filter((i) => i !== id) };
      },
      false,
      'toggleAiModelLoading',
    );
  },
  refreshAiModelList: async () => {
    await mutate([FETCH_AI_PROVIDER_MODEL_LIST_KEY, get().activeAiProvider]);
  },
  toggleModelEnabled: async (params) => {
    const { activeAiProvider } = get();
    if (!activeAiProvider) return;

    get().internal_toggleAiModelLoading(params.id, true);

    await aiModelService.toggleModelEnabled({ ...params, providerId: activeAiProvider });
    await get().refreshAiModelList();

    get().internal_toggleAiModelLoading(params.id, false);
  },

  updateAiModelsSort: async (id, items) => {
    await aiModelService.updateAiModelOrder(id, items);
    await get().refreshAiModelList();
  },

  useFetchAiProviderModels: (id) =>
    useClientDataSWR<AiProviderModelListItem[]>(
      [FETCH_AI_PROVIDER_MODEL_LIST_KEY, id],
      ([, id]) => aiModelService.getAiProviderModelList(id as string),
      {
        onSuccess: (data) => {
          // no need to update list if the list have been init and data is the same
          if (get().isAiModelListInit && isEqual(data, get().aiProviderModelList)) return;

          set(
            { aiProviderModelList: data, isAiModelListInit: true },
            false,
            `useFetchAiProviderModels/${id}`,
          );
        },
      },
    ),
});