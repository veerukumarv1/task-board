import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ColorThemeMenu } from './ColorThemeMenu'
import { HideIcon, ViewIcon } from './icons'
import { IconButton } from './IconButton'
import { ThemeToggle } from './ThemeToggle'

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login(email, password)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to sign in. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <section className="panel login-card">
        <div className="login-card__header">
          <div>
            <h1>Task Board</h1>
            <p>Sign in to manage tasks for your organization.</p>
          </div>
          <div className="topbar__actions">
            <ColorThemeMenu />
            <ThemeToggle />
          </div>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <form className="form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <IconButton
                className="password-field__toggle"
                label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <HideIcon /> : <ViewIcon />}
              </IconButton>
            </div>
          </div>

          <button className="btn btn--primary btn--full" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  )
}
