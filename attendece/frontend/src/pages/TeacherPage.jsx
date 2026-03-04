import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './TeacherPage.module.css'

export default function TeacherPage() {
    const { isLoggedIn } = useAuth()
    const navigate = useNavigate()

    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [search, setSearch] = useState('')
    const [deleteId, setDeleteId] = useState(null)
    const [toast, setToast] = useState(null)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/')
            return
        }
        fetchStudents()
    }, [isLoggedIn])

    const fetchStudents = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/students')
            const data = await res.json()
            setStudents(Array.isArray(data) ? data : [])
        } catch {
            showToast('Failed to load students', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        setDeleteId(id)
        if (!window.confirm('Delete this student? This cannot be undone.')) {
            setDeleteId(null)
            return
        }
        try {
            const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setStudents((prev) => prev.filter((s) => s.id !== id))
                showToast('Student removed successfully')
            } else {
                const data = await res.json().catch(() => ({}))
                showToast(data.error || 'Failed to delete student', 'error')
            }
        } catch {
            showToast('Error deleting student', 'error')
        }
        setDeleteId(null)
    }

    const filtered = students.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className={styles.page}>
            {toast && (
                <div className={`${styles.toast} ${styles[`toast_${toast.type}`]} animate-slide-up`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Teacher Dashboard</h1>
                    <p className={styles.subtitle}>{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
                </div>
                <button className={styles.addBtn} onClick={() => setShowModal(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Enroll Student
                </button>
            </div>

            {/* Search */}
            <div className={styles.searchWrap}>
                <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    className={styles.searchInput}
                    placeholder="Search students…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className={styles.tableWrap}>
                {loading ? (
                    <div className={styles.loadState}>
                        <span className={styles.loadSpinner} />
                        Loading students…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        <p>{search ? 'No students match your search' : 'No students enrolled yet'}</p>
                        {!search && <button className={styles.emptyAddBtn} onClick={() => setShowModal(true)}>+ Enroll first student</button>}
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Email</th>
                                <th>Parent Email</th>
                                <th>Face ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s, i) => (
                                <tr key={s.id} className={styles.row} style={{ animationDelay: `${i * 30}ms` }}>
                                    <td>
                                        <div className={styles.studentCell}>
                                            <div className={styles.avatar}>{s.name[0].toUpperCase()}</div>
                                            <div>
                                                <div className={styles.name}>{s.name}</div>
                                                <div className={styles.idLabel}>ID #{s.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.cell}>{s.email || <span className={styles.na}>—</span>}</td>
                                    <td className={styles.cell}>{s.parent_email || <span className={styles.na}>—</span>}</td>
                                    <td>
                                        {s.has_encoding
                                            ? <span className={styles.badgeGreen}>✓ Registered</span>
                                            : <span className={styles.badgeRed}>✗ Missing</span>}
                                    </td>
                                    <td>
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => handleDelete(s.id)}
                                            disabled={deleteId === s.id}
                                        >
                                            {deleteId === s.id ? '…' : (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                    <path d="M10 11v6m4-6v6" />
                                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                </svg>
                                            )}
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <EnrollModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchStudents(); showToast('Student enrolled successfully!') }}
                    onError={(msg) => showToast(msg || 'Error adding student', 'error')}
                />
            )}
        </div>
    )
}

/* ─── Enroll Modal ─── */
function EnrollModal({ onClose, onSuccess, onError }) {
    const [form, setForm] = useState({ name: '', email: '', parent_email: '' })
    const [photo, setPhoto] = useState(null)
    const [loading, setLoading] = useState(false)
    const [fieldError, setFieldError] = useState('')

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onClose])

    const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!photo) { setFieldError('A photo is required for face recognition.'); return }
        setLoading(true)
        setFieldError('')
        const fd = new FormData()
        fd.append('name', form.name)
        fd.append('email', form.email)
        fd.append('parent_email', form.parent_email)
        fd.append('photo', photo)
        try {
            const res = await fetch('/api/students', { method: 'POST', body: fd })
            const data = await res.json()
            if (res.ok) {
                onSuccess()
            } else {
                setFieldError(data.error || 'Could not add student')
                onError(data.error)
            }
        } catch {
            onError('Connection error')
        }
        setLoading(false)
    }

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`${styles.modal} animate-scale-in`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Enroll New Student</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <Field label="Full Name" name="name" value={form.name} onChange={handle} required placeholder="e.g. Jane Doe" />
                    <Field label="Student Email" name="email" type="email" value={form.email} onChange={handle} placeholder="student@example.com" />
                    <Field label="Parent Email" name="parent_email" type="email" value={form.parent_email} onChange={handle} placeholder="parent@example.com" />

                    <div className={styles.field}>
                        <label className={styles.label}>
                            Photo for Face ID <span className={styles.required}>*</span>
                        </label>
                        <label className={styles.fileLabel}>
                            <input type="file" accept="image/*" onChange={(e) => { setPhoto(e.target.files[0]); setFieldError('') }} className={styles.fileHidden} />
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            {photo ? photo.name : 'Choose photo…'}
                        </label>
                        <p className={styles.hint}>Use a clear, front-facing photo with good lighting for best results.</p>
                        {fieldError && <p className={styles.fieldError}>{fieldError}</p>}
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.saveBtn} disabled={loading || !form.name}>
                            {loading ? <span className={styles.spinner} /> : null}
                            {loading ? 'Saving…' : 'Enroll Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function Field({ label, name, type = 'text', value, onChange, required, placeholder }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>
                {label} {required && <span className={styles.required}>*</span>}
            </label>
            <input
                className={styles.input}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
            />
        </div>
    )
}
