const express = require('express');
const Record = require('../models/Record');
const Policy = require('../models/Policy');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// USER: Create a record
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const record = new Record({
      title,
      content,
      category,
      owner: req.user.userId
    });
    await record.save();
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// USER: Get own records
router.get('/my-records', auth, async (req, res) => {
  try {
    const records = await Record.find({ owner: req.user.userId }).sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// USER: Update an ACTIVE record (Archived records cannot be edited)
router.put('/:id', auth, async (req, res) => {
  try {
    const record = await Record.findOne({ _id: req.params.id, owner: req.user.userId });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    if (record.status === 'ARCHIVED') return res.status(403).json({ error: 'Archived records cannot be edited' });

    const { title, content, category } = req.body;
    record.title = title || record.title;
    record.content = content || record.content;
    record.category = category || record.category;

    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Get all records (for reporting)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const records = await Record.find().populate('owner', 'username').sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Get records nearing expiry (e.g., expiring within next 3 days)
router.get('/nearing-expiry', adminAuth, async (req, res) => {
  try {
    const policies = await Policy.find();
    const activeRecords = await Record.find({ status: 'ACTIVE' }).populate('owner', 'username');
    
    const nearingExpiry = [];
    const now = new Date();

    for (const record of activeRecords) {
      const policy = policies.find(p => p.category === record.category);
      if (policy) {
        const expiryDate = new Date(record.createdAt);
        expiryDate.setDate(expiryDate.getDate() + policy.retentionDays);
        
        const timeDiff = expiryDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysLeft > 0 && daysLeft <= 3) {
          nearingExpiry.push({ ...record.toObject(), daysLeft, expiryDate });
        }
      }
    }
    
    res.json(nearingExpiry);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
