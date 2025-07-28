import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Send, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Campaigns = () => {
  const { campaigns, loading } = useData();
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const sendCampaign = async (campaignId) => {
    try {
      toast.loading('Sending campaign...', { id: 'sending' });
      
      const response = await api.post(`/campaigns/${campaignId}/send`);
      
      toast.success('Campaign sent successfully!', { id: 'sending' });
      
      // Refresh data to get updated campaign
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error('Failed to send campaign', { id: 'sending' });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Campaigns
            </h1>
            <p className="text-gray-600 text-lg">Manage your message campaigns</p>
          </div>
          <Link
            to="/campaigns/create"
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Campaign
          </Link>
        </div>
      </motion.div>

      {campaigns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100"
        >
          <Send className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-600 mb-6">Create your first campaign to start sending bulk messages</p>
          <Link
            to="/campaigns/create"
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 inline-flex items-center shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Campaign
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {campaign.name}
                  </h3>
                  <div className="flex items-center mb-2">
                    {getStatusIcon(campaign.status)}
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Recipients:</span>
                  <span className="font-medium">{campaign.totalRecipients}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Success:</span>
                  <span className="font-medium text-green-600">{campaign.successCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-medium text-red-600">{campaign.failureCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {campaign.message}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCampaign(campaign)}
                    className="btn-secondary flex-1 flex items-center justify-center text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </button>
                  
                  {campaign.status === 'draft' && (
                    <button
                      onClick={() => sendCampaign(campaign._id)}
                      className="btn-primary flex-1 flex items-center justify-center text-sm"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCampaign(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedCampaign.name}
              </h3>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Message:</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedCampaign.message}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recipients:</h4>
                <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  {selectedCampaign.recipients.map((recipient, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      {recipient.phone} {recipient.name && `(${recipient.name})`}
                    </div>
                  ))}
                </div>
              </div>

              {selectedCampaign.results && selectedCampaign.results.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Results:</h4>
                  <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                    {selectedCampaign.results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between text-sm py-1">
                        <span className="text-gray-700">{result.recipient}</span>
                        <span className={`font-medium ${
                          result.status === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Campaigns;