'use client'

export default function TeamCallsOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Calls</h1>
        <p className="mt-2 text-gray-600">Sales team call analytics and performance insights</p>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Calls This Week', value: '47', trend: '+12%', color: 'blue' },
          { label: 'Avg Call Duration', value: '14m 32s', trend: '+2m', color: 'green' },
          { label: 'Demo Scheduled', value: '18', trend: '+45%', color: 'purple' },
          { label: 'Team Quality Score', value: '73/100', trend: '+5pts', color: 'orange' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white shadow rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className={`mt-1 text-xs font-medium ${
              kpi.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>{kpi.trend}</p>
          </div>
        ))}
      </div>

      {/* Top Performers & Focus Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h2>
          <div className="space-y-3">
            {[
              { name: 'Sarah Chen', calls: 12, score: 82, demos: 5 },
              { name: 'Mike Johnson', calls: 11, score: 78, demos: 4 },
              { name: 'Lisa Wang', calls: 10, score: 75, demos: 3 },
            ].map((agent) => (
              <div key={agent.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.calls} calls · {agent.demos} demos</p>
                </div>
                <div className="text-lg font-bold text-green-600">{agent.score}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Focus Areas</h2>
          <div className="space-y-3">
            {[
              { area: 'Closing Ask', agents: 5, impact: 'High' },
              { area: 'Objection Handling', agents: 3, impact: 'Medium' },
              { area: 'Demo Setup', agents: 2, impact: 'High' },
            ].map((item) => (
              <div key={item.area} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{item.area}</p>
                  <p className="text-xs text-gray-500">{item.agents} agents need coaching</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  item.impact === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>{item.impact}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
