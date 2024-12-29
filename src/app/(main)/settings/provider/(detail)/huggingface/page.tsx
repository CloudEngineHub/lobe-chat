'use client';

import { Markdown } from '@lobehub/ui';
import { Input } from 'antd';
import { createStyles } from 'antd-style';
import { useTranslation } from 'react-i18next';

import { SkeletonInput } from '../../features/ProviderConfig';
import { HuggingFaceProviderCard } from '@/config/modelProviders';
import { aiProviderSelectors, useAiInfraStore } from '@/store/aiInfra';
import { GlobalLLMProviderKey } from '@/types/user/settings';

import { KeyVaultsConfigKey, LLMProviderApiTokenKey } from '../../const';
import { ProviderItem } from '../../type';
import ProviderDetail from '../[id]';

const useStyles = createStyles(({ css, token }) => ({
  markdown: css`
    p {
      color: ${token.colorTextDescription} !important;
    }
  `,
  tip: css`
    font-size: 12px;
    color: ${token.colorTextDescription};
  `,
}));

const providerKey: GlobalLLMProviderKey = 'huggingface';

// Same as OpenAIProvider, but replace API Key with HuggingFace Access Token
const useProviderCard = (): ProviderItem => {
  const { t } = useTranslation('modelProvider');
  const { styles } = useStyles();
  const isLoading = useAiInfraStore(aiProviderSelectors.isAiProviderConfigLoading(providerKey));

  return {
    ...HuggingFaceProviderCard,
    apiKeyItems: [
      {
        children: isLoading ? (
          <SkeletonInput />
        ) : (
          <Input.Password
            autoComplete={'new-password'}
            placeholder={t(`${providerKey}.accessToken.placeholder`)}
          />
        ),
        desc: (
          <Markdown className={styles.markdown} fontSize={12} variant={'chat'}>
            {t(`${providerKey}.accessToken.desc`)}
          </Markdown>
        ),
        label: t(`${providerKey}.accessToken.title`),
        name: [KeyVaultsConfigKey, providerKey, LLMProviderApiTokenKey],
      },
    ],
  };
};

const Page = () => {
  const card = useProviderCard();

  return <ProviderDetail {...card} />;
};

export default Page;