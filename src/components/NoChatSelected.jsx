import { MessageSquare, Lock } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-200/50 border-l border-base-300">
      <div className="max-w-md text-center space-y-4">
        {/* Icon Display */}
        <div className="flex justify-center mb-6">
          <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center relative">
            <MessageSquare className="size-12 text-primary" />
            <div className="absolute -bottom-2 -right-2 bg-base-100 p-2 rounded-full shadow-lg border border-base-300">
              <Lock className="size-4 text-primary" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-3xl font-light text-base-content/80">WhatsApp Web</h2>
        <p className="text-base-content/50 text-sm leading-relaxed">
          Send and receive messages without keeping your phone online.<br/>
          Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
        </p>

        <div className="pt-10 flex items-center justify-center gap-2 text-base-content/30 text-xs">
          <Lock className="size-3" />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
