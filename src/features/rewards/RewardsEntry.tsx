import { useState } from 'react';
import { SafeAreaView } from 'react-native';

import { hasPermission } from '../business/permissions';
import { Workspace } from '../business/types';

import { BusinessRewardsOverview } from './components/BusinessRewardsOverview';
import { EventMenuLinkForm } from './components/EventMenuLinkForm';
import { LoyaltyScanner } from './components/LoyaltyScanner';
import { OfferForm } from './components/OfferForm';
import { ProgrammeForm } from './components/ProgrammeForm';
import { RewardError, RewardLoading } from './components/RewardUI';
import { useBusinessRewards } from './hooks';
import { rewardStyles as s } from './styles';
import { LoyaltyOffer, LoyaltyProgram } from './types';

type Screen = 'overview' | 'programme' | 'offer' | 'scanner' | 'event';
export function RewardsEntry({ workspace, onBack }: { workspace: Workspace; onBack: () => void }) {
  const rewards = useBusinessRewards(workspace.business.id);
  const [screen, setScreen] = useState<Screen>('overview');
  const [editing, setEditing] = useState<LoyaltyProgram | null>(null);
  const [editingOffer, setEditingOffer] = useState<LoyaltyOffer | null>(null);
  const close = () => {
    setEditing(null);
    setEditingOffer(null);
    setScreen('overview');
  };
  if (rewards.loading)
    return (
      <SafeAreaView style={s.safe}>
        <RewardLoading />
      </SafeAreaView>
    );
  if (rewards.error)
    return (
      <SafeAreaView style={s.safe}>
        <RewardError message={rewards.error} onRetry={rewards.refresh} />
      </SafeAreaView>
    );
  if (screen === 'programme')
    return (
      <SafeAreaView style={s.safe}>
        <ProgrammeForm
          program={editing}
          menu={rewards.menu}
          busy={rewards.busy}
          onBack={close}
          onSave={(input) => rewards.saveProgram(editing?.id ?? null, input)}
        />
      </SafeAreaView>
    );
  if (screen === 'offer')
    return (
      <SafeAreaView style={s.safe}>
        <OfferForm
          offer={editingOffer}
          programs={rewards.programs}
          menu={rewards.menu}
          busy={rewards.busy}
          onBack={close}
          onSave={(input) => rewards.saveOffer(editingOffer?.id ?? null, input)}
        />
      </SafeAreaView>
    );
  if (screen === 'scanner') return <LoyaltyScanner menu={rewards.menu} onBack={close} />;
  if (screen === 'event')
    return (
      <SafeAreaView style={s.safe}>
        <EventMenuLinkForm businessId={workspace.business.id} menu={rewards.menu} onBack={close} />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.safe}>
      <BusinessRewardsOverview
        programs={rewards.programs}
        offers={rewards.offers}
        stats={rewards.stats}
        canManage={hasPermission(workspace.role, 'rewards.manage')}
        canIssue={hasPermission(workspace.role, 'loyalty.issue')}
        busy={rewards.busy}
        onBack={onBack}
        onCreateProgram={() => setScreen('programme')}
        onCreateOffer={() => setScreen('offer')}
        onEdit={(program) => {
          setEditing(program);
          setScreen('programme');
        }}
        onEditOffer={(offer) => {
          setEditingOffer(offer);
          setScreen('offer');
        }}
        onStatus={rewards.setStatus}
        onScan={() => setScreen('scanner')}
        onLinkEvent={() => setScreen('event')}
      />
    </SafeAreaView>
  );
}
