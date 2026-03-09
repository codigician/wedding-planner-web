import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import AuthPage from '@/pages/AuthPage'
import EventsPage from '@/pages/EventsPage'
import EventPage from '@/pages/EventPage'

function App() {
  return (
    <BrowserRouter basename="/wedding-planner-web/">
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<EventsPage />} />
            <Route path="/events/:eventId" element={<EventPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
