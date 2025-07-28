import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Download, Search, Send, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Chats = () => {
  const { chats, groups, loading, refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);

  const exportChats = () => {
    const csvData = chats.map(chat => {
      const phone = chat.phone || '';
      const name = chat.name || chat.formattedTitle || phone || 'Contact';
      return {
        id: chat.id,
        name: name,
        phone: phone
      };
    });

    downloadCSV(csvData, 'chats.csv');
    toast.success('Chats exported successfully!');
  };

  const exportGroups = () => {
    const csvData = groups.map(group => {
      const members = Array.isArray(group.members) ? group.members : [];
      const memberPhones = members.map(m => m.phone).filter(phone => phone).join(';');
      const memberIds = members.map(m => m.id).filter(id => id).join(';');
      const groupId = group.id || '';
      const name = group.name || group.formattedTitle || `Group ${groupId.split('-')[0]}` || 'Group';
      
      return {
        id: groupId,
        name: name,
        members_count: group.memberCount || members.length,
        member_phones: memberPhones,
        member_ids: memberIds
      };
    });

    downloadCSV(csvData, 'groups.csv');
    toast.success('Groups exported successfully!');
  };

  const downloadCSV = (data, filename) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredChats = chats.filter(chat => {
    const name = chat.name || chat.formattedTitle || '';
    const phone = chat.phone || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           phone.includes(searchTerm);
  });

  const filteredGroups = groups.filter(group => {
    const name = group.name || group.formattedTitle || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading && chats.length === 0 && groups.length === 0) {
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Chats & Groups
        </h1>
        <p className="text-gray-600 text-lg">Manage your WhatsApp contacts and groups</p>
      </motion.div>

      {/* Actions Bar */}
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
              placeholder="Search chats and groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={async () => {
                try {
                  setSyncing(true);
                  toast.loading('Syncing chats...', { id: 'sync' });
                  await api.post('/whatsapp/sync-chats');
                  toast.loading('Syncing groups...', { id: 'sync' });
                  await api.post('/whatsapp/sync-groups');
                  refreshData();
                  toast.success('Data synced successfully!', { id: 'sync' });
                } catch (error) {
                  toast.error('Failed to sync data', { id: 'sync' });
                } finally {
                  setSyncing(false);
                }
              }}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center"
              disabled={loading || syncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync All
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={async () => {
                try {
                  setSyncing(true);
                  await api.post('/whatsapp/sync-chats');
                  refreshData();
                  toast.success('Chats synced!');
                } catch (error) {
                  toast.error('Failed to sync chats');
                } finally {
                  setSyncing(false);
                }
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center text-sm"
              disabled={loading || syncing}
            >
              Chats
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={async () => {
                try {
                  setSyncing(true);
                  await api.post('/whatsapp/sync-groups');
                  refreshData();
                  toast.success('Groups synced!');
                } catch (error) {
                  toast.error('Failed to sync groups');
                } finally {
                  setSyncing(false);
                }
              }}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center text-sm"
              disabled={loading || syncing}
            >
              Groups
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={exportChats}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Chats
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={exportGroups}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Groups
            </motion.button>
            <Link
              to="/campaigns/create"
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Campaign
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chats Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
        >
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-3">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Chats ({filteredChats.length})
            </h2>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No chats found</p>
            ) : (
              filteredChats.map((chat, index) => {
                const phone = chat.phone || chat.id?.replace('@c.us', '') || '';
                const name = chat.name || chat.formattedTitle || phone || 'Contact';
                const chatId = chat.id || '';

                return (
                  <motion.div
                    key={chatId}
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
                        <p className="font-medium text-gray-900">{name}</p>
                        <p className="text-sm text-gray-600">Phone: {phone}</p>
                        <p className="text-xs text-gray-500">ID: {chatId}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Groups Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
        >
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-3">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Groups ({filteredGroups.length})
            </h2>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No groups found</p>
            ) : (
              filteredGroups.map((group, index) => {
                const groupId = group.id || '';
                const name = group.name || group.formattedTitle || `Group ${groupId.split('-')[0]}` || 'Group';
                const members = Array.isArray(group.members) ? group.members : [];

                return (
                  <motion.div
                    key={groupId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all duration-200 border border-green-200"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold mr-4 shadow-lg">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{name}</p>
                        <p className="text-sm text-green-600 font-medium">
                          Members: {group.memberCount || members.length}
                        </p>
                        {members.length > 0 && (
                          <p className="text-xs text-gray-600 truncate">
                            Phones: {members.slice(0, 3).map(m => m.phone).filter(phone => phone).join(', ')}{members.length > 3 ? '...' : ''}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 truncate">ID: {groupId}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Chats;