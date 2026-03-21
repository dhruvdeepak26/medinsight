import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import './Auth.css'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmation, setConfirmation] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err, data } = await signUp(email, password)
    setLoading(false)
    if (err) {
      setError(err.message)
    } else if (data.user && !data.session) {
      // Email confirmation required — store DOB locally for after confirmation
      if (dateOfBirth) localStorage.setItem('medinsight_pending_dob', dateOfBirth)
      setConfirmation(true)
    } else {
      // Immediate session — create profile now
      if (data.user && dateOfBirth) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          date_of_birth: dateOfBirth,
        })
      }
      navigate('/dashboard')
    }
  }

  if (confirmation) {
    return (
      <main className="auth-page">
        <div className="auth-bg" aria-hidden="true" />
        <div className="auth-card">
          <div className="auth-card__header">
            <div className="auth-card__icon auth-card__icon--success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="auth-card__title">Check your email</h1>
            <p className="auth-card__sub">
              We sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account, then{' '}
              <Link to="/login" className="auth-link">sign in</Link>.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <div className="auth-bg" aria-hidden="true" />
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="auth-card__title">Create account</h1>
          <p className="auth-card__sub">Start tracking your health with MedInsight</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="auth-input"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              className="auth-input"
              type="date"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
