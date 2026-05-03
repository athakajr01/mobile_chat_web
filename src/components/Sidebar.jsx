import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Plus, Search, MoreVertical, MessageSquare, RotateCw, Globe, PlusCircle, PenSquare, Image as ImageIcon } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import StatusSection from "./StatusSection";
import CommunitiesSection from "./CommunitiesSection";
import { useChatSettingsStore } from "../store/useChatSettingsStore";

const Sidebar = () => {
  const { 
    getUsers, 
    users, 
    groups,
    statuses,
    selectedUser, 
    setSelectedUser, 
    selectedGroup,
    setSelectedGroup,
    isUsersLoading, 
    isGroupsLoading,
    unsubscribeFromUsers,
    unsubscribeFromGroups,
    unsubscribeFromStatuses
  } = useChatStore();

  const { 
    showUnreadBadges,
    mergeGroupsWithChats 
  } = useChatSettingsStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("chats"); // "chats" or "status"
  const [chatFilter, setChatFilter] = useState("all"); 
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getUsers();
    return () => {
      unsubscribeFromUsers();
      unsubscribeFromGroups();
      unsubscribeFromStatuses();
    };
  }, [getUsers, unsubscribeFromUsers, unsubscribeFromGroups, unsubscribeFromStatuses]);

  const filteredUsers = users.filter(u => u.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Combine and sort chats
  const allChats = [
    ...filteredUsers.map(u => ({ ...u, type: "user" })),
    ...(mergeGroupsWithChats ? filteredGroups.map(g => ({ ...g, type: "group" })) : [])
  ].sort((a, b) => {
      return a.fullName ? a.fullName.localeCompare(b.fullName) : a.name.localeCompare(b.name);
  });

  const displayChats = allChats.filter(chat => {
    if (chatFilter === "groups") return chat.type === "group";
    if (chatFilter === "unread") return chat.type === "user" && chat.unreadCount > 0;
    return true;
  });

  const finalDisplayGroups = !mergeGroupsWithChats ? filteredGroups : [];

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-16 lg:w-[380px] border-r border-base-300 flex flex-col transition-all duration-200 bg-base-100">
      {/* WhatsApp Web Header */}
      <div className="hidden lg:flex items-center justify-between p-3 bg-base-200 border-b border-base-300">
        <div className="size-10 rounded-full overflow-hidden border border-base-content/10">
            <img src={authUser?.profilePic || "/avatar.png"} className="size-full object-cover" />
        </div>
        <div className="flex gap-4 text-base-content/60">
            <button 
              className={`btn btn-ghost btn-xs btn-circle ${activeTab === "communities" ? "text-primary bg-primary/10" : ""}`} 
              title="Communities"
              onClick={() => setActiveTab("communities")}
            >
                <Globe className="size-5" />
            </button>
            <button 
              className={`btn btn-ghost btn-xs btn-circle relative ${activeTab === "status" ? "text-primary bg-primary/10" : ""}`} 
              title="Status" 
              onClick={() => setActiveTab("status")}
            >
                <RotateCw className="size-5" />
                {statuses.some(s => s.userId !== authUser?._id) && (
                  <span className="absolute -top-0.5 -right-0.5 size-2.5 bg-primary rounded-full border-2 border-base-200" />
                )}
            </button>
            <button 
              className={`btn btn-ghost btn-xs btn-circle ${activeTab === "chats" ? "text-primary bg-primary/10" : ""}`} 
              title="Chats" 
              onClick={() => setActiveTab("chats")}
            >
                <MessageSquare className="size-5" />
            </button>
            {!mergeGroupsWithChats && (
              <button 
                className={`btn btn-ghost btn-xs btn-circle ${activeTab === "groups" ? "text-primary bg-primary/10" : ""}`} 
                title="Groups" 
                onClick={() => setActiveTab("groups")}
              >
                  <Users className="size-5" />
              </button>
            )}
            <div className="dropdown dropdown-end">
              <button 
                className="btn btn-ghost btn-xs btn-circle text-primary" 
                title="New Creation"
              >
                  <PlusCircle className="size-5" />
              </button>
              <ul tabIndex={0} className="dropdown-content z-[100] menu p-2 shadow-2xl bg-base-200 rounded-3xl w-52 mt-4 border border-base-300 animate-in fade-in zoom-in-95 duration-200">
                <li className="menu-title px-4 py-2 text-[10px] uppercase tracking-widest opacity-50 font-black">Create New</li>
                <li>
                  <button onClick={() => { setActiveTab("status"); setIsCreateModalOpen(false); /* The StatusSection has its own post trigger but we can refine this later */ }}>
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <RotateCw className="size-4" />
                    </div>
                    <span>Status Update</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsCreateModalOpen(true)}>
                    <div className="size-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                      <Users className="size-4" />
                    </div>
                    <span>Group Chat</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab("communities"); }}>
                    <div className="size-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <ImageIcon className="size-4" />
                    </div>
                    <span>Community Post</span>
                  </button>
                </li>
              </ul>
            </div>
            
            <button className="btn btn-ghost btn-xs btn-circle">
                <MoreVertical className="size-5" />
            </button>
        </div>
      </div>

      <div className="border-b border-base-300 w-full p-2 lg:p-3 bg-base-100 space-y-3">
        {/* Search Bar */}
        <div className="hidden lg:flex items-center bg-base-200 rounded-lg px-3 py-1.5 group focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <Search className="size-4 text-base-content/40 group-focus-within:text-primary transition-colors" />
            <input 
                type="text" 
                placeholder="Search or start new chat"
                className="bg-transparent border-none outline-none text-sm ml-3 w-full placeholder:text-base-content/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {/* Filter Pills - WhatsApp Style */}
        {activeTab === "chats" && (
          <div className="flex gap-2 px-1">
            {["all", "unread", "groups"].map((filter) => (
              <button
                key={filter}
                onClick={() => setChatFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${
                  chatFilter === filter 
                    ? "bg-primary/20 text-primary" 
                    : "bg-base-200 text-base-content/60 hover:bg-base-300"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-y-auto w-full flex-1">
        {activeTab === "status" ? (
          <StatusSection />
        ) : activeTab === "communities" ? (
          <CommunitiesSection />
        ) : activeTab === "groups" ? (
          filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => setSelectedGroup(group)}
                  className={`
                    w-full p-3 flex items-center gap-3
                    hover:bg-base-200 transition-all border-b border-base-200/40
                    ${selectedGroup?._id === group._id ? "bg-base-200" : ""}
                  `}
                >
                  {/* Reuse group rendering logic */}
                  <div className="relative mx-auto lg:mx-0 shrink-0">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
                       {group.groupPic ? (
                           <img src={group.groupPic} className="size-full object-cover" />
                       ) : (
                           <Users className="size-5 text-primary" />
                       )}
                    </div>
                  </div>
                  <div className="hidden lg:block text-left min-w-0 flex-1">
                     <div className="font-medium text-[15px] truncate text-base-content/90">{group.name}</div>
                     <div className="text-[13px] text-base-content/40 truncate font-light">{group.members.length} members</div>
                  </div>
                </button>
            ))
          ) : (
            <div className="text-center text-zinc-500 py-8">No groups found</div>
          )
        ) : (
          displayChats.length > 0 ? (
            displayChats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => {
                  if (chat.type === "user") setSelectedUser(chat);
                  else setSelectedGroup(chat);
                }}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-200 transition-all border-b border-base-200/40
                  ${(chat.type === "user" ? selectedUser?._id === chat._id : selectedGroup?._id === chat._id) ? "bg-base-200" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0 shrink-0">
                  <div className={`size-12 rounded-full overflow-hidden border border-base-content/5 ${chat.type === "group" ? "bg-primary/10 flex items-center justify-center border-primary/20" : ""}`}>
                    {chat.type === "user" ? (
                      <img
                        src={chat.profilePic || "/avatar.png"}
                        alt={chat.fullName}
                        className="size-full object-cover"
                      />
                    ) : (
                      chat.groupPic ? (
                        <img src={chat.groupPic} className="size-full object-cover" />
                      ) : (
                        <Users className="size-5 text-primary" />
                      )
                    )}
                  </div>
                  {chat.type === "user" && onlineUsers.includes(chat._id) && (
                    <span
                      className="absolute bottom-0.5 right-0.5 size-3 bg-green-500 
                      ring-2 ring-base-100 rounded-full"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="hidden lg:block text-left min-w-0 flex-1">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div className="font-medium text-[15px] truncate text-base-content/90">
                      {chat.type === "user" ? chat.fullName : chat.name}
                    </div>
                    <span className="text-[10px] text-base-content/40 font-light">
                      12:45
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13px] text-base-content/40 truncate font-light flex-1">
                      {chat.type === "user" ? (
                        chat.typingTo === authUser?._id ? (
                          <span className="text-secondary animate-pulse font-medium italic">typing...</span>
                        ) : (
                          "Hey there! I am using Chatty"
                        )
                      ) : (
                        <span className="opacity-70">
                          <span className="font-medium">You: </span>
                          Check out the new features!
                        </span>
                      )}
                    </div>
                    {/* Mock unread badge for "organized" feel */}
                    {showUnreadBadges && Math.random() > 0.8 && (
                      <div className="bg-primary text-primary-content size-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                        2
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-2">
              <div className="size-16 rounded-full bg-base-200 flex items-center justify-center text-base-content/20">
                <Search className="size-8" />
              </div>
              <p className="text-sm font-medium text-base-content/40">No {chatFilter === "all" ? "chats" : chatFilter} found</p>
            </div>
          )
        )}
      </div>

      {isCreateModalOpen && <CreateGroupModal onClose={() => setIsCreateModalOpen(false)} />}
    </aside>
  );
};

export default Sidebar;
