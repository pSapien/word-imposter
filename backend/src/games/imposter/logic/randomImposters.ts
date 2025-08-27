import { randomSlice } from "@server/utils";

export function randomImposters(playerIds: string[], count: number) {
  return randomSlice(playerIds, count);
}
