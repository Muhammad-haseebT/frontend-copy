import axios from "axios";

const url = import.meta.env.VITE_BASE_URL;

// export const getPlayerStats = async (playerId, sport = null) => {
//   const params = sport ? `?sport=${sport}` : "";
//   const response = await axios.get(`${url}/player/${playerId}/stats${params}`);
//   console.log(response.data);
//   return response.data;
// };

// Response
// {
//   "playerId": 1,
//   "playerName": "Syed Hussain",
//   "totalRuns": 0,
//   "highest": 12,
//   "ballsFaced": 0,
//   "ballsBowled": 0,
//   "runsConceded": 0,
//   "strikeRate": 0,
//   "economy": 0,
//   "battingAvg": 0,
//   "bowlingAverage": 0,
//   "notOuts": 3,
//   "matchesPlayed": 2,
//   "wickets": 0,
//   "fours": 0,
//   "sixes": 0,
//   "pomCount": 0
// }

export const getTournamentStats = async (tournamentId) => {
  try {
    const response = await axios.get(`${url}/tournament/${tournamentId}/stats`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching tournament stats:", error);
    throw error;
  }
};
// //repsonse{
//   "tournamentId": 1,
//   "manOfTournamentId": 23,
//   "manOfTournamentName": "Aitsham",
//   "highestScorerId": 13,
//   "highestScorerName": "Ahmad",
//   "highestRuns": 36,
//   "bestBatsmanId": 13,
//   "bestBatsmanName": "Ahmad",
//   "bestBatsmanRuns": 36,
//   "bestBowlerId": 23,
//   "bestBowlerName": "Aitsham",
//   "bestBowlerWickets": 0,
//   "topBatsmen": [
//     {
//       "playerId": 13,
//       "playerName": "Ahmad",
//       "runs": 36,
//       "ballsFaced": 6,
//       "fours": 0,
//       "sixes": 6,
//       "wickets": 0,
//       "runsConceded": 24,
//       "ballsBowled": 6,
//       "economy": 24,
//       "bowlingAverage": null,
//       "pomCount": 1,
//       "compositeScore": -17
//     },
//     {
//       "playerId": 2,
//       "playerName": "Asad",
//       "runs": 36,
//       "ballsFaced": 12,
//       "fours": 6,
//       "sixes": 0,
//       "wickets": 0,
//       "runsConceded": 30,
//       "ballsBowled": 5,
//       "economy": 36,
//       "bowlingAverage": null,
//       "pomCount": 0,
//       "compositeScore": -88
//     },
//     {
//       "playerId": 23,
//       "playerName": "Aitsham",
//       "runs": 30,
//       "ballsFaced": 5,
//       "fours": 0,
//       "sixes": 5,
//       "wickets": 0,
//       "runsConceded": 12,
//       "ballsBowled": 6,
//       "economy": 12,
//       "bowlingAverage": null,
//       "pomCount": 1,
//       "compositeScore": 35
//     },
//     {
//       "playerId": 1,
//       "playerName": "Syed Hussain",
//       "runs": 30,
//       "ballsFaced": 15,
//       "fours": 0,
//       "sixes": 0,
//       "wickets": 0,
//       "runsConceded": 42,
//       "ballsBowled": 7,
//       "economy": 36,
//       "bowlingAverage": null,
//       "pomCount": 0,
//       "compositeScore": -100
//     },
//     {
//       "playerId": 14,
//       "playerName": "Daim",
//       "runs": 6,
//       "ballsFaced": 1,
//       "fours": 0,
//       "sixes": 1,
//       "wickets": 0,
//       "runsConceded": 12,
//       "ballsBowled": 6,
//       "economy": 12,
//       "bowlingAverage": null,
//       "pomCount": 0,
//       "compositeScore": -12
//     }
//   ],
//   "topBowlers": [
//     {
//       "playerId": 23,
//       "playerName": "Aitsham",
//       "runs": 30,
//       "ballsFaced": 5,
//       "fours": 0,
//       "sixes": 5,
//       "wickets": 0,
//       "runsConceded": 12,
//       "ballsBowled": 6,
//       "economy": 12,
//       "bowlingAverage": null,
//       "pomCount": 1,
//       "compositeScore": 35
//     },
//     {
//       "playerId": 24,
//       "playerName": "Saeed",
//       "runs": 0,
//       "ballsFaced": 0,
//       "fours": 0,
//       "sixes": 0,
//       "wickets": 0,
//       "runsConceded": 12,
//       "ballsBowled": 6,
//       "economy": 12,
//       "bowlingAverage": null,
//       "pomCount": 0,
//       "compositeScore": -20
//     },
//     {
//       "playerId": 12,
//       "playerName": "Bakar",
//       "runs": 0,
//       "ballsFaced": 0,
//       "fours": 0,
//       "sixes": 0,
//       "wickets": 0,
//       "runsConceded": 6,
//       "ballsBowled": 3,
//       "economy": 12,
//       "bowlingAverage": null,
//       "pomCount": 0,
//       "compositeScore": -20
//     },
//     {
//       "playerId": 14,
//       "playerName": "Daim",
//       "runs": 6,
//       "ballsFaced": 1,
//       "fours": 0,
//       "sixes": 1,
//       "wickets": 0,
//       "runsConceded": 12,
//       "ballsBowled": 6,
//       "economy": 12,
//       "bowlingAverage": null,
//       "pomCount": 0,
//       "compositeScore": -12
//     },
//     {
//       "playerId": 13,
//       "playerName": "Ahmad",
//       "runs": 36,
//       "ballsFaced": 6,
//       "fours": 0,
//       "sixes": 6,
//       "wickets": 0,
//       "runsConceded": 24,
//       "ballsBowled": 6,
//       "economy": 24,
//       "bowlingAverage": null,
//       "pomCount": 1,
//       "compositeScore": -17
//     }
//   ]

export const getPlayerTournamentStats = async (playerId, tournamentId) => {
  try {
    const response = await axios.get(
      `${url}/player/${playerId}/stats?tournamentId=${tournamentId}`,
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching player tournament stats:", error);
    throw error;
  }
};
//response{

//   "playerId": 1,
//   "playerName": "Syed Hussain",
//   "totalRuns": 0,
//   "highest": 12,
//   "ballsFaced": 0,
//   "ballsBowled": 0,
//   "runsConceded": 0,
//   "strikeRate": 0,
//   "economy": 0,
//   "battingAvg": 0,
//   "bowlingAverage": 0,
//   "notOuts": 3,
//   "matchesPlayed": 2,
//   "wickets": 0,
//   "fours": 0,
//   "sixes": 0,
//   "pomCount": 0
// }

export const getTournamentNamesandIds = async () => {
  try {
    const response = await axios.get(`${url}/tournament/namesAndIds`);
    return response.data;
  } catch (error) {
    console.error("Error fetching tournament names and ids:", error);
    throw error;
  }
};
//repsonse{
// [
//   {
//     "1": "Spring Cricket 2025"
//   },
//   {
//     "15": "Summer Cricket 2026"
//   },
//   {
//     "16": "Champions"
//   },
//   {
//     "17": "Best Volleyball "
//   },
//   {
//     "18": "sadasdasd"
//   }
// ]

export const getPlayerStats = async (playerId, sport = null) => {
  try {
    const params = sport ? `?sport=${encodeURIComponent(sport)}` : "";
    const response = await axios.get(
      `${url}/player/${playerId}/stats${params}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching player stats:", error);
    throw error;
  }
};
export const getTopVotedPlayers = async (tournamentId) => {
  const r = await axios.get(
    `${url}/api/favourite-player/top-voted/${tournamentId}`,
  );
  return r.data;
};

export const setManOfTournament = async (tournamentId, playerId) => {
  const r = await axios.post(
    `${url}/api/favourite-player/set-mot/${tournamentId}/${playerId}`,
  );
  return r.data;
};

export const setManOfTournamentRanked = async (
  tournamentId,
  playerId,
  rank,
) => {
  const r = await axios.post(
    `${url}/api/favourite-player/tournament/${tournamentId}/man-of-tournament`, // ← was /award/tournament
    null,
    { params: { playerId, rank } },
  );
  return r.data;
};

export const getTopStatPlayers = async (tournamentId) => {
  const r = await axios.get(
    `${url}/api/favourite-player/top-stats/${tournamentId}`,
  );
  return r.data;
};
