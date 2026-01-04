import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | 'finance'>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleDemoLogin = (demoRole: string) => {
    // Store demo user in localStorage
    localStorage.setItem('demo_user', JSON.stringify({
      id: 'demo-' + demoRole,
      full_name: demoRole.charAt(0).toUpperCase() + demoRole.slice(1) + ' Demo',
      role: demoRole,
      avatar_url: null
    }))
    navigate('/dashboard')
    window.location.reload()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isLogin) {
      const { error } = await signIn(email, password)
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Email not confirmed. Please check your email for a confirmation link.')
        } else {
          setError(error.message)
        }
      } else {
        navigate('/dashboard')
      }
    } else {
      const { error } = await signUp(email, password, fullName, role)
      if (error) {
        setError(error.message)
      } else {
        setError('')
        alert('Account created! Please check your email for confirmation link.')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#F8FAF7',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '16px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        padding: '32px',
        width: '100%',
        maxWidth: '420px'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#5B8C51',
            fontSize: '24px'
          }}>
            🎓
          </div>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>School Admin</span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', color: '#1f2937', marginBottom: '8px' }}>
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '24px' }}>
          {isLogin ? 'Sign in to access your dashboard' : 'Register for a new account'}
        </p>

        {/* Demo Login Buttons */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
            Quick Demo Login:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {['admin', 'teacher', 'student', 'finance'].map((demoRole) => (
              <button
                key={demoRole}
                onClick={() => handleDemoLogin(demoRole)}
                type="button"
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  textTransform: 'capitalize'
                }}
              >
                {demoRole}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', marginBottom: '24px' }}></div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            borderRadius: '8px', 
            backgroundColor: '#fef2f2', 
            color: '#dc2626',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                outline: 'none',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your email"
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                outline: 'none',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
              required
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  outline: 'none',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: 'white'
                }}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="finance">Finance</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#5B8C51',
              color: 'white',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '8px'
            }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle */}
        <p style={{ textAlign: 'center', color: '#4b5563', marginTop: '24px' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: '#5B8C51',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}