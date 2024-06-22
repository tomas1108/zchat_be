const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define schema for Notification
const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now },
});

// Create model for Notification
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
