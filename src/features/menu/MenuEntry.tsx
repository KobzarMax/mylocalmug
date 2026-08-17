import { useState } from 'react';

import { Workspace } from '../business/types';

import { CategoryForm } from './components/CategoryForm';
import { MenuItemForm } from './components/MenuItemForm';
import { MenuOverview } from './components/MenuOverview';
import { useMenu } from './hooks';
import { MenuCategory, MenuItem } from './types';

type CategoryEditor = MenuCategory | 'new' | null;
type ItemEditor = MenuItem | 'new' | null;

export function MenuEntry({
  workspace,
  onBack,
  initialAction,
}: {
  workspace: Workspace;
  onBack: () => void;
  initialAction?: 'item' | 'category';
}) {
  const menu = useMenu(workspace.business.id);
  const [categoryEditor, setCategoryEditor] = useState<CategoryEditor>(
    initialAction === 'category' ? 'new' : null,
  );
  const [itemEditor, setItemEditor] = useState<ItemEditor>(initialAction === 'item' ? 'new' : null);

  const finishEditing = async () => {
    setCategoryEditor(null);
    setItemEditor(null);
    await menu.refresh();
  };

  if (categoryEditor)
    return (
      <CategoryForm
        businessId={workspace.business.id}
        category={categoryEditor === 'new' ? null : categoryEditor}
        nextSortOrder={menu.categories.length}
        onBack={() => setCategoryEditor(null)}
        onSaved={finishEditing}
      />
    );

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
      onAddCategory={() => setCategoryEditor('new')}
      onAddDefaults={menu.addDefaults}
      onEditCategory={setCategoryEditor}
      onDeleteCategory={menu.removeCategory}
      onMoveCategory={menu.moveCategory}
      onAddItem={() => setItemEditor('new')}
      onEditItem={setItemEditor}
      onDeleteItem={menu.removeItem}
      onRetry={menu.refresh}
    />
  );
}
