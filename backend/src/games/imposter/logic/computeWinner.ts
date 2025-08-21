export type Winner = "imposters" | "civilians" | null;

export interface ComputeWinnerParams {
  players: { id: string; status: "alive" | "eliminated"; role: string }[];
  imposterIds: string[];
  remainingImposters: string[];
}

export function computeWinner({ players, imposterIds, remainingImposters }: ComputeWinnerParams): Winner {
  const aliveCivilians = players.filter(
    (p) => !imposterIds.includes(p.id) && p.status === "alive" && p.role !== "spectator"
  );

  if (remainingImposters.length === 0) return "civilians";
  if (remainingImposters.length >= aliveCivilians.length) return "imposters";

  return null;
}
