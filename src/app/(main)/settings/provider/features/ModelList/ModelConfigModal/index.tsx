import { Modal } from '@lobehub/ui';
import { Button, FormInstance } from 'antd';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAiInfraStore } from '@/store/aiInfra';

import ModelConfigForm from './Form';

interface ModelConfigModalProps {
  id: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  showAzureDeployName?: boolean;
}

const ModelConfigModal = memo<ModelConfigModalProps>(
  ({ id, showAzureDeployName, open, setOpen }) => {
    const { t } = useTranslation('setting');
    const { t: tc } = useTranslation('common');
    const [formInstance, setFormInstance] = useState<FormInstance>();

    const editingProvider = useAiInfraStore((s) => s.activeAiProvider!);

    const closeModal = () => {
      setOpen(false);
    };

    return (
      <Modal
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={closeModal}>
            {tc('cancel')}
          </Button>,

          <Button
            key="ok"
            onClick={() => {
              if (!editingProvider || !id || !formInstance) return;
              // const data = formInstance.getFieldsValue();

              // dispatchCustomModelCards(editingProvider as any, { id, type: 'update', value: data });

              closeModal();
            }}
            style={{ marginInlineStart: '16px' }}
            type="primary"
          >
            {tc('ok')}
          </Button>,
        ]}
        maskClosable
        onCancel={closeModal}
        open={open}
        title={t('llm.customModelCards.modelConfig.modalTitle')}
        zIndex={1251} // Select is 1150
      >
        <ModelConfigForm
          // initialValues={{}}
          onFormInstanceReady={setFormInstance}
          showAzureDeployName={showAzureDeployName}
        />
      </Modal>
    );
  },
);
export default ModelConfigModal;
