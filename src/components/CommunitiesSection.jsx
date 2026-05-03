import { useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Heart, MessageCircle, Share2, MoreHorizontal, Camera, X, Image as ImageIcon, Send } from "lucide-react";
import { formatMessageTime, formatDate } from "../lib/utils";

const CommunitiesSection = () => {
  const { posts, users, createPost, togglePostLike } = useChatStore();
  const { authUser } = useAuthStore();
  
  const [isPosting, setIsPosting] = useState(false);
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
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
    setIsPosting(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-base-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200/50">
          <h2 className="font-bold text-lg">Communities</h2>
          <button 
            onClick={() => setIsPosting(true)}
            className="btn btn-primary btn-sm rounded-full"
          >
            Create Post
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-20 space-y-4">
             <div className="size-20 bg-base-200 rounded-full flex items-center justify-center mx-auto text-base-content/20">
                <Share2 className="size-10" />
             </div>
             <p className="text-base-content/40 font-medium">No posts in your community yet.</p>
          </div>
        ) : (
          posts.map((post) => {
            const author = users.find(u => u._id === post.userId) || (post.userId === authUser._id ? authUser : { fullName: "Unknown User", profilePic: "/avatar.png" });
            const isLiked = post.likes?.includes(authUser?._id);

            return (
              <div key={post._id} className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
                 {/* Post Header */}
                 <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={author.profilePic || "/avatar.png"} className="size-10 rounded-full object-cover border border-base-300" />
                        <div>
                            <h4 className="font-bold text-sm">{author.fullName}</h4>
                            <p className="text-[10px] text-base-content/50 uppercase tracking-tighter">{formatDate(post.createdAt)}</p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-xs btn-circle"><MoreHorizontal className="size-4" /></button>
                 </div>

                 {/* Post Content */}
                 <div className="px-4 pb-2">
                    <p className="text-sm leading-relaxed">{post.text}</p>
                 </div>

                 {/* Post Media */}
                 {post.image && (
                   <div className="aspect-square w-full bg-base-200">
                      <img src={post.image} className="size-full object-cover" />
                   </div>
                 )}

                 {/* Actions */}
                 <div className="p-2 border-t border-base-300 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <button 
                          onClick={() => togglePostLike(post._id)}
                          className={`btn btn-ghost btn-sm gap-2 ${isLiked ? "text-error" : "text-base-content/40"}`}
                        >
                            <Heart className={`size-5 ${isLiked ? "fill-current" : ""}`} />
                            <span className="text-xs font-bold">{post.likes?.length || 0}</span>
                        </button>
                        <button className="btn btn-ghost btn-sm text-base-content/40 gap-2">
                            <MessageCircle className="size-5" />
                            <span className="text-xs font-bold">{post.comments?.length || 0}</span>
                        </button>
                    </div>
                    <button className="btn btn-ghost btn-sm text-base-content/40"><Share2 className="size-5" /></button>
                 </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Post Modal */}
      {isPosting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-base-100 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
                  <h3 className="font-bold">New Post</h3>
                  <button onClick={() => setIsPosting(false)} className="btn btn-ghost btn-sm btn-circle"><X size={20}/></button>
              </div>
              
              <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                      <img src={authUser?.profilePic || "/avatar.png"} className="size-10 rounded-full object-cover" />
                      <span className="font-bold">{authUser?.fullName}</span>
                  </div>

                  <textarea 
                    className="textarea textarea-ghost w-full min-h-[120px] text-lg focus:bg-transparent resize-none p-0"
                    placeholder="What's on your mind?"
                    autoFocus
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                  />

                  {postImage && (
                    <div className="relative rounded-2xl overflow-hidden group">
                        <img src={postImage} className="w-full max-h-60 object-cover" />
                        <button 
                          onClick={() => setPostImage(null)}
                          className="absolute top-2 right-2 btn btn-circle btn-sm bg-black/50 text-white border-none hover:bg-black/70"
                        >
                          <X size={14} />
                        </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-base-300">
                      <div className="flex gap-2">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-ghost btn-circle text-primary"
                          >
                            <ImageIcon className="size-6" />
                          </button>
                          <button className="btn btn-ghost btn-circle text-primary">
                            <Camera className="size-6" />
                          </button>
                      </div>
                      <button 
                        disabled={!postText.trim() && !postImage}
                        onClick={handleCreatePost}
                        className="btn btn-primary px-8 rounded-full font-bold"
                      >
                        Post
                      </button>
                  </div>
              </div>
              <input type="file" hidden ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
           </div>
        </div>
      )}
    </div>
  );
};

export default CommunitiesSection;
