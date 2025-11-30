const API_BASE_URL = '/api';

// Helper to get auth token (checks for adminToken first if in admin mode)
const getAuthToken = () => {
  // Check if we're in admin mode
  const isAdminMode = window.location.pathname.startsWith('/admin');
  if (isAdminMode) {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) return adminToken;
  }
  return localStorage.getItem('token');
};

// Helper to get headers with auth token
const getHeaders = (includeContentType = true) => {
  const headers = {};
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch (e) {
      // If response is not JSON, check status
      if (response.status === 0 || response.status === 503) {
        errorMessage = 'Backend server is not running. Please start the server on port 5000.';
      } else if (response.status === 404) {
        errorMessage = 'API endpoint not found. Make sure the backend server is running.';
      } else if (response.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        errorMessage = `Request failed with status ${response.status}`;
      }
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const fetchProducts = () => {
  return fetch(`${API_BASE_URL}/products`, {
    headers: getHeaders(false)
  }).then(handleResponse);
};

export const createProduct = (product) => {
  return fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(product),
  }).then(handleResponse);
};

export const updateProduct = (id, product) => {
  return fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(product),
  }).then(handleResponse);
};

export const deleteProduct = (id) => {
  return fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false) // Include auth token
  }).then(handleResponse);
};

export const bulkDeleteProducts = (ids) => {
  return fetch(`${API_BASE_URL}/products/bulk-delete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ids }),
  }).then(handleResponse);
};

export const fetchClients = () => {
  return fetch(`${API_BASE_URL}/clients`, {
    headers: getHeaders(false)
  }).then(handleResponse);
};

export const createClient = (client) => {
  return fetch(`${API_BASE_URL}/clients`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(client),
  }).then(handleResponse);
};

export const updateClient = (id, client) => {
  return fetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(client),
  }).then(handleResponse);
};

export const deleteClient = (id) => {
  return fetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false)
  }).then(handleResponse);
};

export const bulkDeleteClients = (ids) => {
  return fetch(`${API_BASE_URL}/clients/bulk-delete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ids }),
  }).then(handleResponse);
};

export const uploadCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${API_BASE_URL}/import/csv`, {
    method: 'POST',
    body: formData,
  }).then(handleResponse);
};

export const uploadPDF = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${API_BASE_URL}/import/pdf`, {
    method: 'POST',
    body: formData,
  }).then(handleResponse);
};

export const uploadXLSX = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${API_BASE_URL}/import/xlsx`, {
    method: 'POST',
    body: formData,
  }).then(handleResponse);
};

export const bulkImportProducts = (products, assignToUserId = null, fileName = null, fileSize = null, fileType = null) => {
  return fetch(`${API_BASE_URL}/products/bulk`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ 
      products,
      assignToUserId,
      fileName,
      fileSize,
      fileType
    }),
  }).then(handleResponse);
};

export const bulkImportClients = (clients, assignToUserId = null, fileName = null, fileSize = null, fileType = null) => {
  return fetch(`${API_BASE_URL}/clients/bulk`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ 
      clients,
      assignToUserId,
      fileName,
      fileSize,
      fileType
    }),
  }).then(handleResponse);
};

// Document API functions
export const fetchAllDocuments = () => {
  return fetch(`${API_BASE_URL}/documents`, {
    headers: getHeaders(false)
  }).then(handleResponse);
};

export const fetchClientDocuments = (clientId) => {
  return fetch(`${API_BASE_URL}/documents/client/${clientId}`, {
    headers: getHeaders(false)
  }).then(handleResponse);
};

export const fetchPersonalDocuments = () => {
  return fetch(`${API_BASE_URL}/documents/personal`, {
    headers: getHeaders(false)
  }).then(handleResponse);
};

export const uploadClientDocument = (clientId, file) => {
  const formData = new FormData();
  // Append file with explicit filename to ensure UTF-8 encoding
  // The browser will automatically encode the filename in the Content-Disposition header
  formData.append('file', file, file.name);
  
  const headers = {};
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(`${API_BASE_URL}/documents/client/${clientId}`, {
    method: 'POST',
    headers: headers,
    body: formData,
    // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
  }).then(handleResponse);
};

export const uploadPersonalDocument = (file) => {
  const formData = new FormData();
  // Append file with explicit filename to ensure UTF-8 encoding
  formData.append('file', file, file.name);
  
  const headers = {};
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(`${API_BASE_URL}/documents/personal`, {
    method: 'POST',
    headers: headers,
    body: formData,
    // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
  })
    .then(response => {
      return handleResponse(response);
    })
    .catch(error => {
      // Enhanced error handling for network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Could not connect to server. Make sure the backend server is running on port 5000.');
      }
      throw error;
    });
};

export const deleteDocument = (id) => {
  return fetch(`${API_BASE_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false)
  }).then(handleResponse);
};

