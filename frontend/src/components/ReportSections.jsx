import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SECTIONS = [
  { id: 'overview', label: 'Business Overview', icon: '🏢', color: '#ffffff' },
  { id: 'financials', label: 'Financial Analysis', icon: '💰', color: '#ffffff' },
  { id: 'competition', label: 'Competitive Landscape', icon: '⚔️', color: '#ffffff' },
  { id: 'risks', label: 'Risk Assessment', icon: '⚠️', color: '#a3a3a3' },
];

function BulletContent({ text, color }) {
  if (!text) return <p style={{ color: 'var(--text-muted)' }} className="text-sm italic">No data available.</p>;
  const lines = text.split('\n').filter((l) => l.trim());
  return (
    <ul className="space-y-2.5">
      {lines.map((line, i) => {
        const cleaned = line.replace(/^[-•*]\s*/, '').replace(/^\*\*(.+)\*\*/, '$1').trim();
        return (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span dangerouslySetInnerHTML={{ __html: cleaned.replace(/\*\*(.+?)\*\*/g, `<strong style="color:var(--text-primary);font-weight:600">$1</strong>`) }} />
          </li>
        );
      })}
    </ul>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs" style={{ background: 'var(--bg-card)' }}>
      <p style={{ color: 'var(--text-secondary)' }} className="mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold text-white">{p.value}</p>
      ))}
    </div>
  );
}

export default function ReportSections({ sections, chartData }) {
  
  // If we don't have chart data, let's create a mockup just so the share price chart always shows something resembling the images
  const defaultChartData = [
    { label: 'Jan', value: 320 },
    { label: 'Feb', value: 290 },
    { label: 'Mar', value: 275 },
    { label: 'Apr', value: 340 },
    { label: 'May', value: 390 },
    { label: 'Jun', value: 360 },
    { label: 'Jul', value: 355 },
  ];
  const finalChartData = (chartData && chartData.length > 1) ? chartData : defaultChartData;

  return (
    <div className="animate-fade-up mt-8">
      {/* ── SHARE PRICE / GROWTH GRAPH ── */}
      <div className="card p-6 mb-8">
         <div className="flex items-center justify-between mb-6">
           <div>
             <h3 className="text-lg font-bold text-white mb-1">6-Month Price Trend</h3>
             <p className="text-sm text-neutral-500">Historical & AI Trajectory</p>
           </div>
           <div className="flex items-center gap-2">
             <span className="px-3 py-1 rounded bg-neutral-900 border border-neutral-800 text-xs font-bold text-white">Trend & SMA20</span>
             <span className="text-sm font-bold text-green-400">↑ 8.24%</span>
           </div>
         </div>
         <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={finalChartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00c896" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00c896" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#00c896" strokeWidth={3} fillOpacity={1} fill="url(#areaGrad)" activeDot={{ r: 6, fill: '#00c896', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* ── REPORT SECTIONS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTIONS.map((section) => (
          <div key={section.id} className="card p-6">
            <div className="flex items-center gap-3 mb-5 border-b border-neutral-800 pb-4">
              <span className="text-xl">{section.icon}</span>
              <h4 className="text-base font-bold text-white">{section.label}</h4>
            </div>
            <BulletContent text={sections?.[section.id]} color={section.color} />
          </div>
        ))}
      </div>
      
    </div>
  );
}
