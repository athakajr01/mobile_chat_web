import { useEffect, useRef } from "react";
import { useCallStore } from "../store/useCallStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const CallModal = () => {
  const { 
    isIncomingCall, 
    isCallActive, 
    activeCall, 
    localStream, 
    remoteStream, 
    acceptCall, 
    declineCall, 
    endCall,
    isMicMuted,
    isCameraOff,
    toggleMic,
    toggleCamera
  } = useCallStore();
  const { authUser } = useAuthStore();
  const { users } = useChatStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCallActive]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isCallActive]);

  if (!isIncomingCall && !isCallActive) return null;

  const otherUser = activeCall?.callerId === authUser?._id 
    ? users.find(u => u._id === activeCall?.receiverId)
    : users.find(u => u._id === activeCall?.callerId);

  const displayName = otherUser?.fullName || "Chat Partner";
  const displayPic = otherUser?.profilePic || "/avatar.png";

  const getStatusText = () => {
    if (isIncomingCall) return `Incoming ${activeCall?.type} call...`;
    if (activeCall?.status === "ringing") return "Ringing...";
    if (activeCall?.status === "accepted") {
      return remoteStream ? "Connected" : "Connecting...";
    }
    if (activeCall?.status === "declined") return "Declined";
    if (activeCall?.status === "ended") return "Call Ended";
    return "Calling...";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-base-300 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-base-content/10 relative"
        >
          {/* Header/Status */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-4 bg-black/40 p-2 pr-4 rounded-full backdrop-blur-md border border-white/10">
            <img src={displayPic} className="size-10 rounded-full border-2 border-primary object-cover" />
            <div>
              <h3 className="text-white font-bold leading-none">{displayName}</h3>
              <p className="text-white/60 text-xs mt-1">
                {getStatusText()}
              </p>
            </div>
          </div>

          {/* Video Stage */}
          <div className="aspect-video w-full bg-zinc-900 border-b border-white/5 relative group">
            {/* Remote Video (Primary) */}
            <div className="size-full flex items-center justify-center overflow-hidden">
              {activeCall?.type === "video" && remoteStream ? (
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="size-32 rounded-full overflow-hidden border-4 border-primary/20 p-1">
                    <img src={displayPic} className="size-full rounded-full object-cover" />
                  </div>
                  {activeCall?.type === "audio" && (
                    <div className="flex gap-1">
                      <motion.div animate={{ height: [10, 30, 10] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 bg-primary rounded-full" />
                      <motion.div animate={{ height: [20, 40, 20] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1 bg-primary rounded-full" />
                      <motion.div animate={{ height: [15, 35, 15] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-primary rounded-full" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Local Video (PIP) */}
            <motion.div 
               drag
               dragConstraints={{ left: 0, right: 300, top: 0, bottom: 200 }}
               className="absolute bottom-6 right-6 w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-xl border-2 border-white/20 z-10"
            >
              {activeCall?.type === "video" && localStream ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="size-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="size-full flex items-center justify-center bg-base-200">
                  <img src={authUser?.profilePic || "/avatar.png"} className="size-12 rounded-full opacity-50" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Controls */}
          <div className="p-8 flex items-center justify-center gap-6 bg-base-300">
            {isIncomingCall ? (
              <>
                <button 
                  onClick={acceptCall}
                  className="btn btn-circle btn-lg bg-green-500 hover:bg-green-600 border-none text-white shadow-lg shadow-green-500/20"
                >
                  <Phone className="size-6" />
                </button>
                <button 
                  onClick={declineCall}
                  className="btn btn-circle btn-lg btn-error shadow-lg shadow-error/20"
                >
                  <PhoneOff className="size-6" />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={endCall}
                  className="btn btn-circle btn-lg btn-error shadow-lg shadow-error/20"
                >
                  <PhoneOff className="size-6" />
                </button>
                {/* Visual toggle spacers */}
                <div className="w-1 h-8 bg-base-content/10 rounded-full mx-2" />
                
                <button 
                  onClick={toggleMic}
                  className={`btn btn-circle ${isMicMuted ? "btn-error" : "btn-ghost text-base-content/60"}`}
                  title={isMicMuted ? "Unmute" : "Mute"}
                >
                  {isMicMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                </button>

                <button 
                  onClick={toggleCamera}
                  className={`btn btn-circle ${isCameraOff ? "btn-error" : "btn-ghost text-base-content/60"}`}
                  title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {isCameraOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CallModal;
