const express = require('express');
const axios = require('axios');
const Campaign = require('../models/Campaign');
const auth = require('../middleware/auth');

const router = express.Router();
const WPPCONNECT_API = process.env.WPPCONNECT_API_URL;

// Get all campaigns for user
router.get('/', auth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get campaigns', error: error.message });
  }
});

// Create campaign
router.post('/', auth, async (req, res) => {
  try {
    const { name, message, recipients, delay } = req.body;

    const campaign = new Campaign({
      userId: req.user._id,
      name,
      message,
      recipients,
      delay: delay || 3000,
      totalRecipients: recipients.length
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create campaign', error: error.message });
  }
});

// Send campaign
router.post('/:id/send', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.status = 'running';
    await campaign.save();

    // Send messages with delay
    const results = [];
    for (let i = 0; i < campaign.recipients.length; i++) {
      const recipient = campaign.recipients[i];
      
      try {
        const phone = recipient.phone.replace('@c.us', '').replace('@g.us', '');
        
        await axios.post(`${WPPCONNECT_API}/api/${req.user.sessionName}/send-message`, {
          phone,
          isGroup: recipient.isGroup || false,
          isNewsletter: false,
          isLid: false,
          message: campaign.message
        }, {
          headers: { 'Authorization': `Bearer ${req.user.whatsappToken}` }
        });

        results.push({
          recipient: recipient.phone,
          status: 'success',
          sentAt: new Date()
        });

        campaign.successCount++;
      } catch (error) {
        results.push({
          recipient: recipient.phone,
          status: 'failed',
          sentAt: new Date(),
          error: error.message
        });

        campaign.failureCount++;
      }

      // Delay between messages
      if (i < campaign.recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, campaign.delay));
      }
    }

    campaign.results = results;
    campaign.status = 'completed';
    await campaign.save();

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send campaign', error: error.message });
  }
});

// Get campaign details
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get campaign', error: error.message });
  }
});

module.exports = router;