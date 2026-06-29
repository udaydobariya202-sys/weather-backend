const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn('Warning: SUPABASE_URL is not set in the environment variables.');
}

if (!supabaseServiceRoleKey && !supabaseAnonKey) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is not set.');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || supabaseAnonKey || 'placeholder'
);

const unwrapSingle = (response) => {
  const { data, error } = response;
  if (error) {
    throw error;
  }
  return data;
};

// Profiles helpers
async function getUserByGoogleId(googleId) {
  const response = await supabase
    .from('profiles')
    .select('*')
    .eq('google_id', googleId)
    .maybeSingle();

  return unwrapSingle(response);
}

async function getUserByEmail(email) {
  const response = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  return unwrapSingle(response);
}

async function getUserById(userId) {
  const response = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return unwrapSingle(response);
}

async function createUser(userData) {
  const payload = {
    google_id: userData.google_id ?? null,
    email: userData.email,
    name: userData.name ?? null,
    avatar_url: userData.avatar_url ?? null,
    company_name: userData.company_name ?? null,
    diesel_price: userData.diesel_price ?? null,
    last_active: userData.last_active ?? new Date().toISOString(),
    is_admin: userData.is_admin ?? false,
  };

  const response = await supabase
    .from('profiles')
    .insert(payload)
    .select()
    .single();

  return unwrapSingle(response);
}

async function updateUser(userId, updates) {
  const response = await supabase
    .from('profiles')
    .update({
      ...updates,
      last_active: updates.last_active ?? new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  return unwrapSingle(response);
}

async function getAllUsers() {
  const response = await supabase
    .from('profiles')
    .select('id, email, name, company_name, avatar_url, is_admin, created_at, last_active')
    .order('created_at', { ascending: false });

  return unwrapSingle(response) || [];
}

// Contacts helpers
async function getContactsByUserId(userId) {
  const response = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return unwrapSingle(response) || [];
}

async function getContactById(contactId) {
  const response = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  return unwrapSingle(response);
}

async function getAllContacts() {
  const response = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });

  return unwrapSingle(response) || [];
}

async function createContact(contactData) {
  const response = await supabase
    .from('contacts')
    .insert(contactData)
    .select()
    .single();

  return unwrapSingle(response);
}

async function updateContact(contactId, updates) {
  const response = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single();

  return unwrapSingle(response);
}

async function deleteContact(contactId) {
  const response = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);

  unwrapSingle(response);
  return true;
}

// Tools helpers
async function getToolsByUserId(userId) {
  const response = await supabase
    .from('tools')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return unwrapSingle(response) || [];
}

async function getToolById(toolId) {
  const response = await supabase
    .from('tools')
    .select('*')
    .eq('id', toolId)
    .single();

  return unwrapSingle(response);
}

async function getAllTools() {
  const response = await supabase
    .from('tools')
    .select('*')
    .order('created_at', { ascending: false });

  return unwrapSingle(response) || [];
}

async function createTool(toolData) {
  const response = await supabase
    .from('tools')
    .insert(toolData)
    .select()
    .single();

  return unwrapSingle(response);
}

async function updateTool(toolId, updates) {
  const response = await supabase
    .from('tools')
    .update(updates)
    .eq('id', toolId)
    .select()
    .single();

  return unwrapSingle(response);
}

async function deleteTool(toolId) {
  const response = await supabase
    .from('tools')
    .delete()
    .eq('id', toolId);

  unwrapSingle(response);
  return true;
}

// Invoices helpers
async function getInvoicesByUserId(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const response = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return unwrapSingle(response) || [];
}

async function getInvoiceById(invoiceId) {
  const response = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items (*)
    `)
    .eq('id', invoiceId)
    .single();

  return unwrapSingle(response);
}

async function getNextInvoiceNumber(userId) {
  const response = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  const data = unwrapSingle(response) || [];
  if (data.length > 0) {
    const lastNumber = data[0].invoice_number || '#INV-000';
    const num = parseInt(String(lastNumber).replace('#INV-', ''), 10) || 0;
    return `#INV-${String(num + 1).padStart(3, '0')}`;
  }

  return '#INV-001';
}

async function createInvoice(invoiceData) {
  const response = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single();

  return unwrapSingle(response);
}

async function updateInvoice(invoiceId, updates) {
  const response = await supabase
    .from('invoices')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .select()
    .single();

  return unwrapSingle(response);
}

