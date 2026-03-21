import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './Analyze.css'

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

function AiReportContent({ data }) {
  const overall = OVERALL_META[data.overall?.status] ?? OVERALL_META.fair

  return (
    <div className="report">
      {/* Overall status banner */}
      <div className={`report__overall report__overall--${overall.cls}`}>
        <span className="report__overall-emoji">{overall.emoji}</span>
        <div className="report__overall-body">
          <div className="report__overall-label">{data.overall?.label ?? 'Health Assessment'}</div>
          <p className="report__overall-summary">{data.overall?.summary}</p>
        </div>
      </div>

      {/* Per-section metric tables */}
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

      {/* Recommendations */}
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

const SECTIONS = [
  {
    id: 'basic',
    title: 'Basic Info',
    tag: 'Demographics',
    fields: [
      { key: 'age', label: 'Age', placeholder: 'e.g. 32', unit: 'yrs', type: 'number' },
      { key: 'weight', label: 'Weight', placeholder: 'e.g. 72', unit: 'kg', type: 'number' },
      { key: 'height', label: 'Height', placeholder: 'e.g. 175', unit: 'cm', type: 'number' },
      { key: 'bmi', label: 'BMI', unit: 'kg/m²', computed: true },
    ],
  },
  {
    id: 'cardio',
    title: 'Cardiovascular',
    tag: 'Heart & Circulation',
    fields: [
      { key: 'heartRate', label: 'Resting Heart Rate', placeholder: 'e.g. 72', unit: 'bpm', type: 'number' },
      { key: 'bloodPressure', label: 'Blood Pressure', placeholder: '120/80', unit: 'mmHg', type: 'text' },
    ],
  },
  {
    id: 'activity',
    title: 'Activity & Sleep',
    tag: 'Lifestyle',
    fields: [
      { key: 'steps', label: 'Daily Steps', placeholder: 'e.g. 8500', unit: 'steps', type: 'number' },
      { key: 'sleep', label: 'Sleep Duration', placeholder: 'e.g. 7.5', unit: 'hrs', type: 'number' },
      { key: 'spo2', label: 'Blood Oxygen (SpO2)', placeholder: 'e.g. 98', unit: '%', type: 'number' },
    ],
  },
  {
    id: 'blood',
    title: 'Blood Panel',
    tag: 'Lab Values',
    fields: [
      { key: 'cholesterol', label: 'Total Cholesterol', placeholder: 'e.g. 185', unit: 'mg/dL', type: 'number' },
      { key: 'ldl', label: 'LDL Cholesterol', placeholder: 'e.g. 110', unit: 'mg/dL', type: 'number' },
      { key: 'hdl', label: 'HDL Cholesterol', placeholder: 'e.g. 55', unit: 'mg/dL', type: 'number' },
      { key: 'glucose', label: 'Blood Glucose (Fasting)', placeholder: 'e.g. 90', unit: 'mg/dL', type: 'number' },
    ],
  },
]

function calcAge(dob) {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function generateInsights(data) {
  const insights = []
  const add = (metric, value, status, text) => insights.push({ metric, value, status, text })

  if (data.bmi) {
    const v = parseFloat(data.bmi)
    if (v < 18.5)      add('BMI', `${v} kg/m²`, 'warn', 'Underweight — consider consulting a nutritionist for a balanced diet plan.')
    else if (v <= 24.9) add('BMI', `${v} kg/m²`, 'ok',   'BMI is in the healthy range. Maintain your current lifestyle.')
    else if (v <= 29.9) add('BMI', `${v} kg/m²`, 'warn', 'Overweight range. Regular exercise and dietary adjustments are recommended.')
    else                add('BMI', `${v} kg/m²`, 'danger','Obese range. Consultation with a healthcare provider is strongly recommended.')
  }

  if (data.heartRate) {
    const v = parseInt(data.heartRate)
    if (v < 60)       add('Heart Rate', `${v} bpm`, 'warn', 'Below-normal resting heart rate (bradycardia). May be normal for athletes — monitor if symptomatic.')
    else if (v <= 100) add('Heart Rate', `${v} bpm`, 'ok',   'Resting heart rate is within the healthy range (60–100 bpm).')
    else               add('Heart Rate', `${v} bpm`, 'danger','Elevated resting heart rate (tachycardia). Reduce caffeine and stress; consult a doctor.')
  }

  if (data.bloodPressure) {
    const parts = data.bloodPressure.split('/')
    if (parts.length === 2) {
      const sys = parseInt(parts[0]), dia = parseInt(parts[1])
      if (!isNaN(sys) && !isNaN(dia)) {
        if (sys < 120 && dia < 80)       add('Blood Pressure', data.bloodPressure, 'ok',     'Normal blood pressure. Keep up the healthy lifestyle.')
        else if (sys <= 129 && dia < 80) add('Blood Pressure', data.bloodPressure, 'warn',   'Elevated blood pressure. Reduce sodium intake and monitor regularly.')
        else if (sys <= 139 || dia <= 89) add('Blood Pressure', data.bloodPressure, 'warn',  'Stage 1 hypertension. Lifestyle changes may be needed — consult a doctor.')
        else                              add('Blood Pressure', data.bloodPressure, 'danger', 'Stage 2 hypertension. Medical attention is recommended.')
      }
    }
  }

  if (data.steps) {
    const v = parseInt(data.steps)
    if (v < 5000)      add('Daily Steps', v.toLocaleString(), 'warn', 'Low activity level. Aim for 7,500–10,000 steps per day for cardiovascular health.')
    else if (v < 7500) add('Daily Steps', v.toLocaleString(), 'warn', 'Moderate activity. Increasing to 10,000+ steps would improve overall health outcomes.')
    else               add('Daily Steps', v.toLocaleString(), 'ok',   'Great activity level! Meeting or exceeding the recommended daily step goal.')
  }

  if (data.sleep) {
    const v = parseFloat(data.sleep)
    if (v < 6)        add('Sleep', `${v}h`, 'danger', 'Severely insufficient sleep. Adults need 7–9 hours for recovery, cognition, and immune function.')
    else if (v < 7)   add('Sleep', `${v}h`, 'warn',   'Slightly below optimal sleep. Aim for 7–9 hours per night for best health outcomes.')
    else if (v <= 9)  add('Sleep', `${v}h`, 'ok',     'Optimal sleep duration. Consistent 7–9 hours supports overall health and recovery.')
    else              add('Sleep', `${v}h`, 'warn',   'More than 9 hours may indicate oversleeping — associated with fatigue and other health issues.')
  }

  if (data.spo2) {
    const v = parseInt(data.spo2)
    if (v >= 95)      add('SpO2', `${v}%`, 'ok',     'Normal blood oxygen saturation. Oxygen delivery to tissues is functioning well.')
    else if (v >= 90) add('SpO2', `${v}%`, 'warn',   'Slightly low blood oxygen. Monitor closely and consult a doctor if persistent.')
    else              add('SpO2', `${v}%`, 'danger', 'Low blood oxygen saturation. Seek medical attention promptly.')
  }

  if (data.cholesterol) {
    const v = parseFloat(data.cholesterol)
    if (v < 200)       add('Cholesterol', `${v} mg/dL`, 'ok',     'Total cholesterol is in the desirable range. Continue heart-healthy habits.')
    else if (v <= 239) add('Cholesterol', `${v} mg/dL`, 'warn',   'Borderline high cholesterol. Diet, exercise, and possible medication can help.')
    else               add('Cholesterol', `${v} mg/dL`, 'danger', 'High total cholesterol. Medical consultation and lifestyle intervention recommended.')
  }

  if (data.ldl) {
    const v = parseFloat(data.ldl)
    if (v < 100)       add('LDL', `${v} mg/dL`, 'ok',     'Optimal LDL (bad) cholesterol. Excellent cardiovascular protection.')
    else if (v <= 129) add('LDL', `${v} mg/dL`, 'ok',     'Near-optimal LDL. Minor dietary improvements would bring it to optimal range.')
    else if (v <= 159) add('LDL', `${v} mg/dL`, 'warn',   'Borderline high LDL. Reduce saturated fats and increase fiber intake.')
    else               add('LDL', `${v} mg/dL`, 'danger', 'High LDL significantly increases cardiovascular risk. Consult a doctor.')
  }

  if (data.hdl) {
    const v = parseFloat(data.hdl)
    if (v < 40)       add('HDL', `${v} mg/dL`, 'danger', 'Low HDL (good) cholesterol is a major cardiovascular risk factor.')
    else if (v < 60)  add('HDL', `${v} mg/dL`, 'warn',   'Acceptable HDL, but higher levels (60+ mg/dL) offer more heart protection.')
    else              add('HDL', `${v} mg/dL`, 'ok',     'Excellent HDL level — protective against heart disease. Keep it up!')
  }

  if (data.glucose) {
    const v = parseFloat(data.glucose)
    if (v < 70)        add('Glucose', `${v} mg/dL`, 'danger', 'Hypoglycemia detected. Eat something immediately and consult a healthcare provider.')
    else if (v <= 99)  add('Glucose', `${v} mg/dL`, 'ok',     'Fasting blood glucose is in the normal range. Good metabolic health.')
    else if (v <= 125) add('Glucose', `${v} mg/dL`, 'warn',   'Prediabetic glucose range. Lifestyle changes can prevent progression to diabetes.')
    else               add('Glucose', `${v} mg/dL`, 'danger', 'Glucose exceeds diabetic threshold (≥126 mg/dL). Consult a healthcare provider.')
  }

  return insights
}

function computeScore(insights) {
  if (!insights.length) return null
  const map = { ok: 100, warn: 55, danger: 15 }
  return Math.round(insights.reduce((s, i) => s + map[i.status], 0) / insights.length)
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

export default function Analyze() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({})
  const [ageFromProfile, setAgeFromProfile] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiReport, setAiReport] = useState('')
  const [aiReportData, setAiReportData] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('date_of_birth')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.date_of_birth) {
          const age = calcAge(data.date_of_birth)
          setAgeFromProfile(age)
          setForm(prev => ({ ...prev, age: String(age) }))
        }
      })
  }, [user])

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const calculatedBmi = (() => {
    const w = parseFloat(form.weight)
    const h = parseFloat(form.height)
    if (!w || !h || h <= 0) return null
    return (w / Math.pow(h / 100, 2)).toFixed(1)
  })()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAiReport('')

    const formWithBmi = calculatedBmi ? { ...form, bmi: calculatedBmi } : form
    const insights = generateInsights(formWithBmi)
    const score = computeScore(insights)

    // Save to Supabase only when logged in
    let savedId = null
    if (user) {
      const { data: row, error } = await supabase
        .from('analyses')
        .insert({ user_id: user.id, metrics: { ...formWithBmi, insights }, score })
        .select('id')
        .single()
      if (!error && row) savedId = row.id
    }

    // Set aiLoading before results so the AI section renders immediately
    setAiLoading(true)
    setAiReportData(null)
    setResults({ insights, score })
    setLoading(false)

    // Stream AI health report from serverless function
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formWithBmi),
      })

      if (response.ok) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          setAiReport(accumulated)
        }
        // Parse the completed JSON response
        try {
          const cleaned = accumulated.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
          setAiReportData(JSON.parse(cleaned))
        } catch {
          // fallback — raw text will render as plain message
        }
        // Persist ai_report to the saved row
        if (user && savedId && accumulated) {
          await supabase.from('analyses').update({ ai_report: accumulated }).eq('id', savedId)
        }
      }
    } catch (err) {
      console.error('AI report error:', err)
    } finally {
      setAiLoading(false)
    }
  }

  const scoreStatus = results
    ? results.score >= 80 ? 'ok' : results.score >= 50 ? 'warn' : 'danger'
    : null

  const scoreLabel = results
    ? results.score >= 80 ? 'Excellent'
      : results.score >= 60 ? 'Good'
      : results.score >= 40 ? 'Fair'
      : 'Needs Attention'
    : null

  const okCount     = results?.insights.filter(i => i.status === 'ok').length ?? 0
  const warnCount   = results?.insights.filter(i => i.status === 'warn').length ?? 0
  const dangerCount = results?.insights.filter(i => i.status === 'danger').length ?? 0

  return (
    <div className="page analyze">
      <div className="container">
        <div className="analyze__layout">

          {/* ─── Form ─── */}
          <div className="analyze__form-col">
            <div className="analyze__header">
              <h1 className="analyze__title">Health Analysis</h1>
              <p className="analyze__sub">
                Enter your health metrics below for an instant AI-powered interpretation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="analyze__form">
              {SECTIONS.map(section => (
                <div key={section.id} className="card analyze__section">
                  <div className="analyze__section-head">
                    <span className="section-tag">{section.tag}</span>
                    <h2 className="analyze__section-title">{section.title}</h2>
                  </div>
                  <div className="analyze__fields">
                    {section.fields.map(field => (
                      <div key={field.key} className="form-group">
                        <label className="form-label">
                          {field.label}
                          {field.key === 'age' && ageFromProfile !== null && (
                            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>
                              from date of birth
                            </span>
                          )}
                        </label>
                        <div className="analyze__input-wrap">
                          {field.computed ? (
                            <input
                              className="form-input analyze__input--computed"
                              type="text"
                              readOnly
                              value={calculatedBmi ?? ''}
                              placeholder="Calculated automatically"
                            />
                          ) : field.key === 'age' && ageFromProfile !== null ? (
                            <input
                              className="form-input analyze__input--computed"
                              type="text"
                              readOnly
                              value={ageFromProfile}
                              title="Automatically calculated from your date of birth. Update it on your Profile page."
                            />
                          ) : (
                            <input
                              className="form-input"
                              type={field.type}
                              placeholder={field.placeholder}
                              value={form[field.key] || ''}
                              onChange={e => update(field.key, e.target.value)}
                              step={field.type === 'number' ? 'any' : undefined}
                              min={field.type === 'number' ? '0' : undefined}
                            />
                          )}
                          <span className="analyze__unit">{field.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="submit"
                className={`btn btn-primary btn-lg analyze__submit${loading ? ' analyze__submit--loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="analyze__spinner" aria-hidden="true" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Health Data
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ─── Results ─── */}
          <div className="analyze__results-col">
            {!results ? (
              <div className="analyze__placeholder">
                <div className="analyze__placeholder-icon">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Results appear here</h3>
                <p>Fill in your health metrics and click Analyze to receive your personalized interpretation.</p>
              </div>
            ) : (
              <div className="analyze__results">

                {/* Score card */}
                <div className={`card analyze__score-card analyze__score-card--${scoreStatus}`}>
                  <div className="analyze__score-top">
                    <div>
                      <div className="analyze__score-eyebrow">Overall Health Score</div>
                      <div className={`analyze__score-num analyze__score--${scoreStatus}`}>{results.score}</div>
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
                      style={{ width: `${results.score}%` }}
                    />
                  </div>
                  <div className="analyze__bar-labels">
                    <span>0</span><span>50</span><span>100</span>
                  </div>
                </div>

                {/* Anon save notice */}
                {!user && (
                  <div className="analyze__anon-notice">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Results are not saved.{' '}
                    <a href="/login" className="analyze__anon-link">Sign in</a> to track your history.
                  </div>
                )}

                {/* Disclaimer */}
                <div className="analyze__disclaimer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1, color: 'var(--accent)' }}>
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  For informational purposes only. Not a substitute for professional medical advice.
                </div>

                {/* Findings */}
                <h3 className="analyze__findings-title">Detailed Findings</h3>

                {results.insights.length === 0 ? (
                  <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>
                    No metrics entered for analysis. Fill in at least a few fields to see findings.
                  </p>
                ) : (
                  <div className="analyze__insights">
                    {results.insights.map((insight, i) => (
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
                )}

                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                  onClick={() => navigate('/dashboard')}
                >
                  View in Dashboard
                </button>
              </div>
            )}
          </div>

        </div>

        {/* ─── AI Report (full width) ─── */}
        {results && (
          <div className="card analyze__ai-report">
            <div className="analyze__ai-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>AI Health Report</span>
              {aiLoading && <span className="analyze__spinner analyze__spinner--sm" aria-hidden="true" />}
            </div>

            {aiLoading ? (
              <div className="report__generating">
                <div className="report__generating-dots">
                  <span /><span /><span />
                </div>
                <p>Generating your personalized health report…</p>
              </div>
            ) : aiReportData ? (
              <AiReportContent data={aiReportData} />
            ) : (
              <p className="report__fallback">
                {aiReport || 'AI report unavailable.'}
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
