import { randomInt } from "crypto";

export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i] as T;
    array[i] = array[j] as T;
    array[j] = temp;
  }
  return array;
}

export function randomSlice<T>(arr: T[], count: number) {
  return shuffle(arr.slice()).slice(0, count);
}

export function randomIdx<T>(arr: T[]): number {
  return randomInt(0, arr.length);
}

export function random<T>(arr: T[]): T {
  return arr[randomIdx(arr)] as T;
}

export function randomStr(length = 12) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}
