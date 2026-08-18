export const menuKeys = {
  business: (businessId: string) => ['business-menu', businessId] as const,
  categoryName: (businessId: string, categoryId: string | null, normalizedName: string) =>
    ['business-menu', businessId, 'category-name', categoryId, normalizedName] as const,
};
