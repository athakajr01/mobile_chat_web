import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Plus, Image as ImageIcon, Camera, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatMessageTime, formatDate } from "../lib/utils";

const StatusSection = () => {
  const { statuses, users, postStatus } = useChatStore();
  const { authUser } = useAuthStore();
  
  const [isPosting, setIsPosting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [statusImage, setStatusImage] = useState(null);
  const [viewingStatus, setViewingStatus] = useState(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const STORY_DURATION = 5000; // 5 seconds per story

  const handleStatusView = (userStatuses) => {
    setViewingStatus(userStatuses);
    setCurrentStatusIndex(0);
    setProgress(0);
    startTimer(0, userStatuses);
  };

  const startTimer = (index, userStatuses) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(0);
    
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(timerRef.current);
        handleNextStatus(index, userStatuses);
      }
    }, 50);
  };

  const handleNextStatus = (index, userStatuses) => {
    if (index < userStatuses.length - 1) {
      const nextIndex = index + 1;
      setCurrentStatusIndex(nextIndex);
      startTimer(nextIndex, userStatuses);
    } else {
      closeStatusView();
    }
  };

  const handlePrevStatus = (index, userStatuses) => {
    if (index > 0) {
      const prevIndex = index - 1;
      setCurrentStatusIndex(prevIndex);
      startTimer(prevIndex, userStatuses);
    } else {
      setProgress(0);
      startTimer(0, userStatuses);
    }
  };

  const closeStatusView = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setViewingStatus(null);
    setProgress(0);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setStatusImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!statusText && !statusImage) return;
    await postStatus({ text: statusText, mediaUrl: statusImage });
    setIsPosting(false);
    setStatusText("");
    setStatusImage(null);
  };

  const activeStatuses = statuses.filter(s => {
    const createdAt = new Date(s.createdAt);
    const now = new Date();
    return (now - createdAt) < 24 * 60 * 60 * 1000;
  });

  const myStatuses = activeStatuses.filter(s => s.userId === authUser?._id);
  const otherStatuses = activeStatuses.filter(s => s.userId !== authUser?._id);

  // Group statuses by user
  const groupedStatuses = otherStatuses.reduce((acc, status) => {
    if (!acc[status.userId]) acc[status.userId] = [];
    acc[status.userId].push(status);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-100">
      <div className="p-4 flex flex-col gap-6 overflow-y-auto">
        
        {/* My Status */}
        <div className="space-y-3">
          <h3 className="text-secondary font-bold text-sm px-2">MY STATUS</h3>
          <div className="flex items-center gap-4 p-2 hover:bg-base-200 rounded-xl transition-colors cursor-pointer group">
            <div className="relative" onClick={() => myStatuses.length > 0 ? handleStatusView(myStatuses) : setIsPosting(true)}>
              <div className={`size-14 rounded-full border-2 p-0.5 ${myStatuses.length > 0 ? "border-primary" : "border-base-300"}`}>
                <img 
                  src={authUser?.profilePic || "/avatar.png"} 
                  className="size-full rounded-full object-cover" 
                />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsPosting(true); }}
                className="absolute -bottom-1 -right-1 size-6 bg-primary rounded-full flex items-center justify-center text-white ring-2 ring-base-100"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <div className="flex-1" onClick={() => myStatuses.length > 0 ? handleStatusView(myStatuses) : setIsPosting(true)}>
              <p className="font-bold text-base-content/90">My Status</p>
              <p className="text-xs text-base-content/50">
                {myStatuses.length > 0 ? `Updated ${formatDate(myStatuses[myStatuses.length-1].createdAt)}` : "Tap to add status update"}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        {Object.keys(groupedStatuses).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-secondary font-bold text-sm px-2">RECENT UPDATES</h3>
            <div className="space-y-1">
              {Object.entries(groupedStatuses).map(([userId, userStatuses]) => {
                const user = users.find(u => u._id === userId);
                const lastStatus = userStatuses[userStatuses.length - 1];
                
                return (
                  <div 
                    key={userId}
                    className="flex items-center gap-4 p-3 hover:bg-base-200 rounded-xl transition-colors cursor-pointer"
                    onClick={() => handleStatusView(userStatuses)}
                  >
                    <div className="size-14 rounded-full border-2 border-primary p-0.5">
                       <img 
                        src={user?.profilePic || "/avatar.png"} 
                        className="size-full rounded-full object-cover" 
                       />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base-content/90 truncate">{user?.fullName}</p>
                      <p className="text-xs text-base-content/50 truncate">
                        {formatDate(lastStatus.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Post Status Modal */}
      <AnimatePresence>
        {isPosting && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <div className="w-full max-w-lg bg-zinc-900 rounded-3xl overflow-hidden relative">
               <button 
                onClick={() => setIsPosting(false)}
                className="absolute top-4 right-4 z-10 btn btn-circle btn-ghost text-white"
              >
                <X />
              </button>

              <div className="p-8 space-y-6">
                <div className="aspect-video w-full bg-black/40 rounded-2xl flex items-center justify-center relative overflow-hidden border border-white/10">
                  {statusImage ? (
                    <img src={statusImage} className="size-full object-contain" />
                  ) : (
                    <div className="text-center space-y-2">
                       <div className="size-16 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                          <ImageIcon className="size-8 text-white/40" />
                       </div>
                       <p className="text-white/40 text-sm">Add a photo or background</p>
                    </div>
                  )}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-4 right-4 btn btn-primary btn-circle shadow-xl"
                  >
                    <Camera className="size-5" />
                  </button>
                </div>
                
                <input 
                  type="text" 
                  placeholder="Type a status..."
                  className="w-full bg-transparent border-b border-white/10 py-4 text-2xl text-white placeholder:text-white/20 outline-none text-center"
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  autoFocus
                />

                <div className="flex justify-center pt-4">
                   <button 
                    disabled={!statusText && !statusImage}
                    onClick={handlePost}
                    className="btn btn-primary btn-wide rounded-full text-lg shadow-xl shadow-primary/20"
                   >
                     Post Status
                   </button>
                </div>
              </div>
              <input type="file" hidden ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Status Modal */}
       <AnimatePresence>
        {viewingStatus && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
             <button 
                onClick={closeStatusView}
                className="absolute top-6 right-6 z-10 btn btn-circle btn-ghost text-white"
              >
                <X />
              </button>

              <div className="w-full max-w-lg h-full flex flex-col items-center justify-center relative bg-black">
                 {/* Progress Bars */}
                 <div className="absolute top-6 left-4 right-4 flex gap-1 z-20">
                    {viewingStatus.map((_, i) => (
                      <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-white transition-all duration-50"
                           style={{ 
                             width: i < currentStatusIndex ? "100%" : i === currentStatusIndex ? `${progress}%` : "0%" 
                           }}
                         />
                      </div>
                    ))}
                 </div>

                 {/* User Info */}
                 <div className="absolute top-10 left-4 flex items-center gap-3 z-20">
                    <img 
                      src={users.find(u => u._id === viewingStatus[0].userId)?.profilePic || "/avatar.png"} 
                      className="size-10 rounded-full border border-white/20"
                    />
                    <div>
                        <p className="text-white font-bold text-sm">
                          {users.find(u => u._id === viewingStatus[0].userId)?.fullName}
                        </p>
                        <p className="text-white/60 text-[10px]">
                          {formatDate(viewingStatus[currentStatusIndex].createdAt)}
                        </p>
                    </div>
                 </div>

                 {/* Navigation Zones */}
                 <div className="absolute inset-0 flex z-30">
                    <div className="w-1/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrevStatus(currentStatusIndex, viewingStatus); }} />
                    <div className="w-2/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNextStatus(currentStatusIndex, viewingStatus); }} />
                 </div>

                 {/* Content */}
                 <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
                    {viewingStatus[currentStatusIndex].mediaUrl ? (
                      <img src={viewingStatus[currentStatusIndex].mediaUrl} className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" />
                    ) : (
                      <div className="text-center p-8">
                         <h2 className="text-3xl font-light text-white leading-relaxed">{viewingStatus[currentStatusIndex].text}</h2>
                      </div>
                    )}
                    {viewingStatus[currentStatusIndex].mediaUrl && viewingStatus[currentStatusIndex].text && (
                      <div className="mt-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                        <p className="text-white text-lg">{viewingStatus[currentStatusIndex].text}</p>
                      </div>
                    )}
                 </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusSection;
