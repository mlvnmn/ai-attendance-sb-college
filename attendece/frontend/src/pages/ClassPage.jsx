import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import styles from './ClassPage.module.css'

export default function ClassPage() {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const socketRef = useRef(null)
    const intervalRef = useRef(null)

    const [connected, setConnected] = useState(false)
    const [currentStudents, setCurrentStudents] = useState([])
    const [markedStudents, setMarkedStudents] = useState([])
    const [headCount, setHeadCount] = useState(0)
    const [verifyResult, setVerifyResult] = useState(null)
    const [commitReady, setCommitReady] = useState(false)
    const [toast, setToast] = useState(null)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 4000)
    }

    useEffect(() => {
        // Connect socket
        const socket = io('/', { transports: ['websocket', 'polling'] })
        socketRef.current = socket

        socket.on('connect', () => setConnected(true))
        socket.on('disconnect', () => setConnected(false))

        socket.on('attendance_update', (data) => {
            setHeadCount(data.total_faces)
            setCurrentStudents(data.current_students)
            setMarkedStudents(data.marked_students)
        })

        socket.on('session_reset', () => {
            setCurrentStudents([])
            setMarkedStudents([])
            setHeadCount(0)
            setVerifyResult(null)
            setCommitReady(false)
            showToast('Session cleared', 'info')
        })

        socket.on('attendance_committed', (data) => {
            showToast(data.message)
            setMarkedStudents([])
            setCurrentStudents([])
            setHeadCount(0)
            setVerifyResult(null)
            setCommitReady(false)
        })

        // Camera
        if (navigator.mediaDevices?.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
                .then((stream) => {
                    if (videoRef.current) videoRef.current.srcObject = stream
                    intervalRef.current = setInterval(sendFrame, 1000)
                })
                .catch(console.error)
        }

        return () => {
            socket.disconnect()
            clearInterval(intervalRef.current)
        }
    }, [])

    const sendFrame = useCallback(() => {
        const socket = socketRef.current
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!socket?.connected || !video || !canvas) return
        if (video.videoWidth === 0) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        const dataURL = canvas.toDataURL('image/jpeg', 0.6)
        socket.emit('frame_process', { image: dataURL })
    }, [])

    const handleReset = () => {
        if (window.confirm('Clear the current session? This will NOT save any records.')) {
            socketRef.current?.emit('reset_session')
        }
    }

    const handleVerify = () => {
        if (markedStudents.length === headCount && headCount > 0) {
            setVerifyResult({ type: 'match', msg: `✓ Perfect! ${markedStudents.length} marked matches ${headCount} in camera.` })
        } else if (headCount === 0) {
            setVerifyResult({ type: 'warn', msg: 'No faces in camera right now.' })
        } else {
            setVerifyResult({ type: 'mismatch', msg: `⚠ Mismatch: ${markedStudents.length} recognized vs ${headCount} in camera.` })
        }
        setCommitReady(true)
    }

    const handleCommit = () => {
        if (window.confirm(`Confirm final attendance for ${markedStudents.length} student(s)?`)) {
            socketRef.current?.emit('commit_attendance')
        }
    }

    return (
        <div className={styles.page}>
            {/* Toast */}
            {toast && (
                <div className={`${styles.toast} ${styles[`toast_${toast.type}`]} animate-slide-up`}>
                    {toast.msg}
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className={styles.layout}>
                {/* --- Camera Panel --- */}
                <div className={styles.cameraPanel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <h2 className={styles.panelTitle}>Live Camera Feed</h2>
                            <p className={styles.panelSub}>Face the camera directly for instant recognition</p>
                        </div>
                        <button className={styles.resetBtn} onClick={handleReset}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4" />
                            </svg>
                            Reset
                        </button>
                    </div>

                    <div className={styles.videoWrap}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className={styles.video}
                        />

                        {/* Connection badge */}
                        <div className={`${styles.connBadge} ${connected ? styles.connOnline : styles.connOffline}`}>
                            <span className={`${styles.connDot} ${connected ? styles.connDotOnline : ''}`} />
                            {connected ? 'Live' : 'Disconnected'}
                        </div>

                        {/* In-frame badges */}
                        <div className={styles.inFrameOverlay}>
                            {currentStudents.map((s) => (
                                <span key={s.id} className={styles.inFrameBadge}>{s.name}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- Attendance Panel --- */}
                <div className={styles.attendancePanel}>
                    {/* Header */}
                    <div className={styles.attHeader}>
                        <div>
                            <h2 className={styles.panelTitle}>Marked Present</h2>
                            <p className={styles.panelSub}>Current session</p>
                        </div>
                        <div className={styles.countBadge}>{markedStudents.length}</div>
                    </div>

                    {/* Student list */}
                    <div className={styles.studentList}>
                        {markedStudents.length === 0 ? (
                            <div className={styles.emptyState}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="8" r="4" /><path d="M1 20s0-6 11-6 11 6 11 6" />
                                </svg>
                                <p>Waiting for face scans…</p>
                            </div>
                        ) : (
                            markedStudents.map((s, i) => (
                                <div key={s.id} className={styles.studentRow} style={{ animationDelay: `${i * 40}ms` }}>
                                    <div className={styles.avatar}>{s.name[0].toUpperCase()}</div>
                                    <div className={styles.studentInfo}>
                                        <span className={styles.studentName}>{s.name}</span>
                                        <span className={styles.studentStatus}>Verified Present</span>
                                    </div>
                                    <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Headcount bar */}
                    <div className={styles.headcountBar}>
                        <span className={styles.headcountLabel}>Live headcount:</span>
                        <span className={styles.headcountNum}>{headCount}</span>
                    </div>

                    {/* Verify result */}
                    {verifyResult && (
                        <div className={`${styles.verifyResult} ${styles[`vr_${verifyResult.type}`]}`}>
                            {verifyResult.msg}
                        </div>
                    )}

                    {/* Actions */}
                    <div className={styles.actions}>
                        <button className={styles.verifyBtn} onClick={handleVerify}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                                <rect x="9" y="3" width="6" height="4" rx="2" />
                                <path d="m9 12 2 2 4-4" />
                            </svg>
                            1. Verify Headcount
                        </button>
                        <button
                            className={`${styles.commitBtn} ${!commitReady ? styles.commitDisabled : ''}`}
                            onClick={handleCommit}
                            disabled={!commitReady}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            2. Commit Attendance
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
