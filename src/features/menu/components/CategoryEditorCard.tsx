import { ActivityIndicator, Text, TextInput, View } from 'react-native';

import { AppButton } from '../../../components/ui/AppButton';
import { palette } from '../../../lib/design';
import { categoryStyles as s } from '../categoryStyles';
import { CategoryNameMatch } from '../types';

type Props = {
  editing: boolean;
  name: string;
  exactMatch: CategoryNameMatch | null;
  similarMatches: CategoryNameMatch[];
  similarConfirmed: boolean;
  checking: boolean;
  checkFailed: boolean;
  busy: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onConfirmSimilar: () => void;
  onRetryCheck: () => void;
  onSave: () => void;
  onCancel: () => void;
};

export function CategoryEditorCard(props: Props) {
  const similarNeedsConfirmation = props.similarMatches.length > 0 && !props.similarConfirmed;
  const saveDisabled =
    props.name.trim().length === 0 ||
    props.checking ||
    props.checkFailed ||
    Boolean(props.exactMatch) ||
    similarNeedsConfirmation;

  return (
    <View style={s.editor}>
      <Text accessibilityRole="header" style={s.editorTitle}>
        {props.editing ? 'Edit category' : 'New category'}
      </Text>
      <Text style={s.label}>Category name</Text>
      <TextInput
        accessibilityLabel="Category name"
        autoFocus
        editable={!props.busy}
        maxLength={60}
        onChangeText={props.onNameChange}
        placeholder="Coffee"
        placeholderTextColor={palette.placeholder}
        returnKeyType="done"
        style={s.input}
        value={props.name}
      />
      {props.checking ? (
        <View accessibilityLiveRegion="polite" style={s.checkingRow}>
          <ActivityIndicator color={palette.green} size="small" />
          <Text style={s.checkingText}>Checking for similar categories…</Text>
        </View>
      ) : null}
      {props.exactMatch ? (
        <Text accessibilityLiveRegion="assertive" style={s.exactText}>
          “{props.exactMatch.categoryName}” already exists. Choose a different name.
        </Text>
      ) : null}
      {props.similarMatches.length > 0 ? (
        <View style={s.matchCard}>
          <Text style={s.matchTitle}>Similar categories found</Text>
          <Text style={s.matchText}>
            {props.similarMatches.map((match) => match.categoryName).join(', ')}
          </Text>
          <Text style={s.matchText}>Use the existing category unless this one is genuinely different.</Text>
          {!props.similarConfirmed ? (
            <View style={s.editorActions}>
              <AppButton label="Use this name anyway" onPress={props.onConfirmSimilar} variant="secondary" />
            </View>
          ) : (
            <Text accessibilityLiveRegion="polite" style={s.matchText}>
              Similar name confirmed. You can now save.
            </Text>
          )}
        </View>
      ) : null}
      {props.error ? (
        <View>
          <Text accessibilityLiveRegion="assertive" style={s.exactText}>
            {props.error}
          </Text>
          {props.checkFailed ? (
            <View style={s.editorActions}>
              <AppButton label="Try name check again" onPress={props.onRetryCheck} variant="secondary" />
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={s.editorActions}>
        <AppButton
          label={props.editing ? 'Save changes' : 'Create category'}
          busy={props.busy}
          disabled={saveDisabled}
          onPress={props.onSave}
        />
        <AppButton label="Cancel" disabled={props.busy} onPress={props.onCancel} variant="secondary" />
      </View>
    </View>
  );
}
