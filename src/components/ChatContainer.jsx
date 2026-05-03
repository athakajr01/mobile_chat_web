import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { useChatSettingsStore } from "../store/useChatSettingsStore";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, Smile, Trash2 } from "lucide-react";

const COMMON_EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    selectedGroup,
    unsubscribeFromMessages,
    toggleReaction,
    deleteMessage,
    users,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { showDateHeaders } = useChatSettingsStore();
  const messageEndRef = useRef(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);

  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id, false);
    if (selectedGroup) getMessages(selectedGroup._id, true);

    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, selectedGroup?._id, getMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const getSenderInfo = (senderId) => {
    if (senderId === authUser._id) return authUser;
    return users.find((u) => u._id === senderId) || { fullName: "Unknown User", profilePic: "/avatar.png" };
  };

  const getNameColor = (name) => {
    const colors = [
      "text-blue-500", "text-purple-500", "text-pink-500", 
      "text-orange-500", "text-green-500", "text-cyan-500"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto whatsapp-container">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => {
          const sender = getSenderInfo(message.senderId);
          const isMyMessage = message.senderId === authUser._id;
          const isGroupChat = !!(selectedGroup || message.groupId);
          const prevMessage = messages[idx - 1];
          
          const showDateHeader = showDateHeaders && (!prevMessage || 
            new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString());

          const formatDateLabel = (dateStr) => {
              const d = new Date(dateStr);
              const now = new Date();
              if (d.toDateString() === now.toDateString()) return "Today";
              const yesterday = new Date();
              yesterday.setDate(now.getDate() - 1);
              if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
              return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
          };

          return (
            <div key={message._id}>
              {showDateHeader && (
                <div className="flex justify-center my-6 sticky top-2 z-[5]">
                   <span className="bg-base-200 text-base-content/60 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm uppercase tracking-widest border border-base-300 backdrop-blur-md">
                     {formatDateLabel(message.createdAt)}
                   </span>
                </div>
              )}
              
              <div
                className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} mt-1`}
                onMouseEnter={() => setHoveredMessage(message._id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                <div className={`relative group flex max-w-[85%] ${isMyMessage ? "flex-row-reverse" : "flex-row"} gap-2`}>
                {/* Avatar for others in group chats */}
                {!isMyMessage && isGroupChat && (
                  <div className="avatar self-end mb-1">
                    <div className="size-8 rounded-full border border-base-content/10">
                      <img
                        src={sender.profilePic || "/avatar.png"}
                        alt="profile pic"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col relative">
                  <div className={`shadow-sm border border-black/5 min-w-[70px] rounded-xl px-2.5 py-1.5 pb-2 transition-all ${
                    isMyMessage 
                    ? "chat-bubble-wa-sender rounded-tr-none" 
                    : "chat-bubble-wa-receiver rounded-tl-none"
                  }`}>
                    {/* Receiver's Name in Group Chat */}
                    {!isMyMessage && isGroupChat && (
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[11px] font-bold ${getNameColor(sender.fullName)}`}>
                          {sender.fullName}
                        </span>
                        {selectedGroup?.admins?.includes(message.senderId) && (
                           <span className="text-[9px] bg-primary/10 text-primary px-1.5 rounded-full font-black uppercase tracking-tighter">Admin</span>
                        )}
                      </div>
                    )}

                    {/* Image Attachment */}
                    {message.image && (
                      <div className="mb-1 bg-black/5 rounded-lg overflow-hidden border border-black/5">
                        <img
                          src={message.image}
                          alt="Attachment"
                          className="max-h-[350px] w-full object-contain"
                        />
                      </div>
                    )}

                    {/* Message Content & Inline Metadata */}
                    <div className="flex flex-wrap items-end justify-between gap-x-4">
                      {message.text && (
                        <p className="text-[14px] leading-[1.3] break-words flex-1">
                          {message.text}
                        </p>
                      )}
                      
                      {/* Timestamp & Read Receipts Inside Bubble */}
                      <div className="flex items-center gap-1 self-end translate-y-1">
                        <span className="text-[10px] opacity-40 font-light whitespace-nowrap">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {isMyMessage && !isGroupChat && (
                           <div className="flex items-center">
                              {message.isRead ? (
                                <CheckCheck className="size-3.5 text-blue-500" />
                              ) : (
                                <Check className="size-3.5 opacity-40" />
                              )}
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Reactions display (slightly overlapping bottom) */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className="absolute -bottom-2.5 left-1 flex flex-wrap gap-0.5 p-0.5 rounded-full bg-white shadow-sm border border-black/5 z-10 scale-90">
                        {Object.entries(message.reactions).map(([emoji, users]) => (
                          <div
                            key={emoji}
                            className="flex items-center gap-0.5 px-1 rounded-full text-[10px]"
                          >
                            <span>{emoji}</span>
                            <span className="font-medium text-black/60">{users.length}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reaction & Delete Controls on Hover */}
                  {hoveredMessage === message._id && (
                    <div className={`absolute -top-11 ${isMyMessage ? "right-0" : "left-0"} z-20 flex gap-1 p-1.5 bg-base-300 border border-base-content/10 rounded-full shadow-2xl animate-in fade-in zoom-in duration-200 items-center`}>
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(message._id, emoji)}
                          className="hover:scale-150 transition-transform px-1 text-lg active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                      {isMyMessage && (
                        <>
                          <div className="w-px h-6 bg-base-content/10 mx-1" />
                          <button
                            onClick={() => {
                              if (window.confirm("Delete this message?")) {
                                deleteMessage(message._id);
                              }
                            }}
                            className="hover:text-error transition-colors px-1 p-1 rounded-full hover:bg-error/10"
                            title="Delete message"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
        <div ref={messageEndRef} className="pt-4" />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
