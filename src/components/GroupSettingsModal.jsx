import { useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Users, Camera, Save } from "lucide-react";
import toast from "react-hot-toast";

const GroupSettingsModal = ({ onClose }) => {
  const { selectedGroup, updateGroup } = useChatStore();
  const [groupName, setGroupName] = useState(selectedGroup?.name || "");
  const [groupPicBase64, setGroupPicBase64] = useState(selectedGroup?.groupPic || "");
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Please select an image file");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupPicBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      return toast.error("Group name cannot be empty");
    }

    try {
      await updateGroup(selectedGroup._id, {
        name: groupName.trim(),
        groupPic: groupPicBase64,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update group:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-base-content/10">
        {/* Header */}
        <div className="p-4 border-b border-base-content/10 flex items-center justify-between bg-base-200">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h2 className="text-lg font-bold">Group Settings</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          {/* Group Picture */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="size-32 rounded-full overflow-hidden border-4 border-base-200 shadow-inner">
                {groupPicBase64 ? (
                  <img src={groupPicBase64} alt="Group" className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-base-200 flex items-center justify-center text-base-content/20">
                    <Users className="size-12" />
                  </div>
                )}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-content rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="size-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            <p className="text-xs text-base-content/40 uppercase tracking-widest font-bold">Group Icon</p>
          </div>

          {/* Group Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Group Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name..."
              className="input input-bordered w-full focus:ring-1 focus:ring-primary/20 transition-all"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-8 gap-2">
              <Save className="size-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
