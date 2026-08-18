import { useState } from 'react';

import { Workspace } from '../business/types';

import { MenuItemForm } from './components/MenuItemForm';
import { MenuOverview } from './components/MenuOverview';
import { useMenu } from './hooks';
import { MenuItem } from './types';

type ItemEditor = MenuItem | 'new' | null;

export function MenuEntry({
  workspace,
  onBack,
  onManageCategories,
  onCreateCategory,
  initialAction,
}: {
  workspace: Workspace;
  onBack: () => void;
  onManageCategories: () => void;
  onCreateCategory: () => void;
  initialAction?: 'item';
}) {
  const menu = useMenu(workspace.business.id);
  const [itemEditor, setItemEditor] = useState<ItemEditor>(initialAction === 'item' ? 'new' : null);

  const finishEditing = async () => {
    setItemEditor(null);
    await menu.refresh();
  };

  if (itemEditor)
    return (
      <MenuItemForm
        businessId={workspace.business.id}
        item={itemEditor === 'new' ? null : itemEditor}
        categories={menu.categories}
        onBack={() => setItemEditor(null)}
        onSaved={finishEditing}
      />
    );

  return (
    <MenuOverview
      categories={menu.categories}
      items={menu.items}
      loading={menu.loading}
      busy={menu.busy}
      error={menu.error}
      onBack={onBack}
      onAddDefaults={menu.addDefaults}
      onAddItem={() => setItemEditor('new')}
      onCreateCategory={onCreateCategory}
      onManageCategories={onManageCategories}
      onEditItem={setItemEditor}
      onDeleteItem={menu.removeItem}
      onRetry={menu.refresh}
    />
  );
}
