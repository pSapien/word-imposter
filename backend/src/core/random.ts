/**
 * Shuffle given array in place using Fisher-Yates algorithm
 *
 * @param array The source array to shuffle
 * @returns The source array itself
 */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

export function arrRandom<T>(arr: T[], count: number) {
  return shuffle(arr.slice()).slice(0, count);
}
