import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Plus, Phone, Mail, Search, Download, MessageCircle } from 'lucide-react';
import { fetchClients, createClient, updateClient, deleteClient, fetchProducts } from '../services/api';
import ClientModal from '../components/ClientModal';
import Fuse from 'fuse.js';
import * as XLSX from 'xlsx';

// WhatsApp icon component
const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const ClientsPage = () => {
  const { t } = useI18n();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, productsData] = await Promise.all([
        fetchClients(),
        fetchProducts(),
      ]);
      setClients(clientsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fuse = new Fuse(clients, {
    keys: ['name', 'email', 'phone'],
    threshold: 0.3,
  });

  const filteredClients = searchTerm
    ? fuse.search(searchTerm).map(item => item.item)
    : clients;

  const handleAdd = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleSave = async (clientData) => {
    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, clientData);
        setClients(clients.map(c => c.id === editingClient.id ? updated : c));
      } else {
        const newClient = await createClient(clientData);
        setClients([...clients, newClient]);
      }
      setIsModalOpen(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(id);
        setClients(clients.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Failed to delete client');
      }
    }
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email) => {
    window.location.href = `mailto:${email}`;
  };

  const handleWhatsApp = (phone) => {
    if (!phone) {
      alert(t('noPhoneForWhatsApp') || 'No phone number available for this client.');
      return;
    }
    // Clean the phone number - remove spaces, dashes, parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    // Remove leading zeros and add country code if needed
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
      // Assume Israeli number if starts with 0, replace with +972
      formattedPhone = '972' + formattedPhone.substring(1);
    }
    // Remove + if present (wa.me doesn't need it)
    formattedPhone = formattedPhone.replace(/^\+/, '');
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const handleExport = (format) => {
    const data = filteredClients.map(c => ({
      [t('clientName')]: c.name,
      [t('phone')]: c.phone,
      [t('email')]: c.email,
      [t('pc')]: c.pc || '',
      [t('lastContacted')]: c.lastContacted || '',
      [t('notes')]: c.notes || '',
      [t('attachedProducts')]: c.productIds?.join(', ') || '',
    }));

    if (format === 'csv') {
      const csv = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');
      // Add UTF-8 BOM for Hebrew/Unicode support in Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients.${format}`;
      a.click();
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');
      XLSX.writeFile(wb, `clients.${format}`, { bookType: 'xlsx', type: 'binary' });
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-black">{t('clients')}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('addClient')}
            </button>
            <div className="relative group">
              <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2">
                <Download className="w-5 h-5" />
                {t('export')}
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {t('exportAsCSV')}
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {t('exportAsXLSX')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 rtl:right-3 rtl:left-auto" />
            <input
              type="text"
              placeholder={t('searchClients')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent rtl:pr-10 rtl:pl-4"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('clientName')}
              </th>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('phone')}
              </th>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('email')}
              </th>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pc')}
              </th>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('lastContacted')}
              </th>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  {t('noClients')}
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr 
                  key={client.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEdit(client)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.pc || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.lastContacted
                      ? new Date(client.lastContacted).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2 rtl:flex-row-reverse">
                      {client.phone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(client.phone);
                          }}
                          className="text-primary hover:text-orange-600"
                          title={t('call')}
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                      )}
                      {client.phone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(client.phone);
                          }}
                          className="text-green-600 hover:text-green-700"
                          title={t('whatsapp') || 'WhatsApp'}
                        >
                          <WhatsAppIcon className="w-5 h-5" />
                        </button>
                      )}
                      {client.email && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmail(client.email);
                          }}
                          className="text-primary hover:text-orange-600"
                          title={t('email')}
                        >
                          <Mail className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ClientModal
          client={editingClient}
          clients={clients}
          products={products}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => {
            setIsModalOpen(false);
            setEditingClient(null);
          }}
        />
      )}
    </div>
  );
};

export default ClientsPage;



