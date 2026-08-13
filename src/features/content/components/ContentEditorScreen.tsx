import React, { useCallback } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { palette } from '../../../lib/design';
import { useContentEditor } from '../editorHooks';
import { styles } from '../styles';
import { ContentItem, RichTextDocument } from '../types';
import { ContentHeader } from './ContentUI';
import { CoverPicker } from './CoverPicker';
import { EventFields } from './EventFields';
import { PublicationActions } from './PublicationActions';
import { RichTextField } from './RichTextField';

export function ContentEditorScreen({ businessId, businessAddress, businessTimezone, item, initialKind, onBack, onSaved }: { businessId: string; businessAddress: string; businessTimezone: string; item: ContentItem | null; initialKind?: 'news' | 'event'; onBack: () => void; onSaved: () => void }) {
  const editor = useContentEditor({ businessId, businessAddress, businessTimezone, item, initialKind, onSaved });
  const changeBody = useCallback((document: RichTextDocument, text: string) => {
    editor.update('bodyDocument', document); editor.update('bodyText', text);
  }, [editor.update]);
  const submit = (mode: 'draft' | 'publish' | 'schedule', date?: Date) => editor.submit(mode, date).catch((caught) => {
    Alert.alert('Could not save content', caught instanceof Error ? caught.message : 'Please try again.');
  });
  const pickCover = () => editor.pickCover().catch((caught) => Alert.alert('Could not choose image', caught instanceof Error ? caught.message : 'Please try again.'));

  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safe}>
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <ContentHeader title={item ? 'Edit content' : 'New content'} onBack={onBack} />
      <Text style={styles.intro}>Write a useful local story, then save it as a draft, publish it now, or schedule it.</Text>
      <View style={styles.actions}>
        {(['news', 'event'] as const).map((kind) => <Pressable key={kind} disabled={editor.busy || editor.kindLocked} onPress={() => editor.setKind(kind)} style={[styles.chip, { flex: 1 }, editor.form.kind === kind && styles.chipActive]}><Text style={[styles.chipText, editor.form.kind === kind && styles.chipTextActive]}>{kind}</Text></Pressable>)}
      </View>
      {editor.kindLocked && <Text style={styles.subtle}>The content type is locked after publication is scheduled.</Text>}
      <CoverPicker url={editor.coverUrl} disabled={editor.busy} onPick={pickCover} onRemove={editor.clearCover} />
      <Field label="Title" value={editor.form.title} onChange={(value) => editor.update('title', value)} disabled={editor.busy} maxLength={140} placeholder="What is happening?" />
      <Field label="Excerpt" value={editor.form.excerpt} onChange={(value) => editor.update('excerpt', value)} disabled={editor.busy} maxLength={300} placeholder="A short preview for the feed" multiline />
      <RichTextField initialDocument={editor.form.bodyDocument} disabled={editor.busy} onChange={changeBody} />
      <View style={styles.switchRow}><View style={styles.switchCopy}><Text style={styles.switchTitle}>Pin this story</Text><Text style={styles.switchHint}>Pinned upcoming events appear first in customer feeds.</Text></View><Switch value={editor.form.isPinned} onValueChange={(value) => editor.update('isPinned', value)} disabled={editor.busy} trackColor={{ false: '#D7CEC6', true: palette.mint }} thumbColor={editor.form.isPinned ? palette.green : palette.muted} /></View>
      {editor.form.kind === 'event' && <EventFields form={editor.form} disabled={editor.busy} update={editor.update} />}
      <PublicationActions busy={editor.busy} hasPublication={Boolean(item?.publishedAt)} alreadyPublished={Boolean(item?.publishedAt && new Date(item.publishedAt) <= new Date())} onSave={submit} />
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}

function Field({ label, value, onChange, disabled, maxLength, placeholder, multiline = false }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; maxLength: number; placeholder: string; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} editable={!disabled} maxLength={maxLength} placeholder={placeholder} placeholderTextColor="#9B918A" multiline={multiline} style={[styles.input, multiline && styles.multiline]} /></View>;
}
