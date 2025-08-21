export function getEliminatedPlayerByVotes(votes: Record<string, string>): string[] {
  const voteCounts: Record<string, number> = {};
  let skips = 0;

  Object.values(votes).forEach((votee) => {
    if (votee) {
      voteCounts[votee] = (voteCounts[votee] || 0) + 1;
    } else {
      skips++;
    }
  });

  if (Object.keys(voteCounts).length === 0) return [];

  const maxVotes = Math.max(...Object.values(voteCounts));

  if (skips >= maxVotes) return [];
  if (maxVotes === 0) return [];

  return Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([player]) => player);
}
