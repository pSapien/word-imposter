import type { GameConfig } from "../types";
import ImposterBlitzRoom from "./pages/ImposterBlitzRoom";
import ImposterBlitzGameUI from "./pages/ImposterBlitzGameUI";

export const ImposterBlitzConfig: GameConfig = {
  id: "imposter-blitz",
  name: "Imposter Blitz",
  roomComponent: ImposterBlitzRoom,
  gameComponent: ImposterBlitzGameUI,
};