export const getDocumentDownloadUrl = (id) => {
  return `${API_BASE_URL}/documents/download/${id}`;
};

// User/Profile API functions
export const getAllUsers = (token) => {
  return fetch(`${API_BASE_URL}/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }).then(handleResponse);
};

export const getUserProfile = (token) => {
  // Add cache-busting to ensure fresh data on each request
  return fetch(`${API_BASE_URL}/users/profile?t=${Date.now()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
  }).then(handleResponse);
};

export const updateUserProfile = (token, updates) => {
  return fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  }).then(handleResponse);
};

export const updateUserEmail = (token, email, password) => {
  return fetch(`${API_BASE_URL}/users/profile/email`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);
};

export const updateUserPassword = (token, currentPassword, newPassword) => {
  return fetch(`${API_BASE_URL}/users/profile/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  }).then(handleResponse);
};

export const uploadProfilePicture = (token, file) => {
  const formData = new FormData();
  formData.append('picture', file);

  return fetch(`${API_BASE_URL}/users/profile/picture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  }).then(handleResponse);
};

export const deleteUserProfile = (token) => {
  return fetch(`${API_BASE_URL}/users/profile`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }).then(handleResponse);
};

// Admin API functions
export const adminLogin = (email, password) => {
  return fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);
};

export const adminChangePassword = (token, currentPassword, newPassword) => {
  return fetch(`${API_BASE_URL}/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  }).then(handleResponse);
};

export const getAdminDashboard = (token) => {
  return fetch(`${API_BASE_URL}/admin/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }).then(handleResponse);
};

export const getAdminUsers = (token) => {
  return fetch(`${API_BASE_URL}/admin/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }).then(handleResponse);
};

export const resetUserPassword = (token, userId, newPassword) => {
  return fetch(`${API_BASE_URL}/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword }),
  }).then(handleResponse);
};

export const adminUpdateUserEmail = (token, userId, email) => {
  return fetch(`${API_BASE_URL}/admin/users/${userId}/email`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  }).then(handleResponse);
};

export const toggleUserStatus = (token, userId, isActive) => {
  return fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ isActive }),
  }).then(handleResponse);
};

export const deleteUser = (token, userId) => {
  return fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }).then(handleResponse);
};

export const assignClientToUser = (token, clientId, userId) => {
  return fetch(`${API_BASE_URL}/admin/clients/${clientId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  }).then(handleResponse);
};

export const assignProductToUser = (token, productId, userId) => {
  return fetch(`${API_BASE_URL}/admin/products/${productId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  }).then(handleResponse);
};

export const assignDocumentToUser = (token, documentId, userId) => {
  return fetch(`${API_BASE_URL}/admin/documents/${documentId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  }).then(handleResponse);
};

export const requestPasswordReset = (email, phone) => {
  return fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, phone }),
  }).then(handleResponse);
};

export const resetPassword = (token, newPassword) => {
  return fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  }).then(handleResponse);
};

// Import History API
export const getImportHistory = () => {
  return fetch(`${API_BASE_URL}/import-history`, {
    headers: getHeaders(false),
  }).then(handleResponse);
};

export const getImportLog = (id) => {
  return fetch(`${API_BASE_URL}/import-history/${id}`, {
    headers: getHeaders(false),
  }).then(handleResponse);
};

export const deleteImportLog = (id) => {
  return fetch(`${API_BASE_URL}/import-history/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  }).then(handleResponse);
};

export const clearImportHistory = () => {
  return fetch(`${API_BASE_URL}/import-history`, {
    method: 'DELETE',
    headers: getHeaders(false),
  }).then(handleResponse);
};

