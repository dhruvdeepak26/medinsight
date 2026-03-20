import { Link } from 'react-router-dom'
import './Landing.css'

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Instant Health Insights',
    desc: 'Enter your metrics and receive immediate AI-generated interpretations of your health data — no waiting, no appointments.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Smart Risk Detection',
    desc: 'Advanced algorithms cross-reference 13 health markers to flag cardiovascular, metabolic, and lifestyle risks before they escalate.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Historical Tracking',
    desc: 'Every analysis is saved locally. Track how your metrics evolve over time and spot trends before they become problems.',
  },
]

const METRICS = [
  { label: 'Age', unit: 'years' },
  { label: 'Weight', unit: 'kg' },
  { label: 'Height', unit: 'cm' },
  { label: 'BMI', unit: 'kg/m²' },
  { label: 'Heart Rate', unit: 'bpm' },
  { label: 'Daily Steps', unit: '/day' },
  { label: 'Sleep', unit: 'hours' },
  { label: 'SpO2', unit: '%' },
  { label: 'Blood Pressure', unit: 'mmHg' },
  { label: 'Cholesterol', unit: 'mg/dL' },
  { label: 'LDL', unit: 'mg/dL' },
  { label: 'HDL', unit: 'mg/dL' },
  { label: 'Glucose', unit: 'mg/dL' },
]

const DEMO_METRICS = [
  { label: 'Heart Rate', val: '72', unit: 'bpm', status: 'ok' },
  { label: 'Blood Pressure', val: '118/76', unit: 'mmHg', status: 'ok' },
  { label: 'SpO2', val: '98', unit: '%', status: 'ok' },
  { label: 'Glucose', val: '94', unit: 'mg/dL', status: 'ok' },
]

export default function Landing() {
  return (
    <main className="page landing">

      {/* ─── Hero ─── */}
      <section className="landing__hero">
        <div className="landing__hero-bg" aria-hidden="true" />
        <div className="container">
          <div className="landing__hero-grid">

            <div className="landing__hero-content">
              <div className="badge badge-accent landing__hero-badge">
                <span className="landing__pulse-dot" aria-hidden="true" />
                AI-Powered Health Analysis
              </div>

              <h1 className="landing__hero-title">
                Understand Your<br />
                <span className="landing__gradient-text">Health Data</span>
              </h1>

              <p className="landing__hero-sub">
                Enter your health metrics and get instant AI-powered insights.
                Detect risks early, track trends over time, and take control of your wellbeing.
              </p>

              <div className="landing__hero-actions">
                <Link to="/analyze" className="btn btn-primary btn-lg">
                  Start Analyzing
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                <Link to="/dashboard" className="btn btn-ghost btn-lg">
                  View Dashboard
                </Link>
              </div>
            </div>

            {/* Decorative UI card */}
            <div className="landing__hero-visual" aria-hidden="true">
              <div className="landing__vis-main">
                <div className="landing__vis-header">
                  <span className="landing__vis-dot" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Health Overview</span>
                  <span className="badge badge-ok" style={{ marginLeft: 'auto', fontSize: '10px' }}>All Good</span>
                </div>
                <div className="landing__vis-rows">
                  {DEMO_METRICS.map(m => (
                    <div key={m.label} className="landing__vis-row">
                      <span className="landing__vis-label">{m.label}</span>
                      <span className="landing__vis-val">{m.val} <span className="landing__vis-unit">{m.unit}</span></span>
                      <span className={`landing__vis-dot-status landing__vis-dot-status--${m.status}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="landing__vis-score">
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Score</div>
                <div className="landing__vis-score-num">87</div>
                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>Excellent</div>
              </div>

              <div className="landing__vis-alert">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ffbe32" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                LDL slightly elevated
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="landing__stats">
            {[
              { num: '13', label: 'Health Metrics' },
              { num: '< 1s', label: 'Analysis Time' },
              { num: '100%', label: 'Private & Local' },
            ].map(s => (
              <div key={s.label} className="landing__stat">
                <span className="landing__stat-num">{s.num}</span>
                <span className="landing__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="landing__features">
        <div className="container">
          <div className="landing__section-head">
            <span className="section-tag">Features</span>
            <h2 className="landing__section-title">
              Everything you need to<br />stay ahead of your health
            </h2>
          </div>
          <div className="landing__features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="card landing__feature-card">
                <div className="landing__feature-icon">{f.icon}</div>
                <h3 className="landing__feature-title">{f.title}</h3>
                <p className="landing__feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Metrics Grid ─── */}
      <section className="landing__metrics-section">
        <div className="container">
          <div className="landing__section-head landing__section-head--center">
            <span className="section-tag">Coverage</span>
            <h2 className="landing__section-title">
              13 health markers,<br />one comprehensive analysis
            </h2>
            <p className="landing__section-sub">
              From basic vitals to blood panel results — MedInsight covers what matters most for a complete health picture.
            </p>
          </div>
          <div className="landing__metrics-grid">
            {METRICS.map((m, i) => (
              <div key={i} className="landing__metric-chip">
                <span className="landing__metric-dot" aria-hidden="true" />
                <span className="landing__metric-name">{m.label}</span>
                <span className="landing__metric-unit">{m.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="landing__cta-section">
        <div className="container">
          <div className="landing__cta-card">
            <div className="landing__cta-glow" aria-hidden="true" />
            <h2 className="landing__cta-title">Ready to take control of your health?</h2>
            <p className="landing__cta-sub">Start your first analysis in under a minute. No sign-up required.</p>
            <Link to="/analyze" className="btn btn-primary btn-lg">
              Analyze My Health
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing__footer">
        <div className="container landing__footer-inner">
          <span>MedInsight — AI Health Interpreter</span>
          <span>For informational purposes only. Not a substitute for medical advice.</span>
        </div>
      </footer>

    </main>
  )
}
