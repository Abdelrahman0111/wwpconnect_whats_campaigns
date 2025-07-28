import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChatsOnly from './pages/ChatsOnly';
import GroupsOnly from './pages/GroupsOnly';
import Campaigns from './pages/Campaigns';
import CreateCampaign from './pages/CreateCampaign';
import Sidebar from './components/Sidebar';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-whatsapp-400"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-auto">
                    <Dashboard />
                  </div>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/chats-only" element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-auto">
                    <ChatsOnly />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/groups-only" element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-auto">
                    <GroupsOnly />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/campaigns" element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-auto">
                    <Campaigns />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/campaigns/create" element={
              <ProtectedRoute>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-auto">
                    <CreateCampaign />
                  </div>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;