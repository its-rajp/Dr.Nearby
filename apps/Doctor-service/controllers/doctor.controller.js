// apps/Doctor-service/controllers/doctor.controller.js
import Doctor from '../models/doctor.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const generateToken = (id) => {
  return jwt.sign({ id, role: 'doctor' }, process.env.JWT_SECRET || 'dr_nearby_jwt_secret_v2_2025', {
    expiresIn: '7d'
  });
};

/**
 * @description Register a new doctor
 * @route POST /api/doctor/register
 */
export const registerDoctor = async (req, res) => {
  try {
    const { name, email, password, phone, dob, gender, specialization, hospital, address, city, state, zipCode, licenseNumber, experience, qualification, languages } = req.body;

    
    if (!name || !email || !password || !phone || !dob || !gender || !specialization || !hospital || !address || !city || !state || !licenseNumber || !experience || !qualification) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields including location details.' });
    }

    
    const existingDoctor = await Doctor.findOne({ $or: [{ email }, { licenseNumber }] });
    if (existingDoctor) {
      return res.status(409).json({ success: false, message: 'Doctor with this email or license number already exists.' });
    }

    const doctor = await Doctor.create({
      name,
      email,
      password,
      phone,
      dob,
      gender,
      specialization,
      hospital,
      location: {
        address,
        city,
        state,
        zipCode: zipCode || ''
      },
      licenseNumber,
      experience,
      qualification,
      languages: languages ? (typeof languages === 'string' ? languages.split(',').map(l => l.trim()) : languages) : []
    });

    const token = generateToken(doctor._id);
    
    
    const doctorData = doctor.toObject();
    delete doctorData.password;

    res.status(201).json({ success: true, token, doctor: doctorData, message: 'Registration successful!' });
  } catch (error) {
    console.error('Doctor registration error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Doctor with this email or license number already exists.' });
    }
    res.status(500).json({ success: false, message: error.message || 'Registration failed. Please try again.' });
  }
};

/**
 * @description Login a doctor
 * @route POST /api/doctor/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    
    const doctor = await Doctor.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { name: { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    });
    console.log(`Login attempt for: ${email}`);
    
    if (!doctor) {
      console.log('Doctor not found in DB (Case insensitive search by Email or Name)');
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    
    let isMatch = false;
    
    // 1. Try plain text comparison first (User Request: "as it is feeded")
    if (password === doctor.password) {
        isMatch = true;
        console.log('Password matched as plain text.');
    } else {
        // 2. Fallback to bcrypt for legacy hashed passwords
        try {
            isMatch = await bcrypt.compare(password, doctor.password);
            console.log(`Bcrypt match status: ${isMatch}`);
        } catch (e) {
            console.log('Bcrypt comparison failed (likely not a hash).');
        }
    }
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    
    doctor.lastLogin = new Date();
    await doctor.save();

    const token = generateToken(doctor._id);

    res.json({
      success: true,
      token,
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        dob: doctor.dob,
        gender: doctor.gender,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        location: doctor.location,
        licenseNumber: doctor.licenseNumber,
        experience: doctor.experience,
        qualification: doctor.qualification,
        languages: doctor.languages,
        isActive: doctor.isActive,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt,
        __v: doctor.__v,
        lastLogin: doctor.lastLogin
      }
    });
  } catch (error) {
    console.error('Doctor login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

/**
 * @description Get current doctor profile
 * @route GET /api/doctor/profile
 */
export const getDoctorProfile = async (req, res) => {
  try {
    const id = req.params.id || req.user._id;
    const doctor = await Doctor.findById(id).select('-password');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }
    res.json({ success: true, doctor });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

/**
 * @description Update doctor profile
 * @route PUT /api/doctor/profile
 */
export const updateDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    
    const allowedUpdates = ['name', 'phone', 'specialization', 'hospital', 'location', 'experience', 'qualification', 'languages', 'email'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        doctor[field] = req.body[field];
      }
    });

    
    if (req.body.location) {
      doctor.location = { ...doctor.location.toObject(), ...req.body.location };
    }

    await doctor.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        location: doctor.location,
        experience: doctor.experience,
        qualification: doctor.qualification,
        languages: doctor.languages
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

/**
 * @description Reset doctor password (Admin only)
 * @route PUT /api/doctor/reset-password/:id
 */
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    
    
    
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
         return res.status(403).json({ success: false, message: 'Not authorized to reset passwords.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'New password is required.' });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    doctor.password = password;
    await doctor.save();

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

/**
 * @description Admin update doctor (e.g. deactivate)
 * @route PUT /api/doctor/doctors/:id
 */
export const uploadDoctorProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const imageUrl = `/uploads/${req.file.filename}`;
        
        await Doctor.findByIdAndUpdate(req.user._id, { profileImage: imageUrl });
        
        res.json({ success: true, imageUrl, message: 'Profile photo uploaded successfully' });
    } catch (error) {
        console.error('Doctor profile photo upload failed:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
};

export const adminUpdateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
         return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    
    if (updates.isActive !== undefined) doctor.isActive = updates.isActive;
    if (updates.name) doctor.name = updates.name;
    if (updates.email) doctor.email = updates.email;
    if (updates.phone) doctor.phone = updates.phone;
    if (updates.consultationFee) doctor.consultationFee = updates.consultationFee;
    
    await doctor.save();

    const doctorData = doctor.toObject();
    delete doctorData.password;

    res.json({ success: true, doctor: doctorData, message: 'Doctor updated successfully.' });
  } catch (error) {
    console.error('Admin update doctor error:', error);
    res.status(500).json({ success: false, message: 'Failed to update doctor.' });
  }
};
