import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginModal from './LoginModal'
import styles from './Navbar.module.css'

export default function Navbar() {
    const { isLoggedIn, showLoginModal, setShowLoginModal } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleTeacherClick = () => {
        if (isLoggedIn) {
            navigate('/teacher')
        } else {
            setShowLoginModal(true)
        }
    }

    return (
        <>
            <nav className={styles.nav}>
                <div className={styles.inner}>
                    <Link to="/" className={styles.brand}>
                        <span className={styles.brandIcon}>◈</span>
                        <span className={styles.brandText}>AttendanceAI</span>
                    </Link>

                    <div className={styles.links}>
                        <Link
                            to="/class"
                            className={`${styles.link} ${location.pathname === '/class' ? styles.linkActive : ''}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 7l-7 5 7 5V7z" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                            Class Mode
                        </Link>
                        <button
                            onClick={handleTeacherClick}
                            className={`${styles.btn} ${isLoggedIn ? styles.btnLoggedIn : ''}`}
                        >
                            {isLoggedIn ? (
                                <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Teacher Dashboard
                                </>
                            ) : (
                                <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    Teacher Login
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
        </>
    )
}
