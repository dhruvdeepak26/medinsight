import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

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

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
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

export default function Dashboard() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('medinsight_history')
    if (saved) setHistory(JSON.parse(saved))
  }, [])

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

        {history.length === 0 ? (
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
                const val = latest?.data?.[key]
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
                    </tr>
                  </thead>
                  <tbody>
                    {[...history].reverse().map((entry, i) => {
                      const status = getScoreStatus(entry.score)
                      return (
                        <tr key={i}>
                          <td className="dashboard__td-muted">{formatDate(entry.date)}</td>
                          <td>
                            <div className="dashboard__score-cell">
                              <span className={`dashboard__score-num dashboard__score--${status}`}>
                                {entry.score}
                              </span>
                              <span className="dashboard__score-sublabel">{getScoreLabel(entry.score)}</span>
                            </div>
                          </td>
                          <td>{entry.data?.bmi || '—'}</td>
                          <td>{entry.data?.heartRate ? `${entry.data.heartRate} bpm` : '—'}</td>
                          <td>{entry.data?.bloodPressure || '—'}</td>
                          <td>{entry.data?.glucose ? `${entry.data.glucose} mg/dL` : '—'}</td>
                          <td>
                            <span className={`badge badge-${status}`}>
                              {entry.insights?.length ?? 0} findings
                            </span>
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
    </div>
  )
}
