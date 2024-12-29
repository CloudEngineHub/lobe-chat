import { z } from 'zod';

export type ModelPriceCurrency = 'CNY' | 'USD';

export const AiModelSourceEnum = {
  Builtin: 'builtin',
  Remote: 'remote',
  custom: 'custom',
} as const;
export type AiModelSourceType = (typeof AiModelSourceEnum)[keyof typeof AiModelSourceEnum];

export type AiModelType =
  | 'chat'
  | 'embedding'
  | 'tts'
  | 'stt'
  | 'image'
  | 'text2video'
  | 'text2music';

export interface ModelAbilities {
  /**
   * whether model supports file upload
   */
  files?: boolean;
  /**
   * whether model supports function call
   */
  functionCall?: boolean;
  /**
   *  whether model supports vision
   */
  vision?: boolean;
}

// 语言模型的设置参数
export interface LLMParams {
  /**
   * 控制生成文本中的惩罚系数，用于减少重复性
   * @default 0
   */
  frequency_penalty?: number;
  /**
   * 生成文本的最大长度
   */
  max_tokens?: number;
  /**
   * 控制生成文本中的惩罚系数，用于减少主题的变化
   * @default 0
   */
  presence_penalty?: number;
  /**
   * 生成文本的随机度量，用于控制文本的创造性和多样性
   * @default 1
   */
  temperature?: number;
  /**
   * 控制生成文本中最高概率的单个 token
   * @default 1
   */
  top_p?: number;
}

export interface BasicModelPricing {
  /**
   * the currency of the pricing
   * @default USD
   */
  currency?: ModelPriceCurrency;
  /**
   * the input pricing, e.g. $1 / 1M tokens
   */
  input?: number;
}

export interface ChatModelPricing extends BasicModelPricing {
  audioInput?: number;
  audioOutput?: number;
  cachedAudioInput?: number;
  cachedInput?: number;
  /**
   * the output pricing, e.g. $2 / 1M tokens
   */
  output?: number;
  writeCacheInput?: number;
}

interface AIBaseModelCard {
  /**
   * the context window (or input + output tokens limit)
   */
  contextWindowTokens?: number;
  description?: string;
  /**
   * the name show for end user
   */
  displayName?: string;
  enabled?: boolean;
  id: string;
  /**
   * whether model is legacy (deprecated but not removed yet)
   */
  legacy?: boolean;
  /**
   * who create this model
   */
  organization?: string;

  releasedAt?: string;
}

export interface AIChatModelCard extends AIBaseModelCard {
  abilities?: {
    /**
     * whether model supports file upload
     */
    files?: boolean;
    /**
     * whether model supports function call
     */
    functionCall?: boolean;
    /**
     *  whether model supports vision
     */
    vision?: boolean;
  };
  /**
   * used in azure and doubao
   */
  deploymentName?: string;
  maxOutput?: number;
  pricing?: ChatModelPricing;
  type: 'chat';
}

export interface AIEmbeddingModelCard extends AIBaseModelCard {
  maxDimension: number;
  pricing?: {
    /**
     * the currency of the pricing
     * @default USD
     */
    currency?: ModelPriceCurrency;
    /**
     * the input pricing, e.g. $1 / 1M tokens
     */
    input?: number;
  };
  type: 'embedding';
}

export interface AIText2ImageModelCard extends AIBaseModelCard {
  pricing?: {
    /**
     * the currency of the pricing
     * @default USD
     */
    currency?: ModelPriceCurrency;
  } & Record<string, number>; // [resolution: string]: number;
  resolutions: string[];
  type: 'image';
}

export interface AITTSModelCard extends AIBaseModelCard {
  pricing?: {
    /**
     * the currency of the pricing
     * @default USD
     */
    currency?: ModelPriceCurrency;
    /**
     * the input pricing, e.g. $1 / 1M tokens
     */
    input?: number;
  };
  type: 'tts';
}

export interface AISTTModelCard extends AIBaseModelCard {
  pricing?: {
    /**
     * the currency of the pricing
     * @default USD
     */
    currency?: ModelPriceCurrency;
    /**
     * the input pricing, e.g. $1 / 1M tokens
     */
    input?: number;
  };
  type: 'stt';
}

export interface AIRealtimeModelCard extends AIBaseModelCard {
  abilities?: {
    /**
     * whether model supports file upload
     */
    files?: boolean;
    /**
     * whether model supports function call
     */
    functionCall?: boolean;
    /**
     *  whether model supports vision
     */
    vision?: boolean;
  };
  /**
   * used in azure and doubao
   */
  deploymentName?: string;
  maxOutput?: number;
  pricing?: ChatModelPricing;
  type: 'realtime';
}

// create
export const CreateAiModelSchema = z.object({
  config: z.object({}).passthrough().optional(),
  description: z.string().optional(),
  id: z.string(),
  logo: z.string().optional(),
  name: z.string(),

  // checkModel: z.string().optional(),
  // homeUrl: z.string().optional(),
  // modelsUrl: z.string().optional(),
});

export type CreateAiModelParams = z.infer<typeof CreateAiModelSchema>;

// List Query

export interface AiProviderModelListItem {
  abilities?: ModelAbilities;
  contextWindowTokens?: number;
  displayName?: string;
  enabled: boolean;
  id: string;
  pricing?: ChatModelPricing;
  releasedAt?: string;
  source?: AiModelSourceType;
  type: AiModelType;
}

// Update
export const UpdateAiModelConfigSchema = z.object({
  checkModel: z.string().optional(),
  fetchOnClient: z.boolean().optional(),
  keyVaults: z.object({}).passthrough().optional(),
});

export type UpdateAiModelConfigParams = z.infer<typeof UpdateAiModelConfigSchema>;

export interface AiModelSortMap {
  id: string;
  sort: number;
}

export const ToggleAiModelEnableSchema = z.object({
  enabled: z.boolean(),
  id: z.string(),
  providerId: z.string(),
  source: z.enum(['builtin', 'custom', 'remote']).optional(),
});

export type ToggleAiModelEnableParams = z.infer<typeof ToggleAiModelEnableSchema>;