'use client'

export function PayoffMatrix() {
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
      <h2 className="text-2xl font-bold mb-4 text-white">Payoff Matrix</h2>
      <p className="text-gray-400 text-sm mb-6">
        Points earned per round based on both players' choices
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-2 border-gray-600 bg-gray-800 p-4"></th>
              <th className="border-2 border-gray-600 bg-gray-800 p-4 text-white font-semibold">
                Opponent Cooperates
              </th>
              <th className="border-2 border-gray-600 bg-gray-800 p-4 text-white font-semibold">
                Opponent Defects
              </th>
            </tr>
          </thead>
          <tbody>
            {/* You Cooperate Row */}
            <tr>
              <td className="border-2 border-gray-600 bg-gray-800 p-4 text-white font-semibold">
                You Cooperate
              </td>
              {/* Both Cooperate - Green */}
              <td className="border-2 border-gray-600 bg-green-900/40 p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-3xl font-bold text-green-300">3 / 3</div>
                  <div className="text-xs text-green-400 font-semibold">
                    🤝 Mutual Cooperation
                  </div>
                  <div className="text-xs text-green-200">
                    Both players benefit equally
                  </div>
                </div>
              </td>
              {/* You Cooperate, Opponent Defects - Red (you lose) */}
              <td className="border-2 border-gray-600 bg-red-900/40 p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-3xl font-bold text-red-300">0 / 5</div>
                  <div className="text-xs text-red-400 font-semibold">
                    💔 You're Betrayed
                  </div>
                  <div className="text-xs text-red-200">
                    You get nothing, opponent exploits
                  </div>
                </div>
              </td>
            </tr>

            {/* You Defect Row */}
            <tr>
              <td className="border-2 border-gray-600 bg-gray-800 p-4 text-white font-semibold">
                You Defect
              </td>
              {/* You Defect, Opponent Cooperates - Dark Green (you win) */}
              <td className="border-2 border-gray-600 bg-emerald-900/60 p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-3xl font-bold text-emerald-300">5 / 0</div>
                  <div className="text-xs text-emerald-400 font-semibold">
                    ⚔️ You Betray
                  </div>
                  <div className="text-xs text-emerald-200">
                    You exploit their cooperation
                  </div>
                </div>
              </td>
              {/* Both Defect - Yellow */}
              <td className="border-2 border-gray-600 bg-yellow-900/40 p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-3xl font-bold text-yellow-300">1 / 1</div>
                  <div className="text-xs text-yellow-400 font-semibold">
                    ⚡ Mutual Defection
                  </div>
                  <div className="text-xs text-yellow-200">
                    Both lose most potential points
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-xs text-green-300">Both Cooperate</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg">
          <div className="w-4 h-4 bg-emerald-600 rounded"></div>
          <span className="text-xs text-emerald-300">Betray Success</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-xs text-red-300">Betrayed</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-xs text-yellow-300">Both Defect</span>
        </div>
      </div>

      {/* Prize Distribution Info */}
      <div className="mt-6 p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
        <h3 className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
          <span className="text-xl">🏆</span> Prize Distribution
        </h3>
        <ul className="text-sm text-purple-200 space-y-1">
          <li>• <span className="font-semibold">Entry Fee:</span> 0.01 ETH per player</li>
          <li>• <span className="font-semibold">Winners:</span> Top 30% of players by total score</li>
          <li>• <span className="font-semibold">Distribution:</span> Progressive rewards (1st place gets the most)</li>
          <li>• <span className="font-semibold">Example:</span> With 10 players, top 3 share the 0.1 ETH prize pool</li>
        </ul>
      </div>
    </div>
  )
}
