import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Assessment from './pages/Assessment'
import Review from './pages/Review'
import Feedback from './pages/Feedback'
import Evolution from './pages/Evolution'
import Profile from './pages/Profile'
import Me from './pages/Me'
import Share from './pages/Share'
import Settings from './pages/Settings'

export default function App() {
  return (
    <HashRouter>
      <div className="mx-auto max-w-[430px] min-h-screen bg-wm-bg shadow-2xl">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/review" element={<Review />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/evolution" element={<Evolution />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/me" element={<Me />} />
          <Route path="/share" element={<Share />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
