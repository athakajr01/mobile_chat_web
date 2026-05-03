import { useState } from "react";
import { X, Video, Phone, Users, Search, MoreVertical, Settings } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import GroupSettingsModal from "./GroupSettingsModal";

const ChatHeader = () => {
  const { selectedUser, selectedGroup, setSelectedUser, setSelectedGroup, users } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { startCall } = useCallStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleClose = () => {
    setSelectedUser(null);
    setSelectedGroup(null);
  };

  const isGroupAdmin = selectedGroup?.createdBy === authUser?._id;

  if (selectedGroup) {
    return (
      <div className="px-4 py-2 border-b border-base-300 bg-base-200/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="avatar">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
                {selectedGroup.groupPic ? (
                  <img src={selectedGroup.groupPic} className="size-full object-cover" />
                ) : (
                  <Users className="size-5 text-primary" />
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-[15px] text-base-content/90 leading-tight">{selectedGroup.name}</h3>
              <p className="text-[12px] opacity-60">
                {selectedGroup.members.length} members
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button key="search-group" className="btn btn-ghost btn-circle btn-sm text-base-content/40">
                <Search className="size-[18px]" />
            </button>
            {isGroupAdmin && (
              <button 
                key="settings-group" 
                onClick={() => setIsSettingsOpen(true)}
                className="btn btn-ghost btn-circle btn-sm text-base-content/40 hover:text-primary transition-colors"
                title="Group Settings"
              >
                <Settings className="size-[18px]" />
              </button>
            )}
            <button key="more-group" className="btn btn-ghost btn-circle btn-sm text-base-content/40">
                <MoreVertical className="size-[18px]" />
            </button>
            <button onClick={handleClose} className="btn btn-ghost btn-circle btn-sm text-base-content/30">
              <X className="size-5" />
            </button>
          </div>
        </div>
        {isSettingsOpen && <GroupSettingsModal onClose={() => setIsSettingsOpen(false)} />}
      </div>
    );
  }

  // Find the most up-to-date user data from the real-time users list
  const currentChatUser = users.find(u => u._id === selectedUser?._id) || selectedUser;
  const isTyping = currentChatUser?.typingTo === authUser?._id;

  return (
    <div className="px-4 py-2 border-b border-base-300 bg-base-200/90 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative overflow-hidden border border-base-content/5">
              <img src={currentChatUser.profilePic || "/avatar.png"} alt={currentChatUser.fullName} className="size-full object-cover" />
            </div>
          </div>

          {/* User info */}
          <div className="flex flex-col">
            <h3 className="font-medium text-[15px] text-base-content/90 leading-tight">{currentChatUser.fullName}</h3>
            <p className="text-[12px] opacity-60">
              {isTyping ? (
                <span className="text-secondary animate-pulse font-medium">typing...</span>
              ) : (
                onlineUsers.includes(currentChatUser._id) ? <span className="text-secondary font-medium">online</span> : "last seen recently"
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <button 
              onClick={() => startCall(currentChatUser._id, "audio")} 
              className="btn btn-ghost btn-circle btn-sm text-base-content/40 hover:text-primary"
              title="Audio Call"
            >
              <Phone className="size-[18px]" />
            </button>
            <button 
              onClick={() => startCall(currentChatUser._id, "video")} 
              className="btn btn-ghost btn-circle btn-sm text-base-content/40 hover:text-primary"
              title="Video Call"
            >
              <Video className="size-[18px]" />
            </button>
            <div className="w-px h-6 bg-base-content/10 mx-1" />
            <button key="search" className="btn btn-ghost btn-circle btn-sm text-base-content/40">
                <Search className="size-[18px]" />
            </button>
            <button key="more" className="btn btn-ghost btn-circle btn-sm text-base-content/40">
                <MoreVertical className="size-[18px]" />
            </button>
          </div>

          <button onClick={handleClose} className="btn btn-ghost btn-circle btn-sm text-base-content/30">
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
