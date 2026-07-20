import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { type ReactNode } from 'react'
import Home from './pages/Home'
import Assessment from './pages/Assessment'
import Review from './pages/Review'
import Feedback from './pages/Feedback'
import Evolution from './pages/Evolution'
import Profile from './pages/Profile'
import Me from './pages/Me'
import Share from './pages/Share'
import Settings from './pages/Settings'
import Auth from './pages/Auth'
import { isLoggedIn } from './lib/api'

// 路由守卫：未登录时跳转到 /auth
function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  if (!isLoggedIn()) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <HashRouter>
      <div className="mx-auto max-w-[430px] min-h-screen bg-wm-bg shadow-2xl">
        <Routes>
          {/* 登录注册页（公开） */}
          <Route path="/auth" element={
            isLoggedIn() ? <Navigate to="/home" replace /> : <Auth />
          } />

          {/* 受保护路由 */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
          <Route path="/review" element={<ProtectedRoute><Review /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
          <Route path="/evolution" element={<ProtectedRoute><Evolution /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/me" element={<ProtectedRoute><Me /></ProtectedRoute>} />
          <Route path="/share" element={<ProtectedRoute><Share /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* 兜底 */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
