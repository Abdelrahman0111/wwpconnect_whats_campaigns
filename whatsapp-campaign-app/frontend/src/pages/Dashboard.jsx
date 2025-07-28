import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Send, Activity, QrCode, CheckCircle, XCircle, Wifi, WifiOff, Key, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const { stats, loading: dataLoading, refreshData } = useData();
  const [sessionName, setSessionName] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [currentStep, setCurrentStep] = useState('session');

  useEffect(() => {
    if (user?.isWhatsappConnected) {
      setCurrentStep('connected');
      setConnectionStatus('connected');
    }
  }, [user]);

  const createSession = async () => {
    if (!sessionName.trim()) {
      toast.error('Please enter a session name');
      return;
    }

    try {
      setConnectionStatus('creating');
      setCurrentStep('token');
      
      // Update user session name
      await api.patch('/auth/update-session', { sessionName });
      
      // Generate token
      toast.loading('Generating token...', { id: 'session' });
      await api.post('/whatsapp/generate-token');
      
      setCurrentStep('starting');
      toast.loading('Starting session...', { id: 'session' });
      
      // Start session
      await api.post('/whatsapp/start-session');
      
      setCurrentStep('qr');
      toast.loading('Getting QR code...', { id: 'session' });
      
      // Get QR code
      const qrResponse = await api.get('/whatsapp/qr-code', {
        responseType: 'blob'
      });
      
      const qrUrl = URL.createObjectURL(qrResponse.data);
      setQrCode(qrUrl);
      
      toast.success('QR code ready! Scan with WhatsApp', { id: 'session' });
      
      // Check connection periodically
      const interval = setInterval(checkConnection, 3000);
      return () => clearInterval(interval);
    } catch (error) {
      toast.error('Failed to create session', { id: 'session' });
      setConnectionStatus('error');
      setCurrentStep('session');
    }
  };

  const checkConnection = async () => {
    try {
      const response = await api.get('/whatsapp/status');
      
      if (response.data.connected) {
        setConnectionStatus('connected');
        setCurrentStep('connected');
        setQrCode(null);
        setUser(prev => ({ ...prev, isWhatsappConnected: true }));
        toast.success('WhatsApp connected successfully!');
        refreshData();
      } else {
        setConnectionStatus('scanning');
      }
    } catch (error) {
      setConnectionStatus('error');
    }
  };



  const StatCard = ({ icon: Icon, title, value, color, loading }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300"
    >
      <div className="flex items-center">
        <div className={`p-4 rounded-2xl ${color} shadow-lg`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 text-lg">Welcome back, {user?.email}</p>
      </motion.div>

      {/* WhatsApp Session Setup */}
      {currentStep === 'session' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Create WhatsApp Session</h3>
            <p className="text-gray-600">Enter a unique session name to get started</p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Session Name
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-lg"
                placeholder="e.g., MyWhatsAppSession"
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={createSession}
              disabled={connectionStatus === 'creating'}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {connectionStatus === 'creating' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Session...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Create Session
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Session Steps */}
      {currentStep !== 'session' && currentStep !== 'connected' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
        >
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${currentStep === 'token' ? 'text-blue-600' : 'text-green-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'token' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  <Key className="h-4 w-4" />
                </div>
                <span className="ml-2 font-medium">Token</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center ${currentStep === 'starting' ? 'text-blue-600' : currentStep === 'qr' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'starting' ? 'bg-blue-100' : currentStep === 'qr' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Play className="h-4 w-4" />
                </div>
                <span className="ml-2 font-medium">Session</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center ${currentStep === 'qr' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'qr' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <QrCode className="h-4 w-4" />
                </div>
                <span className="ml-2 font-medium">QR Code</span>
              </div>
            </div>
          </div>

          {qrCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <h4 className="text-xl font-bold text-gray-900 mb-4">
                Scan QR Code with WhatsApp
              </h4>
              <div className="inline-block p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 rounded-xl" />
              </div>
              <p className="text-gray-600 mt-4 max-w-md mx-auto">
                Open WhatsApp on your phone → Settings → Linked Devices → Link a Device → Scan this QR code
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Connected Status */}
      {currentStep === 'connected' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-xl p-8 mb-8 border border-green-200"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Wifi className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Connected!</h3>
            <p className="text-gray-600">Your WhatsApp session is active and ready to use</p>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      {currentStep === 'connected' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={MessageCircle}
            title="Total Chats"
            value={dataLoading ? '...' : stats.totalChats}
            color="bg-gradient-to-r from-blue-400 to-blue-600"
            loading={dataLoading}
          />
          <StatCard
            icon={Users}
            title="Total Groups"
            value={dataLoading ? '...' : stats.totalGroups}
            color="bg-gradient-to-r from-green-400 to-green-600"
            loading={dataLoading}
          />
          <StatCard
            icon={Send}
            title="Total Campaigns"
            value={dataLoading ? '...' : stats.totalCampaigns}
            color="bg-gradient-to-r from-purple-400 to-purple-600"
            loading={dataLoading}
          />
          <StatCard
            icon={Activity}
            title="Active Campaigns"
            value={dataLoading ? '...' : stats.activeCampaigns}
            color="bg-gradient-to-r from-orange-400 to-orange-600"
            loading={dataLoading}
          />
        </div>
      )}

      {/* Quick Actions */}
      {currentStep === 'connected' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.a
              href="/chats"
              whileHover={{ scale: 1.05, y: -5 }}
              className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:shadow-lg transition-all duration-300 border border-blue-200"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <p className="font-bold text-blue-900 text-lg mb-2">View Chats</p>
              <p className="text-sm text-blue-600 text-center">Browse your conversations and contacts</p>
            </motion.a>

            <motion.a
              href="/campaigns"
              whileHover={{ scale: 1.05, y: -5 }}
              className="flex flex-col items-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:shadow-lg transition-all duration-300 border border-green-200"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-4">
                <Send className="h-6 w-6 text-white" />
              </div>
              <p className="font-bold text-green-900 text-lg mb-2">Campaigns</p>
              <p className="text-sm text-green-600 text-center">Manage your message campaigns</p>
            </motion.a>

            <motion.a
              href="/campaigns/create"
              whileHover={{ scale: 1.05, y: -5 }}
              className="flex flex-col items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:shadow-lg transition-all duration-300 border border-purple-200"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <p className="font-bold text-purple-900 text-lg mb-2">New Campaign</p>
              <p className="text-sm text-purple-600 text-center">Create bulk message campaign</p>
            </motion.a>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;