import { create } from "zustand";
import toast from "react-hot-toast";
import { db, auth } from "../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  orderBy, 
  getDocs,
  limit,
  Timestamp,
  or,
  and,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    groups: [],
    statuses: [],
    posts: [],
    selectedUser: null,
    selectedGroup: null,
    isUsersLoading: false,
    isGroupsLoading: false,
    isMessagesLoading: false,
    unsubscribeFromMessagesListener: null,
    unsubscribeFromUsersListener: null,
    unsubscribeFromGroupsListener: null,
    unsubscribeFromStatusesListener: null,
    unsubscribeFromPostsListener: null,

    subscribeToPosts: () => {
        if (get().unsubscribeFromPostsListener) return;
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));
            set({ posts });
        });
        set({ unsubscribeFromPostsListener: unsubscribe });
    },

    unsubscribeFromPosts: () => {
        const { unsubscribeFromPostsListener } = get();
        if (unsubscribeFromPostsListener) {
            unsubscribeFromPostsListener();
            set({ unsubscribeFromPostsListener: null });
        }
    },

    createPost: async (postData) => {
        const myId = auth.currentUser?.uid;
        if (!myId) return;
        try {
            await addDoc(collection(db, "posts"), {
                userId: myId,
                text: postData.text || "",
                image: postData.image || "",
                likes: [],
                comments: [],
                createdAt: new Date().toISOString(),
            });
            toast.success("Post created!");
        } catch (error) {
            console.error("Error creating post:", error);
            toast.error("Failed to create post");
        }
    },

    togglePostLike: async (postId) => {
        const myId = auth.currentUser?.uid;
        if (!myId) return;
        try {
            const post = get().posts.find(p => p._id === postId);
            if (!post) return;
            const currentLikes = post.likes || [];
            const updatedLikes = currentLikes.includes(myId) 
                ? currentLikes.filter(id => id !== myId)
                : [...currentLikes, myId];
            
            await updateDoc(doc(db, "posts", postId), { likes: updatedLikes });
        } catch (error) {
            console.error("Error liking post:", error);
        }
    },

    subscribeToGroups: () => {
        const myId = auth.currentUser?.uid;
        if (!myId) {
            console.warn("Skipping subscribeToGroups: User not authenticated");
            return;
        }
        if (get().unsubscribeFromGroupsListener) return;

        set({ isGroupsLoading: true });
        try {
            const groupsRef = collection(db, "groups");
            const q = query(groupsRef, where("members", "array-contains", myId));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const groups = snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));
                set({ groups, isGroupsLoading: false });
            }, (error) => {
                console.error("Error subscribing to groups:", {
                    message: error.message,
                    code: error.code,
                    uid: myId
                });
                set({ isGroupsLoading: false });
                if (error.code === "permission-denied") {
                    toast.error("Group access restricted. Please try logging in again.");
                }
            });

            set({ unsubscribeFromGroupsListener: unsubscribe });
        } catch (error) {
            console.error("Critical error in subscribeToGroups:", error);
            set({ isGroupsLoading: false });
        }
    },

    unsubscribeFromGroups: () => {
        const { unsubscribeFromGroupsListener } = get();
        if (unsubscribeFromGroupsListener) {
            unsubscribeFromGroupsListener();
            set({ unsubscribeFromGroupsListener: null });
        }
    },

    subscribeToStatuses: () => {
        if (get().unsubscribeFromStatusesListener) return;

        const statusesRef = collection(db, "statuses");
        // Sort by time, but for now just live sync
        const unsubscribe = onSnapshot(statusesRef, (snapshot) => {
            const statuses = snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));
            set({ statuses });
        });

        set({ unsubscribeFromStatusesListener: unsubscribe });
    },

    unsubscribeFromStatuses: () => {
        const { unsubscribeFromStatusesListener } = get();
        if (unsubscribeFromStatusesListener) {
            unsubscribeFromStatusesListener();
            set({ unsubscribeFromStatusesListener: null });
        }
    },

    postStatus: async (statusData) => {
        const myId = auth.currentUser?.uid;
        if (!myId) return;

        try {
            await addDoc(collection(db, "statuses"), {
                userId: myId,
                text: statusData.text || "",
                mediaUrl: statusData.mediaUrl || "",
                bg: statusData.bg || "bg-primary",
                createdAt: new Date().toISOString(),
            });
            toast.success("Status posted!");
        } catch (error) {
            console.error("Error posting status:", error);
            toast.error("Failed to post status");
        }
    },

    createGroup: async (groupData) => {
        const myId = auth.currentUser?.uid;
        if (!myId) return;

        try {
            const newGroup = {
                name: groupData.name,
                members: [...groupData.members, myId],
                admins: [myId], // First admin is the creator
                settings: {
                    onlyAdminsCanMessage: false,
                },
                createdBy: myId,
                groupPic: groupData.groupPic || "",
                createdAt: new Date().toISOString(),
            };
            const docRef = await addDoc(collection(db, "groups"), newGroup);
            toast.success("Group created successfully");
            return docRef.id;
        } catch (error) {
            toast.error(error.message);
            console.error("Error creating group:", error);
        }
    },

    subscribeToUsers: () => {
        if (get().unsubscribeFromUsersListener) return;

        set({ isUsersLoading: true });
        const usersRef = collection(db, "users");
        const unsubscribe = onSnapshot(usersRef, (snapshot) => {
            const users = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (doc.id !== auth.currentUser?.uid) {
                    users.push({ ...data, _id: doc.id });
                }
            });
            set({ users, isUsersLoading: false });
        }, (error) => {
            console.error("Error subscribing to users:", error);
            set({ isUsersLoading: false });
        });

        set({ unsubscribeFromUsersListener: unsubscribe });
    },

    unsubscribeFromUsers: () => {
        const { unsubscribeFromUsersListener } = get();
        if (unsubscribeFromUsersListener) {
            unsubscribeFromUsersListener();
            set({ unsubscribeFromUsersListener: null });
        }
    },

    getUsers: async () => {
        get().subscribeToUsers();
        get().subscribeToGroups();
        get().subscribeToStatuses();
        get().subscribeToPosts();
    },

    toggleReaction: async (messageId, emoji) => {
        const myId = auth.currentUser?.uid;
        if (!myId) return;

        try {
            const { messages } = get();
            const message = messages.find((m) => m._id === messageId);
            if (!message) return;

            const currentReactions = message.reactions || {};
            const emojiUsers = currentReactions[emoji] || [];

            let updatedEmojiUsers;
            if (emojiUsers.includes(myId)) {
                // Remove reaction
                updatedEmojiUsers = emojiUsers.filter((id) => id !== myId);
            } else {
                // Add reaction
                updatedEmojiUsers = [...emojiUsers, myId];
            }

            // Clean up empty emoji arrays to keep doc clean
            const updatedReactions = {
                ...currentReactions,
                [emoji]: updatedEmojiUsers,
            };

            if (updatedEmojiUsers.length === 0) {
                delete updatedReactions[emoji];
            }

            await updateDoc(doc(db, "messages", messageId), {
                reactions: updatedReactions,
            });
        } catch (error) {
            console.error("Error toggling reaction:", error);
            toast.error("Failed to update reaction");
        }
    },

    getMessages: async (chatId, isGroup = false) => {
        set({ isMessagesLoading: true });
        try {
            const myId = auth.currentUser?.uid;
            if (!myId) return;

            const messagesRef = collection(db, "messages");
            
            // Unsubscribe from previous listener if it exists
            const currentUnsubscribe = get().unsubscribeFromMessagesListener;
            if (currentUnsubscribe) currentUnsubscribe();

            let q;
            if (isGroup) {
                // Fetch messages for the group
                q = query(
                    messagesRef,
                    where("groupId", "==", chatId),
                    orderBy("createdAt", "asc")
                );
            } else {
                // Fetch private messages
                q = query(
                    messagesRef,
                    or(
                        and(where("senderId", "==", myId), where("receiverId", "==", chatId)),
                        and(where("senderId", "==", chatId), where("receiverId", "==", myId))
                    ),
                    orderBy("createdAt", "asc")
                );
            }

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const messagesSnapshot = snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));
                const prevMessages = get().messages;
                set({ messages: messagesSnapshot });

                // Notification Logic
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const newMessage = change.doc.data();
                        const isFromMe = newMessage.senderId === myId;
                        
                        // Don't notify for my own messages or during initial load (if we have no prev messages)
                        if (!isFromMe && prevMessages.length > 0) {
                            if ("Notification" in window && Notification.permission === "granted" && document.visibilityState === "hidden") {
                                const sender = get().users.find(u => u._id === newMessage.senderId);
                                new Notification(sender ? sender.fullName : "New Message", {
                                    body: newMessage.text || "Sent an image",
                                    icon: sender?.profilePic || "/avatar.png"
                                });
                            }
                        }
                    }
                });

                // Mark received messages as read (only for private chats)
                if (!isGroup) {
                    get().markMessagesAsRead(chatId);
                }
            }, (error) => {
                console.error("Firestore message listener error:", error);
                toast.error("Failed to load messages");
            });

            set({ unsubscribeFromMessagesListener: unsubscribe });
        } catch (error) {
            console.error("Error in getMessages:", error);
            toast.error(error.message);
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    markMessagesAsRead: async (userId) => {
        const myId = auth.currentUser?.uid;
        if (!myId || !userId) return;

        try {
            const { messages } = get();
            const unreadMessages = messages.filter(
                (m) => m.senderId === userId && m.receiverId === myId && !m.isRead
            );

            if (unreadMessages.length === 0) return;

            const updatePromises = unreadMessages.map((m) =>
                updateDoc(doc(db, "messages", m._id), { isRead: true })
            );
            await Promise.all(updatePromises);
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, selectedGroup } = get();
        const myId = auth.currentUser?.uid;
        if (!myId || (!selectedUser && !selectedGroup)) return;

        try {
            const newMessage = {
                senderId: myId,
                text: messageData.text || "",
                image: messageData.image || "",
                createdAt: new Date().toISOString(),
                reactions: {},
            };

            if (selectedGroup) {
                newMessage.groupId = selectedGroup._id;
            } else {
                newMessage.receiverId = selectedUser._id;
                newMessage.isRead = false;
            }

            await addDoc(collection(db, "messages"), newMessage);
        } catch (error) {
            toast.error(error.message);
        }
    },

    unsubscribeFromMessages: () => {
        const { unsubscribeFromMessagesListener } = get();
        if (unsubscribeFromMessagesListener) {
            unsubscribeFromMessagesListener();
            set({ unsubscribeFromMessagesListener: null });
        }
    },

    deleteMessage: async (messageId) => {
        try {
            await deleteDoc(doc(db, "messages", messageId));
            toast.success("Message deleted");
        } catch (error) {
            console.error("Error deleting message:", error);
            toast.error("Failed to delete message");
        }
    },

    updateGroup: async (groupId, updateData) => {
        try {
            await updateDoc(doc(db, "groups", groupId), updateData);
            set((state) => ({
                selectedGroup: state.selectedGroup?._id === groupId 
                    ? { ...state.selectedGroup, ...updateData } 
                    : state.selectedGroup
            }));
            toast.success("Group updated successfully");
        } catch (error) {
            console.error("Error updating group:", error);
            toast.error("Failed to update group settings");
        }
    },

    setSelectedUser: (selectedUser) => {
        get().unsubscribeFromMessages();
        set({ selectedUser, selectedGroup: null });
        if (selectedUser) {
            get().getMessages(selectedUser._id, false);
        }
    },

    setSelectedGroup: (selectedGroup) => {
        get().unsubscribeFromMessages();
        set({ selectedGroup, selectedUser: null });
        if (selectedGroup) {
            get().getMessages(selectedGroup._id, true);
        }
    },
}));
