import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ClassPage from './pages/ClassPage'
import TeacherPage from './pages/TeacherPage'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1, padding: '0' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/class" element={<ClassPage />} />
            <Route path="/teacher" element={<TeacherPage />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}
