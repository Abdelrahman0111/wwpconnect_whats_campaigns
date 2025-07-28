const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const UserData = require('../models/UserData');
const auth = require('../middleware/auth');

const router = express.Router();
const WPPCONNECT_API = process.env.WPPCONNECT_API_URL;
const SECRET_KEY = process.env.WPPCONNECT_SECRET_KEY;

// Generate WhatsApp token
router.post('/generate-token', auth, async (req, res) => {
  try {
    const response = await axios.post(`${WPPCONNECT_API}/api/${req.user.sessionName}/${SECRET_KEY}/generate-token`);
    
    req.user.whatsappToken = response.data.token;
    await req.user.save();

    res.json({ token: response.data.token });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate token', error: error.message });
  }
});

// Start WhatsApp session
router.post('/start-session', auth, async (req, res) => {
  try {
    const response = await axios.post(`${WPPCONNECT_API}/api/${req.user.sessionName}/start-session`, {
      webhook: '',
      waitQrCode: true
    }, {
      headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to start session', error: error.message });
  }
});

// Get QR Code
router.get('/qr-code', auth, async (req, res) => {
  try {
    const response = await axios.get(`${WPPCONNECT_API}/api/${req.user.sessionName}/qrcode-session`, {
      headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` },
      responseType: 'arraybuffer'
    });

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get QR code', error: error.message });
  }
});

// Check connection status
router.get('/status', auth, async (req, res) => {
  try {
    const response = await axios.get(`${WPPCONNECT_API}/api/${req.user.sessionName}/check-connection-session`, {
      headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` }
    });

    const isConnected = response.data.status === true || response.data.connected === true;
    
    if (isConnected && !req.user.isWhatsappConnected) {
      req.user.isWhatsappConnected = true;
      req.user.lastConnected = new Date();
      await req.user.save();
    }

    res.json({ connected: isConnected, data: response.data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check status', error: error.message });
  }
});

// Get chats only
router.get('/chats', auth, async (req, res) => {
  try {
    let userData = await UserData.findOne({ userId: req.user._id });
    
    if (userData?.chats?.length > 0) {
      return res.json(userData.chats);
    }

    const response = await axios.post(`${WPPCONNECT_API}/api/${req.user.sessionName}/list-chats`, {
      onlyUsers: true
    }, {
      headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` }
    });

    const chats = Array.isArray(response.data) ? response.data.filter(item => !item.isGroup) : [];
    const processedChats = chats.map(chat => {
      const phone = chat.id._serialized.replace('@c.us', '');
      return {
        id: chat.id._serialized,
        name: chat.name || chat.formattedTitle || chat.pushname || phone || 'Contact',
        phone: phone
      };
    });

    await UserData.findOneAndUpdate(
      { userId: req.user._id },
      { chats: processedChats },
      { upsert: true }
    );

    res.json(processedChats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get chats', error: error.message });
  }
});

// Get groups only (no members)
router.get('/groups', auth, async (req, res) => {
  try {
    let userData = await UserData.findOne({ userId: req.user._id });
    
    if (userData?.groups?.length > 0) {
      return res.json(userData.groups);
    }

    const response = await axios.post(`${WPPCONNECT_API}/api/${req.user.sessionName}/list-chats`, {
      onlyGroups: true
    }, {
      headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` }
    });

    const groups = Array.isArray(response.data) ? response.data.filter(item => item.isGroup) : [];
    const basicGroups = groups.map(group => ({
      id: group.id._serialized,
      name: group.name || group.formattedTitle || group.subject || `Group ${group.id._serialized.split('-')[0]}`,
      memberCount: 0,
      membersLoaded: false
    }));

    await UserData.findOneAndUpdate(
      { userId: req.user._id },
      { groups: basicGroups },
      { upsert: true }
    );

    res.json(basicGroups);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get groups', error: error.message });
  }
});

// Get counts only (super fast)
router.get('/counts', auth, async (req, res) => {
  try {
    const response = await axios.post(`${WPPCONNECT_API}/api/${req.user.sessionName}/list-chats`, {}, {
      headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` }
    });

    const data = Array.isArray(response.data) ? response.data : [];
    const chatsCount = data.filter(item => !item.isGroup).length;
    const groupsCount = data.filter(item => item.isGroup).length;

    res.json({ chatsCount, groupsCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get counts', error: error.message });
  }
});

// Fetch members for selected groups
router.post('/fetch-group-members', auth, async (req, res) => {
  try {
    const { groupIds } = req.body;
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({ message: 'Group IDs required' });
    }

    const results = [];

    for (const groupId of groupIds) {
      try {
        console.log(`\n=== Fetching members for group: ${groupId} ===`);
        
        // Try different API endpoints for group members
        let membersResponse;
        try {
          membersResponse = await axios.get(`${WPPCONNECT_API}/api/${req.user.sessionName}/group-members/${groupId}`, {
            headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` },
            timeout: 15000
          });
        } catch (error) {
          membersResponse = await axios.post(`${WPPCONNECT_API}/api/${req.user.sessionName}/group-members`, {
            groupId: groupId
          }, {
            headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` },
            timeout: 15000
          });
        }
        
        console.log('Raw API response status:', membersResponse.status);
        console.log('Raw API response data:', JSON.stringify(membersResponse.data, null, 2));
        
        let members = membersResponse.data?.response || membersResponse.data || [];
        console.log('Step 1 - Extracted members:', Array.isArray(members), 'Length:', Array.isArray(members) ? members.length : 'N/A');
        
        if (!Array.isArray(members)) {
          console.log('Step 2 - Not array, checking participants...');
          members = members.participants || members.groupMetadata?.participants || [];
          console.log('Step 2 - After participants check:', Array.isArray(members), 'Length:', Array.isArray(members) ? members.length : 'N/A');
        }
        
        if (!Array.isArray(members) || members.length === 0) {
          console.log('Step 3 - Still no members, checking all possible paths...');
          console.log('Available keys in response:', Object.keys(membersResponse.data || {}));
          
          // Try different possible paths
          const possiblePaths = [
            membersResponse.data?.result,
            membersResponse.data?.data,
            membersResponse.data?.members,
            membersResponse.data?.groupInfo?.participants,
            membersResponse.data?.chat?.participants
          ];
          
          for (let i = 0; i < possiblePaths.length; i++) {
            if (Array.isArray(possiblePaths[i]) && possiblePaths[i].length > 0) {
              members = possiblePaths[i];
              console.log(`Found members in path ${i}:`, members.length);
              break;
            }
          }
        }
        
        console.log('Final members array:', Array.isArray(members), 'Length:', Array.isArray(members) ? members.length : 'N/A');
        console.log('Sample member object:', members[0]);
        
        const processedMembers = members.map(m => {
          const memberId = m.id?._serialized || m.id || m.contact?.id?._serialized || m.user || '';
          const phone = m.id?.user || memberId.replace('@c.us', '').replace('@g.us', '').replace('@lid', '');
          return {
            id: memberId,
            phone: phone,
            name: m.name || m.formattedName || m.pushname || phone
          };
        }).filter(m => m.id && (m.id.includes('@c.us') || m.id.includes('@lid')));
        
        console.log(`Final result: ${processedMembers.length} valid members from ${members.length} total`);
        console.log('Sample processed member:', processedMembers[0]);

        // Update database directly for this group
        await UserData.updateOne(
          { userId: req.user._id, 'groups.id': groupId },
          {
            $set: {
              'groups.$.members': processedMembers,
              'groups.$.memberCount': processedMembers.length,
              'groups.$.membersLoaded': true
            }
          }
        );
        
        console.log(`Updated group ${groupId} with ${processedMembers.length} members in database`);

        results.push({ groupId, memberCount: processedMembers.length, status: 'success' });
        console.log(`✅ Success for group ${groupId}: ${processedMembers.length} members`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error fetching members for group ${groupId}:`, error.message);
        console.error('Full error:', error.response?.data || error);
        results.push({ groupId, error: error.message, status: 'failed' });
      }
    }

    // Update lastSyncAt
    await UserData.updateOne(
      { userId: req.user._id },
      { $set: { lastSyncAt: new Date() } }
    );
    
    console.log('All groups updated in database');

    console.log('\n=== FINAL RESULTS ===');
    console.log('Results:', results);
    
    res.json({ results, message: `Processed ${groupIds.length} groups` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch group members', error: error.message });
  }
});

// Sync chats only
router.post('/sync-chats', auth, async (req, res) => {
  try {
    const response = await axios.post(`${WPPCONNECT_API}/api/${req.user.sessionName}/list-chats`, {
      onlyUsers: true
    }, {
      headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` }
    });

    const chats = Array.isArray(response.data) ? response.data.filter(item => !item.isGroup) : [];
    const processedChats = chats.map(chat => {
      const phone = chat.id._serialized.replace('@c.us', '');
      return {
        id: chat.id._serialized,
        name: chat.name || chat.formattedTitle || chat.pushname || phone || 'Contact',
        phone: phone
      };
    });

    await UserData.findOneAndUpdate(
      { userId: req.user._id },
      { chats: processedChats },
      { upsert: true }
    );

    res.json({ message: 'Chats synced', count: processedChats.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync chats', error: error.message });
  }
});

// Sync groups only (no members)
router.post('/sync-groups', auth, async (req, res) => {
  try {
    const response = await axios.post(`${WPPCONNECT_API}/api/${req.user.sessionName}/list-chats`, {
      onlyGroups: true
    }, {
      headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` }
    });

    const groups = Array.isArray(response.data) ? response.data.filter(item => item.isGroup) : [];
    const processedGroups = groups.map(group => ({
      id: group.id._serialized,
      name: group.name || group.formattedTitle || group.subject || `Group ${group.id._serialized.split('-')[0]}`,
      memberCount: 0,
      membersLoaded: false
    }));

    await UserData.findOneAndUpdate(
      { userId: req.user._id },
      { groups: processedGroups },
      { upsert: true }
    );

    res.json({ message: 'Groups synced', count: processedGroups.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync groups', error: error.message });
  }
});

// Sync all data (legacy endpoint for combined page)
router.post('/sync-all', auth, async (req, res) => {
  try {
    // Sync chats
    const chatsResponse = await axios.post(`${WPPCONNECT_API}/api/${req.user.sessionName}/list-chats`, {
      onlyUsers: true
    }, {
      headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` }
    });

    const chats = Array.isArray(chatsResponse.data) ? chatsResponse.data.filter(item => !item.isGroup) : [];
    const processedChats = chats.map(chat => {
      const phone = chat.id._serialized.replace('@c.us', '');
      return {
        id: chat.id._serialized,
        name: chat.name || chat.formattedTitle || chat.pushname || phone || 'Contact',
        phone: phone
      };
    });

    // Sync groups (basic info only)
    const groupsResponse = await axios.post(`${WPPCONNECT_API}/api/${req.user.sessionName}/list-chats`, {
      onlyGroups: true
    }, {
      headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` }
    });

    const groups = Array.isArray(groupsResponse.data) ? groupsResponse.data.filter(item => item.isGroup) : [];
    const processedGroups = groups.map(group => ({
      id: group.id._serialized,
      name: group.name || group.formattedTitle || group.subject || `Group ${group.id._serialized.split('-')[0]}`,
      memberCount: 0,
      membersLoaded: false
    }));

    await UserData.findOneAndUpdate(
      { userId: req.user._id },
      { chats: processedChats, groups: processedGroups },
      { upsert: true }
    );

    res.json({ 
      message: 'All data synced', 
      chatsCount: processedChats.length,
      groupsCount: processedGroups.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync all data', error: error.message });
  }
});

// Send message
router.post('/send-message', auth, async (req, res) => {
  try {
    const { phone, isGroup, message } = req.body;

    const response = await axios.post(`${WPPCONNECT_API}/api/${req.user.sessionName}/send-message`, {
      phone,
      isGroup,
      isNewsletter: false,
      isLid: false,
      message
    }, {
      headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

module.exports = router;