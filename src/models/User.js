import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password should be at least 6 characters long'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent password from being returned in queries
userSchema.set('toJSON', {
  transform: function(doc, ret, opt) {
    delete ret.password;
    return ret;
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
