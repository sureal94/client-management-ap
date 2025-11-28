import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nContext';
import Layout from './components/Layout';
import ProductsPage from './pages/ProductsPage';
import ClientsPage from './pages/ClientsPage';
import ImportPage from './pages/ImportPage';
import DocumentsPage from './pages/DocumentsPage';

function App() {
  try {
    return (
      <I18nProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<ProductsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/import" element={<ImportPage />} />
            </Routes>
          </Layout>
        </Router>
      </I18nProvider>
    );
  } catch (error) {
    console.error('Error in App component:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error Loading App</h1>
        <p>{error.message}</p>
        <p>Check the browser console for more details.</p>
      </div>
    );
  }
}

export default App;




