const express = require('express');
const router = express.Router();
const { requireAuth } = require('../lib/auth');
const {
  getInvoicesByUserId,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  createInvoiceItems,
  deleteInvoiceItemsByInvoiceId
} = require('../lib/supabase');

/**
 * GET /api/invoices
 * Get all invoices for authenticated user with pagination
 * Query params: page (default 1), limit (default 20)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const invoices = await getInvoicesByUserId(userId, page, limit);

    res.json({
      success: true,
      data: invoices,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/invoices
 * Create a new invoice
 * Body: { contact_id, invoice_number, status, invoice_date, items: [] }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { contact_id, invoice_number, status, invoice_date, items } = req.body;

    if (!invoice_number) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'invoice_number is required',
        timestamp: new Date().toISOString()
      });
    }

    // Calculate total amount from items
    let totalAmount = 0;
    if (items && Array.isArray(items)) {
      items.forEach(item => {
        const amount = (parseFloat(item.hours) || 0) * (parseFloat(item.rate) || 0);
        totalAmount += amount;
      });
    }

    const invoiceData = {
      user_id: userId,
      contact_id,
      invoice_number,
      status: status || 'pending',
      total_amount: totalAmount,
      paid_amount: 0,
      pending_amount: totalAmount,
      invoice_date: invoice_date || new Date().toISOString().split('T')[0]
    };

    const invoice = await createInvoice(invoiceData);

    // Create invoice items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const itemsData = items.map(item => ({
        invoice_id: invoice.id,
        tool_id: item.tool_id,
        tool_name: item.tool_name,
        hours: item.hours,
        rate: item.rate,
        amount: (parseFloat(item.hours) || 0) * (parseFloat(item.rate) || 0),
        description: item.description
      }));

      await createInvoiceItems(itemsData);
    }

    // Fetch the complete invoice with items
    const completeInvoice = await getInvoiceById(invoice.id);

    res.status(201).json({
      success: true,
      data: completeInvoice,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/invoices/:id
 * Get a single invoice with items
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    const invoice = await getInvoiceById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Invoice not found',
        timestamp: new Date().toISOString()
      });
    }

    // Verify user owns this invoice
    if (invoice.user_id !== userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: invoice,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/invoices/:id
 * Update an invoice
 * Body: { contact_id, invoice_number, status, invoice_date, items }
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;
    const { contact_id, invoice_number, status, invoice_date, items } = req.body;

    // Check if invoice exists and belongs to user
    const existingInvoice = await getInvoiceById(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Invoice not found',
        timestamp: new Date().toISOString()
      });
    }

    if (existingInvoice.user_id !== userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    // Calculate total amount from items
    let totalAmount = 0;
    if (items && Array.isArray(items)) {
      items.forEach(item => {
        const amount = (parseFloat(item.hours) || 0) * (parseFloat(item.rate) || 0);
        totalAmount += amount;
      });
    }

    const updates = {};
    if (contact_id !== undefined) updates.contact_id = contact_id;
    if (invoice_number !== undefined) updates.invoice_number = invoice_number;
    if (status !== undefined) updates.status = status;
    if (invoice_date !== undefined) updates.invoice_date = invoice_date;
    if (totalAmount > 0) {
      updates.total_amount = totalAmount;
      updates.pending_amount = totalAmount - (parseFloat(existingInvoice.paid_amount) || 0);
    }

    const updatedInvoice = await updateInvoice(invoiceId, updates);

    // Update invoice items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await deleteInvoiceItemsByInvoiceId(invoiceId);

      // Create new items
      if (items.length > 0) {
        const itemsData = items.map(item => ({
          invoice_id: invoiceId,
          tool_id: item.tool_id,
          tool_name: item.tool_name,
          hours: item.hours,
          rate: item.rate,
          amount: (parseFloat(item.hours) || 0) * (parseFloat(item.rate) || 0),
          description: item.description
        }));

        await createInvoiceItems(itemsData);
      }
    }

    // Fetch the complete updated invoice
    const completeInvoice = await getInvoiceById(invoiceId);

    res.json({
      success: true,
      data: completeInvoice,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete an invoice
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Check if invoice exists and belongs to user
    const existingInvoice = await getInvoiceById(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Invoice not found',
        timestamp: new Date().toISOString()
      });
    }

    if (existingInvoice.user_id !== userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    await deleteInvoice(invoiceId);

    res.json({
      success: true,
      data: { message: 'Invoice deleted successfully' },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/invoices/:id/status
 * Update invoice status (paid/pending)
 * Body: { status, paid_amount }
 */
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;
    const { status, paid_amount } = req.body;

    if (!status || !['paid', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid status. Must be "paid" or "pending"',
        timestamp: new Date().toISOString()
      });
    }

    // Check if invoice exists and belongs to user
    const existingInvoice = await getInvoiceById(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Invoice not found',
        timestamp: new Date().toISOString()
      });
    }

    if (existingInvoice.user_id !== userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    const updates = { status };
    if (paid_amount !== undefined) {
      updates.paid_amount = parseFloat(paid_amount);
      updates.pending_amount = existingInvoice.total_amount - parseFloat(paid_amount);
    }

    const updatedInvoice = await updateInvoiceStatus(invoiceId, status);
    await updateInvoice(invoiceId, updates);

    // Fetch the complete updated invoice
    const completeInvoice = await getInvoiceById(invoiceId);

    res.json({
      success: true,
      data: completeInvoice,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
