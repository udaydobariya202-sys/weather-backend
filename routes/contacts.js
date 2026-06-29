const express = require('express');
const router = express.Router();
const { requireAuth } = require('../lib/auth');
const {
  getContactsByUserId,
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact
} = require('../lib/supabase');

/**
 * GET /api/contacts
 * Get all contacts for authenticated user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const contacts = isAdmin ? await getAllContacts() : await getContactsByUserId(userId);

    res.json({
      success: true,
      data: contacts,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/contacts
 * Create a new contact
 * Body: { name, mobile, village }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, mobile, village } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'name is required',
        timestamp: new Date().toISOString()
      });
    }

    const contactData = {
      user_id: userId,
      name,
      mobile: mobile || null,
      village: village || null
    };

    const contact = await createContact(contactData);

    res.status(201).json({
      success: true,
      data: contact,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/contacts/:id
 * Update a contact
 * Body: { name, mobile, village }
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const contactId = req.params.id;
    const { name, mobile, village } = req.body;

    const contact = await getContactById(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Contact not found',
        timestamp: new Date().toISOString()
      });
    }

    if (!isAdmin && contact.user_id !== userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (mobile !== undefined) updates.mobile = mobile;
    if (village !== undefined) updates.village = village;

    const updatedContact = await updateContact(contactId, updates);

    res.json({
      success: true,
      data: updatedContact,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const contactId = req.params.id;

    const contact = await getContactById(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Contact not found',
        timestamp: new Date().toISOString()
      });
    }

    if (!isAdmin && contact.user_id !== userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    await deleteContact(contactId);

    res.json({
      success: true,
      data: { message: 'Contact deleted successfully' },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
