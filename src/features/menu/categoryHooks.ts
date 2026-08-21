import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { safeErrorMessage } from '../../lib/errors';
import { MenuCategoryIconKey } from '../../lib/menuCategoryIcons';

import {
  addDefaultMenuCategories,
  checkMenuCategoryName,
  deleteMenuCategory,
  getBusinessMenu,
  saveMenuCategory,
} from './api';
import { menuKeys } from './queryKeys';
import { MenuCategory } from './types';
import { menuCategoryInputSchema, normalizeMenuCategoryName } from './validation';

type CategoryEditor = MenuCategory | 'new' | null;

export function useCategoryManager(businessId: string, initialCreate = false) {
  const client = useQueryClient();
  const queryKey = menuKeys.business(businessId);
  const menuQuery = useQuery({
    queryKey,
    queryFn: () => getBusinessMenu(businessId),
    meta: { persist: false },
  });
  const [editor, setEditor] = useState<CategoryEditor>(initialCreate ? 'new' : null);
  const [name, setNameValue] = useState('');
  const [iconKey, setIconKey] = useState<MenuCategoryIconKey>('other');
  const [debouncedName, setDebouncedName] = useState('');
  const [confirmedSimilarName, setConfirmedSimilarName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const normalizedName = normalizeMenuCategoryName(name);
  const parsedName = menuCategoryInputSchema.safeParse({ name, iconKey });
  const editingCategory = editor && editor !== 'new' ? editor : null;

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedName(normalizedName), 250);
    return () => clearTimeout(timeout);
  }, [normalizedName]);

  const nameCheck = useQuery({
    queryKey: menuKeys.categoryName(businessId, editingCategory?.id ?? null, debouncedName),
    queryFn: () => checkMenuCategoryName(businessId, debouncedName, editingCategory?.id ?? null),
    enabled: Boolean(editor && parsedName.success && debouncedName === normalizedName),
    staleTime: 0,
    meta: { persist: false },
  });

  const invalidate = () => client.invalidateQueries({ queryKey });
  const saveMutation = useMutation({
    mutationFn: () => {
      if (!parsedName.success) throw new Error(parsedName.error.issues[0]?.message ?? 'Check the name.');
      return saveMenuCategory(
        businessId,
        editingCategory?.id ?? null,
        parsedName.data,
        confirmedSimilarName === normalizedName,
      );
    },
    onSuccess: async (saved) => {
      setEditor(null);
      setNameValue('');
      setIconKey('other');
      setConfirmedSimilarName(null);
      setSuccessMessage(`${saved.name} saved.`);
      await invalidate();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => deleteMenuCategory(businessId, categoryId),
    onSuccess: async () => {
      setSuccessMessage('Category deleted. Its items are now uncategorized.');
      await invalidate();
    },
  });
  const defaultsMutation = useMutation({
    mutationFn: () => addDefaultMenuCategories(businessId),
    onSuccess: async () => {
      setSuccessMessage('Starter categories added.');
      await invalidate();
    },
  });

  const categories = menuQuery.data?.categories ?? [];
  const itemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of menuQuery.data?.items ?? []) {
      if (item.categoryId) counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [menuQuery.data?.items]);
  const exactMatch = nameCheck.data?.exact ?? null;
  const similarMatches = nameCheck.data?.similar ?? [];
  const checkingName = Boolean(
    editor && parsedName.success && (debouncedName !== normalizedName || nameCheck.isFetching),
  );
  const similarConfirmed = confirmedSimilarName === normalizedName;
  const busy = saveMutation.isPending || deleteMutation.isPending || defaultsMutation.isPending;

  const openEditor = (next: MenuCategory | 'new') => {
    saveMutation.reset();
    deleteMutation.reset();
    defaultsMutation.reset();
    setEditor(next);
    setNameValue(next === 'new' ? '' : next.name);
    setIconKey(next === 'new' ? 'other' : next.iconKey);
    setDebouncedName(next === 'new' ? '' : normalizeMenuCategoryName(next.name));
    setConfirmedSimilarName(null);
    setValidationError(null);
    setSuccessMessage(null);
  };
  const closeEditor = () => {
    if (busy) return;
    setEditor(null);
    setNameValue('');
    setIconKey('other');
    setValidationError(null);
    setConfirmedSimilarName(null);
  };
  const setName = (value: string) => {
    setNameValue(value);
    setValidationError(null);
    setConfirmedSimilarName(null);
  };
  const save = async () => {
    setValidationError(null);
    if (!parsedName.success) {
      setValidationError(parsedName.error.issues[0]?.message ?? 'Check the category name.');
      return;
    }
    if (checkingName || nameCheck.error) return;
    if (exactMatch) {
      setValidationError(`“${exactMatch.categoryName}” already exists.`);
      return;
    }
    if (similarMatches.length > 0 && !similarConfirmed) return;
    try {
      await saveMutation.mutateAsync();
    } catch (caught) {
      setConfirmedSimilarName(null);
      await nameCheck.refetch();
      setValidationError(safeErrorMessage(caught, 'Could not save this category.'));
    }
  };
  return {
    categories,
    itemCounts,
    editor,
    name,
    iconKey,
    exactMatch,
    similarMatches,
    similarConfirmed,
    checkingName,
    nameCheckFailed: Boolean(nameCheck.error),
    loading: menuQuery.isLoading,
    busy,
    error: menuQuery.error
      ? safeErrorMessage(menuQuery.error, 'Could not load categories.')
      : deleteMutation.error || defaultsMutation.error
        ? safeErrorMessage(deleteMutation.error ?? defaultsMutation.error, 'Could not update categories.')
        : null,
    editorError: validationError
      ? validationError
      : nameCheck.error
        ? safeErrorMessage(nameCheck.error, 'Could not check this category name.')
        : null,
    successMessage,
    openEditor,
    closeEditor,
    setName,
    setIconKey,
    confirmSimilar: () => setConfirmedSimilarName(normalizedName),
    retryNameCheck: () => void nameCheck.refetch(),
    save,
    remove: (categoryId: string) => deleteMutation.mutateAsync(categoryId),
    addDefaults: () => defaultsMutation.mutateAsync(),
    refresh: invalidate,
  };
}
