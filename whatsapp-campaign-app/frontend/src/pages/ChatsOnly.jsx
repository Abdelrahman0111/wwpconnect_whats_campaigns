import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Download, Search, RefreshCw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ChatsOnly = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/whatsapp/chats');
      setChats(response.data);
    } catch (error) {
      toast.error('Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  const syncChats = async () => {
    try {
      setSyncing(true);
      await api.post('/whatsapp/sync-chats');
      await fetchChats();
      toast.success('Chats synced successfully!');
    } catch (error) {
      toast.error('Failed to sync chats');
    } finally {
      setSyncing(false);
    }
  };

  const exportChats = () => {
    const csvData = chats.map(chat => ({
      id: chat.id,
      name: chat.name || chat.formattedTitle || chat.phone || 'Contact',
      phone: chat.phone || ''
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chats.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chats exported successfully!');
  };

  const filteredChats = chats.filter(chat => {
    const name = chat.name || chat.formattedTitle || '';
    const phone = chat.phone || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           phone.includes(searchTerm);
  });

  if (loading && chats.length === 0) {
    return (
      <div className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
          Chats
        </h1>
        <p className="text-gray-600 text-lg">Manage your WhatsApp individual chats</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={syncChats}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center"
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync Chats
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={exportChats}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
      >
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-3">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Individual Chats ({filteredChats.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <p className="text-gray-500 text-center py-8 col-span-full">No chats found</p>
          ) : (
            filteredChats.map((chat, index) => {
              const phone = chat.phone || chat.id?.replace('@c.us', '') || '';
              const name = chat.name || chat.formattedTitle || phone || 'Contact';

              return (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all duration-200 border border-blue-200"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold mr-4 shadow-lg">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 truncate">{name}</p>
                      <p className="text-sm text-gray-600">{phone}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ChatsOnly;