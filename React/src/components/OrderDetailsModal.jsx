import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { X } from 'lucide-react';

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
  const { theme } = useContext(ThemeContext);

  if (!isOpen || !order) return null;

  const totalAmount = order.productDetails.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg shadow-xl w-full max-w-lg ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Order Details (Rapport)</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="space-y-4">
          <p><strong>Order ID:</strong> {order._id}</p>
          <p><strong>Tracking ID:</strong> {order.trackingId}</p>
          <p><strong>Client:</strong> {order.customerName}</p>
          <p><strong>Phone:</strong> {order.mobile1}</p>
          <p><strong>Address:</strong> {`${order.address}, ${order.commune}, ${order.wilaya}`}</p>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-2">Services:</h3>
            <ul>
              {order.productDetails.map(item => (
                <li key={item.serviceItem} className="flex justify-between">
                  <span>{item.serviceItem.name || 'Service'}</span>
                  <span>{item.price.toFixed(2)} DZD</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-4 flex justify-between font-bold text-xl">
            <span>Total</span>
            <span>{totalAmount.toFixed(2)} DZD</span>
          </div>

          {order.note && <p><strong>Note:</strong> {order.note}</p>}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal; 