export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

export function randomArr<T>(arr: T[], count: number) {
  return shuffle(arr.slice()).slice(0, count);
}

export function randomIdx<T>(arr: T[]): number {
  return Math.floor(Math.random() * arr.length);
}

export function random<T>(arr: T[]): T {
  return arr[randomIdx(arr)];
}
