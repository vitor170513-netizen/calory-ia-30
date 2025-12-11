
/**
 * Utility to provide reliable video demonstrations.
 * Instead of static URLs that break/expire, we generate a specific
 * YouTube Search Query URL. This ensures the user ALWAYS finds a working video
 * for exactly the exercise they need.
 */

export const getExerciseVideoUrl = (exerciseName: string): string => {
  const query = encodeURIComponent(`${exerciseName} execução correta exercício fitness`);
  return `https://www.youtube.com/results?search_query=${query}`;
};
