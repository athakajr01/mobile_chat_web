import { create } from "zustand";
import { auth, db } from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import toast from "react-hot-toast";

import { useCallStore } from "./useCallStore";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    unsubscribeFromOnlineUsersListener: null,

    checkAuth: async () => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    set({ authUser: { ...docSnap.data(), _id: user.uid } });
                } else {
                    set({ authUser: null });
                }

                // Set online status
                await updateDoc(docRef, { isOnline: true });

                // Subscribe to online users (only if not already subscribed)
                if (!get().unsubscribeFromOnlineUsersListener) {
                    const usersRef = collection(db, "users");
                    const q = query(usersRef, where("isOnline", "==", true));
                    const unsubscribe = onSnapshot(q, (snapshot) => {
                        const onlineIds = snapshot.docs.map(doc => doc.id);
                        set({ onlineUsers: onlineIds });
                    });
                    set({ unsubscribeFromOnlineUsersListener: unsubscribe });
                }
            } else {
                set({ authUser: null });
                // Cleanup online listener
                const currentUnsubscribe = get().unsubscribeFromOnlineUsersListener;
                if (currentUnsubscribe) {
                    currentUnsubscribe();
                    set({ unsubscribeFromOnlineUsersListener: null });
                }
            }
            set({ isCheckingAuth: false });
        });
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;
            
            const userData = {
                fullName: data.fullName,
                email: data.email,
                profilePic: "",
                createdAt: new Date().toISOString(),
            };

            await setDoc(doc(db, "users", user.uid), userData);
            set({ authUser: { ...userData, _id: user.uid } });
            toast.success("Account created successfully");
        } catch (error) {
            toast.error(error.message);
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;
            
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                await updateDoc(docRef, { isOnline: true });
                set({ authUser: { ...docSnap.data(), _id: user.uid } });
                toast.success("Logged in successfully");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const docRef = doc(db, "users", user.uid);
                await updateDoc(docRef, { isOnline: false });
            }
            useCallStore.getState().destroyPeer();
            await signOut(auth);
            set({ authUser: null });
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error(error.message);
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No user logged in");

            const docRef = doc(db, "users", user.uid);
            await updateDoc(docRef, { profilePic: data.profilePic });
            
            set((state) => ({
                authUser: { ...state.authUser, profilePic: data.profilePic }
            }));
            toast.success("Profile updated successfully");
        } catch (error) {
            console.log("error in update profile:", error);
            toast.error(error.message);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    setTypingStatus: async (receiverId) => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            const docRef = doc(db, "users", user.uid);
            await updateDoc(docRef, { typingTo: receiverId });
        } catch (error) {
            console.error("Error setting typing status:", error);
        }
    },
}));
