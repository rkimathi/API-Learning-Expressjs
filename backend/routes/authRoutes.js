const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Mongoose User model
const { registerValidationRules, loginValidationRules, validate } = require('../middleware/validators');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// TODO: Store JWT_SECRET in environment variables for production
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_JWT_SECRET_REPLACE_ME';

// POST /api/auth/register
router.post('/register', registerValidationRules(), validate, async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    // Create new user instance (password will be hashed by pre-save hook)
    user = new User({
      name,
      email,
      password,
    });

    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id, // user.id is the mongoose virtual getter for _id
      },
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        // Return token and user info (excluding password)
        // Mongoose .toJSON() or .toObject() can be customized via schema options to exclude password
        // For now, let's manually create a user object to return
        const userResponse = { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
        res.status(201).json({ token, user: userResponse, message: 'User registered successfully' });
      }
    );
  } catch (error) {
    console.error('Registration error:', error.message);
    // Check for duplicate key error (code 11000) for email
    if (error.code === 11000) {
        return res.status(400).json({ errors: [{ msg: 'Email already in use.' }] });
    }
    res.status(500).json({ errors: [{ msg: 'Server error during registration' }] });
  }
});

// POST /api/auth/login
router.post('/login', loginValidationRules(), validate, async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email }); // .select('+password') if password field has select: false in schema
    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
    }

    // User matched, create JWT payload
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ errors: [{ msg: 'Server error during login' }] });
  }
});


// GET /api/auth/profile - Protected Route
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // req.user is set by authMiddleware and contains { id: '...' }
    // Fetch user details from DB, excluding password
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      // This case should ideally not happen if token is valid and user exists
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user); // Mongoose document will be converted to JSON
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

// PUT /api/auth/me - Update authenticated user's profile
const { updateProfileValidationRules } = require('../middleware/validators');

router.put('/me', authMiddleware, updateProfileValidationRules(), validate, async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      // Should not happen if token is valid and middleware is working
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update name if provided
    if (name !== undefined) { // Check for undefined to allow clearing name if it's optional
      user.name = name;
    }

    // Update email if provided
    if (email && email !== user.email) {
      const existingUserWithNewEmail = await User.findOne({ email: email, _id: { $ne: userId } });
      if (existingUserWithNewEmail) {
        return res.status(400).json({ errors: [{ msg: 'Email already in use by another account' }] });
      }
      user.email = email;
    }

    // Update password if newPassword is provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ errors: [{ msg: 'Current password is required to update password' }] });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Incorrect current password' }] });
      }
      user.password = newPassword; // Pre-save hook will hash this
    } else if (currentPassword && !newPassword) {
        // If only currentPassword is provided without newPassword, it's likely an error by client
        return res.status(400).json({ errors: [{ msg: 'New password is required when current password is provided for an update'}] });
    }


    const updatedUser = await user.save();

    // Return updated user info (excluding password)
    const userResponse = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
      // Add any other fields you want to return
    };
    res.json(userResponse);

  } catch (error) {
    console.error('Update profile error:', error.message);
    if (error.code === 11000) { // Duplicate key error for email
        return res.status(400).json({ errors: [{ msg: 'Email already in use.' }] });
    }
    res.status(500).json({ msg: 'Server error while updating profile' });
  }
});
