import { useQuery } from '@tanstack/react-query';

import { getBusinessContent } from '../content/api';
import { getLegalProfile } from '../legal/api';
import { getBusinessMenu } from '../menu/api';
import { getBusinessRewards } from '../rewards/api';
import { getTeam } from '../team/api';

import { hasPermission } from './permissions';
import { Workspace } from './types';

export type BusinessSetupItem = {
  key: 'profile' | 'menu' | 'content' | 'rewards' | 'team' | 'legal';
  label: string;
  state: 'complete' | 'incomplete' | 'unknown';
};

export const businessSetupKeys = {
  detail: (businessId: string) => ['business-setup', businessId] as const,
};

export function useBusinessSetup(workspace: Workspace) {
  return useQuery({
    queryKey: businessSetupKeys.detail(workspace.business.id),
    queryFn: () => loadBusinessSetup(workspace),
    meta: { persist: false },
  });
}

async function loadBusinessSetup(workspace: Workspace): Promise<BusinessSetupItem[]> {
  const { business, role } = workspace;
  const items: BusinessSetupItem[] = [
    {
      key: 'profile',
      label: 'Business profile',
      state: [business.description, business.address, business.contactEmail, business.contactPhone].every(
        Boolean,
      )
        ? 'complete'
        : 'incomplete',
    },
  ];
  const checks: Promise<BusinessSetupItem>[] = [];
  if (hasPermission(role, 'menu.manage')) {
    checks.push(asSetupItem('menu', 'Menu', getBusinessMenu(business.id), (data) => data.items.length > 0));
  }
  if (hasPermission(role, 'content.manage')) {
    checks.push(
      asSetupItem(
        'content',
        'News & events',
        getBusinessContent(business.id, business.name),
        (data) => data.length > 0,
      ),
    );
  }
  if (hasPermission(role, 'rewards.manage')) {
    checks.push(
      asSetupItem('rewards', 'Rewards', getBusinessRewards(business.id), (data) => data.programs.length > 0),
    );
  }
  if (hasPermission(role, 'team.read')) {
    checks.push(
      asSetupItem(
        'team',
        'Team',
        getTeam(business.id),
        (data) => data.members.length > 1 || data.invitations.length > 0,
      ),
    );
  }
  if (hasPermission(role, 'legal.read')) {
    checks.push(
      asSetupItem(
        'legal',
        'Legal information',
        getLegalProfile(business.id),
        (data) => data.status === 'approved',
      ),
    );
  }
  return [...items, ...(await Promise.all(checks))];
}

async function asSetupItem<T>(
  key: BusinessSetupItem['key'],
  label: string,
  request: Promise<T>,
  complete: (value: T) => boolean,
): Promise<BusinessSetupItem> {
  try {
    return { key, label, state: complete(await request) ? 'complete' : 'incomplete' };
  } catch {
    return { key, label, state: 'unknown' };
  }
}
