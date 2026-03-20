import User from '../models/user.model.js';
import MedicalHistory from '../models/MedicalHistory.js';

// @desc    Get patient profile
// @route   GET /patient/profile
export const getPatientProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      // Ensure password is excluded (double-check)
      const userObj = user.toObject();
      delete userObj.password;
      res.json({ success: true, user: userObj });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

// @desc    Get public patient profile by ID
// @route   GET /patient/profile/:id
export const getPublicPatientProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (user) {
      const userObj = user.toObject();
      delete userObj.password;
      res.json({ success: true, user: userObj });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

// @desc    Update patient profile
// @route   PUT /patient/profile
export const updatePatientProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate input
    const { username, email, phone, dob, bloodGroup } = req.body;

    // Update fields only if provided
    if (username !== undefined) {
      if (!username || username.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Username cannot be empty.' });
      }
      user.username = username.trim();
    }

    if (bloodGroup !== undefined) {
      user.bloodGroup = bloodGroup;
    }

    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format.' });
      }
      
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email: email.trim(), _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Email is already in use by another account.' });
      }
      
      user.email = email.trim();
    }

    if (phone !== undefined) {
      if (!phone || phone.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Phone cannot be empty.' });
      }
      user.phone = phone.trim();
    }

    if (dob !== undefined) {
      // Validate date of birth (required field)
      if (!dob || dob.trim() === '') {
        return res.status(400).json({ success: false, message: 'Date of birth is required.' });
      }
      
      // Convert string date to Date object
      const dateObj = new Date(dob);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format.' });
      }
      
      // Validate that date is not in the future
      if (dateObj > new Date()) {
        return res.status(400).json({ success: false, message: 'Date of birth cannot be in the future.' });
      }
      
      user.dob = dateObj;
    }

    const updatedUser = await user.save();

    // Return user without password
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.json({ success: true, user: userResponse, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    // Handle duplicate key error (MongoDB)
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email is already in use by another account.' });
    }
    
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};

// @desc    Get medical history
// @route   GET /patient/medical-history
export const getMedicalHistory = async (req, res) => {
    try {
        let userId = req.user._id;

        // If ID param is provided and user is authorized (doctor/admin), use that ID
        if (req.params.userId) {
             if (req.doctor || req.user.role === 'admin' || req.user.role === 'super_admin') {
                 userId = req.params.userId;
             } else {
                 // Regular users can only see their own
                 return res.status(403).json({ success: false, message: 'Unauthorized' });
             }
        }

        const medicalHistory = await MedicalHistory.findOne({ userId: userId });
        if (!medicalHistory) {
            // Return empty object instead of 404 to allow rendering "No history available"
            return res.json({ success: true, medicalHistory: null });
        }
        res.json({ success: true, medicalHistory });
    } catch (error) {
        console.error('Error fetching medical history:', error);
        res.status(500).json({ success: false, message: 'Server error fetching medical history' });
    }
};

// @desc    Update medical history
// @route   PUT /patient/medical-history
export const updateMedicalHistory = async (req, res) => {
    try {
        let medicalHistory = await MedicalHistory.findOne({ userId: req.user._id });

        if (!medicalHistory) {
            // Create new if doesn't exist
            medicalHistory = new MedicalHistory({
                userId: req.user._id,
                ...req.body
            });
        } else {
            // Update existing
            Object.assign(medicalHistory, req.body);
        }

        await medicalHistory.save();
        res.json({ success: true, medicalHistory });
    } catch (error) {
        console.error('Error updating medical history:', error);
        res.status(500).json({ success: false, message: 'Server error updating medical history' });
    }
};

// @desc    Reset patient password (Admin only)
// @route   PUT /patient/reset-password/:id
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to reset passwords.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'New password is required.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.password = password;
    await user.save(); // Triggers pre-save hook to hash password

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

// @desc    Admin update user (e.g. deactivate)
// @route   PUT /patient/users/:id
export const adminUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Allow updating specific fields
    if (updates.isActive !== undefined) user.isActive = updates.isActive;
    if (updates.email) user.email = updates.email;
    if (updates.username) user.username = updates.username;
    if (updates.phone) user.phone = updates.phone;
    if (updates.bloodGroup) user.bloodGroup = updates.bloodGroup;

    await user.save();
    
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, user: userObj, message: 'User updated successfully.' });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};
