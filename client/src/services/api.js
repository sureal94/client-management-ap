const API_BASE_URL = '/api';

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
      } else {
        errorMessage = `Request failed with status ${response.status}`;
      }
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const fetchProducts = () => {
  return fetch(`${API_BASE_URL}/products`).then(handleResponse);
};

export const createProduct = (product) => {
  return fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  }).then(handleResponse);
};

export const updateProduct = (id, product) => {
  return fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  }).then(handleResponse);
};

export const deleteProduct = (id) => {
  return fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
  }).then(handleResponse);
};

export const fetchClients = () => {
  return fetch(`${API_BASE_URL}/clients`).then(handleResponse);
};

export const createClient = (client) => {
  return fetch(`${API_BASE_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  }).then(handleResponse);
};

export const updateClient = (id, client) => {
  return fetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  }).then(handleResponse);
};

export const deleteClient = (id) => {
  return fetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'DELETE',
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

export const bulkImportProducts = (products) => {
  return fetch(`${API_BASE_URL}/products/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products }),
  }).then(handleResponse);
};

export const bulkImportClients = (clients) => {
  return fetch(`${API_BASE_URL}/clients/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clients }),
  }).then(handleResponse);
};

// Document API functions
export const fetchAllDocuments = () => {
  return fetch(`${API_BASE_URL}/documents`).then(handleResponse);
};

export const fetchClientDocuments = (clientId) => {
  return fetch(`${API_BASE_URL}/documents/client/${clientId}`).then(handleResponse);
};

export const fetchPersonalDocuments = () => {
  return fetch(`${API_BASE_URL}/documents/personal`).then(handleResponse);
};

export const uploadClientDocument = (clientId, file) => {
  const formData = new FormData();
  // Append file with explicit filename to ensure UTF-8 encoding
  // The browser will automatically encode the filename in the Content-Disposition header
  formData.append('file', file, file.name);
  return fetch(`${API_BASE_URL}/documents/client/${clientId}`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
  }).then(handleResponse);
};

export const uploadPersonalDocument = (file) => {
  const formData = new FormData();
  // Append file with explicit filename to ensure UTF-8 encoding
  formData.append('file', file, file.name);
  
  return fetch(`${API_BASE_URL}/documents/personal`, {
    method: 'POST',
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
  }).then(handleResponse);
};

export const getDocumentDownloadUrl = (id) => {
  return `${API_BASE_URL}/documents/download/${id}`;
};

