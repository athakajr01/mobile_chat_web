import { create } from "zustand";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, deleteDoc } from "firebase/firestore";
import Peer from "peerjs";
import toast from "react-hot-toast";

export const useCallStore = create((set, get) => ({
    peer: null,
    myPeerId: null,
    activeCall: null, // Firestore call document data
    callId: null,
    localStream: null,
    remoteStream: null,
    isIncomingCall: false,
    isCallActive: false,
    isMicMuted: false,
    isCameraOff: false,
    peerCall: null, // The PeerJS call object

    initPeer: () => {
        if (get().peer) return;

        // PeerJS initialization
        const peer = new Peer();
        
        peer.on("open", (id) => {
            console.log("PeerJS opened with ID:", id);
            set({ myPeerId: id });
        });

        peer.on("call", (call) => {
            // This is for the receiver side when caller initiates the media stream
            set({ peerCall: call });
        });

        peer.on("error", (err) => {
            console.error("PeerJS error:", err);
            // toast.error("Call error: " + err.type);
        });

        set({ peer });

        // Listen for incoming call requests in Firestore
        const myUid = auth.currentUser?.uid;
        if (myUid) {
            const callsRef = collection(db, "calls");
            const q = query(callsRef, where("receiverId", "==", myUid), where("status", "==", "ringing"));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                if (!snapshot.empty && !get().isCallActive && !get().isIncomingCall) {
                    const callDoc = snapshot.docs[0];
                    set({ 
                        activeCall: { ...callDoc.data(), _id: callDoc.id },
                        callId: callDoc.id,
                        isIncomingCall: true 
                    });
                }
            });
            return unsubscribe;
        }
    },

    destroyPeer: () => {
        const { peer } = get();
        if (peer) {
            peer.destroy();
        }
        set({ peer: null, myPeerId: null });
    },

    startCall: async (receiverId, type) => {
        const myPeerId = get().myPeerId;
        if (!myPeerId) {
            toast.error("Communication channel not ready. Try again.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: type === "video",
                audio: true
            });
            set({ localStream: stream });

            const callData = {
                callerId: auth.currentUser.uid,
                receiverId,
                status: "ringing",
                type,
                callerPeerId: myPeerId,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, "calls"), callData);
            set({ callId: docRef.id, activeCall: { ...callData, _id: docRef.id }, isCallActive: true });

            // Listen for status changes
            const unsubscribe = onSnapshot(doc(db, "calls", docRef.id), (docSnap) => {
                if (!docSnap.exists()) return;
                const data = docSnap.data();
                
                if (data.status === "accepted" && data.receiverPeerId) {
                    // Start actual PeerJS call
                    const outgoingPeerCall = get().peer.call(data.receiverPeerId, stream);
                    outgoingPeerCall.on("stream", (remoteStream) => {
                        console.log("Received remote stream (caller)");
                        set({ remoteStream });
                    });
                    set({ peerCall: outgoingPeerCall });
                } else if (data.status === "declined" || data.status === "ended") {
                    get().endCallLocal();
                    unsubscribe();
                }
            });
        } catch (error) {
            console.error("Error starting call:", error);
            toast.error("Could not access camera/microphone. Please check permissions.");
        }
    },

    acceptCall: async () => {
        const { activeCall, callId, myPeerId } = get();
        if (!activeCall || !callId || !myPeerId) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: activeCall.type === "video",
                audio: true
            });
            set({ localStream: stream, isIncomingCall: false, isCallActive: true });

            await updateDoc(doc(db, "calls", callId), {
                status: "accepted",
                receiverPeerId: myPeerId
            });

            // Handle the PeerJS call
            const peerCall = get().peerCall;
            if (peerCall) {
                peerCall.answer(stream);
                peerCall.on("stream", (remoteStream) => {
                    console.log("Received remote stream (receiver)");
                    set({ remoteStream });
                });
            } else {
                // If the signal arrived via PeerJS before we hit accept, wait for it
                const peer = get().peer;
                const onIncomingCall = (call) => {
                    call.answer(stream);
                    call.on("stream", (remoteStream) => {
                        set({ remoteStream });
                    });
                    set({ peerCall: call });
                    peer.off("call", onIncomingCall);
                };
                peer.on("call", onIncomingCall);
            }

            // Status monitor for disconnect
            const unsubscribe = onSnapshot(doc(db, "calls", callId), (docSnap) => {
                if (docSnap.exists() && docSnap.data().status === "ended") {
                    get().endCallLocal();
                    unsubscribe();
                }
            });
        } catch (error) {
            console.error("Error accepting call:", error);
            toast.error("Could not access camera/microphone");
            get().declineCall();
        }
    },

    declineCall: async () => {
        const { callId } = get();
        if (callId) {
            await updateDoc(doc(db, "calls", callId), { status: "declined" });
        }
        set({ isIncomingCall: false, activeCall: null, callId: null });
    },

    endCall: async () => {
        const { callId } = get();
        if (callId) {
            await updateDoc(doc(db, "calls", callId), { status: "ended" });
        }
        get().endCallLocal();
    },

    endCallLocal: () => {
        const { localStream, peerCall } = get();
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerCall) {
            peerCall.close();
        }
        set({ 
            localStream: null, 
            remoteStream: null, 
            activeCall: null, 
            callId: null, 
            isIncomingCall: false, 
            isCallActive: false,
            isMicMuted: false,
            isCameraOff: false,
            peerCall: null
        });
    },

    toggleMic: () => {
        const { localStream, isMicMuted } = get();
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = isMicMuted;
                set({ isMicMuted: !isMicMuted });
            }
        }
    },

    toggleCamera: () => {
        const { localStream, isCameraOff } = get();
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = isCameraOff;
                set({ isCameraOff: !isCameraOff });
            }
        }
    }
}));
