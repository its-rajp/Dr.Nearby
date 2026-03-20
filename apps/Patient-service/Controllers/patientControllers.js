import HealthRecord from '../models/HealthRecord.js';
import MedicineOrder from '../models/MedicineOrder.js';
import Medicine from '../models/Medicine.js';

export const uploadHealthRecord = async (req, res) => {
  const userId = req.user._id;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const recordData = {
      userId: userId,
      type: req.body.type,
      notes: req.body.notes,
      fileUrl: `/uploads/${req.file.filename}`, // Use the path provided by multer
      sharedWith: req.body.sharedWith ? [req.body.sharedWith] : []
    };

    const record = await HealthRecord.create(recordData);
    res.status(201).json({ success: true, record });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

export const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const imageUrl = `/uploads/${req.file.filename}`;
        
        // Update user profile with image URL
        const User = (await import('../models/user.model.js')).default;
        await User.findByIdAndUpdate(req.user._id, { profileImage: imageUrl });
        
        res.json({ success: true, imageUrl, message: 'Profile photo uploaded successfully' });
    } catch (error) {
        console.error('Profile photo upload failed:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
};

export const shareHealthRecord = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { doctorId } = req.body;

  try {
    const record = await HealthRecord.findOne({ _id: id, userId: userId });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    if (!record.sharedWith.includes(doctorId)) {
      record.sharedWith.push(doctorId);
      await record.save();
    }

    res.json({ success: true, message: 'Record shared with doctor successfully', record });
  } catch (error) {
    console.error('Share failed:', error);
    res.status(500).json({ success: false, message: 'Share failed' });
  }
};

export const getHealthRecords = async (req, res) => {
  const userId = req.user ? req.user._id : null;

  try {
    // If doctor is requesting, return records shared with them
    if (req.doctor) {
        const records = await HealthRecord.find({ sharedWith: req.doctor._id }).populate('userId', 'name email');
        return res.json({ success: true, records });
    }

    // If patient is requesting, return their own records
    const records = await HealthRecord.find({ userId: userId });
    res.json({ success: true, records });
  } catch (error) {
    console.error('Failed to fetch records:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch records' });
  }
};

export const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({});
    res.json({ success: true, medicines });
  } catch (error) {
    console.error('Failed to fetch medicines:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch medicines' });
  }
};

export const placeMedicineOrder = async (req, res) => {
  const userId = req.user._id;

  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain items.' });
    }

    const orderItems = items.map(item => ({
        medicineId: item.id || item._id || item.medicineId,
        name: item.name,
        quantity: item.quantity,
        price: item.price
    }));

    const order = await MedicineOrder.create({ medicines: orderItems, userId: userId });
    res.status(201).json({ success: true, orderId: order._id });
  } catch (error) {
    console.error('Order failed:', error);
    res.status(500).json({ success: false, message: 'Order failed' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await MedicineOrder.findById(req.params.id).populate('userId', 'name email');
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }
    // Verify user owns this order
    if (order.userId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.json({ success: true, order });
  } catch (error) {
    console.error('Fetch order failed:', error);
    res.status(500).json({ success: false, message: 'Fetch order failed' });
  }
};

export const processMedicinePayment = async (req, res) => {
  try {
    const { orderId, method, amount, address, upiId } = req.body;
    
    const order = await MedicineOrder.findById(orderId);
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Verify user
    if (order.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Mock payment processing
    // In real app, verify transaction with Razorpay/Stripe using req.body.paymentId

    order.status = 'confirmed';
    order.paymentMethod = method;
    order.amount = amount;
    order.deliveryAddress = address;
    order.paymentDate = new Date();
    
    // Generate mock transaction ID
    order.transactionId = 'TXN' + Math.floor(100000 + Math.random() * 900000);
    
    if (method === 'upi' && upiId) {
        order.upiId = upiId;
    }
    
    // Set estimated delivery date (48 hours from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 2);
    order.deliveryDate = deliveryDate;
    
    await order.save();

    res.json({ success: true, message: 'Payment processed successfully', transactionId: order.transactionId });
  } catch (error) {
    console.error('Payment failed:', error);
    res.status(500).json({ success: false, message: 'Payment failed' });
  }
};

export const getAllOrders = async (req, res) => {
    try {
        // Check if user is admin (assuming role is in req.user)
        // If role check is done in middleware, this can be skipped
        // But double check is good
        /* 
        if (req.user.role !== 'admin') {
             return res.status(403).json({ success: false, message: 'Access denied' });
        } 
        */
        
        const orders = await MedicineOrder.find({})
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
            
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Fetch all orders failed:', error);
        res.status(500).json({ success: false, message: 'Fetch all orders failed' });
    }
};