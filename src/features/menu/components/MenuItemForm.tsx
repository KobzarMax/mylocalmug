import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../../lib/design';
import { useMenuItemEditor } from '../hooks';
import { styles } from '../styles';
import { MenuCategory, MenuItem } from '../types';
import { MenuHeader } from './MenuUI';

export function MenuItemForm({ businessId, item, categories, onBack, onSaved }: {
  businessId: string;
  item: MenuItem | null;
  categories: MenuCategory[];
  onBack: () => void;
  onSaved: () => void;
}) {
  const editor = useMenuItemEditor(businessId, item, categories, onSaved);
  const submit = () => editor.submit().catch((caught) => {
    Alert.alert('Could not save item', caught instanceof Error ? caught.message : 'Please try again.');
  });
  const pickPhoto = () => editor.pickPhoto().catch((caught) => {
    Alert.alert('Could not choose photo', caught instanceof Error ? caught.message : 'Please try again.');
  });

  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <MenuHeader title={item ? 'Edit menu item' : 'New menu item'} onBack={onBack} />
        <Text style={styles.intro}>Keep customer-facing details concise and mark an item unavailable instead of deleting it temporarily.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={editor.previewUrl ? 'Replace menu item photo' : 'Choose menu item photo'} disabled={editor.busy} onPress={pickPhoto} style={styles.photoPicker}>
          {editor.previewUrl ? <Image source={{ uri: editor.previewUrl }} style={styles.photoPreview} /> : <><Ionicons name="image-outline" size={34} color={palette.green} /><Text style={styles.secondaryText}>Choose item photo</Text></>}
          {editor.previewUrl && <View style={styles.photoOverlay}>
            <Pressable disabled={editor.busy} onPress={(event) => { event.stopPropagation(); pickPhoto(); }} style={styles.photoAction}><Ionicons name="image-outline" size={16} color={palette.paper} /><Text style={styles.photoActionText}>Replace</Text></Pressable>
            <Pressable disabled={editor.busy} onPress={(event) => { event.stopPropagation(); editor.clearPhoto(); }} style={styles.photoAction}><Ionicons name="trash-outline" size={16} color={palette.paper} /><Text style={styles.photoActionText}>Remove</Text></Pressable>
          </View>}
        </Pressable>

        <View style={styles.field}><Text style={styles.label}>Item name</Text><TextInput value={editor.form.name} onChangeText={(value) => editor.update('name', value)} editable={!editor.busy} maxLength={100} placeholder="Flat white" placeholderTextColor="#9B918A" style={styles.input} /></View>
        <View style={styles.field}><Text style={styles.label}>Description</Text><TextInput value={editor.form.description} onChangeText={(value) => editor.update('description', value)} editable={!editor.busy} maxLength={500} multiline placeholder="Double espresso with silky steamed milk" placeholderTextColor="#9B918A" style={[styles.input, styles.multiline]} /></View>
        <View style={styles.field}><Text style={styles.label}>Price (£)</Text><TextInput value={editor.form.price} onChangeText={(value) => editor.update('price', value)} editable={!editor.busy} keyboardType="decimal-pad" maxLength={11} placeholder="3.50" placeholderTextColor="#9B918A" style={styles.input} /></View>
        <View style={styles.field}><Text style={styles.label}>Category</Text><View style={styles.categoryOptions}>
          <CategoryOption label="Uncategorized" active={editor.form.categoryId === null} onPress={() => editor.update('categoryId', null)} />
          {categories.map((category) => <CategoryOption key={category.id} label={category.name} active={editor.form.categoryId === category.id} onPress={() => editor.update('categoryId', category.id)} />)}
        </View></View>
        <View style={styles.availabilityRow}><View style={styles.availabilityCopy}><Text style={styles.availabilityTitle}>Available to order</Text><Text style={styles.availabilityHint}>Turn this off when an item is temporarily sold out.</Text></View><Switch value={editor.form.isAvailable} onValueChange={(value) => editor.update('isAvailable', value)} disabled={editor.busy} trackColor={{ false: '#D7CEC6', true: palette.mint }} thumbColor={editor.form.isAvailable ? palette.green : palette.muted} /></View>
        <Pressable disabled={editor.busy} onPress={submit} style={[styles.submitButton, editor.busy && styles.disabled]}>{editor.busy ? <ActivityIndicator color={palette.paper} /> : <Text style={styles.submitText}>Save menu item</Text>}</Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function CategoryOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.categoryOption, active && styles.categoryOptionActive]}><Text style={[styles.categoryOptionText, active && styles.categoryOptionTextActive]}>{label}</Text></Pressable>;
}
