import { Routes, Route, HashRouter } from "react-router-dom";

import { Home } from "./pages/Home";
import { Room } from "./pages/Room";
import { SocketProvider } from "./context";
import { FloatingConsoleLogs, ModalProvider } from "./components";
import { Constants } from "./constants";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <SocketProvider>
      <ModalProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomName" element={<Room />} />
          </Routes>
          {Constants.ShowDebugLogs && <FloatingConsoleLogs />}
          <Toaster
            toastOptions={{
              duration: Constants.ToastShowDuration,
            }}
          />
        </HashRouter>
      </ModalProvider>
    </SocketProvider>
  );
}
