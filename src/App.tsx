import { Routes, Route, HashRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./context/SocketContext";
import { GameSelectionPage } from "./pages/GameSelectionPage";
import { CodeWordsSetupPage } from "./games/codewords/pages/CodeWordsSetupPage";
import { WordImposterRoom, WordImposterGame } from "./games/word-imposter";
import { Constants } from "./constants.ts";
import { FloatingConsoleLogs } from "@app/components";
// Import future game rooms here
// import { CodeWordsRoom } from "./games/codewords/pages/CodeWordsRoom";

export default function App() {
  return (
    <SocketProvider>
      <HashRouter>
        <Routes>
          {/* Game Selection */}
          <Route path="/" element={<GameSelectionPage />} />

          <Route path="/game/imposter/room" element={<WordImposterRoom />} />
          <Route path="/game/imposter/room/:roomCode" element={<WordImposterGame />} />

          <Route path="/game/codewords/room" element={<CodeWordsSetupPage />} />
        </Routes>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              color: "#374151",
              fontWeight: "500",
            },
            success: {
              iconTheme: {
                primary: "#10B981",
                secondary: "#FFFFFF",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#FFFFFF",
              },
            },
          }}
        />
        {Constants.ShowDebugLogs && <FloatingConsoleLogs />}
      </HashRouter>
    </SocketProvider>
  );
}
