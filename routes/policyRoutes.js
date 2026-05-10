const express = require('express');
const Policy = require('../models/Policy');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// ADMIN: Define/Update a retention policy
router.post('/', adminAuth, async (req, res) => {
  try {
    const { category, retentionDays } = req.body;
    let policy = await Policy.findOne({ category });
    
    if (policy) {
      policy.retentionDays = retentionDays;
    } else {
      policy = new Policy({ category, retentionDays });
    }
    
    await policy.save();
    res.json(policy);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN/USER: Get all policies
router.get('/', auth, async (req, res) => {
  try {
    const policies = await Policy.find();
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Delete a policy
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Policy.findByIdAndDelete(req.params.id);
    res.json({ message: 'Policy deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
