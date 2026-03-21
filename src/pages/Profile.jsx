import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './Profile.css'

const PREF_DEFAULTS = {
  gender: '',
  units: 'metric',
  alerts: false,
  weeklyReports: true,
}

function calcAge(dob) {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function Profile() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState(PREF_DEFAULTS)
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [saved, setSaved] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [historyCount, setHistoryCount] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('medinsight_profile')
    if (stored) {
      const parsed = JSON.parse(stored)
      setPrefs({ ...PREF_DEFAULTS, ...parsed })
    }
    setHistoryCount(JSON.parse(localStorage.getItem('medinsight_history') || '[]').length)

    // Flush any pending DOB stored during email-confirmation signup
    const pendingDob = localStorage.getItem('medinsight_pending_dob')
    if (pendingDob && user) {
      supabase.from('profiles').upsert({ id: user.id, date_of_birth: pendingDob }, { onConflict: 'id' })
        .then(() => localStorage.removeItem('medinsight_pending_dob'))
    }
  }, [user])

  useEffect(() => {
    if (!user) { setProfileLoading(false); return }
    supabase
      .from('profiles')
      .select('full_name, date_of_birth')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? '')
          setDateOfBirth(data.date_of_birth ?? '')
        }
        setProfileLoading(false)
      })
  }, [user])

  const updatePref = (key, val) => setPrefs(prev => ({ ...prev, [key]: val }))

  const calculatedAge = dateOfBirth ? calcAge(dateOfBirth) : null

  const handleSave = async (e) => {
    e.preventDefault()
    // Save personal info to Supabase
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        date_of_birth: dateOfBirth || null,
      }, { onConflict: 'id' })
    }
    // Save preferences to localStorage
    localStorage.setItem('medinsight_profile', JSON.stringify(prefs))
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
                    <div className="profile__avatar-name">{fullName || 'Your Name'}</div>
                    <div className="profile__avatar-sub">MedInsight User</div>
                  </div>
                </div>

                {profileLoading ? (
                  <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Loading…</p>
                ) : (
                  <div className="profile__fields">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="e.g. Alex Johnson"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        Date of Birth
                        {calculatedAge !== null && (
                          <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 400 }}>
                            — Age: <strong style={{ color: 'var(--accent)' }}>{calculatedAge}</strong>
                          </span>
                        )}
                      </label>
                      <input
                        className="form-input"
                        type="date"
                        value={dateOfBirth}
                        onChange={e => setDateOfBirth(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                )}
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
                        className={`profile__toggle-btn${prefs.units === val ? ' profile__toggle-btn--active' : ''}`}
                        onClick={() => updatePref('units', val)}
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
                      aria-checked={prefs[key]}
                      className={`profile__switch${prefs[key] ? ' profile__switch--on' : ''}`}
                      onClick={() => updatePref(key, !prefs[key])}
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
