import { Pressable, Text, View } from 'react-native';

import { rewardStyles as s } from '../styles';
import { LoyaltyProgram, LoyaltyProgramStatus } from '../types';

export function BusinessProgrammeCard({
  program,
  busy,
  canManage,
  onEdit,
  onChange,
}: {
  program: LoyaltyProgram;
  busy: boolean;
  canManage: boolean;
  onEdit: () => void;
  onChange: (status: LoyaltyProgramStatus) => void;
}) {
  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{program.name}</Text>
          <Text style={s.meta}>
            {program.type} · version {program.currentVersion} · {program.status}
          </Text>
        </View>
        <View style={s.pill}>
          <Text style={s.pillText}>{program.status}</Text>
        </View>
      </View>
      <Text style={s.meta}>{program.description || 'No description yet.'}</Text>
      {canManage ? (
        <ProgrammeActions program={program} busy={busy} onEdit={onEdit} onChange={onChange} />
      ) : null}
    </View>
  );
}

function ProgrammeActions({
  program,
  busy,
  onEdit,
  onChange,
}: {
  program: LoyaltyProgram;
  busy: boolean;
  onEdit: () => void;
  onChange: (status: LoyaltyProgramStatus) => void;
}) {
  const action = (label: string, status: LoyaltyProgramStatus, warning = false) => (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={() => onChange(status)}
      style={[s.secondary, warning && s.warning, busy && s.disabled]}
    >
      <Text style={[s.secondaryText, warning && s.warningText]}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={s.wrap}>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onEdit}
        style={[s.secondary, busy && s.disabled]}
      >
        <Text style={s.secondaryText}>New version</Text>
      </Pressable>
      {program.status === 'draft' ? (
        <>
          {action('Publish', 'active')}
          {program.startsAt && new Date(program.startsAt) > new Date()
            ? action('Schedule', 'scheduled')
            : null}
        </>
      ) : null}
      {program.status === 'scheduled' ? action('Return to draft', 'draft') : null}
      {program.status === 'active' ? (
        <>
          {action('Pause', 'paused')}
          {action('End', 'ended', true)}
        </>
      ) : null}
      {program.status === 'paused' ? action('Resume', 'active') : null}
      {program.status === 'ended' ? action('Archive', 'archived', true) : null}
    </View>
  );
}
