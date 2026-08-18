import { Workspace } from '../business/types';

import { useCategoryManager } from './categoryHooks';
import { CategoryManagerScreen } from './components/CategoryManagerScreen';

export function CategoryManagerEntry({
  workspace,
  initialCreate,
  onBack,
}: {
  workspace: Workspace;
  initialCreate: boolean;
  onBack: () => void;
}) {
  const manager = useCategoryManager(workspace.business.id, initialCreate);
  return <CategoryManagerScreen manager={manager} onBack={onBack} />;
}
