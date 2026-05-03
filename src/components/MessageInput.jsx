import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Smile, Paperclip, Mic } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { sendMessage, selectedUser, selectedGroup } = useChatStore();
  const { setTypingStatus, authUser } = useAuthStore();

  const isAdmin = selectedGroup?.admins?.includes(authUser?._id);
  const isRestricted = selectedGroup?.settings?.onlyAdminsCanMessage && !isAdmin;

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);

    // Typing indicator logic
    if (selectedUser) {
      setTypingStatus(selectedUser._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(null);
      }, 2000);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTypingStatus(null);

      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTypingStatus(null);
    };
  }, [setTypingStatus]);

  if (isRestricted) {
    return (
      <div className="bg-base-200/50 backdrop-blur-md border-t border-base-300 p-4 text-center">
        <p className="text-sm font-medium text-base-content/40 flex items-center justify-center gap-2 italic">
          <Shield className="size-4" /> Only admins can send messages to this group
        </p>
      </div>
    );
  }

  return (
    <div className="bg-base-200/90 backdrop-blur-md border-t border-base-300 p-2 md:p-3 relative z-10">
      {imagePreview && (
        <div className="absolute bottom-full left-0 w-full p-4 bg-base-100 border-t border-base-300 flex animate-in slide-in-from-bottom-2">
          <div className="relative group">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-xl border border-base-300 shadow-lg"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error text-white
              flex items-center justify-center shadow-md active:scale-95 transition-transform"
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-7xl mx-auto px-2">
        <div className="flex items-center gap-1.5 md:gap-3 text-base-content/40">
           <button type="button" className="btn btn-ghost btn-circle btn-sm">
             <Smile className="size-6" />
           </button>
           <button type="button" className="btn btn-ghost btn-circle btn-sm" onClick={() => fileInputRef.current?.click()}>
             <Paperclip className="size-[22px]" />
           </button>
        </div>

        <div className="flex-1 px-1">
          <input
            type="text"
            className="w-full bg-base-100 rounded-lg px-4 py-2.5 outline-none text-[15px] shadow-sm ring-1 ring-base-300 focus:ring-primary/20 transition-all placeholder:text-base-content/30"
            placeholder="Type a message"
            value={text}
            onChange={handleTextChange}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </div>

        <div className="flex items-center">
            {text.trim() || imagePreview ? (
                <button
                    type="submit"
                    className="btn btn-primary btn-circle btn-md shadow-lg active:scale-95 transition-transform"
                >
                    <Send className="size-5 transform translate-x-0.5" />
                </button>
            ) : (
                <button type="button" className="btn btn-ghost btn-circle btn-md text-base-content/40">
                    <Mic className="size-6" />
                </button>
            )}
        </div>
      </form>
    </div>
  );
};
export default MessageInput;
