import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  DollarSign, 
  Download,
  MoreHorizontal,
  Calendar,
  ChevronUp,
  ChevronDown,
  CreditCard,
  Wallet,
  Building,
  Check,
  X
} from 'lucide-react';

const PaymentManagement = () => {
  const { theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('all');
  
  // Sample data for charts
  const paymentMethodData = [
    { name: 'Credit Card', value: 45 },
    { name: 'Bank Transfer', value: 25 },
    { name: 'PayPal', value: 20 },
    { name: 'Other', value: 10 },
  ];
  
  const monthlyPaymentsData = [
    { name: 'Jan', received: 8400, pending: 1200 },
    { name: 'Feb', received: 7200, pending: 1800 },
    { name: 'Mar', received: 9500, pending: 900 },
    { name: 'Apr', received: 8800, pending: 1400 },
    { name: 'May', received: 10200, pending: 800 },
    { name: 'Jun', received: 11500, pending: 600 },
  ];
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  
  const stats = [
    { title: 'Total Payments', value: '13,574,200.00 DZD', change: 15.8, icon: <DollarSign size={20} /> },
    { title: 'Received Payments', value: '11,707,244.00 DZD', change: 12.4, icon: <Check size={20} /> },
    { title: 'Pending Payments', value: '1,862,892.00 DZD', change: -5.2, icon: <CreditCard size={20} /> },
    { title: 'Declined Payments', value: '531,468.00 DZD', change: 2.8, icon: <X size={20} /> },
  ];
  
  const recentPayments = [
    { id: 'PAY-2791', amount: '378,000.00 DZD', status: 'Completed', method: 'Credit Card', date: 'Apr 2, 2025' },
    { id: 'PAY-2790', amount: '129,600.00 DZD', status: 'Pending', method: 'Bank Transfer', date: 'Apr 1, 2025' },
    { id: 'PAY-2789', amount: '86,400.00 DZD', status: 'Completed', method: 'PayPal', date: 'Mar 30, 2025' },
    { id: 'PAY-2788', amount: '226,800.00 DZD', status: 'Completed', method: 'Credit Card', date: 'Mar 28, 2025' },
    { id: 'PAY-2787', amount: '102,600.00 DZD', status: 'Declined', method: 'Credit Card', date: 'Mar 25, 2025' },
  ];

  const getStatusBadge = (status) => {
    let bgColor, textColor;
    
    if (theme === 'dark') {
      if (status === 'Completed') {
        bgColor = 'bg-green-900/30';
        textColor = 'text-green-400';
      } else if (status === 'Pending') {
        bgColor = 'bg-yellow-900/30';
        textColor = 'text-yellow-400';
      } else {
        bgColor = 'bg-red-900/30';
        textColor = 'text-red-400';
      }
    } else {
      if (status === 'Completed') {
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
      } else if (status === 'Pending') {
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
      } else {
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
      }
    }
    
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  const getMethodIcon = (method) => {
    if (method === 'Credit Card') {
      return <CreditCard size={16} />;
    } else if (method === 'Bank Transfer') {
      return <Building size={16} />;
    } else if (method === 'PayPal') {
      return <Wallet size={16} />;
    } else {
      return <DollarSign size={16} />;
    }
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Payment Management</h1>
        <div className="flex gap-2">
          <button className={`flex items-center gap-2 px-4 py-2 rounded border ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}>
            <Download size={18} />
            Export
          </button>
          <div className="relative">
            <button className={`flex items-center gap-2 px-4 py-2 rounded border ${
              theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}>
              <MoreHorizontal size={18} />
              More actions
            </button>
          </div>
        </div>
      </div>
      
      {/* Date Range Selector */}
      <div className="mb-6">
        <button className={`flex items-center gap-2 px-4 py-2 rounded border ${
          theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-700'
        }`}>
          <Calendar size={18} />
          Last 30 days
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-6 rounded-lg shadow ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {stat.title}
                </h3>
                <div className={`text-3xl font-semibold mt-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.value}
                </div>
              </div>
              <div className={`p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {stat.icon}
              </div>
            </div>
            <div className="mt-4">
              <span className={`inline-flex items-center text-sm ${
                stat.change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {stat.change >= 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {Math.abs(stat.change)}% last period
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Method Distribution Chart */}
        <div className={`rounded-lg shadow ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="p-6">
            <h2 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Payment Methods Distribution
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
                      border: theme === 'dark' ? '1px solid #374151' : '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      color: theme === 'dark' ? '#F3F4F6' : '#1F2937',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Monthly Payments Chart */}
        <div className={`rounded-lg shadow ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="p-6">
            <h2 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Monthly Payment Trends
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPaymentsData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
                    opacity={theme === 'dark' ? 0.1 : 1}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                    tickLine={{ stroke: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                  />
                  <YAxis
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                    tickLine={{ stroke: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
                      border: theme === 'dark' ? '1px solid #374151' : '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      color: theme === 'dark' ? '#F3F4F6' : '#1F2937',
                    }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="received"
                    name="Received"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="pending"
                    name="Pending"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Payments Section */}
      <div className={`rounded-lg shadow ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Recent Payments
            </h2>
            
            {/* Tabs */}
            <div className={`flex rounded-md ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              {['all', 'completed', 'pending', 'declined'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? theme === 'dark'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-600'
                        : 'text-gray-700 hover:bg-gray-200'
                  } ${tab === 'all' ? 'rounded-l-md' : ''} ${tab === 'declined' ? 'rounded-r-md' : ''}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${
              theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              <thead>
                <tr>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Payment ID
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Amount
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Method
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Date
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Status
                  </th>
                  <th scope="col" className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={theme === 'dark' ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                {recentPayments
                  .filter(payment => 
                    activeTab === 'all' || 
                    activeTab === payment.status.toLowerCase()
                  )
                  .map((payment) => (
                    <tr key={payment.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {payment.id}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {payment.amount}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <div className="flex items-center">
                          <span className="mr-2">{getMethodIcon(payment.method)}</span>
                          {payment.method}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {payment.date}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm`}>
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          className={`font-medium ${
                            theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                          }`}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;