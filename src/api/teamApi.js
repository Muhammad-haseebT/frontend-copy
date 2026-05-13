import axios from "axios";

const url = import.meta.env.VITE_BASE_URL;

export const getTeamsByTournamentId = async (tournamentId) => {
  const r = await axios.get(`${url}/team/tournament/${tournamentId}`);
  return r.data ?? []; // array
};

export const getMyTeamByTournamentIdAndAccountId = async (
  tournamentId,
  accountId,
) => {
  const r = await axios.get(
    `${url}/team/tournament/account/${tournamentId}/${accountId}`,
  );
  return r.data; // object
};
export const createTeam = async (teamData, playerId, tournamentId) => {
  const r = await axios.post(
    `${url}/team/${tournamentId}/${playerId}`,
    teamData,
  );
  return r.data; // object
};

export const getTeamRequests = async () => {
  const r = await axios.get(`${url}/teamRequest`);
  return r.data ?? []; // array
};
//approve team request
export const approveTeamRequest = async (teamRequestId) => {
  const r = await axios.put(`${url}/teamRequest/approve/${teamRequestId}`);
  return r.data;
};
//reject team request
export const rejectTeamRequest = async (teamRequestId) => {
  const r = await axios.put(`${url}/teamRequest/reject/${teamRequestId}`);
  return r.data;
};
export const createTeamRequest = async (object) => {
  const r = await axios.post(`${url}/teamRequest`, object);
  return r.data;
};

export const getPlayersByTeamId = async (teamId) => {
  const r = await axios.get(`${url}/team/${teamId}/players`);
  return r.data ?? []; // array
};
