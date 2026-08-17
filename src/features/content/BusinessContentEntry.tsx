import { useState } from 'react';

import { Workspace } from '../business/types';

import { BusinessContentOverview } from './components/BusinessContentOverview';
import { CancelEventScreen } from './components/CancelEventScreen';
import { ContentEditorScreen } from './components/ContentEditorScreen';
import { useBusinessContent } from './hooks';
import { ContentItem } from './types';

type Screen =
  | { type: 'overview' }
  | { type: 'editor'; item: ContentItem | null; kind?: 'news' | 'event' }
  | { type: 'cancel'; item: ContentItem };

export function BusinessContentEntry({
  workspace,
  onBack,
  initialCreateKind,
}: {
  workspace: Workspace;
  onBack: () => void;
  initialCreateKind?: 'news' | 'event';
}) {
  const content = useBusinessContent(workspace.business.id, workspace.business.name);
  const [screen, setScreen] = useState<Screen>(
    initialCreateKind ? { type: 'editor', item: null, kind: initialCreateKind } : { type: 'overview' },
  );
  const saved = async () => {
    setScreen({ type: 'overview' });
    await content.refresh();
  };
  if (screen.type === 'editor')
    return (
      <ContentEditorScreen
        businessId={workspace.business.id}
        businessAddress={workspace.location?.address ?? workspace.business.address}
        businessTimezone={workspace.location?.timezone ?? 'Europe/London'}
        item={screen.item}
        initialKind={screen.kind}
        onBack={() => setScreen({ type: 'overview' })}
        onSaved={saved}
      />
    );
  if (screen.type === 'cancel')
    return (
      <CancelEventScreen
        item={screen.item}
        busy={content.busy}
        onBack={() => setScreen({ type: 'overview' })}
        onCancel={async (reason) => {
          await content.cancel(screen.item, reason);
          setScreen({ type: 'overview' });
        }}
      />
    );
  return (
    <BusinessContentOverview
      items={content.items}
      loading={content.loading}
      busy={content.busy}
      error={content.error}
      onBack={onBack}
      onRetry={content.refresh}
      onCreate={(kind) => setScreen({ type: 'editor', item: null, kind })}
      onEdit={(item) => setScreen({ type: 'editor', item })}
      onArchive={content.archive}
      onDelete={content.removeDraft}
      onCancel={(item) => setScreen({ type: 'cancel', item })}
    />
  );
}
