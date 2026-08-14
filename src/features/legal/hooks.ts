import { useCallback, useEffect, useState } from 'react';
import { hasPermission } from '../business/permissions';
import { Workspace } from '../business/types';
import { approveLegalProfile, getLegalProfile, requestLegalProfileChanges, saveLegalProfile, submitLegalProfile } from './api';
import { BusinessLegalProfile, BusinessLegalProfileInput } from './types';
import { firstValidationMessage, legalDraftSchema, legalSubmissionSchema, normalizeLegalInput } from './validation';

export function useLegalProfile(workspace: Workspace) {
  const [profile, setProfile] = useState<BusinessLegalProfile | null>(null);
  const [form, setForm] = useState<BusinessLegalProfileInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getLegalProfile(workspace.business.id);
      setProfile(next);
      setForm(toInput(next));
      setDirty(false);
    } catch (caught) {
      setError(messageFrom(caught, 'Legal information is unavailable.'));
    } finally {
      setLoading(false);
    }
  }, [workspace.business.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const update = <Key extends keyof BusinessLegalProfileInput>(key: Key, value: BusinessLegalProfileInput[Key]) => {
    setForm((current) => current ? { ...current, [key]: value } : current);
    setDirty(true);
    setError(null);
  };

  const run = async (operation: () => Promise<BusinessLegalProfile>) => {
    setBusy(true);
    setError(null);
    try {
      const next = await operation();
      setProfile(next);
      setForm(toInput(next));
      setDirty(false);
      return next;
    } catch (caught) {
      const message = messageFrom(caught, 'Could not update the legal profile.');
      setError(message);
      throw new Error(message);
    } finally {
      setBusy(false);
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
    profile, form, loading, busy, dirty, error, refresh, update, save, submit,
    approve: () => profile ? run(() => approveLegalProfile(profile.businessId, profile.revision)) : Promise.reject(new Error('Legal information is still loading.')),
    requestChanges: (note: string) => profile ? run(() => requestLegalProfileChanges(profile.businessId, profile.revision, note)) : Promise.reject(new Error('Legal information is still loading.')),
    canWrite: hasPermission(workspace.role, 'legal.write'),
    canApprove: hasPermission(workspace.role, 'legal.approve'),
  };
}

function toInput(profile: BusinessLegalProfile): BusinessLegalProfileInput {
  const { entityType, legalName, tradingName, registeredAddressLine1, registeredAddressLine2,
    registeredTownCity, registeredCounty, registeredPostcode, contactEmail, contactPhone,
    companyNumber, charityNumber, vatRegistered, vatNumber } = profile;
  return { entityType, legalName, tradingName, registeredAddressLine1, registeredAddressLine2,
    registeredTownCity, registeredCounty, registeredPostcode, contactEmail, contactPhone,
    companyNumber, charityNumber, vatRegistered, vatNumber };
}

function messageFrom(caught: unknown, fallback: string) {
  if (!caught || typeof caught !== 'object') return fallback;
  const message = 'message' in caught && typeof caught.message === 'string' ? caught.message : fallback;
  if (/changed\. refresh/i.test(message)) return 'Someone else changed this legal profile. Refresh before continuing.';
  return message;
}
