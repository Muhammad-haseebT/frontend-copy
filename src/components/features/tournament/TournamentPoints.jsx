import React, { useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "../../common/LoadingSpinner";

const url = import.meta.env.VITE_BASE_URL;

export default function TournamentPoints({ tournamentId, sport }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ds, setDs] = useState(sport || "cricket");

  useEffect(() => {
    if (!tournamentId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${url}/tournament/${tournamentId}/points`);
        const list = Array.isArray(res.data) ? res.data : [];
        setPoints(list);
        if (sport) {
          console.log("sport", sport.toLowerCase());
          setDs(sport.toLowerCase());
          return;
        }
        // Auto-detect from data shape
        const hasGD = list[0]?.goalDifference !== undefined;
        const hasDraws = list.some((r) => (r.draws ?? 0) > 0);
        setDs(!hasGD ? "cricket" : hasDraws ? "futsal" : "volleyball");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [tournamentId]);

  if (loading) return <LoadingSpinner />;
  if (!points.length)
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-lg font-medium">No points data available</p>
      </div>
    );

  const s = sport?.toLowerCase() || ds;
  console.log(s);

  const sortedPoints = [...points].sort((a, b) => {
    // 1. Primary: Points (Desc)
    if ((b.points || 0) !== (a.points || 0)) {
      return (b.points || 0) - (a.points || 0);
    }

    // 2. Secondary: Sport-specific tie-breakers
    if (s === "cricket") {
      return (Number(b.nrr) || 0) - (Number(a.nrr) || 0);
    }
    if (s === "futsal") {
      const gdA = a.goalDifference ?? (a.goalsFor ?? 0) - (a.goalsAgainst ?? 0);
      const gdB = b.goalDifference ?? (b.goalsFor ?? 0) - (b.goalsAgainst ?? 0);
      if (gdB !== gdA) return gdB - gdA;
      return (b.goalsFor || 0) - (a.goalsFor || 0);
    }
    if (s === "volleyball") {
      const sdA = (a.goalsFor || 0) - (a.goalsAgainst || 0);
      const sdB = (b.goalsFor || 0) - (b.goalsAgainst || 0);
      if (sdB !== sdA) return sdB - sdA;
      return (b.goalsFor || 0) - (a.goalsFor || 0);
    }

    // 3. Tertiary: Wins (Desc)
    return (b.wins || 0) - (a.wins || 0);
  });

  if (s === "futsal") return <FutsalTable rows={sortedPoints} />;
  if (s === "volleyball") return <VolleyballTable rows={sortedPoints} />;
  if (s === "badminton")
    return <SimpleTable rows={sortedPoints} color="violet" legend="Win = 2 pts" />;
  if (s === "table tennis" || s === "tabletennis")
    return <SimpleTable rows={sortedPoints} color="blue" legend="Win = 2 pts" />;
  if (s === "tug of war" || s === "tugofwar")
    return (
      <SimpleTable
        rows={sortedPoints}
        color="amber"
        legend="Win = 2 pts · Best of rounds"
      />
    );
  if (s === "ludo")
    return <SimpleTable rows={sortedPoints} color="orange" legend="Win = 2 pts" />;
  return <CricketTable rows={sortedPoints} />;
}

// ─── Cricket ─────────────────────────────────────────────────────
function CricketTable({ rows }) {
  return (
    <Wrapper legend="P W L Pts NRR">
      <thead>
        <tr className="bg-red-600 text-white">
          <Th first>Team</Th>
          <Th c>P</Th>
          <Th c>W</Th>
          <Th c>L</Th>
          <Th c>Pts</Th>
          <Th c last>
            NRR
          </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((t, i) => (
          <tr
            key={t.teamId || i}
            className="hover:bg-red-50 even:bg-gray-50 transition-colors"
          >
            <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
              <Rank r={i + 1} />
              {t.teamName}
            </td>
            <td className="p-4 text-center text-gray-600">{t.played}</td>
            <td className="p-4 text-center text-green-600 font-semibold">
              {t.wins}
            </td>
            <td className="p-4 text-center text-red-500 font-semibold">
              {t.losses}
            </td>
            <td className="p-4 text-center font-bold text-lg">{t.points}</td>
            <td className="p-4 text-center">
              <Nrr v={t.nrr} />
            </td>
          </tr>
        ))}
      </tbody>
    </Wrapper>
  );
}

// ─── Futsal ──────────────────────────────────────────────────────
function FutsalTable({ rows }) {
  return (
    <Wrapper mw={580} legend="Win=3 Draw=1 Loss=0 · GD = Goal Difference">
      <thead>
        <tr className="bg-emerald-600 text-white">
          <Th first>Team</Th>
          <Th c>P</Th>
          <Th c>W</Th>
          <Th c>D</Th>
          <Th c>L</Th>
          <Th c>GF</Th>
          <Th c>GA</Th>
          <Th c>GD</Th>
          <Th c last>
            Pts
          </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((t, i) => {
          const gd =
            t.goalDifference ?? (t.goalsFor ?? 0) - (t.goalsAgainst ?? 0);
          return (
            <tr
              key={t.teamId || i}
              className="hover:bg-emerald-50 even:bg-gray-50 transition-colors"
            >
              <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                <Rank r={i + 1} />
                {t.teamName}
              </td>
              <td className="p-4 text-center">{t.played}</td>
              <td className="p-4 text-center text-green-600 font-semibold">
                {t.wins}
              </td>
              <td className="p-4 text-center text-amber-500 font-semibold">
                {t.draws ?? 0}
              </td>
              <td className="p-4 text-center text-red-500 font-semibold">
                {t.losses}
              </td>
              <td className="p-4 text-center">{t.goalsFor ?? 0}</td>
              <td className="p-4 text-center">{t.goalsAgainst ?? 0}</td>
              <td className="p-4 text-center font-mono font-semibold">
                <Gd v={gd} />
              </td>
              <td className="p-4 text-center font-bold text-lg">{t.points}</td>
            </tr>
          );
        })}
      </tbody>
    </Wrapper>
  );
}

// ─── Volleyball ──────────────────────────────────────────────────
function VolleyballTable({ rows }) {
  return (
    <Wrapper
      mw={520}
      legend="SW=Sets Won  SL=Sets Lost  SD=Set Diff · 3-0/3-1: winner 3pts | 3-2: winner 3 loser 1"
    >
      <thead>
        <tr className="bg-blue-600 text-white">
          <Th first>Team</Th>
          <Th c>P</Th>
          <Th c>W</Th>
          <Th c>L</Th>
          <Th c>SW</Th>
          <Th c>SL</Th>
          <Th c>SD</Th>
          <Th c last>
            Pts
          </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((t, i) => {
          const sw = t.goalsFor ?? 0,
            sl = t.goalsAgainst ?? 0;
          return (
            <tr
              key={t.teamId || i}
              className="hover:bg-blue-50 even:bg-gray-50 transition-colors"
            >
              <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                <Rank r={i + 1} />
                {t.teamName}
              </td>
              <td className="p-4 text-center">{t.played}</td>
              <td className="p-4 text-center text-green-600 font-semibold">
                {t.wins}
              </td>
              <td className="p-4 text-center text-red-500 font-semibold">
                {t.losses}
              </td>
              <td className="p-4 text-center text-blue-600 font-semibold">
                {sw}
              </td>
              <td className="p-4 text-center text-gray-600">{sl}</td>
              <td className="p-4 text-center font-mono font-semibold">
                <Gd v={sw - sl} />
              </td>
              <td className="p-4 text-center font-bold text-lg">{t.points}</td>
            </tr>
          );
        })}
      </tbody>
    </Wrapper>
  );
}

// ─── Simple (Badminton / Table Tennis / Tug of War / Ludo) ───────
function SimpleTable({ rows, color, legend }) {
  const bg = {
    violet: "bg-violet-600",
    blue: "bg-blue-600",
    amber: "bg-amber-600",
    orange: "bg-orange-600",
  };
  const hover = {
    violet: "hover:bg-violet-50",
    blue: "hover:bg-blue-50",
    amber: "hover:bg-amber-50",
    orange: "hover:bg-orange-50",
  };
  return (
    <Wrapper legend={legend}>
      <thead>
        <tr className={`${bg[color] || "bg-gray-700"} text-white`}>
          <Th first>Team</Th>
          <Th c>P</Th>
          <Th c>W</Th>
          <Th c>L</Th>
          <Th c last>
            Pts
          </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((t, i) => (
          <tr
            key={t.teamId || i}
            className={`${hover[color] || ""} even:bg-gray-50 transition-colors`}
          >
            <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
              <Rank r={i + 1} />
              {t.teamName}
            </td>
            <td className="p-4 text-center">{t.played}</td>
            <td className="p-4 text-center text-green-600 font-semibold">
              {t.wins}
            </td>
            <td className="p-4 text-center text-red-500 font-semibold">
              {t.losses}
            </td>
            <td className="p-4 text-center font-bold text-lg">{t.points}</td>
          </tr>
        ))}
      </tbody>
    </Wrapper>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────
function Wrapper({ children, mw = 420, legend }) {
  return (
    <div className="overflow-hidden bg-white rounded-xl shadow border border-gray-100">
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse"
          style={{ minWidth: mw }}
        >
          {children}
        </table>
      </div>
      {legend && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
          {legend}
        </div>
      )}
    </div>
  );
}
function Th({ children, c, first, last }) {
  return (
    <th
      className={`p-4 font-semibold text-sm uppercase tracking-wide ${c ? "text-center" : ""} ${first ? "rounded-tl-xl" : ""} ${last ? "rounded-tr-xl" : ""}`}
    >
      {children}
    </th>
  );
}
function Rank({ r }) {
  const bg =
    r === 1
      ? "bg-yellow-400"
      : r === 2
        ? "bg-gray-300"
        : r === 3
          ? "bg-orange-400"
          : "bg-gray-200";
  return (
    <span
      className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] font-black text-white flex-shrink-0 ${bg}`}
    >
      {r}
    </span>
  );
}
function Nrr({ v }) {
  const n = Number(v) || 0;
  const c = n > 0 ? "text-green-600" : n < 0 ? "text-red-500" : "text-gray-500";
  return (
    <span className={`font-mono font-semibold ${c}`}>
      {n > 0 ? "+" : ""}
      {n.toFixed(3)}
    </span>
  );
}
function Gd({ v }) {
  const c = v > 0 ? "text-green-600" : v < 0 ? "text-red-500" : "text-gray-500";
  return (
    <span className={c}>
      {v > 0 ? "+" : ""}
      {v}
    </span>
  );
}
