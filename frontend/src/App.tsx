import { AuthProvider, useAuth } from './auth/AuthContext'
import { LoginForm } from './components/LoginForm'
import { BoardPage } from './pages/BoardPage'
import { ThemeProvider } from './theme/ThemeContext'
import './styles/global.scss'
import './styles/components.scss'

function AppGate() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-screen">Preparing your workspace…</div>
  }

  return user ? <BoardPage /> : <LoginForm />
}

export default function App() {
  return (
    <ThemeProvider>
      <div className="app-root">
        <AuthProvider>
          <AppGate />
        </AuthProvider>
      </div>
    </ThemeProvider>
  )
}
