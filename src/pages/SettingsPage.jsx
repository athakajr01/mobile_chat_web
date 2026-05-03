import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useChatSettingsStore } from "../store/useChatSettingsStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Check, Settings, MessageSquare, Users, Bell, Moon, Sun, Monitor, Shield, Trash2, Edit2, Camera, RotateCw, Globe, Plus, Image as ImageIcon, Heart, MessageCircle } from "lucide-react";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import CreateGroupModal from "../components/CreateGroupModal";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great, just working on some new features!", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { 
    showUnreadBadges, 
    setShowUnreadBadges, 
    showDateHeaders, 
    setShowDateHeaders,
    mergeGroupsWithChats,
    setMergeGroupsWithChats 
  } = useChatSettingsStore();
  
  const { groups, updateGroup, users, posts, statuses, createPost, postStatus } = useChatStore();
  const { authUser } = useAuthStore();
  
  const [activeSection, setActiveSection] = useState("appearance"); // appearance, chats, groups, notifications, social
  const [editingGroup, setEditingGroup] = useState(null);
  const [managedGroupId, setManagedGroupId] = useState(null); 
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [statusImage, setStatusImage] = useState(null);
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const fileInputRef = useRef(null);
  const statusImageRef = useRef(null);
  const postImageRef = useRef(null);

  const adminGroups = groups.filter(g => g.admins?.includes(authUser?._id));
  const myPosts = posts.filter(p => p.userId === authUser?._id);
  const myStatus = statuses.filter(s => s.userId === authUser?._id);
  const managedGroup = groups.find(g => g._id === managedGroupId);

  const adminMembers = managedGroup?.members?.filter(id => managedGroup.admins?.includes(id)) || [];
  const regularMembers = managedGroup?.members?.filter(id => !managedGroup.admins?.includes(id)) || [];

  const handleStatusImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setStatusImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePostImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPostImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!postText.trim() && !postImage) return;
    await createPost({ text: postText, image: postImage });
    setPostText("");
    setPostImage(null);
    toast.success("Post shared to Community!");
  };

  const handlePostStatus = async () => {
    if (!statusText.trim() && !statusImage) return;
    await postStatus({ text: statusText, mediaUrl: statusImage });
    setStatusText("");
    setStatusImage(null);
    toast.success("Status updated!");
  };

  const handleGroupImageChange = async (e, groupId) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
        await updateGroup(groupId, { groupPic: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const requestNotificationPermission = () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support desktop notification");
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        toast.success("Notifications enabled!");
      } else {
        toast.error("Notifications permission denied");
      }
    });
  };

  const sections = [
    { id: "appearance", label: "Appearance", icon: <Monitor className="size-4" /> },
    { id: "chats", label: "Chats", icon: <MessageSquare className="size-4" /> },
    { id: "groups", label: "Groups", icon: <Users className="size-4" /> },
    { id: "social", label: "Social Hub", icon: <Globe className="size-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="size-4" /> },
  ];

  return (
    <div className="h-screen bg-base-100 flex overflow-hidden">
      {/* Settings Navigation Sidebar */}
      <div className="w-64 border-r border-base-300 bg-base-200/50 flex flex-col pt-20">
        <div className="px-6 mb-8 text-center sm:text-left">
           <h1 className="text-xl font-bold flex items-center gap-2">
             <Settings className="size-5 text-primary" /> Settings
           </h1>
        </div>
        
        <nav className="px-2 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeSection === section.id 
                  ? "bg-primary text-primary-content font-bold shadow-lg shadow-primary/20 scale-[1.02]" 
                  : "hover:bg-base-200 text-base-content/60"
              }`}
            >
              {section.icon}
              <span className="text-sm">{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pt-20 pb-10">
        <div className="max-w-3xl mx-auto px-8">
          
          {activeSection === "appearance" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div>
                <h2 className="text-2xl font-bold mb-2">Appearance</h2>
                <p className="text-base-content/60">Customize how Chatty looks for you</p>
               </div>

               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {THEMES.map((t) => (
                    <button
                    key={t}
                    className={`
                        group flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2
                        ${theme === t ? "border-primary bg-primary/5" : "border-transparent bg-base-200/50 hover:bg-base-200"}
                    `}
                    onClick={() => setTheme(t)}
                    >
                    <div className="relative h-10 w-full rounded-lg overflow-hidden" data-theme={t}>
                        <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                        <div className="rounded bg-primary"></div>
                        <div className="rounded bg-secondary"></div>
                        <div className="rounded bg-accent"></div>
                        <div className="rounded bg-neutral"></div>
                        </div>
                    </div>
                    <span className="text-[11px] font-bold truncate w-full text-center uppercase tracking-tighter">
                        {t}
                    </span>
                    </button>
                ))}
               </div>

               {/* Preview Section */}
               <div className="pt-4">
                    <h3 className="text-sm font-bold text-base-content/40 uppercase tracking-widest mb-4">Live Preview</h3>
                    <div className="rounded-3xl border border-base-300 overflow-hidden bg-base-100 shadow-2xl">
                    <div className="p-6 bg-base-200/30">
                        <div className="max-w-md mx-auto">
                        <div className="bg-base-100 rounded-2xl shadow-sm overflow-hidden border border-base-300">
                            <div className="px-4 py-3 border-b border-base-300 bg-base-100/50 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold shadow-sm">
                                JD
                                </div>
                                <div className="flex-1">
                                <h3 className="font-bold text-sm">John Doe</h3>
                                <p className="text-[10px] text-primary font-medium uppercase tracking-tighter">Online</p>
                                </div>
                            </div>
                            </div>

                            <div className="p-4 space-y-4 min-h-[180px] max-h-[180px] overflow-y-auto bg-base-200/20">
                            {PREVIEW_MESSAGES.map((message) => (
                                <div
                                key={message.id}
                                className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                                >
                                <div
                                    className={`
                                    max-w-[85%] rounded-2xl px-4 py-2 shadow-sm text-sm leading-relaxed
                                    ${message.isSent ? "bg-primary text-primary-content rounded-tr-none" : "bg-base-100 rounded-tl-none border border-base-300"}
                                    `}
                                >
                                    <p>{message.content}</p>
                                    <p className={`text-[9px] mt-1 text-right italic ${message.isSent ? "text-primary-content/60" : "text-base-content/40"}`}>
                                    12:00
                                    </p>
                                </div>
                                </div>
                            ))}
                            </div>

                            <div className="p-3 border-t border-base-300 bg-base-100/50">
                            <div className="flex gap-2">
                                <input type="text" className="input input-sm input-bordered flex-1 rounded-full h-9" placeholder="Message..." disabled />
                                <button className="btn btn-primary btn-sm btn-circle h-9 w-9 min-h-0"><Send size={14} /></button>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
               </div>
            </div>
          )}

          {activeSection === "chats" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold mb-2">Chat Preferences</h2>
                <p className="text-base-content/60">Manage your messaging experience</p>
              </div>

              <div className="bg-base-200/50 rounded-3xl p-6 space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold">Unread Badges</p>
                        <p className="text-xs text-base-content/40">Show status indicator on chats with new messages</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary" 
                      checked={showUnreadBadges} 
                      onChange={() => setShowUnreadBadges(!showUnreadBadges)} 
                    />
                 </div>

                 <div className="divider opacity-5"></div>

                 <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold">Date Headers</p>
                        <p className="text-xs text-base-content/40">Organize chat messages with date dividers (Today, Yesterday...)</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary" 
                      checked={showDateHeaders} 
                      onChange={() => setShowDateHeaders(!showDateHeaders)} 
                    />
                 </div>

                 <div className="divider opacity-5"></div>

                 <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold">Merge Groups & Chats</p>
                        <p className="text-xs text-base-content/40">Display both lists in a single unified sidebar view</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary" 
                      checked={mergeGroupsWithChats} 
                      onChange={() => setMergeGroupsWithChats(!mergeGroupsWithChats)} 
                    />
                 </div>
              </div>
            </div>
          )}

          {activeSection === "groups" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">Group Management</h2>
                    <div className="flex items-center gap-2">
                        {!managedGroupId && (
                             <button onClick={() => setIsGroupModalOpen(true)} className="btn btn-primary btn-sm flex items-center gap-2">
                                <Plus className="size-4" /> Create New Group
                            </button>
                        )}
                        {managedGroupId && (
                            <button onClick={() => setManagedGroupId(null)} className="btn btn-ghost btn-sm">Back to List</button>
                        )}
                    </div>
                </div>
                <p className="text-base-content/60">Manage permissions and members for your groups</p>
              </div>

              {!managedGroupId ? (
                <div className="grid gap-4">
                    {adminGroups.length > 0 ? (
                        adminGroups.map((group) => (
                            <div key={group._id} className="bg-base-200/50 rounded-2xl p-4 flex items-center gap-4 group hover:bg-base-200 transition-all border border-transparent hover:border-primary/20">
                            <div className="relative">
                                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                                    {group.groupPic ? (
                                        <img src={group.groupPic} className="size-full object-cover" />
                                    ) : (
                                        <Users className="size-8 text-primary/40" />
                                    )}
                                </div>
                            </div>

                            <div className="flex-1">
                                <h4 className="font-bold text-lg">{group.name}</h4>
                                <p className="text-xs text-base-content/40">
                                    {group.members.length} members • {group.admins?.length || 1} admins
                                </p>
                            </div>

                            <button 
                                onClick={() => setManagedGroupId(group._id)}
                                className="btn btn-primary btn-sm rounded-lg"
                            >
                                Manage
                            </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-base-200/30 rounded-3xl space-y-3">
                            <div className="size-20 bg-base-300 rounded-full flex items-center justify-center mx-auto text-base-content/20">
                                <Users className="size-10" />
                            </div>
                            <p className="text-base-content/40 font-medium">You aren't an admin of any groups</p>
                        </div>
                    )}
                </div>
              ) : (
                <div className="space-y-8 animate-in zoom-in-95 duration-200">
                    {/* Detailed Management View */}
                    <div className="bg-base-200/50 rounded-3xl p-6 space-y-8">
                        {/* Group Identity */}
                        <div className="flex items-center gap-6">
                            <div className="relative group/pic">
                                <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-base-100 shadow-xl">
                                    {managedGroup.groupPic ? (
                                        <img src={managedGroup.groupPic} className="size-full object-cover" />
                                    ) : (
                                        <Users className="size-10 text-primary/40" />
                                    )}
                                </div>
                                <button 
                                    onClick={() => {
                                        setEditingGroup(managedGroup._id);
                                        fileInputRef.current?.click();
                                    }}
                                    className="absolute -bottom-1 -right-1 size-8 bg-primary rounded-full flex items-center justify-center text-white ring-4 ring-base-100 shadow-lg"
                                >
                                    <Camera className="size-4" />
                                </button>
                            </div>
                            <div className="flex-1">
                                {editingGroup === managedGroup._id ? (
                                    <input 
                                        autoFocus
                                        className="input input-lg input-ghost font-bold text-2xl w-full focus:bg-transparent p-0"
                                        defaultValue={managedGroup.name}
                                        onBlur={(e) => {
                                            if (e.target.value !== managedGroup.name) updateGroup(managedGroup._id, { name: e.target.value });
                                            setEditingGroup(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") e.target.blur();
                                            if (e.key === "Escape") setEditingGroup(null);
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl font-bold">{managedGroup.name}</h3>
                                        <button onClick={() => setEditingGroup(managedGroup._id)} className="text-base-content/30 hover:text-primary transition-colors">
                                            <Edit2 className="size-5" />
                                        </button>
                                    </div>
                                )}
                                <p className="text-sm text-base-content/50">Created on {new Date(managedGroup.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Group Restrictions */}
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 font-bold text-sm text-base-content/40 uppercase tracking-widest">
                                <Shield className="size-4" /> Permissions
                            </h4>
                            <div className="bg-base-100/50 rounded-2xl p-4 flex items-center justify-between border border-base-300/30">
                                <div>
                                    <p className="font-bold text-sm">Send Messages</p>
                                    <p className="text-xs text-base-content/40">Only admins can send messages to this group</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="toggle toggle-primary toggle-sm"
                                    checked={managedGroup.settings?.onlyAdminsCanMessage || false}
                                    onChange={(e) => updateGroup(managedGroup._id, { 
                                        settings: { ...managedGroup.settings, onlyAdminsCanMessage: e.target.checked }
                                    })}
                                />
                            </div>
                        </div>                        {/* Members with Admin privileges */}
                        <div className="space-y-6">
                            {/* Admins Section */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 font-bold text-sm text-base-content/40 uppercase tracking-widest">
                                    <Shield className="size-4" /> Admins ({adminMembers.length})
                                </h4>
                                <div className="grid gap-2">
                                    {adminMembers.map(memberId => {
                                        const member = users.find(u => u._id === memberId) || (memberId === authUser._id ? authUser : null);
                                        if (!member) return null;
                                        const isCreator = managedGroup.createdBy === memberId;

                                        return (
                                            <div key={memberId} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <img src={member.profilePic || "/avatar.png"} className="size-10 rounded-full object-cover border-2 border-primary" />
                                                        <Shield className="absolute -bottom-1 -right-1 size-4 text-primary fill-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{member.fullName} {member._id === authUser._id && "(You)"}</p>
                                                        {isCreator ? (
                                                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase">Creator</span>
                                                        ) : (
                                                            <span className="text-[10px] bg-base-300 text-base-content/60 px-2 py-0.5 rounded-full font-bold uppercase">Co-Admin</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {!isCreator && memberId !== authUser._id && (
                                                    <button 
                                                        onClick={() => {
                                                            const newAdmins = managedGroup.admins.filter(id => id !== memberId);
                                                            updateGroup(managedGroup._id, { admins: newAdmins });
                                                            toast.success(`${member.fullName} is no longer an admin`);
                                                        }}
                                                        className="btn btn-ghost btn-xs text-error hover:bg-error/10 rounded-lg"
                                                    >
                                                        Demote
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Regular Members Section */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 font-bold text-sm text-base-content/40 uppercase tracking-widest">
                                    <Users className="size-4" /> Members ({regularMembers.length})
                                </h4>
                                <div className="grid gap-2">
                                    {regularMembers.length > 0 ? (
                                        regularMembers.map(memberId => {
                                            const member = users.find(u => u._id === memberId) || (memberId === authUser._id ? authUser : null);
                                            if (!member) return null;

                                            return (
                                                <div key={memberId} className="flex items-center justify-between p-3 rounded-xl bg-base-100/30 border border-base-300/20">
                                                    <div className="flex items-center gap-3">
                                                        <img src={member.profilePic || "/avatar.png"} className="size-10 rounded-full object-cover" />
                                                        <div>
                                                            <p className="font-bold text-sm">{member.fullName} {member._id === authUser._id && "(You)"}</p>
                                                            <span className="text-[10px] text-base-content/40 uppercase">Member</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            const newAdmins = [...(managedGroup.admins || []), memberId];
                                                            updateGroup(managedGroup._id, { admins: newAdmins });
                                                            toast.success(`${member.fullName} is now an admin`);
                                                        }}
                                                        className="btn btn-primary btn-outline btn-xs rounded-lg"
                                                    >
                                                        Promote to Admin
                                                    </button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-center py-4 text-base-content/40 italic">No other members</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                onChange={(e) => handleGroupImageChange(e, managedGroupId)} 
                accept="image/*" 
              />
            </div>
          )}

          {activeSection === "social" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold mb-2">Social Hub</h2>
                <p className="text-base-content/60">Share updates and manage your social presence</p>
              </div>

              {/* Status Update (WhatsApp Style) */}
              <div className="bg-base-200/50 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-2">
                  <RotateCw className="size-4" /> Share Status
                </h3>
                <div className="flex gap-3">
                  <div className="size-12 rounded-full ring-2 ring-primary ring-offset-2 overflow-hidden shrink-0">
                    <img src={authUser?.profilePic || "/avatar.png"} className="size-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div 
                      className="relative w-full aspect-video bg-base-100 rounded-2xl overflow-hidden border border-base-300 cursor-pointer flex items-center justify-center group"
                      onClick={() => statusImageRef.current?.click()}
                    >
                      {statusImage ? (
                        <>
                          <img src={statusImage} className="size-full object-contain" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); setStatusImage(null); }}
                            className="absolute top-2 right-2 btn btn-circle btn-xs btn-error"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center text-base-content/20 group-hover:text-primary transition-colors">
                           <Camera className="size-8 mb-1 mx-auto" />
                           <p className="text-xs">Add an image for your status</p>
                        </div>
                      )}
                    </div>
                    <textarea 
                      placeholder="Add a caption..."
                      className="textarea textarea-bordered w-full rounded-2xl bg-base-100 resize-none h-20"
                      value={statusText}
                      onChange={(e) => setStatusText(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={handlePostStatus}
                        disabled={!statusText.trim() && !statusImage}
                        className="btn btn-primary btn-sm rounded-full px-6 font-bold"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <input 
                type="file" 
                hidden 
                ref={statusImageRef} 
                onChange={handleStatusImageChange} 
                accept="image/*" 
              />

              {/* Post Creation (Instagram Style) */}
              <div className="bg-base-200/50 rounded-3xl p-6 space-y-4">
                 <h3 className="text-sm font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="size-4" /> Create Public Post
                </h3>
                <div className="space-y-4">
                  <div className="relative group cursor-pointer" onClick={() => postImageRef.current?.click()}>
                    {postImage ? (
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-base-300">
                        <img src={postImage} className="size-full object-cover" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPostImage(null); }}
                          className="absolute top-2 right-2 btn btn-circle btn-xs btn-error"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="aspect-video rounded-2xl border-2 border-dashed border-base-content/10 flex flex-col items-center justify-center text-base-content/20 hover:border-primary/40 hover:text-primary transition-all">
                        <ImageIcon className="size-10 mb-2" />
                        <span className="text-sm font-medium">Add a photo to your post</span>
                      </div>
                    )}
                  </div>
                  <textarea 
                    placeholder="Write a caption..."
                    className="textarea textarea-ghost w-full rounded-xl bg-base-100/50 resize-none h-24"
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleCreatePost}
                      disabled={!postText.trim() && !postImage}
                      className="btn btn-primary btn-md rounded-full px-10 font-bold shadow-lg shadow-primary/20"
                    >
                      Share Post
                    </button>
                  </div>
                </div>
              </div>

              {/* Personal Post Gallery */}
              <div className="space-y-4">
                 <h3 className="text-sm font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="size-4" /> Your Gallery
                </h3>
                {myPosts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {myPosts.map(post => (
                      <div key={post._id} className="aspect-square rounded-2xl bg-base-200 overflow-hidden relative group">
                        {post.image ? (
                           <img src={post.image} className="size-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                           <div className="size-full flex items-center justify-center p-4 text-center italic text-xs text-base-content/40 leading-tight">
                              {post.text}
                           </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-4 text-white">
                           <div className="flex items-center gap-1 font-bold">
                              <Heart className="size-4 fill-white" />
                              <span className="text-sm">{post.likes?.length || 0}</span>
                           </div>
                           <div className="flex items-center gap-1 font-bold">
                              <MessageCircle className="size-4 fill-white" />
                              <span className="text-sm">{post.comments?.length || 0}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-base-200/30 rounded-3xl py-12 text-center text-base-content/40 flex flex-col items-center">
                    <ImageIcon className="size-8 mb-2 opacity-20" />
                    <p className="text-sm">No posts yet</p>
                  </div>
                )}
              </div>
              
              <input 
                type="file" 
                hidden 
                ref={postImageRef} 
                onChange={handlePostImageChange} 
                accept="image/*" 
              />
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div>
                <h2 className="text-2xl font-bold mb-2">Notifications</h2>
                <p className="text-base-content/60">Configure your alert preferences</p>
               </div>

               <div className="bg-base-200/50 rounded-3xl p-8 space-y-6 flex flex-col items-center text-center">
                    <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2 ring-8 ring-primary/5">
                        <Bell className="size-10" />
                    </div>
                    <div className="max-w-md">
                        <h3 className="text-xl font-bold mb-2">Stay Connected</h3>
                        <p className="text-sm text-base-content/60 leading-relaxed mb-8">
                            Enable desktop notifications to get alerted about new messages even when Chatty is running in the background.
                        </p>
                        <button 
                          onClick={requestNotificationPermission}
                          className="btn btn-primary btn-wide rounded-full font-bold shadow-xl shadow-primary/20"
                        >
                            Enable Notifications
                        </button>
                    </div>
               </div>
            </div>
          )}

        </div>
      </div>
      {isGroupModalOpen && <CreateGroupModal onClose={() => setIsGroupModalOpen(false)} />}
    </div>
  );
};
export default SettingsPage;

