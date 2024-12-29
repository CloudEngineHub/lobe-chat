import { ModelIcon } from '@lobehub/icons';
import { SortableList } from '@lobehub/ui';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { AiProviderModelListItem } from '@/types/aiModel';

const ListItem = memo<AiProviderModelListItem>(({ id, displayName, source }) => {
  return (
    <>
      <Flexbox gap={8} horizontal>
        <ModelIcon model={id} size={24} style={{ borderRadius: 6 }} type={'avatar'} />
        {displayName || id}
      </Flexbox>
      <SortableList.DragHandle />
    </>
  );
});

export default ListItem;