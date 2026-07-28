import React, { useEffect, useMemo, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../../lib/supabase';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const emptySeries = [];

const formatMoney = (value) => {
  if (value == null) return 'N/A';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: numeric >= 1000 ? 0 : 2,
  }).format(numeric);
};

function StatCard({ label, value, hint, icon, tone = 'neutral' }) {
  const toneClasses = {
    neutral: 'border-white/5 bg-white/5',
    positive: 'border-emerald-400/20 bg-emerald-400/10',
    accent: 'border-primary/20 bg-primary/10',
    warning: 'border-amber-400/20 bg-amber-400/10',
  };

  return (
    <div className={`glass-card p-6 rounded-3xl border ${toneClasses[tone]} transition-colors`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-2">{label}</p>
          <h3 className="text-3xl font-display font-bold text-white">{value}</h3>
          {hint && <p className="text-[11px] text-on-surface-variant mt-2">{hint}</p>}
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, action }) {
  return (
    <div className="glass-card p-6 rounded-3xl border-white/5">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl text-white font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-on-surface-variant mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function AdminHome() {
  const [overview, setOverview] = useState(null);
  const [series, setSeries] = useState(emptySeries);
  const [recentNews, setRecentNews] = useState([]);
  const [recentLaunches, setRecentLaunches] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      if (!supabase) {
        if (active) setLoading(false);
        return;
      }

      const [metricsRes, launchesRes, newsRes] = await Promise.all([
        supabase
          .from('platform_metrics')
          .select('metric_date, free_users, premium_users, active_launches, archived_launches, monthly_mrr, total_volume')
          .order('metric_date', { ascending: false })
          .limit(7),
        supabase
          .from('launches')
          .select('id, name, status, access_tier, launch_at')
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('news_posts')
          .select('id, title, published_at, category')
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(3),
      ]);

      let logsData = [];
      try {
        const { data: logs, error: logsError } = await supabase
          .from('admin_activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (!logsError && logs) {
          logsData = logs;
        }
      } catch (e) {
        console.log('admin_activity_logs not populated or missing, skipping');
      }

      if (!active) return;

      setActivityLogs(logsData);

      const metricsRows = metricsRes.data ?? [];
      const normalizedSeries = metricsRows
        .slice()
        .reverse()
        .map((row) => ({
          label: new Date(row.metric_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          users: Number(row.free_users || 0) + Number(row.premium_users || 0),
          revenue: Number(row.monthly_mrr || 0),
          launches: Number(row.active_launches || 0),
        }));

      setSeries(normalizedSeries);
      setOverview(metricsRows[0] || null);
      setRecentNews((newsRes.data ?? []).map((item) => ({
        title: item.title,
        meta: item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Draft',
      })));
      setRecentLaunches((launchesRes.data ?? []).map((item) => ({
        name: item.name,
        status: item.status,
        tier: item.access_tier,
        time: item.launch_at ? new Date(item.launch_at).toLocaleDateString() : 'TBA',
      })));
      setLoading(false);
    };

    if (!hasSupabaseConfig) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    load().catch(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (!overview) {
      return [];
    }

    const freeUsers = Number(overview.free_users || 0);
    const premiumUsers = Number(overview.premium_users || 0);
    const totalUsers = freeUsers + premiumUsers;
    const revenue = overview.monthly_mrr;
    const activeLaunches = overview.active_launches || 0;
    const archivedLaunches = overview.archived_launches || 0;
    const volume = overview.total_volume;

    return [
      { label: 'Total users', value: totalUsers.toLocaleString(), hint: `${freeUsers.toLocaleString()} free / ${premiumUsers.toLocaleString()} premium`, icon: 'group', tone: 'accent' },
      { label: 'Monthly revenue', value: formatMoney(revenue), hint: 'MRR from active subscriptions', icon: 'payments', tone: 'positive' },
      { label: 'Active launches', value: activeLaunches.toLocaleString(), hint: `${archivedLaunches.toLocaleString()} archived in vault`, icon: 'rocket_launch', tone: 'warning' },
      { label: 'Total volume', value: formatMoney(volume), hint: 'Aggregated platform volume', icon: 'insights', tone: 'neutral' },
    ];
  }, [overview]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 bg-primary/15 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase">
            Admin Command Center
          </span>
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Overview</h1>
            <p className="text-on-surface-variant text-sm max-w-2xl">
              Track user growth, revenue, launch activity, and real-time user session audits from one dashboard.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Status</p>
            <p className="text-white font-bold text-sm">{loading ? 'Syncing...' : 'Live'}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Refresh</p>
            <p className="text-white font-bold text-sm">Auto-loaded</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>
          )}

          {overview && (
            <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
              <Panel
                title="Growth Trend"
                subtitle="Combined user count, revenue, and active launches over the last seven snapshots."
                action={<span className="text-[11px] text-on-surface-variant font-mono uppercase tracking-wider">7 day view</span>}
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series}>
                      <defs>
                        <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d4ff00" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#d4ff00" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(13, 17, 23, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          color: '#fff',
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="users" name="Users" stroke="#d4ff00" fill="url(#usersFill)" strokeWidth={2} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#60a5fa" fill="url(#revenueFill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Launch Health" subtitle="Launch inventory by current status">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(13, 17, 23, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="launches" name="Active launches" fill="#d4ff00" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Panel title="Recent News" subtitle="Latest posts published from the newsroom">
              <div className="space-y-3">
                {recentNews.length > 0 ? recentNews.map((item) => (
                  <div key={`${item.title}-${item.meta}`} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-white font-bold truncate">{item.title}</p>
                      <p className="text-[11px] text-on-surface-variant mt-1">{item.meta}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-white/10 text-on-surface-variant">Published</span>
                  </div>
                )) : (
                  <div className="text-on-surface-variant">No published news yet.</div>
                )}
              </div>
            </Panel>

            <Panel title="Recent Launches" subtitle="Most recent launch records and their access tier">
              <div className="space-y-3">
                {recentLaunches.length > 0 ? recentLaunches.map((item) => (
                  <div key={`${item.name}-${item.time}`} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-white font-bold truncate">{item.name}</p>
                      <p className="text-[11px] text-on-surface-variant mt-1">
                        {item.status} • {item.tier}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-primary/15 text-primary">{item.time}</span>
                  </div>
                )) : (
                  <div className="text-on-surface-variant">No launch records yet.</div>
                )}
              </div>
            </Panel>
          </div>

          {/* User Session Audits log panel */}
          <Panel title="User Session Audits" subtitle="Real-time audits of logged-in user sessions, activity types, and accumulated time tracking">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Activity Log Details</th>
                    <th className="py-3 px-4 text-center">Session Duration</th>
                    <th className="py-3 px-4 text-right">Activity Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activityLogs.length > 0 ? activityLogs.map((log) => {
                    const formattedTime = log.created_at 
                      ? new Date(log.created_at).toLocaleString() 
                      : 'Recent';

                    return (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors text-xs">
                        <td className="py-3.5 px-4 font-semibold text-white truncate max-w-[200px]">{log.email || 'Anonymous'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                            log.action_type === 'login' ? 'bg-primary/20 text-primary' :
                            log.action_type === 'join_launch' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            log.action_type === 'leave_launch' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            log.action_type === 'view_launch' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-white/10 text-on-surface-variant'
                          }`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant max-w-[300px] truncate">{log.details || '-'}</td>
                        <td className="py-3.5 px-4 text-on-surface-variant font-mono text-center">
                          {log.duration_seconds >= 60 
                            ? `${Math.floor(log.duration_seconds / 60)}m ${log.duration_seconds % 60}s`
                            : `${log.duration_seconds || 0}s`}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant font-mono text-right">{formattedTime}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-4xl text-white/20 mb-2 block">history_toggle_off</span>
                        No active session or user activity logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
