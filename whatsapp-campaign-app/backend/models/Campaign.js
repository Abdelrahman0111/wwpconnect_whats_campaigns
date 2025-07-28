const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  recipients: [{
    phone: String,
    name: String,
    isGroup: Boolean
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'running', 'completed', 'failed'],
    default: 'draft'
  },
  scheduledAt: Date,
  results: [{
    recipient: String,
    status: String,
    sentAt: Date,
    error: String
  }],
  totalRecipients: Number,
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  delay: {
    type: Number,
    default: 3000
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', campaignSchema);