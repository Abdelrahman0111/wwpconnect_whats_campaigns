const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  chats: [{
    id: String,
    name: String,
    formattedTitle: String,
    phone: String,
    lastUpdated: Date
  }],
  groups: [{
    id: String,
    name: String,
    formattedTitle: String,
    members: [{
      id: String,
      phone: String
    }],
    memberCount: Number,
    membersLoaded: { type: Boolean, default: false },
    lastUpdated: Date
  }],
  lastSyncAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserData', userDataSchema);