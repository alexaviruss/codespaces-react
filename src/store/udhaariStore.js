import { create } from "zustand";

export const useUdhaariStore = create((set) => ({
  udhaariList: [],
  loading: false,
  setUdhaariList: (udhaariList) => set({ udhaariList }),
  addUdhaariStore: (item) =>
    set((state) => ({ udhaariList: [item, ...state.udhaariList] })),
  setLoading: (loading) => set({ loading }),
}));