async function deleteInvoice(invoiceId) {
  const response = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  unwrapSingle(response);
  return true;
}

async function updateInvoiceStatus(invoiceId, status) {
  const response = await supabase
    .from('invoices')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .select()
    .single();

  return unwrapSingle(response);
}

// Invoice items helpers
async function createInvoiceItem(itemData) {
  const response = await supabase
    .from('invoice_items')
    .insert(itemData)
    .select()
    .single();

  return unwrapSingle(response);
}

async function createInvoiceItems(itemsData) {
  const response = await supabase
    .from('invoice_items')
    .insert(itemsData)
    .select();

  return unwrapSingle(response) || [];
}

async function deleteInvoiceItemsByInvoiceId(invoiceId) {
  const response = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId);

  unwrapSingle(response);
  return true;
}

async function getAllInvoices() {
  const response = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items (*),
      profiles (
        email,
        name,
        company_name,
        is_admin
      )
    `)
    .order('created_at', { ascending: false });

  return unwrapSingle(response) || [];
}

async function getAnalyticsOverview(userId) {
  const invoicesQuery = supabase
    .from('invoices')
    .select('total_amount, paid_amount, pending_amount, status, created_at');
  const contactsQuery = supabase.from('contacts').select('id');
  const toolsQuery = supabase.from('tools').select('id');
  const recentInvoicesQuery = supabase
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
    .order('created_at', { ascending: false })
    .limit(5);
  const monthlyRevenueQuery = supabase
    .from('invoices')
    .select('total_amount, created_at')
    .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())
    .order('created_at', { ascending: true });

  if (userId) {
    invoicesQuery.eq('user_id', userId);
    contactsQuery.eq('user_id', userId);
    toolsQuery.eq('user_id', userId);
    recentInvoicesQuery.eq('user_id', userId);
    monthlyRevenueQuery.eq('user_id', userId);
  }

  const invoicesResponse = await invoicesQuery;
  const contactsResponse = await contactsQuery;
  const toolsResponse = await toolsQuery;
  const recentInvoicesResponse = await recentInvoicesQuery;
  const monthlyRevenueResponse = await monthlyRevenueQuery;

  const invoices = unwrapSingle(invoicesResponse) || [];
  const contacts = unwrapSingle(contactsResponse) || [];
  const tools = unwrapSingle(toolsResponse) || [];
  const recentInvoices = unwrapSingle(recentInvoicesResponse) || [];
  const monthlyRevenue = unwrapSingle(monthlyRevenueResponse) || [];

  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
  const collectedAmount = invoices.reduce(
    (sum, inv) => sum + (inv.status === 'paid' ? Number(inv.paid_amount) || 0 : 0),
    0
  );
  const pendingAmount = invoices.reduce(
    (sum, inv) => sum + (inv.status === 'pending' ? Number(inv.pending_amount) || 0 : 0),
    0
  );
  const totalContacts = contacts.length;
  const totalTools = tools.length;

  const monthlyRevenueGrouped = {};
  monthlyRevenue.forEach((inv) => {
    const month = new Date(inv.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyRevenueGrouped[month] = (monthlyRevenueGrouped[month] || 0) + (Number(inv.total_amount) || 0);
  });

  const monthlyRevenueArray = Object.keys(monthlyRevenueGrouped).map((month) => ({
    month,
    revenue: monthlyRevenueGrouped[month],
  }));

  const statusDistribution = {
    paid: invoices.filter((inv) => inv.status === 'paid').length,
    pending: invoices.filter((inv) => inv.status === 'pending').length,
    overdue: invoices.filter((inv) => inv.status === 'overdue').length,
  };

  return {
    totalInvoices,
    totalRevenue,
    collectedAmount,
    pendingAmount,
    totalContacts,
    totalTools,
    recentInvoices,
    monthlyRevenue: monthlyRevenueArray,
    statusDistribution,
  };
}

async function logAnalyticsEvent(userId, eventType, metadata = {}) {
  const { error } = await supabase
    .from('analytics_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      metadata,
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
  getAllUsers,
  getContactsByUserId,
  getContactById,
  getAllContacts,
  createContact,
  updateContact,
  deleteContact,
  getToolsByUserId,
  getToolById,
  getAllTools,
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
  getAllInvoices,
  getAnalyticsOverview,
  logAnalyticsEvent,
};
