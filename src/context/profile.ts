import { Constants } from "@app/constants";
import { LocalStorage } from "@app/hooks";

export const ProfileStorage = new LocalStorage(Constants.StorageKeys.Profile, {
  displayName: "",
  id: "",
});
export const TokenStorage = new LocalStorage(Constants.StorageKeys.Token, "");
export const NameStorage = new LocalStorage(Constants.StorageKeys.Name, "");
export const RoomNameStorage = new LocalStorage(Constants.StorageKeys.RoomName, "");
export const RoleStorage = new LocalStorage(Constants.StorageKeys.Role, "player");
export const ImposterGameSettingsStorage = new LocalStorage(Constants.StorageKeys.GameSettings, {
  wordCategories: ["legacy"],
  imposterCount: 1,
});
