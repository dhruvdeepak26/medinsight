import { useState, useEffect } from 'react'
import './Profile.css'

const DEFAULTS = {
  name: '',
  age: '',
  gender: '',
  units: 'metric',
  alerts: false,
  weeklyReports: true,
}

export default function Profile() {
  const [profile, setProfile] = useState(DEFAULTS)
  const [saved, setSaved] = useState(false)
  const [historyCount, setHistoryCount] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('medinsight_profile')
    if (stored) setProfile({ ...DEFAULTS, ...JSON.parse(stored) })
    setHistoryCount(JSON.parse(localStorage.getItem('medinsight_history') || '[]').length)
  }, [])

  const update = (key, val) => setProfile(prev => ({ ...prev, [key]: val }))

  const handleSave = (e) => {
    e.preventDefault()
    localStorage.setItem('medinsight_profile', JSON.stringify(profile))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleClearData = () => {
    if (window.confirm('Delete all health history? This cannot be undone.')) {
      localStorage.removeItem('medinsight_history')
      setHistoryCount(0)
    }
  }

  return (
    <div className="page profile">
      <div className="container">

        <div className="profile__layout">

          {/* ─── Main Form ─── */}
          <div className="profile__main">
            <div className="profile__header">
              <h1 className="profile__title">Profile & Settings</h1>
              <p className="profile__sub">Manage your personal info and app preferences</p>
            </div>

            <form onSubmit={handleSave} className="profile__form">

              {/* Personal Info */}
              <div className="card profile__section">
                <span className="section-tag">Personal Info</span>

                <div className="profile__avatar-row">
                  <div className="profile__avatar">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="profile__avatar-name">{profile.name || 'Your Name'}</div>
                    <div className="profile__avatar-sub">MedInsight User</div>
                  </div>
                </div>

                <div className="profile__fields">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Alex Johnson"
                      value={profile.name}
                      onChange={e => update('name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="e.g. 30"
                      value={profile.age}
                      onChange={e => update('age', e.target.value)}
                      min="1"
                      max="120"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Biological Sex</label>
                    <select
                      className="form-input"
                      value={profile.gender}
                      onChange={e => update('gender', e.target.value)}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="card profile__section">
                <span className="section-tag">Preferences</span>

                <div className="form-group">
                  <label className="form-label">Measurement Units</label>
                  <div className="profile__toggle-group">
                    {[
                      { val: 'metric',   label: 'Metric (kg, cm)' },
                      { val: 'imperial', label: 'Imperial (lbs, in)' },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        className={`profile__toggle-btn${profile.units === val ? ' profile__toggle-btn--active' : ''}`}
                        onClick={() => update('units', val)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="profile__rule" />

                {[
                  {
                    key: 'alerts',
                    label: 'Health Alerts',
                    desc: 'Receive alerts when your metrics fall outside normal ranges',
                  },
                  {
                    key: 'weeklyReports',
                    label: 'Weekly Reports',
                    desc: 'Get a weekly summary of your health trends and progress',
                  },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="profile__switch-row">
                    <div>
                      <div className="profile__switch-label">{label}</div>
                      <div className="profile__switch-desc">{desc}</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={profile[key]}
                      className={`profile__switch${profile[key] ? ' profile__switch--on' : ''}`}
                      onClick={() => update(key, !profile[key])}
                    >
                      <span className="profile__switch-thumb" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className={`btn btn-lg profile__save${saved ? ' profile__save--saved' : ' btn-primary'}`}
              >
                {saved ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Saved Successfully
                  </>
                ) : 'Save Changes'}
              </button>

            </form>
          </div>

          {/* ─── Sidebar ─── */}
          <div className="profile__sidebar">

            {/* Stats */}
            <div className="card profile__stats-card">
              <span className="section-tag">Your Data</span>
              <div className="profile__stats-list">
                {[
                  { label: 'Analyses Run',    val: historyCount },
                  { label: 'Metrics Tracked', val: 13 },
                  { label: 'Data Storage',    val: 'Local' },
                  { label: 'Privacy',         val: '100%', accent: true },
                ].map(s => (
                  <div key={s.label} className="profile__stat-row">
                    <span className="profile__stat-label">{s.label}</span>
                    <span className={`profile__stat-val${s.accent ? ' accent' : ''}`}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div className="card profile__privacy-card">
              <div className="profile__privacy-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="profile__privacy-title">Your data stays local</h3>
              <p className="profile__privacy-desc">
                All health data is stored in your browser only. Nothing is sent to external servers.
              </p>
            </div>

            {/* Danger zone */}
            <div className="card profile__danger-card">
              <span className="section-tag" style={{ color: '#ff6060' }}>Danger Zone</span>
              <h3 className="profile__danger-title">Clear Health History</h3>
              <p className="profile__danger-desc">
                Permanently delete all {historyCount} stored analysis record{historyCount !== 1 ? 's' : ''}. This cannot be undone.
              </p>
              <button
                type="button"
                className="profile__danger-btn"
                onClick={handleClearData}
                disabled={historyCount === 0}
              >
                Clear All Data
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
