import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import ServiceItemService from '../services/serviceItemService';
import OrderService from '../services/orderService';
import UserService from '../services/userService'; // Import UserService
import { toast } from 'react-toastify';

const CreateOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const { theme } = useContext(ThemeContext);
  const [formData, setFormData] = useState({
    customerName: '',
    mobile1: '',
    address: '',
    wilaya: '',
    commune: '',
    note: '',
    clientId: '' // Add clientId to formData
  });
  const [serviceItems, setServiceItems] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [users, setUsers] = useState([]); // State for users
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchServiceItems();
      fetchUsers(); // Fetch users when modal opens
    }
  }, [isOpen]);

  const fetchServiceItems = async () => {
    try {
      const response = await ServiceItemService.getAllServiceItems();
      if (response.success) {
        setServiceItems(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch service items');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await UserService.getAllUsers();
      if (response.success) {
        // Filter for clients, or adjust as needed
        const clients = response.data.users.filter(u => u.role === 'CLIENT');
        setUsers(clients);
      }
    } catch (error) {
      toast.error('Failed to fetch clients');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceSelect = (item, isChecked) => {
    if (isChecked) {
      setSelectedServices(prev => [...prev, { serviceItem: item._id, name: item.name, price: item.defaultPrice }]);
    } else {
      setSelectedServices(prev => prev.filter(s => s.serviceItem !== item._id));
    }
  };

  const handlePriceChange = (serviceItemId, newPrice) => {
    setSelectedServices(prev => prev.map(s => 
      s.serviceItem === serviceItemId ? { ...s, price: parseFloat(newPrice) || 0 } : s
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderData = {
        ...formData,
        productDetails: selectedServices.map(({ serviceItem, price }) => ({ serviceItem, price })),
        clientId: formData.clientId,
      };
      const response = await OrderService.createOrder(orderData);
      toast.success('Order created successfully!');
      onSuccess(response.data); // Pass the created order back
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg shadow-xl w-full max-w-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-2xl font-semibold mb-4">Create New Order</h2>
        <form onSubmit={handleSubmit}>
          {/* Form fields for customer info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <select name="clientId" value={formData.clientId} onChange={handleInputChange} className="p-2 rounded border col-span-2" required>
              <option value="">Select a Client</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.username}</option>
              ))}
            </select>
            <input name="customerName" value={formData.customerName} onChange={handleInputChange} placeholder="Customer Name" className="p-2 rounded border" required />
            <input name="mobile1" value={formData.mobile1} onChange={handleInputChange} placeholder="Phone Number" className="p-2 rounded border" required />
            <input name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" className="p-2 rounded border col-span-2" required />
            <input name="wilaya" value={formData.wilaya} onChange={handleInputChange} placeholder="Wilaya" className="p-2 rounded border" required />
            <input name="commune" value={formData.commune} onChange={handleInputChange} placeholder="Commune" className="p-2 rounded border" required />
          </div>
          
          {/* Service selection */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Select Services</h3>
            <div className="max-h-60 overflow-y-auto border rounded p-2">
              {serviceItems.map(item => (
                <div key={item._id} className="flex items-center justify-between p-2">
                  <div>
                    <input
                      type="checkbox"
                      id={`service-${item._id}`}
                      onChange={(e) => handleServiceSelect(item, e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`service-${item._id}`}>{item.name}</label>
                  </div>
                  {selectedServices.some(s => s.serviceItem === item._id) && (
                    <input
                      type="number"
                      value={selectedServices.find(s => s.serviceItem === item._id).price}
                      onChange={(e) => handlePriceChange(item._id, e.target.value)}
                      className="p-1 rounded border w-24"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <textarea name="note" value={formData.note} onChange={handleInputChange} placeholder="Additional Notes" className="p-2 rounded border w-full mb-4"></textarea>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white" disabled={loading}>
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal; 