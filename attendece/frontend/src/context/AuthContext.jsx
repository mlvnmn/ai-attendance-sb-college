import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [showLoginModal, setShowLoginModal] = useState(false)

    const login = async (password) => {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        })
        const data = await res.json()
        if (data.success) {
            setIsLoggedIn(true)
            setShowLoginModal(false)
            return { success: true }
        }
        return { success: false, error: data.error || 'Invalid password' }
    }

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, showLoginModal, setShowLoginModal }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
