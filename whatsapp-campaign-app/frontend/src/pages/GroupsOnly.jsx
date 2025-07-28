import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Download, Search, RefreshCw, UserPlus } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const GroupsOnly = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [fetchingMembers, setFetchingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/whatsapp/groups?t=' + Date.now());
      console.log('Fetched groups from API:', response.data.length);
      setGroups(response.data);
    } catch (error) {
      toast.error('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const syncGroups = async () => {
    try {
      setSyncing(true);
      await api.post('/whatsapp/sync-groups');
      await fetchGroups();
      toast.success('Groups synced successfully!');
    } catch (error) {
      toast.error('Failed to sync groups');
    } finally {
      setSyncing(false);
    }
  };

  const fetchMembersForSelected = async () => {
    if (selectedGroups.length === 0) {
      toast.error('Please select groups first');
      return;
    }

    try {
      setFetchingMembers(true);
      toast.loading(`Fetching members for ${selectedGroups.length} groups...`, { id: 'fetch-members' });
      
      const response = await api.post('/whatsapp/fetch-group-members', {
        groupIds: selectedGroups
      });

      console.log('Fetch members response:', response.data);
      
      // Force refresh groups data
      const refreshResponse = await api.get('/whatsapp/groups');
      setGroups(refreshResponse.data);
      console.log('Refreshed groups:', refreshResponse.data);
      
      const successCount = response.data.results?.filter(r => r.status === 'success').length || 0;
      const failedCount = response.data.results?.filter(r => r.status === 'failed').length || 0;
      
      if (successCount > 0) {
        toast.success(`Members fetched: ${response.data.results.find(r => r.status === 'success')?.memberCount || 0} members`, { id: 'fetch-members' });
      } else {
        toast.error('Failed to fetch members for any group', { id: 'fetch-members' });
      }
      
      setSelectedGroups([]);
    } catch (error) {
      console.error('Fetch members error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch group members', { id: 'fetch-members' });
    } finally {
      setFetchingMembers(false);
    }
  };

  const toggleGroupSelection = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const selectAllGroups = () => {
    if (selectedGroups.length === filteredGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredGroups.map(g => g.id));
    }
  };

  const exportGroups = () => {
    const csvData = groups.map(group => {
      const members = Array.isArray(group.members) ? group.members : [];
      const memberPhones = members.map(m => m.phone).filter(phone => phone).join(';');
      
      return {
        id: group.id,
        name: group.name || group.formattedTitle || `Group ${group.id.split('-')[0]}`,
        members_count: group.memberCount || members.length,
        members_loaded: group.membersLoaded ? 'Yes' : 'No',
        member_phones: memberPhones
      };
    });

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'groups.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Groups exported successfully!');
  };

  const filteredGroups = groups.filter(group => {
    const name = group.name || group.formattedTitle || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading && groups.length === 0) {
    return (
      <div className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-green-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-green-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">
          Groups
        </h1>
        <p className="text-gray-600 text-lg">Manage your WhatsApp groups and members</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={syncGroups}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center"
                disabled={syncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Sync Groups
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={exportGroups}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </motion.button>
            </div>
          </div>

          {selectedGroups.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
              <span className="text-green-700 font-medium">
                {selectedGroups.length} groups selected
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={fetchMembersForSelected}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center"
                disabled={fetchingMembers}
              >
                <UserPlus className={`h-4 w-4 mr-2 ${fetchingMembers ? 'animate-spin' : ''}`} />
                Fetch Members
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-3">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              WhatsApp Groups ({filteredGroups.length})
            </h2>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={selectAllGroups}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors"
          >
            {selectedGroups.length === filteredGroups.length ? 'Deselect All' : 'Select All'}
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredGroups.length === 0 ? (
            <p className="text-gray-500 text-center py-8 col-span-full">No groups found</p>
          ) : (
            filteredGroups.map((group, index) => {
              const name = group.name || group.formattedTitle || `Group ${group.id.split('-')[0]}`;
              const members = Array.isArray(group.members) ? group.members : [];
              const isSelected = selectedGroups.includes(group.id);

              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl hover:shadow-md transition-all duration-200 border cursor-pointer ${
                    isSelected 
                      ? 'bg-gradient-to-r from-green-100 to-green-200 border-green-300' 
                      : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                  }`}
                  onClick={() => toggleGroupSelection(group.id)}
                >
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold mr-4 shadow-lg">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 truncate">{name}</p>
                      <p className="text-sm text-green-600 font-medium">
                        Members: {group.memberCount || members.length}
                      </p>
                      <p className="text-xs text-gray-500">
                        {group.membersLoaded ? '✓ Members loaded' : '○ Members not loaded'}
                      </p>
                      {group.membersLoaded && members.length > 0 && (
                        <p className="text-xs text-blue-600 truncate">
                          Phones: {members.slice(0, 2).map(m => m.phone).join(', ')}{members.length > 2 ? '...' : ''}
                        </p>
                      )}
                      {isSelected && (
                        <div className="mt-2">
                          <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            Selected
                          </span>
                        </div>
                      )}
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

export default GroupsOnly;