import React from 'react';

export default function TournamentOverview({ overview }) {
    return (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-100 rounded-xl p-4 text-center">
                    <div className="text-xl font-semibold text-500 mb-1">Total Teams</div>
                    <div className="text-2xl font-bold">{overview?.teams ?? 0}</div>
                </div>
                <div className="bg-gray-100 rounded-xl p-4 text-center">
                    <div className="text-xl font-semibold text-500 mb-1">PlayerType</div>
                    <div className="text-xl font-bold">{(overview?.playerType || '').toUpperCase()}</div>
                </div>
                <div className="bg-gray-100 rounded-xl p-4 text-center">
                    <div className="text-xl font-semibold text-500 mb-1">StartDate</div>
                    <div className="text-xl font-bold">{overview?.startDate || '-'}</div>
                </div>
            </div>

            {/* Top 3 Teams */}
            <div className="bg-gray-100 rounded-xl p-4">
                <h2 className="text-xl font-bold mb-4">Top 3</h2>
                <div className="space-y-3 border border-red-600 shadow-lg rounded-xl">
                    {overview?.top && overview.top.length > 0 ? (
                        overview.top.map((team, index) => (
                            <div
                                key={team.rank || index}
                                className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl font-bold text-red-600">{team.rank}.</span>
                                    <span className="font-semibold">{team.name}</span>
                                </div>
                                <span className="font-bold text-red-600">({team.points} pts)</span>
                            </div>
                        ))
                    ) : (
                        <h2 className="text-center text-gray-600">No Teams Found</h2>
                    )}
                </div>
            </div>
        </>
    );
}
