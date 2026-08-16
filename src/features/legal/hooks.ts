import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { safeErrorMessage } from '../../lib/errors';
import { hasPermission } from '../business/permissions';
import { Workspace } from '../business/types';

import {
  approveLegalProfile,
  getLegalProfile,
  requestLegalProfileChanges,
  saveLegalProfile,
  submitLegalProfile,
} from './api';
import { BusinessLegalProfile, BusinessLegalProfileInput } from './types';
import {
  firstValidationMessage,
  legalDraftSchema,
  legalSubmissionSchema,
  normalizeLegalInput,
} from './validation';

export function useLegalProfile(workspace: Workspace) {
  const [form, setForm] = useState<BusinessLegalProfileInput | null>(null);
  const [dirty, setDirty] = useState(false);
  const queryKey = ['business-legal-profile', workspace.business.id] as const;
  const client = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: () => getLegalProfile(workspace.business.id),
    meta: { persist: false },
  });
  const mutation = useMutation({
    mutationFn: (operation: () => Promise<BusinessLegalProfile>) => operation(),
    onSuccess: (next) => {
      client.setQueryData(queryKey, next);
      setForm(toInput(next));
      setDirty(false);
    },
  });
  const profile = query.data ?? null;
  useEffect(() => {
    if (query.data && !dirty) setForm(toInput(query.data));
  }, [dirty, query.data]);

  const update = <Key extends keyof BusinessLegalProfileInput>(
    key: Key,
    value: BusinessLegalProfileInput[Key],
  ) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setDirty(true);
  };

  const run = async (operation: () => Promise<BusinessLegalProfile>) => {
    try {
      return await mutation.mutateAsync(operation);
    } catch (caught) {
      const message = messageFrom(caught, 'Could not update the legal profile.');
      throw new Error(message);
    }
  };

  const validated = (submission: boolean) => {
    if (!form) throw new Error('Legal information is still loading.');
    const normalized = normalizeLegalInput(form);
    const parsed = (submission ? legalSubmissionSchema : legalDraftSchema).safeParse(normalized);
    if (!parsed.success) throw new Error(firstValidationMessage(parsed.error));
    return parsed.data;
  };

  const save = () => {
    if (!profile) return Promise.reject(new Error('Legal information is still loading.'));
    const input = validated(false);
    return run(() => saveLegalProfile(profile.businessId, profile.revision, input));
  };
  const submit = async () => {
    if (!profile) throw new Error('Legal information is still loading.');
    const input = validated(true);
    return run(async () => {
      const saved = dirty ? await saveLegalProfile(profile.businessId, profile.revision, input) : profile;
      return submitLegalProfile(saved.businessId, saved.revision);
    });
  };

  return {
    profile,
    form,
    loading: query.isLoading,
    busy: mutation.isPending,
    dirty,
    error: query.error
      ? messageFrom(query.error, 'Legal information is unavailable.')
      : mutation.error
        ? messageFrom(mutation.error, 'Could not update the legal profile.')
        : null,
    refresh: () => client.invalidateQueries({ queryKey }),
    update,
    save,
    submit,
    approve: () =>
      profile
        ? run(() => approveLegalProfile(profile.businessId, profile.revision))
        : Promise.reject(new Error('Legal information is still loading.')),
    requestChanges: (note: string) =>
      profile
        ? run(() => requestLegalProfileChanges(profile.businessId, profile.revision, note))
        : Promise.reject(new Error('Legal information is still loading.')),
    canWrite: hasPermission(workspace.role, 'legal.write'),
    canApprove: hasPermission(workspace.role, 'legal.approve'),
  };
}

function toInput(profile: BusinessLegalProfile): BusinessLegalProfileInput {
  const {
    entityType,
    legalName,
    tradingName,
    registeredAddressLine1,
    registeredAddressLine2,
    registeredTownCity,
    registeredCounty,
    registeredPostcode,
    contactEmail,
    contactPhone,
    companyNumber,
    charityNumber,
    vatRegistered,
    vatNumber,
  } = profile;
  return {
    entityType,
    legalName,
    tradingName,
    registeredAddressLine1,
    registeredAddressLine2,
    registeredTownCity,
    registeredCounty,
    registeredPostcode,
    contactEmail,
    contactPhone,
    companyNumber,
    charityNumber,
    vatRegistered,
    vatNumber,
  };
}

function messageFrom(caught: unknown, fallback: string) {
  if (!caught || typeof caught !== 'object') return fallback;
  const message = 'message' in caught && typeof caught.message === 'string' ? caught.message : fallback;
  if (/changed\. refresh/i.test(message))
    return 'Someone else changed this legal profile. Refresh before continuing.';
  return safeErrorMessage(caught, fallback);
}
