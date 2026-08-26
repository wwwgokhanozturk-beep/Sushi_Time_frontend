import { create } from 'zustand';
import httpClient from '../api/httpClient';

export const useMenuStore = create((set, get) => ({
  items: [],
  categories: ['All'],
  categoryOrder: [],
  categoryImages: {},
  categoryNames: {},
  selectedCategory: null,
  loading: false,
  error: null,

  loadMenu: async (category) => {
    set({ loading: true, error: null });
    try {
      const params = { limit: 1000, ...(category ? { category } : {}) };
      const needsMeta = get().categories.length <= 1;
      // Only the dish list is essential. The category metadata — custom order,
      // photos, renamed labels — is presentation polish, and the page falls
      // back to grouping items by their own category without it. These used to
      // share a Promise.all with the menu itself, so a single failing settings
      // endpoint rejected everything and the page showed "no items found"
      // while /menu had answered with the full catalogue.
      const optional = (make) => (needsMeta ? make().catch(() => null) : Promise.resolve(null));
      const [itemsRes, catsRes, orderRes, imagesRes, namesRes] = await Promise.all([
        httpClient.get('/menu', { params }),
        optional(() => httpClient.get('/menu/categories')),
        optional(() => httpClient.get('/settings/category-order')),
        optional(() => httpClient.get('/settings/category-images')),
        optional(() => httpClient.get('/settings/category-names')),
      ]);
      const items = itemsRes.data?.data?.items || [];
      const cats = catsRes?.data?.data?.categories;
      const order = orderRes?.data?.data?.categoryOrder;
      const images = imagesRes?.data?.data?.categoryImages;
      const catNames = namesRes?.data?.data?.categoryNames;
      set({
        items,
        loading: false,
        selectedCategory: category || null,
        ...(cats ? { categories: ['All', ...cats] } : {}),
        ...(order ? { categoryOrder: order } : {}),
        ...(images ? { categoryImages: images } : {}),
        ...(catNames ? { categoryNames: catNames } : {}),
      });
    } catch (e) {
      set({ loading: false, error: e.response?.data?.message || 'Failed to load menu' });
    }
  },

  filterByCategory: async (category) => {
    const cat = category === 'All' ? null : category;
    set({ loading: true, error: null });
    try {
      const params = { limit: 1000, ...(cat ? { category: cat } : {}) };
      const res = await httpClient.get('/menu', { params });
      set({ items: res.data?.data?.items || [], selectedCategory: cat, loading: false });
    } catch (e) {
      set({ loading: false, error: e.response?.data?.message || 'Failed to filter menu' });
    }
  },
}));
