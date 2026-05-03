import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Users, Search } from "lucide-react";
import toast from "react-hot-toast";

const CreateGroupModal = ({ onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { users, createGroup } = useChatStore();

  const handleToggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      return toast.error("Please enter a group name");
    }
    if (selectedMembers.length === 0) {
      return toast.error("Please select at least one member");
    }

    try {
      await createGroup({
        name: groupName.trim(),
        members: selectedMembers,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-base-content/10">
        {/* Header */}
        <div className="p-4 border-b border-base-content/10 flex items-center justify-between bg-base-200">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h2 className="text-lg font-bold">Create Group Chat</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-6">
          {/* Group Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Group Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name..."
              className="input input-bordered w-full"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Member Selection */}
          <div className="form-control">
            <label className="label flex items-center justify-between">
              <span className="label-text font-medium">Select Members</span>
              <span className="label-text-alt">{selectedMembers.length} selected</span>
            </label>
            
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
              <input
                type="text"
                placeholder="Search users..."
                className="input input-bordered input-sm w-full pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-base-content/10 rounded-lg p-2 space-y-1 bg-base-200/50">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-4 text-sm text-base-content/50">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className={`flex items-center gap-3 p-2 rounded-md hover:bg-base-300 transition-colors cursor-pointer ${
                      selectedMembers.includes(user._id) ? "bg-primary/10 border-primary/20" : ""
                    }`}
                    onClick={() => handleToggleMember(user._id)}
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-xs"
                      checked={selectedMembers.includes(user._id)}
                      readOnly
                    />
                    <img
                      src={user.profilePic || "/avatar.png"}
                      className="size-8 rounded-full object-cover"
                      alt={user.fullName}
                    />
                    <span className="text-sm font-medium">{user.fullName}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-8">
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
