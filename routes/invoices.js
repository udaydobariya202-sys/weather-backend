const express = require('express');
const router = express.Router();
const { requireAuth } = require('../lib/auth');
const {
  getInvoicesByUserId,
  getAllInvoices,
  getInvoiceById,
  getNextInvoiceNumber,
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
    const isAdmin = req.user.role === 'admin';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const invoices = isAdmin ? await getAllInvoices() : await getInvoicesByUserId(userId, page, limit);

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
 * Body: { farmer_name, farmer_mobile, farmer_village, items: [{ tool_name, area_bigha, rate, amount }], diesel_charge, discount, subtotal, total_amount, invoice_date, status }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      farmer_name, 
      farmer_mobile, 
      farmer_village, 
      items, 
      diesel_charge, 
      discount, 
      subtotal, 
      total_amount, 
      invoice_date, 
      status 
    } = req.body;

    if (!farmer_name) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'farmer_name is required',
        timestamp: new Date().toISOString()
      });
    }

    // Auto-generate invoice number
    const invoice_number = await getNextInvoiceNumber(userId);

    const invoiceData = {
      user_id: userId,
      invoice_number,
      farmer_name,
      farmer_mobile: farmer_mobile || null,
      farmer_village: farmer_village || null,
      subtotal: subtotal || 0,
      diesel_charge: diesel_charge || 0,
      discount: discount || 0,
      total_amount: total_amount || 0,
      paid_amount: status === 'paid' ? total_amount || 0 : 0,
      pending_amount: status === 'paid' ? 0 : total_amount || 0,
      status: status || 'pending',
      invoice_date: invoice_date || new Date().toISOString().split('T')[0]
    };

    const invoice = await createInvoice(invoiceData);

    // Create invoice items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const itemsData = items.map(item => ({
        invoice_id: invoice.id,
        tool_name: item.tool_name,
        area_bigha: item.area_bigha || 0,
        rate: item.rate || 0,
        amount: item.amount || 0
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
    const isAdmin = req.user.role === 'admin';
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

    // Verify user owns this invoice unless admin
    if (!isAdmin && invoice.user_id !== userId) {
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
 * Body: { farmer_name, farmer_mobile, farmer_village, items: [{ tool_name, area_bigha, rate, amount }], diesel_charge, discount, subtotal, total_amount, invoice_date, status }
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const invoiceId = req.params.id;
    const { 
      farmer_name, 
      farmer_mobile, 
      farmer_village, 
      items, 
      diesel_charge, 
      discount, 
      subtotal, 
      total_amount, 
      invoice_date, 
      status 
    } = req.body;

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

    if (!isAdmin && existingInvoice.user_id !== userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    const updates = {};
    if (farmer_name !== undefined) updates.farmer_name = farmer_name;
    if (farmer_mobile !== undefined) updates.farmer_mobile = farmer_mobile;
    if (farmer_village !== undefined) updates.farmer_village = farmer_village;
    if (diesel_charge !== undefined) updates.diesel_charge = diesel_charge;
    if (discount !== undefined) updates.discount = discount;
    if (subtotal !== undefined) updates.subtotal = subtotal;
    if (total_amount !== undefined) {
      updates.total_amount = total_amount;
      updates.pending_amount = total_amount - (parseFloat(existingInvoice.paid_amount) || 0);
    }
    if (invoice_date !== undefined) updates.invoice_date = invoice_date;
    if (status !== undefined) updates.status = status;

    const updatedInvoice = await updateInvoice(invoiceId, updates);

    // Update invoice items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await deleteInvoiceItemsByInvoiceId(invoiceId);

      // Create new items
      if (items.length > 0) {
        const itemsData = items.map(item => ({
          invoice_id: invoiceId,
          tool_name: item.tool_name,
          area_bigha: item.area_bigha || 0,
          rate: item.rate || 0,
          amount: item.amount || 0
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
    const isAdmin = req.user.role === 'admin';
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

    if (!isAdmin && existingInvoice.user_id !== userId) {
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
 * Body: { status }
 */
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const invoiceId = req.params.id;
    const { status } = req.body;

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

    if (!isAdmin && existingInvoice.user_id !== userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    const updates = { status };
    if (status === 'paid') {
      updates.paid_amount = existingInvoice.total_amount;
      updates.pending_amount = 0;
    } else {
      updates.paid_amount = 0;
      updates.pending_amount = existingInvoice.total_amount;
    }

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
