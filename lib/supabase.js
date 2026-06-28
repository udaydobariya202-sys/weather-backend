const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Warning: SUPABASE_URL and SUPABASE_ANON_KEY are not set in the environment variables.');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

// Users table helpers
async function getUserByGoogleId(googleId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('google_id', googleId)
    .maybeSingle();

  if (error) {
    console.error('Error in getUserByGoogleId:', error);
    throw error;
  }
  return data;
}

async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Error in getUserByEmail:', error);
    throw error;
  }
  return data;
}

async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
  return data;
}

async function createUser(userData) {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
  return data;
}

async function updateUser(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, last_active: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error in updateUser:', error);
    throw error;
  }
  return data;
}

// Contacts table helpers
async function getContactsByUserId(userId) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error in getContactsByUserId:', error);
    throw error;
  }
  return data;
}

async function createContact(contactData) {
  const { data, error } = await supabase
    .from('contacts')
    .insert(contactData)
    .select()
    .single();

  if (error) {
    console.error('Error in createContact:', error);
    throw error;
  }
  return data;
}

async function updateContact(contactId, updates) {
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single();

  if (error) {
    console.error('Error in updateContact:', error);
    throw error;
  }
  return data;
}

async function deleteContact(contactId) {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);

  if (error) {
    console.error('Error in deleteContact:', error);
    throw error;
  }
  return true;
}

// Tools table helpers
async function getToolsByUserId(userId) {
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error in getToolsByUserId:', error);
    throw error;
  }
  return data;
}

async function createTool(toolData) {
  const { data, error } = await supabase
    .from('tools')
    .insert(toolData)
    .select()
    .single();

  if (error) {
    console.error('Error in createTool:', error);
    throw error;
  }
  return data;
}

async function updateTool(toolId, updates) {
  const { data, error } = await supabase
    .from('tools')
    .update(updates)
    .eq('id', toolId)
    .select()
    .single();

  if (error) {
    console.error('Error in updateTool:', error);
    throw error;
  }
  return data;
}

async function deleteTool(toolId) {
  const { error } = await supabase
    .from('tools')
    .delete()
    .eq('id', toolId);

  if (error) {
    console.error('Error in deleteTool:', error);
    throw error;
  }
  return true;
}

// Invoices table helpers
async function getInvoicesByUserId(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error in getInvoicesByUserId:', error);
    throw error;
  }
  return data;
}

async function getInvoiceById(invoiceId) {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items (*)
    `)
    .eq('id', invoiceId)
    .single();

  if (error) {
    console.error('Error in getInvoiceById:', error);
    throw error;
  }
  return data;
}

async function getNextInvoiceNumber(userId) {
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error in getNextInvoiceNumber:', error);
    throw error;
  }

  if (data && data.length > 0) {
    const lastNumber = data[0].invoice_number;
    const num = parseInt(lastNumber.replace('#INV-', '')) || 0;
    const nextNum = num + 1;
    return `#INV-${String(nextNum).padStart(3, '0')}`;
  }

  return '#INV-001';
}

async function createInvoice(invoiceData) {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single();

  if (error) {
    console.error('Error in createInvoice:', error);
    throw error;
  }
  return data;
}

async function updateInvoice(invoiceId, updates) {
  const { data, error } = await supabase
    .from('invoices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) {
    console.error('Error in updateInvoice:', error);
    throw error;
  }
  return data;
}

async function deleteInvoice(invoiceId) {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  if (error) {
    console.error('Error in deleteInvoice:', error);
    throw error;
  }
  return true;
}

async function updateInvoiceStatus(invoiceId, status) {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) {
    console.error('Error in updateInvoiceStatus:', error);
    throw error;
  }
  return data;
}

// Invoice items helpers
async function createInvoiceItem(itemData) {
  const { data, error } = await supabase
    .from('invoice_items')
    .insert(itemData)
    .select()
    .single();

  if (error) {
    console.error('Error in createInvoiceItem:', error);
    throw error;
  }
  return data;
}

async function createInvoiceItems(itemsData) {
  const { data, error } = await supabase
    .from('invoice_items')
    .insert(itemsData)
    .select();

  if (error) {
    console.error('Error in createInvoiceItems:', error);
    throw error;
  }
  return data;
}

async function deleteInvoiceItemsByInvoiceId(invoiceId) {
  const { error } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId);

  if (error) {
    console.error('Error in deleteInvoiceItemsByInvoiceId:', error);
    throw error;
  }
  return true;
}

// Analytics helpers
async function getAnalyticsOverview(userId) {
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('total_amount, paid_amount, pending_amount, status, created_at')
    .eq('user_id', userId);

  if (invoicesError) {
    console.error('Error in getAnalyticsOverview (invoices):', invoicesError);
    throw invoicesError;
  }

  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', userId);

  if (contactsError) {
    console.error('Error in getAnalyticsOverview (contacts):', contactsError);
    throw contactsError;
  }

  const { data: tools, error: toolsError } = await supabase
    .from('tools')
    .select('id')
    .eq('user_id', userId);

  if (toolsError) {
    console.error('Error in getAnalyticsOverview (tools):', toolsError);
    throw toolsError;
  }

  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
  const collectedAmount = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (parseFloat(inv.paid_amount) || 0), 0);
  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + (parseFloat(inv.pending_amount) || 0), 0);
  const totalContacts = contacts.length;
  const totalTools = tools.length;

  const recentInvoices = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      farmer_name,
      farmer_village,
      total_amount,
      status,
      invoice_date
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  const monthlyRevenue = await supabase
    .from('invoices')
    .select('total_amount, created_at')
    .eq('user_id', userId)
    .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())
    .order('created_at', { ascending: true });

  const monthlyRevenueGrouped = {};
  (monthlyRevenue.data || []).forEach(inv => {
    const month = new Date(inv.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!monthlyRevenueGrouped[month]) {
      monthlyRevenueGrouped[month] = 0;
    }
    monthlyRevenueGrouped[month] += parseFloat(inv.total_amount) || 0;
  });

  const monthlyRevenueArray = Object.keys(monthlyRevenueGrouped).map(month => ({
    month,
    revenue: monthlyRevenueGrouped[month]
  }));

  return {
    totalInvoices,
    totalRevenue,
    collectedAmount,
    pendingAmount,
    totalContacts,
    totalTools,
    recentInvoices: recentInvoices.data || [],
    monthlyRevenue: monthlyRevenueArray
  };
}

async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, company_name, created_at, last_active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
  return data;
}

async function getAllInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      users (
        email,
        name,
        company_name
      ),
      contacts (
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error in getAllInvoices:', error);
    throw error;
  }
  return data;
}

async function logAnalyticsEvent(userId, eventType, metadata = {}) {
  const { error } = await supabase
    .from('analytics_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      metadata
    });

  if (error) {
    console.error('Error in logAnalyticsEvent:', error);
  }
}

module.exports = {
  supabase,
  getUserByGoogleId,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getContactsByUserId,
  createContact,
  updateContact,
  deleteContact,
  getToolsByUserId,
  createTool,
  updateTool,
  deleteTool,
  getInvoicesByUserId,
  getInvoiceById,
  getNextInvoiceNumber,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  createInvoiceItem,
  createInvoiceItems,
  deleteInvoiceItemsByInvoiceId,
  getAnalyticsOverview,
  getAllUsers,
  getAllInvoices,
  logAnalyticsEvent
};
