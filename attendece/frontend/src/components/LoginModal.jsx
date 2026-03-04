import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './LoginModal.module.css'

export default function LoginModal({ onClose }) {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const inputRef = useRef(null)

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 50)
        const handleKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onClose])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        const result = await login(password)
        setLoading(false)
        if (result.success) {
            navigate('/teacher')
        } else {
            setError(result.error)
            setPassword('')
            inputRef.current?.focus()
        }
    }

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`${styles.modal} animate-scale-in`}>
                <div className={styles.iconWrap}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>

                <h2 className={styles.title}>Teacher Access</h2>
                <p className={styles.subtitle}>Enter your password to access the dashboard</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputWrap}>
                        <input
                            ref={inputRef}
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError('') }}
                            placeholder="••••••••"
                            className={`${styles.input} ${error ? styles.inputError : ''}`}
                            autoComplete="current-password"
                        />
                        {error && <p className={styles.error}>{error}</p>}
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={loading || !password}>
                            {loading ? <span className={styles.spinner} /> : null}
                            {loading ? 'Verifying…' : 'Unlock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
