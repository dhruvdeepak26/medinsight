import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/analyze', label: 'Analyze' },
  { to: '/profile', label: 'Profile' },
]

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Med<span className="accent">Insight</span>
        </Link>

        {user && (
          <div className="navbar__links">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `navbar__link${isActive ? ' navbar__link--active' : ''}`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="navbar__actions">
          {user ? (
            <>
              <span className="navbar__email">{user.email}</span>
              <button className="btn btn-ghost navbar__signout" onClick={handleSignOut}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__link">Sign In</Link>
              <Link to="/signup" className="btn btn-primary navbar__cta">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
