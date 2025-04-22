// models/User.js
import mongoose from 'mongoose';

const googleUser = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  email: String,
  fullName: String,
  avatar: String,
  isVerified: {
    type: Boolean,
    default: false,
  },
  authProvider: {
    type: String,
    enum: ['google', 'local'],
    default: 'local',
  },
}, { timestamps: true });

const GoogleUser = mongoose.model('googleUser', googleUser);
export default GoogleUser;
