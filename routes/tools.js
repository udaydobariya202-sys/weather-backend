const express = require('express');
const router = express.Router();
const { requireAuth } = require('../lib/auth');
const {
  getToolsByUserId,
  createTool,
  updateTool,
  deleteTool
} = require('../lib/supabase');

/**
 * GET /api/tools
 * Get all tools for authenticated user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const tools = await getToolsByUserId(userId);

    res.json({
      success: true,
      data: tools,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/tools
 * Create a new tool
 * Body: { name, rate, rate_type }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, rate, rate_type } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'name is required',
        timestamp: new Date().toISOString()
      });
    }

    if (!rate || isNaN(parseFloat(rate))) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'rate is required and must be a number',
        timestamp: new Date().toISOString()
      });
    }

    const toolData = {
      user_id: userId,
      name,
      rate: parseFloat(rate),
      rate_type: rate_type || 'hr'
    };

    const tool = await createTool(toolData);

    res.status(201).json({
      success: true,
      data: tool,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating tool:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/tools/:id
 * Update a tool
 * Body: { name, rate, rate_type }
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const toolId = req.params.id;
    const { name, rate, rate_type } = req.body;

    // Check if tool exists and belongs to user
    const tools = await getToolsByUserId(userId);
    const tool = tools.find(t => t.id === toolId);

    if (!tool) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Tool not found',
        timestamp: new Date().toISOString()
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (rate !== undefined) updates.rate = parseFloat(rate);
    if (rate_type !== undefined) updates.rate_type = rate_type;

    const updatedTool = await updateTool(toolId, updates);

    res.json({
      success: true,
      data: updatedTool,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/tools/:id
 * Delete a tool
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const toolId = req.params.id;

    // Check if tool exists and belongs to user
    const tools = await getToolsByUserId(userId);
    const tool = tools.find(t => t.id === toolId);

    if (!tool) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Tool not found',
        timestamp: new Date().toISOString()
      });
    }

    await deleteTool(toolId);

    res.json({
      success: true,
      data: { message: 'Tool deleted successfully' },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
