import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './HomePage.module.css'

export default function HomePage() {
    const navigate = useNavigate()
    const { isLoggedIn, setShowLoginModal } = useAuth()

    const handleTeacher = () => {
        isLoggedIn ? navigate('/teacher') : setShowLoginModal(true)
    }

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroBadge}>
                    <span className={styles.heroBadgeDot} />
                    AI-Powered Face Recognition
                </div>
                <h1 className={styles.heroTitle}>
                    Smart Attendance<br />
                    <span className={styles.heroGradient}>Made Effortless</span>
                </h1>
                <p className={styles.heroSub}>
                    Automate classroom attendance using real-time computer vision.<br />
                    No sign-in sheets. No manual roll calls. Just open the camera.
                </p>
                <div className={styles.heroCta}>
                    <button className={styles.ctaPrimary} onClick={() => navigate('/class')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
                        </svg>
                        Start Class Mode
                    </button>
                    <button className={styles.ctaSecondary} onClick={handleTeacher}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        Teacher Dashboard
                    </button>
                </div>
            </section>

            {/* Features */}
            <section className={styles.features}>
                {FEATURES.map((f) => (
                    <div key={f.title} className={styles.featureCard}>
                        <div className={styles.featureIcon} style={{ background: f.bg, color: f.color, boxShadow: `0 0 20px ${f.glow}` }}>
                            {f.icon}
                        </div>
                        <h3 className={styles.featureTitle}>{f.title}</h3>
                        <p className={styles.featureDesc}>{f.desc}</p>
                    </div>
                ))}
            </section>

            {/* How it works */}
            <section className={styles.howSection}>
                <h2 className={styles.sectionTitle}>How It Works</h2>
                <div className={styles.steps}>
                    {STEPS.map((s, i) => (
                        <div key={s.title} className={styles.step}>
                            <div className={styles.stepNum}>{i + 1}</div>
                            <h4 className={styles.stepTitle}>{s.title}</h4>
                            <p className={styles.stepDesc}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

const FEATURES = [
    {
        title: 'Face Recognition',
        desc: 'LBPH algorithm detects and identifies students in real-time through the classroom camera.',
        bg: 'rgba(99,102,241,0.12)', color: '#818cf8', glow: 'rgba(99,102,241,0.3)',
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M1 20s0-6 11-6 11 6 11 6" /><path d="M9 11.5c0 0 .5 1 3 1s3-1 3-1" /></svg>
    },
    {
        title: 'Instant Records',
        desc: 'Attendance is committed to the database with one click. Present and absent records are created automatically.',
        bg: 'rgba(16,185,129,0.12)', color: '#34d399', glow: 'rgba(16,185,129,0.25)',
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><path d="m9 12 2 2 4-4" /></svg>
    },
    {
        title: 'Email Alerts',
        desc: 'Parents are automatically notified when their child is marked absent. Keep families in the loop effortlessly.',
        bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', glow: 'rgba(245,158,11,0.25)',
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
    },
    {
        title: 'Headcount Verify',
        desc: 'Cross-reference the number of faces detected in the frame vs. recognized students to catch mismatches.',
        bg: 'rgba(244,63,94,0.12)', color: '#fb7185', glow: 'rgba(244,63,94,0.25)',
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    },
]

const STEPS = [
    { title: 'Enroll Students', desc: 'Teacher uploads a photo per student. The system extracts and stores the face fingerprint.' },
    { title: 'Open Class Mode', desc: 'Point the classroom camera at students. AI recognizes faces in real-time as they enter.' },
    { title: 'Verify & Commit', desc: 'Cross-check headcount, then commit. Records are saved and email notifications are sent.' },
]
