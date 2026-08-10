import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { BusinessApplicationInput, businessApplicationInputSchema, businessProfileInputSchema } from '../../lib/businessValidation';
import { inferProfileImageMime, validateProfileImageBytes, validateProfileImageMetadata } from '../../lib/profileImage';
import { supabase } from '../../lib/supabase';
import {
  getBusinessApplication,
  getBusinessHours,
  getBusinessWorkspace,
  saveBusinessApplication,
  saveBusinessProfile,
  submitBusinessApplication,
} from './api';
import { Application, createDefaultHours, DayHours, SelectedMedia, Workspace } from './types';

export function useBusinessAccess(userId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextWorkspace = await getBusinessWorkspace(userId);
      setWorkspace(nextWorkspace);
      setApplication(nextWorkspace ? null : await getBusinessApplication(userId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Business area unavailable.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { loading, error, application, workspace, refresh };
}

export function useBusinessApplication(userId: string, initial: Application, onSubmitted: () => void) {
  const [form, setForm] = useState<BusinessApplicationInput>(initial);
  const [applicationId, setApplicationId] = useState(initial.id);
  const [busy, setBusy] = useState(false);
  const [lastSaved, setLastSaved] = useState(false);

  const update = (key: keyof BusinessApplicationInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setLastSaved(false);
  };

  const persist = async () => {
    const parsed = businessApplicationInputSchema.safeParse(form);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Some details are invalid.');
    const id = await saveBusinessApplication(userId, applicationId, parsed.data);
    setApplicationId(id);
    setLastSaved(true);
    return id;
  };

  const saveDraft = async () => {
    setBusy(true);
    try { await persist(); } finally { setBusy(false); }
  };

  const submit = async () => {
    setBusy(true);
    try {
      const id = await persist();
      await submitBusinessApplication(id);
      onSubmitted();
    } finally {
      setBusy(false);
    }
  };

  return { form, update, busy, lastSaved, saveDraft, submit };
}

async function chooseMedia(kind: 'logo' | 'header'): Promise<SelectedMedia | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: kind === 'logo' ? [1, 1] : [16, 9],
    quality: 0.85,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const mimeType = inferProfileImageMime(asset.mimeType, asset.fileName ?? asset.uri);
  if (!mimeType) throw new Error('Choose a JPEG, PNG, or WebP image.');
  const response = await fetch(asset.uri);
  const bytes = await response.arrayBuffer();
  validateProfileImageMetadata(mimeType, bytes.byteLength);
  validateProfileImageBytes(bytes, mimeType);
  return { uri: asset.uri, mimeType };
}

async function uploadMedia(businessId: string, kind: 'logo' | 'header', media: SelectedMedia) {
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[media.mimeType];
  const path = `${businessId}/${kind}-${Date.now()}.${extension}`;
  const response = await fetch(media.uri);
  const bytes = await response.arrayBuffer();
  const { error } = await supabase.storage.from('business-media').upload(path, bytes, { contentType: media.mimeType });
  if (error) throw error;
  return { path, url: supabase.storage.from('business-media').getPublicUrl(path).data.publicUrl };
}

export function useBusinessProfile(workspace: Workspace, onSaved: () => void) {
  const [form, setForm] = useState({
    name: workspace.business.name,
    description: workspace.business.description,
    category: workspace.business.category,
    contactEmail: workspace.business.contactEmail,
    contactPhone: workspace.business.contactPhone,
    websiteUrl: workspace.business.websiteUrl,
    address: workspace.location?.address || workspace.business.address,
  });
  const [published, setPublished] = useState(workspace.business.isPublished);
  const [hours, setHours] = useState<DayHours[]>(createDefaultHours);
  const [hoursLoading, setHoursLoading] = useState(Boolean(workspace.location));
  const [logo, setLogo] = useState<SelectedMedia | null>(null);
  const [header, setHeader] = useState<SelectedMedia | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!workspace.location) return;
    let active = true;
    getBusinessHours(workspace.location.id).then((rows) => {
      if (!active) return;
      if (rows.length) {
        const byDay = new Map(rows.map((row) => [row.day_of_week, row]));
        setHours(createDefaultHours().map((fallback) => {
          const row = byDay.get(fallback.dayOfWeek);
          return row ? { dayOfWeek: row.day_of_week, opensAt: row.opens_at ?? fallback.opensAt, closesAt: row.closes_at ?? fallback.closesAt, isClosed: row.is_closed } : fallback;
        }));
      }
    }).finally(() => active && setHoursLoading(false));
    return () => { active = false; };
  }, [workspace.location]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const updateHours = (index: number, patch: Partial<DayHours>) => setHours((current) => current.map((day, dayIndex) => dayIndex === index ? { ...day, ...patch } : day));
  const pickMedia = async (kind: 'logo' | 'header') => {
    const media = await chooseMedia(kind);
    if (kind === 'logo') setLogo(media); else setHeader(media);
  };

  const save = async () => {
    const parsed = businessProfileInputSchema.safeParse(form);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Some details are invalid.');
    setBusy(true);
    const uploadedPaths: string[] = [];
    try {
      let logoUrl = workspace.business.logoUrl;
      let headerUrl = workspace.business.headerUrl;
      if (logo) { const uploaded = await uploadMedia(workspace.business.id, 'logo', logo); logoUrl = uploaded.url; uploadedPaths.push(uploaded.path); }
      if (header) { const uploaded = await uploadMedia(workspace.business.id, 'header', header); headerUrl = uploaded.url; uploadedPaths.push(uploaded.path); }
      await saveBusinessProfile(workspace, parsed.data, published, hours, { logoUrl, headerUrl });
      onSaved();
    } catch (error) {
      if (uploadedPaths.length) await supabase.storage.from('business-media').remove(uploadedPaths);
      throw error;
    } finally {
      setBusy(false);
    }
  };

  return { form, update, published, setPublished, hours, updateHours, hoursLoading, logo, header, pickMedia, busy, save };
}
