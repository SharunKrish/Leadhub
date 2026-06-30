import axios from 'axios';

// Get leads with optional query parameters (search, filter, pagination)
export const getLeads = async (params = {}) => {
  const response = await axios.get('/api/leads/', { params });
  return response.data;
};

// Create a new lead
export const createLead = async (data) => {
  const response = await axios.post('/api/leads/', data);
  return response.data;
};

// Update an existing lead
export const updateLead = async (id, data) => {
  const response = await axios.put(`/api/leads/${id}/`, data);
  return response.data;
};

// Delete a lead
export const deleteLead = async (id) => {
  const response = await axios.delete(`/api/leads/${id}/`);
  return response.data;
};

// Add a note to a lead
export const createNote = async (leadId, content) => {
  const response = await axios.post('/api/notes/', { lead: leadId, content });
  return response.data;
};

// Delete a note
export const deleteNote = async (noteId) => {
  const response = await axios.delete(`/api/notes/${noteId}/`);
  return response.data;
};

// Fetch dashboard statistics
export const getDashboardStats = async () => {
  const response = await axios.get('/api/dashboard/stats/');
  return response.data;
};

// Upload CSV file to import leads
export const importLeadsCSV = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post('/api/leads/import-csv/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Helper to get Excel export URL
export const getExcelExportUrl = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      searchParams.append(key, params[key]);
    }
  });
  const queryString = searchParams.toString();
  return `/api/leads/export/${queryString ? `?${queryString}` : ''}`;
};
