import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Users, MessageCircle, Clock, Plus, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const CreateCampaign = () => {
  const [campaignName, setCampaignName] = useState('');
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState('');
  const [delay, setDelay] = useState(3000);
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const [chatsRes, groupsRes] = await Promise.all([
        api.get('/whatsapp/chats'),
        api.get('/whatsapp/groups')
      ]);

      setChats(chatsRes.data);
      setGroups(groupsRes.data);
    } catch (error) {
      toast.error('Failed to load contacts');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const recipientList = parseRecipients();
    if (recipientList.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/campaigns', {
        name: campaignName,
        message,
        recipients: recipientList,
        delay
      });

      toast.success('Campaign created successfully!');
      navigate('/campaigns');
    } catch (error) {
      toast.error('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const parseRecipients = () => {
    const recipientList = [];
    
    // Add manually entered recipients
    if (recipients.trim()) {
      const lines = recipients.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed) {
          recipientList.push({
            phone: trimmed,
            name: '',
            isGroup: trimmed.includes('@g.us')
          });
        }
      });
    }

    // Add selected contacts
    selectedContacts.forEach(contact => {
      recipientList.push({
        phone: contact.id,
        name: contact.name,
        isGroup: contact.isGroup
      });
    });

    return recipientList;
  };

  const addContact = (contact) => {
    const isAlreadySelected = selectedContacts.some(c => c.id === contact.id._serialized);
    if (!isAlreadySelected) {
      setSelectedContacts(prev => [...prev, {
        id: contact.id._serialized,
        name: contact.name || contact.formattedTitle || 'Unknown',
        isGroup: contact.isGroup || false
      }]);
    }
  };

  const removeContact = (contactId) => {
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const totalRecipients = parseRecipients().length;

  return (
    <div className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8 max-w-4xl mx-auto"
      >
        <Link
          to="/campaigns"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 font-medium"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Campaigns
        </Link>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
          Create Campaign
        </h1>
        <p className="text-gray-600 text-lg">Send bulk messages to your contacts</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6 max-w-4xl mx-auto"
      >
        {/* Campaign Name */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Campaign Details</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="input-field"
              placeholder="Enter campaign name"
              required
            />
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Message</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Content
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="input-field resize-none"
              placeholder="Enter your message here..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Characters: {message.length}
            </p>
          </div>
        </div>

        {/* Recipients */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Recipients</h3>
            <button
              type="button"
              onClick={() => setShowContactPicker(true)}
              className="btn-secondary flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add from Contacts
            </button>
          </div>

          {/* Selected Contacts */}
          {selectedContacts.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Contacts:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center bg-whatsapp-100 text-whatsapp-800 px-3 py-1 rounded-full text-sm"
                  >
                    {contact.isGroup ? (
                      <Users className="h-3 w-3 mr-1" />
                    ) : (
                      <MessageCircle className="h-3 w-3 mr-1" />
                    )}
                    {contact.name}
                    <button
                      type="button"
                      onClick={() => removeContact(contact.id)}
                      className="ml-2 text-whatsapp-600 hover:text-whatsapp-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manual Recipients (one per line)
            </label>
            <textarea
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              rows={6}
              className="input-field resize-none"
              placeholder={`Enter chat/group IDs (one per line)
Examples:
5521999999999@c.us (for chat)
201066797364-1619514424@g.us (for group)`}
            />
            <div className="mt-2 text-sm text-gray-600">
              <p><strong>Format hints:</strong></p>
              <p>• Chat IDs: phone@c.us (e.g., 5521999999999@c.us)</p>
              <p>• Group IDs: number-timestamp@g.us (e.g., 201066797364-1619514424@g.us)</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Total Recipients: {totalRecipients}</strong>
            </p>
          </div>
        </div>

        {/* Anti-Block Timer */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Anti-Block Timer</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delay between messages
            </label>
            <select
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value))}
              className="input-field"
            >
              <option value={1000}>1 second (Fast)</option>
              <option value={3000}>3 seconds (Safe)</option>
              <option value={5000}>5 seconds (Very Safe)</option>
              <option value={10000}>10 seconds (Ultra Safe)</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Recommended:</strong> Use 3-5 seconds delay to avoid WhatsApp blocking your account
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || totalRecipients === 0}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating Campaign...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Send className="h-5 w-5 mr-2" />
              Create Campaign
            </div>
          )}
        </motion.button>
      </motion.form>

      {/* Contact Picker Modal */}
      {showContactPicker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowContactPicker(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-96 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Select Contacts</h3>
              <button
                onClick={() => setShowContactPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-80">
              {/* Chats */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <MessageCircle className="h-4 w-4 mr-2 text-blue-500" />
                  Chats ({chats.length})
                </h4>
                <div className="space-y-2">
                  {chats.map((chat) => {
                    const name = chat.name || chat.formattedTitle || 'Unknown';
                    const isSelected = selectedContacts.some(c => c.id === chat.id._serialized);
                    
                    return (
                      <button
                        key={chat.id._serialized}
                        onClick={() => addContact(chat)}
                        disabled={isSelected}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-gray-600">
                          {chat.id._serialized.replace('@c.us', '')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Groups */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-green-500" />
                  Groups ({groups.length})
                </h4>
                <div className="space-y-2">
                  {groups.map((group) => {
                    const name = group.name || group.formattedTitle || 'Unknown';
                    const members = Array.isArray(group.members) ? group.members : [];
                    const isSelected = selectedContacts.some(c => c.id === group.id._serialized);
                    
                    return (
                      <button
                        key={group.id._serialized}
                        onClick={() => addContact({ ...group, isGroup: true })}
                        disabled={isSelected}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-gray-600">
                          {members.length} members
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CreateCampaign;