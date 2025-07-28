import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAllData = async (force = false) => {
    if (!user?.isWhatsappConnected) return;

    setLoading(true);
    try {
      const [chatsRes, groupsRes, campaignsRes] = await Promise.all([
        api.get('/whatsapp/chats'),
        api.get('/whatsapp/groups'),
        api.get('/campaigns')
      ]);

      setChats(Array.isArray(chatsRes.data) ? chatsRes.data : []);
      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
      setCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => loadAllData();

  useEffect(() => {
    if (user?.isWhatsappConnected) {
      loadAllData();
    }
  }, [user?.isWhatsappConnected]);

  const stats = {
    totalChats: chats.length,
    totalGroups: groups.length,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'running').length
  };

  const value = {
    chats,
    groups,
    campaigns,
    stats,
    loading,
    refreshData,
    loadAllData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};