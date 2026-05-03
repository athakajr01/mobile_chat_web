import { create } from "zustand";

export const useChatSettingsStore = create((set) => ({
  showUnreadBadges: localStorage.getItem("chat-showUnreadBadges") !== "false",
  showDateHeaders: localStorage.getItem("chat-showDateHeaders") !== "false",
  mergeGroupsWithChats: localStorage.getItem("chat-mergeGroups") !== "false",
  
  setShowUnreadBadges: (show) => {
    localStorage.setItem("chat-showUnreadBadges", show);
    set({ showUnreadBadges: show });
  },
  setShowDateHeaders: (show) => {
    localStorage.setItem("chat-showDateHeaders", show);
    set({ showDateHeaders: show });
  },
  setMergeGroupsWithChats: (merge) => {
    localStorage.setItem("chat-mergeGroups", merge);
    set({ mergeGroupsWithChats: merge });
  },
}));
