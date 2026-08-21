import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';

import {
  BusinessApplicationInput,
  businessApplicationInputSchema,
  businessProfileInputSchema,
} from '../../lib/businessValidation';
import { safeErrorMessage } from '../../lib/errors';
import {
  inferProfileImageMime,
  validateProfileImageBytes,
  validateProfileImageMetadata,
} from '../../lib/profileImage';
import { supabase } from '../../lib/supabase';
import { businessBrandPaletteSchema, DEFAULT_BUSINESS_PALETTE } from '../branding/theme';
import { BusinessBrandPalette } from '../branding/types';

import {
  getBusinessApplication,
  getBusinessHours,
  getBusinessWorkspace,
  getPlatformAdminStatus,
  getReviewApplications,
  reviewBusinessApplication,
  saveBusinessApplication,
  saveBusinessProfile,
  submitBusinessApplication,
} from './api';
import {
  Application,
  createDefaultHours,
  DayHours,
  ReviewApplication,
  SelectedMedia,
  Workspace,
} from './types';

export function useBusinessAccess(userId: string) {
  const queryKey = ['business-access', userId] as const;
  const client = useQueryClient();
  const query = useQuery({
    queryKey,
    enabled: Boolean(userId),
    meta: { persist: false },
    queryFn: async () => {
      const [workspace, isPlatformAdmin] = await Promise.all([
        getBusinessWorkspace(userId),
        getPlatformAdminStatus(userId),
      ]);
      return {
        workspace,
        isPlatformAdmin,
        application: workspace ? null : await getBusinessApplication(userId),
      };
    },
  });
  return {
    loading: query.isLoading,
    error: query.error ? message(query.error, 'Business area unavailable.') : null,
    application: query.data?.application ?? null,
    workspace: query.data?.workspace ?? null,
    isPlatformAdmin: query.data?.isPlatformAdmin ?? false,
    refresh: () => client.invalidateQueries({ queryKey }),
  };
}

export function useApplicationReviews() {
  const [selected, setSelected] = useState<ReviewApplication | null>(null);
  const queryKey = ['business-applications', 'review'] as const;
  const client = useQueryClient();
  const query = useQuery({ queryKey, queryFn: getReviewApplications, meta: { persist: false } });
  const decision = useMutation({
    mutationFn: ({ id, approved, reason }: { id: string; approved: boolean; reason: string | null }) =>
      reviewBusinessApplication(id, approved, reason),
    onSuccess: async () => {
      setSelected(null);
      await client.invalidateQueries({ queryKey });
    },
  });
  const decide = async (approved: boolean, reason: string | null) => {
    if (!selected) return;
    await decision.mutateAsync({ id: selected.id, approved, reason });
  };
  return {
    applications: query.data ?? [],
    selected,
    setSelected,
    loading: query.isLoading,
    busy: decision.isPending,
    error: query.error ? message(query.error, 'Could not load applications.') : null,
    refresh: () => client.invalidateQueries({ queryKey }),
    decide,
  };
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
    try {
      await persist();
    } finally {
      setBusy(false);
    }
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

function message(error: unknown, fallback: string) {
  return safeErrorMessage(error, fallback);
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
  const { error } = await supabase.storage
    .from('business-media')
    .upload(path, bytes, { contentType: media.mimeType });
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
  const [brandPalette, setBrandPalette] = useState<BusinessBrandPalette>(workspace.business.brandPalette);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!workspace.location) return;
    let active = true;
    getBusinessHours(workspace.location.id)
      .then((rows) => {
        if (!active) return;
        if (rows.length) {
          const byDay = new Map(rows.map((row) => [row.day_of_week, row]));
          setHours(
            createDefaultHours().map((fallback) => {
              const row = byDay.get(fallback.dayOfWeek);
              return row
                ? {
                    dayOfWeek: row.day_of_week,
                    opensAt: row.opens_at ?? fallback.opensAt,
                    closesAt: row.closes_at ?? fallback.closesAt,
                    isClosed: row.is_closed,
                  }
                : fallback;
            }),
          );
        }
      })
      .finally(() => active && setHoursLoading(false));
    return () => {
      active = false;
    };
  }, [workspace.location]);

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const updateHours = (index: number, patch: Partial<DayHours>) =>
    setHours((current) => current.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)));
  const pickMedia = async (kind: 'logo' | 'header') => {
    const media = await chooseMedia(kind);
    if (kind === 'logo') setLogo(media);
    else setHeader(media);
  };

  const save = async () => {
    const parsed = businessProfileInputSchema.safeParse(form);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Some details are invalid.');
    const parsedPalette = businessBrandPaletteSchema.safeParse(brandPalette);
    if (!parsedPalette.success)
      throw new Error(parsedPalette.error.issues[0]?.message ?? 'Choose accessible brand colours.');
    setBusy(true);
    const uploadedPaths: string[] = [];
    try {
      let logoUrl = workspace.business.logoUrl;
      let headerUrl = workspace.business.headerUrl;
      if (logo) {
        const uploaded = await uploadMedia(workspace.business.id, 'logo', logo);
        logoUrl = uploaded.url;
        uploadedPaths.push(uploaded.path);
      }
      if (header) {
        const uploaded = await uploadMedia(workspace.business.id, 'header', header);
        headerUrl = uploaded.url;
        uploadedPaths.push(uploaded.path);
      }
      await saveBusinessProfile(
        workspace,
        parsed.data,
        published,
        hours,
        { logoUrl, headerUrl },
        parsedPalette.data,
      );
      onSaved();
    } catch (error) {
      if (uploadedPaths.length) await supabase.storage.from('business-media').remove(uploadedPaths);
      throw error;
    } finally {
      setBusy(false);
    }
  };

  return {
    form,
    update,
    published,
    setPublished,
    hours,
    updateHours,
    hoursLoading,
    logo,
    header,
    brandPalette,
    updateBrandPalette: (key: keyof BusinessBrandPalette, value: string) =>
      setBrandPalette((current) => ({ ...current, [key]: value })),
    resetBrandPalette: () => setBrandPalette(DEFAULT_BUSINESS_PALETTE),
    brandPaletteError: (() => {
      const result = businessBrandPaletteSchema.safeParse(brandPalette);
      return result.success ? null : (result.error.issues[0]?.message ?? 'Choose accessible brand colours.');
    })(),
    pickMedia,
    busy,
    save,
  };
}
