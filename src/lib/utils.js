export function formatMessageTime(date) {
    if (!date) return "";
    return new Date(date).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

export function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}
