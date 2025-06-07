import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FieldDetailPage from './pages/FieldDetailPage'
import SearchPage from './pages/SearchPage'
import ProfilePage from './pages/ProfilePage'
import OwnerDashboard from './pages/OwnerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import TeamPage from './pages/TeamPage' // For viewing a specific team by ID
import TeamFinderPage from './pages/TeamFinderPage' // New page for finding teams/opponents
import ProtectedRoute from './components/common/ProtectedRoute'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/fields/:id" element={<FieldDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            
            {/* Updated Team Routes */}
            {/* Route for the general team finding/listing page */}
            <Route 
              path="/teams" 
              element={
                <ProtectedRoute>
                  <TeamFinderPage />
                </ProtectedRoute>
              } 
            />
            {/* Route for viewing a specific team's details */}
            <Route 
              path="/teams/:id" 
              element={
                <ProtectedRoute>
                  <TeamPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner/dashboard" 
              element={
                <ProtectedRoute requiredRole="owner">
                  <OwnerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Add other routes as needed */}
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App

