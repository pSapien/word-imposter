import { Routes, Route, HashRouter } from "react-router-dom";

import { Home } from "./pages/Home";
import { Room } from "./pages/Room";
import { SocketProvider } from "./context";

export default function App() {
  return (
    <SocketProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomName" element={<Room />} />
        </Routes>
      </HashRouter>
    </SocketProvider>
  );
}
