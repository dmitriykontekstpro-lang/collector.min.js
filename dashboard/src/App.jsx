
import { useEffect, useState, useMemo } from 'react'
import { supabase } from './supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { Users, Target, Activity, AlertTriangle, ChevronDown, Filter, Calendar, Zap, Rocket, Moon, Sun, Smartphone, Laptop, Hash, Clock, MousePointer2, Layers, AlertOctagon } from 'lucide-react'

const WEALTH_COLORS = { Low: '#94a3b8', Mid: '#fbbf24', High: '#34d399' };

function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('behavior'); // 'behavior' | 'data'

  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
    fetchData();
  }, [])

  async function fetchData() {
    try {
      const { data, error } = await supabase.from('analytics').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setRawData(data);
      const campaigns = [...new Set(data.map(r => r.data?.utm_campaign).filter(Boolean))];
      setAvailableCampaigns(campaigns);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  const filteredData = useMemo(() => {
    if (!rawData.length) return [];
    return rawData.filter(r => {
      const date = new Date(r.created_at);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      const inDateRange = (!dateRange.start || date >= startDate) && (!dateRange.end || date <= endDate);
      const campaign = r.data?.utm_campaign || 'Non-ad Traffic';
      const inCampaign = selectedCampaigns.length === 0 || selectedCampaigns.includes(campaign);
      return inDateRange && inCampaign;
    });
  }, [rawData, dateRange, selectedCampaigns]);

  const stats = useMemo(() => {
    if (!filteredData.length) return null;

    const totalUsers = filteredData.length;

    // Calculate Averages for "Data" Tab (Safe check for undefined values)
    const avg = (key) => Math.round(filteredData.reduce((a, r) => a + (r.data?.[key] || 0), 0) / (totalUsers || 1));
    const sum = (key) => filteredData.reduce((a, r) => a + (r.data?.[key] || 0), 0);

    // --- TAB 1: BEHAVIOR LOGIC ---
    let behaviorTypes = { Active: 0, Passive: 0, Engaged: 0, Nervous: 0 };
    filteredData.forEach(r => {
      const d = r.data || {};
      if ((d.rage_click_count || 0) > 0 || (d.tab_switch_count || 0) > 3) behaviorTypes.Nervous++;
      else if ((d.total_time_sec || 0) > 60 && (d.max_scroll_depth_percent || 0) > 50) behaviorTypes.Engaged++;
      else if ((d.mouse_velocity_px_sec || 0) > 500 || (d.fields_filled_count || 0) > 0) behaviorTypes.Active++;
      else behaviorTypes.Passive++;
    });
    const behaviorData = Object.keys(behaviorTypes).map(k => ({ subject: k, A: behaviorTypes[k], fullMark: totalUsers }));

    // Tech & Wealth
    const devices = { Mobile: 0, Desktop: 0 };
    const osStats = {};
    let wealth = { Low: 0, Mid: 0, High: 0 };

    filteredData.forEach(r => {
      const d = r.data || {};
      if (d.screen_width < 768 || d.is_mobile) devices.Mobile++; else devices.Desktop++;

      const os = d.os_type || 'Other';
      osStats[os] = (osStats[os] || 0) + 1;

      const mem = d.device_memory_gb || 4;
      const cores = d.hardware_concurrency || 4;
      if (os === 'MacOS' || os === 'iOS' || mem >= 8 || cores > 8) wealth.High++;
      else if (mem < 4) wealth.Low++;
      else wealth.Mid++;
    });

    // --- TAB 2: DATA GRID METRICS ---
    const numerics = [
      { label: 'Total Visits', val: totalUsers, icon: Users },
      { label: 'Leads (Goals)', val: filteredData.filter(r => r.data?.is_lead).length, icon: Target, color: '#34d399' },
      { label: 'Avg Time (sec)', val: avg('total_time_sec'), icon: Clock },
      { label: 'Avg Scroll Depth (%)', val: avg('max_scroll_depth_percent'), icon: Activity },
      { label: 'Rage Clicks (Total)', val: sum('rage_click_count'), icon: AlertOctagon, color: '#f87171' },
      { label: 'Tab Switches', val: sum('tab_switch_count'), icon: Layers },
      { label: 'Avg Mouse Speed', val: avg('mouse_velocity_px_sec'), icon: MousePointer2 },
      { label: 'Form Starts', val: filteredData.filter(r => r.data?.form_start_time_sec).length, icon: Hash },
      { label: 'Fields Filled (Total)', val: sum('fields_filled_count'), icon: Hash },
      { label: 'Text Copied (Total)', val: sum('text_copied_count'), icon: Hash },
      { label: 'Hover Hesitation (sec)', val: avg('hover_hesitation_sec'), icon: Clock },
      { label: 'Visits (9-18h)', val: filteredData.filter(r => r.data?.is_working_hours).length, icon: Sun },
      { label: 'Visits (Night)', val: totalUsers - filteredData.filter(r => r.data?.is_working_hours).length, icon: Moon },
      { label: 'Mobile Users', val: devices.Mobile, icon: Smartphone },
      { label: 'Desktop Users', val: devices.Desktop, icon: Laptop },
    ];

    return {
      totalUsers, behaviorData,
      deviceData: [{ name: 'Mobile', value: devices.Mobile }, { name: 'Desktop', value: devices.Desktop }],
      osData: Object.keys(osStats).map(k => ({ name: k, count: osStats[k] })),
      wealthData: Object.keys(wealth).map(k => ({ name: k, value: wealth[k] })),
      numerics
    };
  }, [filteredData]);

  const toggleCampaign = (camp) => setSelectedCampaigns(prev => prev.includes(camp) ? prev.filter(c => c !== camp) : [...prev, camp]);

  // ML DATASET EXPORT
  async function handleExportML() {
    if (!filteredData.length) {
      alert('Нет данных для экспорта');
      return;
    }

    setIsExporting(true);
    setExportStatus('Трансформируем данные...');

    try {
      // Transform analytics data to ML format
      const mlRows = filteredData.map(row => {
        const d = row.data || {};
        
        return {
          target_is_lead: d.is_lead || false,
          total_time_sec: d.total_time_sec || 0,
          max_scroll_depth_percent: d.max_scroll_depth_percent || 0,
          mouse_velocity_px_sec: d.mouse_velocity_px_sec || 0,
          hover_hesitation_sec: d.hover_hesitation_sec || 0,
          rage_click_count: d.rage_click_count || 0,
          tab_switch_count: d.tab_switch_count || 0,
          scroll_direction_changes: d.scroll_direction_changes || 0,
          text_selection_count: d.text_selection_count || 0,
          text_copied_count: d.text_copied_count || 0,
          fields_filled_count: d.fields_filled_count || 0,
          form_start_time_sec: d.form_start_time_sec || null,
          os_type: d.os_type || 'Unknown',
          screen_width: d.screen_width || 0,
          screen_height: d.screen_height || 0,
          device_memory_gb: d.device_memory_gb || 4,
          hardware_concurrency: d.hardware_concurrency || 4,
          is_working_hours: d.is_working_hours || false,
          is_mobile: d.is_mobile || false,
          traffic_source_type: d.traffic_source_type || 'Direct',
          utm_campaign: d.utm_campaign || null,
          original_analytics_id: row.id
        };
      });

      setExportStatus(`Загружаем ${mlRows.length} записей в Supabase...`);

      // Batch insert (Supabase can handle large batches)
      const { data, error } = await supabase
        .from('ml_dataset')
        .upsert(mlRows, { onConflict: 'original_analytics_id' });

      if (error) throw error;

      setExportStatus(`✅ Успешно! Экспортировано ${mlRows.length} записей.`);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus(`❌ Ошибка: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }

  if (loading) return <div className="loading">Загрузка ML Data...</div>;

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>FitBase & ML-Data</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Advanced Behavioral Analytics</p>
      </header>

      {/* FILTERS */}
      <div className="filters-bar">
        <div className="filter-group">
          <label className="filter-label"><Calendar size={14} style={{ marginBottom: -2 }} /> Период</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="date" className="glass-input" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
            <input type="date" className="glass-input" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label"><Filter size={14} style={{ marginBottom: -2 }} /> Источники</label>
          <div className={`campaign-dropdown ${isDropdownOpen ? 'open' : ''}`}>
            <div className="dropdown-toggle" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              {selectedCampaigns.length > 0 ? `${selectedCampaigns.length} выбрано` : 'Все кампании'} <ChevronDown size={14} />
            </div>
            <div className="dropdown-menu">
              {availableCampaigns.length === 0 && <div style={{ padding: '5px', color: '#ccc' }}>Нет данных</div>}
              {availableCampaigns.map(camp => (
                <div key={camp} className="checkbox-item" onClick={() => toggleCampaign(camp)}>
                  <input type="checkbox" checked={selectedCampaigns.includes(camp)} readOnly /> <span>{camp}</span>
                </div>
              ))}
              {availableCampaigns.length > 0 && <div className="checkbox-item" onClick={() => setSelectedCampaigns([])}><span>Сбросить</span></div>}
            </div>
          </div>
        </div>
      </div>

      {/* ML EXPORT BUTTON */}
      <div style={{marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <button 
              onClick={handleExportML} 
              disabled={isExporting || !filteredData.length}
              style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: '#fff',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  opacity: isExporting ? 0.6 : 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
          >
              {isExporting ? '⏳ Экспортируем...' : '🚀 Подготовить DS для ML'}
          </button>
          {exportStatus && (
              <span style={{color: exportStatus.includes('✅') ? '#34d399' : '#f87171', fontSize: '0.9rem'}}>
                  {exportStatus}
              </span>
          )}
      </div>

      {/* TABS SWITCHER */}
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'behavior' ? 'active' : ''}`} onClick={() => setActiveTab('behavior')}>
          🚀 Behavior & Profiling
        </button>
        <button className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}>
          📊 Raw Numerics (Data)
        </button>
      </div>

      {!stats ? <div className="no-data">Нет данных</div> : (
        <>
          {/* --- TAB 1: BEHAVIOR --- */}
          {activeTab === 'behavior' && (
            <div className="animate-fade-in">
              {/* 1. ПОВЕДЕНИЕ */}
              <h2 className="section-title">🧠 1. Психотип пользователей</h2>
              <div className="charts-grid" style={{ marginBottom: '3rem' }}>
                <div className="card">
                  <h3>Поведенческий профиль</h3>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.behaviorData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#334155" />
                        <Radar name="Users" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.6} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="card">
                  <h3>Расшифровка</h3>
                  <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>
                    <li style={{ marginBottom: '10px' }}><strong style={{ color: '#f87171' }}>Nervous:</strong> Яростные клики, дерганая мышь, переключения вкладок.</li>
                    <li style={{ marginBottom: '10px' }}><strong style={{ color: '#34d399' }}>Engaged:</strong> Долго на сайте (&gt;60c) + глубокий скролл.</li>
                    <li style={{ marginBottom: '10px' }}><strong style={{ color: '#fbbf24' }}>Active:</strong> Быстро двигают мышью, заполняют формы.</li>
                    <li><strong style={{ color: '#94a3b8' }}>Passive:</strong> Просто "висят" или медленно скроллят.</li>
                  </ul>
                </div>
              </div>

              {/* 2. ТЕХНОЛОГИИ */}
              <h2 className="section-title">📱 2. Устройства и Технологии</h2>
              <div className="charts-grid" style={{ marginBottom: '3rem' }}>
                <div className="card">
                  <h3>Mobile vs Desktop</h3>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.deviceData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {stats.deviceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'Mobile' ? '#f472b6' : '#38bdf8'} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <span style={{ color: '#f472b6' }}>Mobile</span> vs <span style={{ color: '#38bdf8' }}>Desktop</span>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <h3>Операционные системы</h3>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.osData}>
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                        <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 3. ПЛАТЕЖЕСПОСОБНОСТЬ */}
              <h2 className="section-title">💰 3. Оценка Платежеспособности (Beta)</h2>
              <div className="charts-grid">
                <div className="card" style={{ gridColumn: 'span 2' }}>
                  <h3>Уровень девайсов аудитории</h3>
                  <p style={{ fontSize: '0.8em', color: '#94a3b8', marginTop: '-10px' }}>На основе CPU, RAM и бренда (Apple = High)</p>

                  <div style={{ display: 'flex', gap: '20px', marginTop: '20px', paddingBottom: '20px' }}>
                    {stats.wealthData.map((w) => (
                      <div key={w.name} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px', textAlign: 'center', borderTop: `4px solid ${WEALTH_COLORS[w.name]}` }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: WEALTH_COLORS[w.name] }}>{w.value}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{w.name} Income Tier</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB 2: DATA GRID --- */}
          {activeTab === 'data' && (
            <div className="animate-fade-in">
              <h2 className="section-title">📊 Raw Data Metrics</h2>
              <div className="data-grid-full">
                {stats.numerics.map((item, i) => (
                  <div key={i} className="data-card-mini">
                    <div className="stat-label" style={{ color: item.color || 'var(--text-secondary)' }}>
                      <item.icon size={16} /> {item.label}
                    </div>
                    <div className="val" style={{ color: item.color || '#fff' }}>
                      {item.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </>
      )}
    </div>
  )
}

export default App
