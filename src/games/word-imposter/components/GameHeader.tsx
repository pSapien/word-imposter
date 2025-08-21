import { Button, useModal } from "@app/components";
import { useSocket, type SocketStatus } from "@app/socket";
import { ArrowLeft, Settings } from "lucide-react";
import { GameSettingsSection } from "./GameSettingsSection.tsx";
import { cn } from "@app/utils";

type Props = {
  onBack: () => void;
  roomName: string;
  isCurrentUserHost: boolean;
};

const statusMap: Record<SocketStatus, { text: string; bg: string; textColor: string }> = {
  connecting: { text: "⏳ Connecting", bg: "bg-yellow-500/20", textColor: "text-yellow-100" },
  connected: { text: "🟢 Connected", bg: "bg-green-500/20", textColor: "text-green-100" },
  authenticated: { text: "🔑 Authenticated", bg: "bg-green-600/20", textColor: "text-green-100" },
  closed: { text: "🔴 Closed", bg: "bg-red-500/20", textColor: "text-red-100" },
  error: { text: "⚠️ Error", bg: "bg-red-600/20", textColor: "text-red-100" },
};

export function GameHeader(props: Props) {
  const { onBack, roomName, isCurrentUserHost } = props;
  const settingsModal = useModal(GameSettingsSection);
  const socket = useSocket();
  const status = socket.status;

  return (
    <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 min-w-[40px] flex items-center justify-center"
        >
          <ArrowLeft size={32} strokeWidth={2.5} />
        </Button>

        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-white">🎭 Word Imposter</h1>
          <div className="text-sm text-white/80">Room: {roomName}</div>
          <div
            className={cn(
              "text-sm px-3 py-1 rounded-full inline-block mt-1",
              statusMap[status].bg,
              statusMap[status].textColor
            )}
          >
            {statusMap[status].text}
          </div>
        </div>

        {/* Settings Button or Spacer */}
        <div className="min-w-[40px] flex items-center justify-center">
          {isCurrentUserHost ? (
            <button onClick={() => settingsModal.show()} className="text-white hover:bg-white/20 p-2 rounded-full">
              <Settings size={32} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
