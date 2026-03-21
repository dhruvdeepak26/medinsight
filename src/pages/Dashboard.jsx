import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'
import './Analyze.css'

const STAT_CARDS = [
  { label: 'Heart Rate', key: 'heartRate', unit: 'bpm', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { label: 'SpO2', key: 'spo2', unit: '%', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )},
  { label: 'Glucose', key: 'glucose', unit: 'mg/dL', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { label: 'Daily Steps', key: 'steps', unit: 'steps', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
]

const SECTION_ICONS = {
  'Demographics':   '👤',
  'Cardiovascular': '🫀',
  'Lifestyle':      '🏃',
  'Blood Panel':    '🔬',
}

const OVERALL_META = {
  excellent: { emoji: '✅', cls: 'ok' },
  good:      { emoji: '✅', cls: 'ok' },
  fair:      { emoji: '⚠️', cls: 'warn' },
  poor:      { emoji: '❌', cls: 'danger' },
}

const METRIC_META = {
  normal:   { emoji: '✅', label: 'Normal',   cls: 'ok' },
  warning:  { emoji: '⚠️', label: 'Warning',  cls: 'warn' },
  critical: { emoji: '❌', label: 'Critical', cls: 'danger' },
}

const STATUS_ICON = {
  ok: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  warn: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  danger: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatChartDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { score, fullDate } = payload[0].payload
  return (
    <div className="trend-tooltip">
      <div className="trend-tooltip__score">{score}</div>
      <div className="trend-tooltip__label">{getScoreLabel(score)}</div>
      <div className="trend-tooltip__date">{fullDate}</div>
    </div>
  )
}

function HealthTrendChart({ history }) {
  if (history.length < 2) {
    return (
      <div className="card trend-card">
        <div className="trend-card__header">
          <h2 className="trend-card__title">Health Score Trend</h2>
        </div>
        <div className="trend-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 16l4-4 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Run at least 2 analyses to see your trend</p>
        </div>
      </div>
    )
  }

  const chartData = history.map(entry => ({
    date: formatChartDate(entry.created_at),
    fullDate: formatDate(entry.created_at),
    score: entry.score,
  }))

  return (
    <div className="card trend-card">
      <div className="trend-card__header">
        <h2 className="trend-card__title">Health Score Trend</h2>
        <span className="trend-card__range">{chartData.length} analyses</span>
      </div>
      <div className="trend-chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e5b4" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#00e5b4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="date"
              tick={{ fill: '#8892a4', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#8892a4', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              content={<TrendTooltip />}
              cursor={{ stroke: 'rgba(0,229,180,0.2)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#00e5b4"
              strokeWidth={2}
              fill="url(#trendGradient)"
              dot={{ r: 4, fill: '#00e5b4', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#00e5b4', stroke: 'rgba(0,229,180,0.3)', strokeWidth: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function getScoreStatus(score) {
  if (score >= 80) return 'ok'
  if (score >= 50) return 'warn'
  return 'danger'
}

function getScoreLabel(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Attention'
}

function AiReportContent({ data }) {
  const overall = OVERALL_META[data.overall?.status] ?? OVERALL_META.fair

  return (
    <div className="report">
      <div className={`report__overall report__overall--${overall.cls}`}>
        <span className="report__overall-emoji">{overall.emoji}</span>
        <div className="report__overall-body">
          <div className="report__overall-label">{data.overall?.label ?? 'Health Assessment'}</div>
          <p className="report__overall-summary">{data.overall?.summary}</p>
        </div>
      </div>

      {data.sections?.map(section => {
        const icon = SECTION_ICONS[section.name] ?? '📋'
        return (
          <div key={section.name} className="report__section">
            <div className="report__section-header">
              <span className="report__section-icon">{icon}</span>
              <h3 className="report__section-title">{section.name}</h3>
            </div>
            <div className="report__table-wrap">
              <table className="report__table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Normal Range</th>
                  </tr>
                </thead>
                <tbody>
                  {section.metrics?.map(metric => {
                    const m = METRIC_META[metric.status] ?? METRIC_META.normal
                    return (
                      <tr key={metric.name}>
                        <td className="report__metric-name">{metric.name}</td>
                        <td className="report__metric-value"><strong>{metric.value}</strong></td>
                        <td>
                          <span className={`report__badge report__badge--${m.cls}`}>
                            {m.emoji} {m.label}
                          </span>
                        </td>
                        <td className="report__range">{metric.range || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {section.metrics?.some(m => m.note) && (
              <div className="report__notes">
                {section.metrics.filter(m => m.note).map(metric => {
                  const m = METRIC_META[metric.status] ?? METRIC_META.normal
                  return (
                    <div key={metric.name} className={`report__note report__note--${m.cls}`}>
                      <span className="report__note-metric">{metric.name}:</span> {metric.note}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {data.recommendations?.length > 0 && (
        <div className="report__recommendations">
          <div className="report__rec-header">
            <span>💡</span>
            <h3>Recommendations</h3>
          </div>
          <ol className="report__rec-list">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="report__rec-item">
                <span className="report__rec-num">{i + 1}</span>
                <span>{rec}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function AnalysisModal({ entry, onClose }) {
  const score = entry.score
  const scoreStatus = getScoreStatus(score)
  const scoreLabel = getScoreLabel(score)
  const insights = entry.metrics?.insights ?? []
  const okCount = insights.filter(i => i.status === 'ok').length
  const warnCount = insights.filter(i => i.status === 'warn').length
  const dangerCount = insights.filter(i => i.status === 'danger').length

  let aiReportData = null
  if (entry.ai_report) {
    try {
      const cleaned = entry.ai_report
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
      aiReportData = JSON.parse(cleaned)
    } catch {}
  }

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal__header">
          <div>
            <h2 className="modal__title">Analysis Detail</h2>
            <p className="modal__date">{formatDate(entry.created_at)}</p>
          </div>
          <button className="btn btn-ghost modal__close-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Close
          </button>
        </div>

        <div className="modal__body">

          {/* Score card */}
          <div className={`card analyze__score-card analyze__score-card--${scoreStatus}`}>
            <div className="analyze__score-top">
              <div>
                <div className="analyze__score-eyebrow">Overall Health Score</div>
                <div className={`analyze__score-num analyze__score--${scoreStatus}`}>{score}</div>
                <div className="analyze__score-label">{scoreLabel}</div>
              </div>
              <div className="analyze__score-breakdown">
                <div className="analyze__bd-item">
                  <span className="analyze__bd-num analyze__bd--ok">{okCount}</span>
                  <span className="analyze__bd-label">Normal</span>
                </div>
                <div className="analyze__bd-item">
                  <span className="analyze__bd-num analyze__bd--warn">{warnCount}</span>
                  <span className="analyze__bd-label">Warning</span>
                </div>
                <div className="analyze__bd-item">
                  <span className="analyze__bd-num analyze__bd--danger">{dangerCount}</span>
                  <span className="analyze__bd-label">Critical</span>
                </div>
              </div>
            </div>
            <div className="analyze__score-bar">
              <div
                className={`analyze__score-fill analyze__score-fill--${scoreStatus}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="analyze__bar-labels">
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>

          {/* Findings */}
          {insights.length > 0 && (
            <>
              <h3 className="modal__section-title">Detailed Findings</h3>
              <div className="analyze__insights">
                {insights.map((insight, i) => (
                  <div key={i} className={`analyze__insight analyze__insight--${insight.status}`}>
                    <div className="analyze__insight-head">
                      <div className={`analyze__insight-icon analyze__insight-icon--${insight.status}`}>
                        {STATUS_ICON[insight.status]}
                      </div>
                      <span className="analyze__insight-metric">{insight.metric}</span>
                      <span className={`badge badge-${insight.status}`}>{insight.value}</span>
                    </div>
                    <p className="analyze__insight-text">{insight.text}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* AI Report */}
          {(aiReportData || entry.ai_report) && (
            <div className="card analyze__ai-report">
              <div className="analyze__ai-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>AI Health Report</span>
              </div>
              {aiReportData ? (
                <AiReportContent data={aiReportData} />
              ) : (
                <p className="report__fallback">{entry.ai_report}</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoadingData(true)
      setFetchError(null)
      const { data, error } = await supabase
        .from('analyses')
        .select('id, created_at, metrics, score, ai_report')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) {
        setFetchError('Failed to load analyses. Please try again.')
      } else {
        setHistory(data ?? [])
      }
      setLoadingData(false)
    }

    load()
  }, [user])

  async function handleDelete(entry) {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return
    setDeletingId(entry.id)
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', entry.id)
    if (!error) {
      setHistory(prev => prev.filter(h => h.id !== entry.id))
      if (selectedEntry?.id === entry.id) setSelectedEntry(null)
    }
    setDeletingId(null)
  }

  const latest = history[history.length - 1]

  return (
    <div className="page dashboard">
      <div className="container">

        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Dashboard</h1>
            <p className="dashboard__sub">Your health overview and analysis history</p>
          </div>
          <Link to="/analyze" className="btn btn-primary">
            New Analysis
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </Link>
        </div>

        {loadingData ? (
          <div className="dashboard__loading">
            <div className="dashboard__loading-spinner" />
            <p>Loading your analyses…</p>
          </div>
        ) : fetchError ? (
          <div className="dashboard__error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {fetchError}
          </div>
        ) : history.length === 0 ? (
          <div className="dashboard__empty">
            <div className="dashboard__empty-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>No analyses yet</h2>
            <p>Run your first health analysis to see your data and insights here.</p>
            <Link to="/analyze" className="btn btn-primary">Run First Analysis</Link>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="dashboard__stats-grid">
              {STAT_CARDS.map(({ label, key, unit, icon }) => {
                const val = latest?.metrics?.[key]
                return (
                  <div key={key} className="card dashboard__stat-card">
                    <div className="dashboard__stat-top">
                      <span className="dashboard__stat-label">{label}</span>
                      <span className="dashboard__stat-icon">{icon}</span>
                    </div>
                    <div className="dashboard__stat-val">
                      {val ? (
                        <>
                          <span className="dashboard__stat-num">{val}</span>
                          <span className="dashboard__stat-unit">{unit}</span>
                        </>
                      ) : (
                        <span className="dashboard__stat-na">—</span>
                      )}
                    </div>
                    <div className="dashboard__stat-footer">Latest reading</div>
                  </div>
                )
              })}
            </div>

            {/* Health trend chart */}
            <HealthTrendChart history={history} />

            {/* History table */}
            <div className="dashboard__history">
              <div className="dashboard__history-header">
                <h2 className="dashboard__history-title">Analysis History</h2>
                <span className="badge badge-accent">{history.length} record{history.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="dashboard__table-wrap">
                <table className="dashboard__table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Score</th>
                      <th>BMI</th>
                      <th>Heart Rate</th>
                      <th>Blood Pressure</th>
                      <th>Glucose</th>
                      <th>Findings</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...history].reverse().map((entry) => {
                      const status = getScoreStatus(entry.score)
                      const insightsCount = entry.metrics?.insights?.length ?? 0
                      return (
                        <tr
                          key={entry.id}
                          className="dashboard__table-row--clickable"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          <td className="dashboard__td-muted">{formatDate(entry.created_at)}</td>
                          <td>
                            <div className="dashboard__score-cell">
                              <span className={`dashboard__score-num dashboard__score--${status}`}>
                                {entry.score}
                              </span>
                              <span className="dashboard__score-sublabel">{getScoreLabel(entry.score)}</span>
                            </div>
                          </td>
                          <td>{entry.metrics?.bmi || '—'}</td>
                          <td>{entry.metrics?.heartRate ? `${entry.metrics.heartRate} bpm` : '—'}</td>
                          <td>{entry.metrics?.bloodPressure || '—'}</td>
                          <td>{entry.metrics?.glucose ? `${entry.metrics.glucose} mg/dL` : '—'}</td>
                          <td>
                            <span className={`badge badge-${status}`}>
                              {insightsCount} finding{insightsCount !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td
                            className="dashboard__td-actions"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              className="dashboard__delete-btn"
                              onClick={() => handleDelete(entry)}
                              disabled={deletingId === entry.id}
                              title="Delete analysis"
                            >
                              {deletingId === entry.id ? (
                                <span className="dashboard__delete-spinner" />
                              ) : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              )}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedEntry && (
        <AnalysisModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  )
}
