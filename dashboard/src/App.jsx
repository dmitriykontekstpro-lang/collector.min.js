
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, Target, Clock, Activity, MousePointer2, Smartphone } from 'lucide-react'

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f472b6'];

function App() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data, error } = await supabase.from('analytics').select('*')
      if (error) throw error
      processData(data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  function processData(data) {
    if (!data || data.length === 0) return;

    // 1. Basic Counts
    const totalUsers = data.length;
    const leads = data.filter(r => r.data?.is_lead).length;

    // 2. Averages
    const totalTime = data.reduce((acc, r) => acc + (r.data?.total_time_sec || 0), 0);
    const avgTime = Math.round(totalTime / totalUsers);

    const totalScroll = data.reduce((acc, r) => acc + (r.data?.max_scroll_depth_percent || 0), 0);
    const avgScroll = Math.round(totalScroll / totalUsers);

    // 3. OS Stats
    const osCount = {};
    data.forEach(r => {
      const os = r.data?.os_type || 'Unknown';
      osCount[os] = (osCount[os] || 0) + 1;
    });
    const osData = Object.keys(osCount).map(k => ({ name: k, value: osCount[k] }));

    // 4. Conversion Source
    const sourceCount = {};
    data.forEach(r => {
      const src = r.data?.traffic_source_type || 'Direct';
      sourceCount[src] = (sourceCount[src] || 0) + 1;
    });
    const sourceData = Object.keys(sourceCount).map(k => ({ name: k, count: sourceCount[k] }));

    setStats({
      totalUsers,
      leads,
      avgTime,
      avgScroll,
      osData,
      sourceData
    })
  }

  if (loading) return <div className="loading">Загрузка данных...</div>
  if (!stats) return <div className="loading">Нет данных в базе</div>

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>Tilda Analytics Pro</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Real-time insights from your website</p>
      </header>

      {/* KPI CARDS */}
      <div className="grid-stats">
        <div className="card">
          <div className="stat-label"><Users size={16} /> Всего посетителей</div>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        <div className="card">
          <div className="stat-label" style={{ color: '#34d399' }}><Target size={16} /> Конверсии (Лиды)</div>
          <div className="stat-value" style={{ color: '#34d399' }}>{stats.leads}</div>
          <div className="stat-sub">CR: {((stats.leads / stats.totalUsers) * 100).toFixed(1)}%</div>
        </div>
        <div className="card">
          <div className="stat-label"><Clock size={16} /> Ср. время на сайте</div>
          <div className="stat-value">{stats.avgTime} сек</div>
        </div>
        <div className="card">
          <div className="stat-label"><Activity size={16} /> Ср. глубина скролла</div>
          <div className="stat-value">{stats.avgScroll}%</div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="charts-grid">
        <div className="card">
          <h2>💻 Операционные системы</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.osData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.osData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.9em', color: '#94a3b8' }}>
              {stats.osData.map((e, i) => (
                <span key={i} style={{ marginRight: '15px' }}>
                  <span style={{ color: COLORS[i % COLORS.length] }}>●</span> {e.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h2>🚦 Источники трафика</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.sourceData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
