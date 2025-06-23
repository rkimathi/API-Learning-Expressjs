const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: false, // Optional by default
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'], // Basic email format validation
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Enforce min length at schema level too
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to hash password before saving (for new users or when password changes)
// Note: This hook is NOT triggered on 'findOneAndUpdate' or 'updateMany' etc.
// If password updates happen via such queries, hashing needs to be handled there.
// For direct document.save() operations (like new user or user.password = newPass; user.save()), this works.
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password (optional, can also be done in route handler)
// UserSchema.methods.comparePassword = async function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

const User = mongoose.model('User', UserSchema);

module.exports = User;
