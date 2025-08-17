import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Button, Form, Input, Select, Table, Modal, message, Empty, Card, Row, Col, Typography, Tooltip, Tag, Space, Dropdown, Menu } from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  FilterOutlined, 
  ExportOutlined, 
  MoreOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  MessageOutlined, 
  SyncOutlined, 
  DownOutlined,
  FileExcelOutlined,
  FileOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import OrderService from '../services/orderService';
import { 
  downloadCSV, 
  downloadExcel, 
  prepareOrdersForExport, 
  orderExportHeaders 
} from '../utils/orderExportUtils';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const OrderManagement = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' ;
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [syncingOrder, setSyncingOrder] = useState(null);
  const [confirmingOrder, setConfirmingOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isExportMenuVisible, setIsExportMenuVisible] = useState(false);
  const exportMenuRef = useRef(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [statusFilter, setStatusFilter] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    items: 0,
    returns: 0,
    fulfilled: 0,
    growth: {
      total: 0,
      items: 0,
      returns: 0,
      fulfilled: 0
    }
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    end: new Date() // Current date
  });

  // Calculate statistics from order data
  const calculateOrderStats = (orders, totalCount) => {
    // Initialize stats
    const calculatedStats = {
      total: totalCount || orders.length,
      items: 0,
      returns: 0,
      fulfilled: 0,
      growth: {
        total: 0,
        items: 0,
        returns: 0,
        fulfilled: 0
      }
    };

    // Count total items across all orders
    calculatedStats.items = orders.reduce((sum, order) => {
      // Assuming each order might have an items property with a count, or we count each order as having at least 1 item
      const itemCount = order.items?.length || 1;
      return sum + itemCount;
    }, 0);

    // Count returns
    calculatedStats.returns = orders.filter(order => order.status?.toLowerCase() === 'returned').length;

    // Count fulfilled orders
    calculatedStats.fulfilled = orders.filter(order => 
      ['delivered', 'fulfilled'].includes(order.status?.toLowerCase())
    ).length;

    // For demonstration, we'll simulate growth rates
    // In a real application, this would involve comparing current period stats with previous period
    calculatedStats.growth = {
      total: generateRandomGrowth(-30, 30),
      items: generateRandomGrowth(-25, 25),
      returns: generateRandomGrowth(-20, 20),
      fulfilled: generateRandomGrowth(-15, 30)
    };

    return calculatedStats;
  };

  // Helper function to generate random growth percentage for demonstration
  const generateRandomGrowth = (min, max) => {
    return parseFloat((Math.random() * (max - min) + min).toFixed(1));
  };

  const fetchOrders = async (page = 1, limit = 10, status = null) => {
    setLoading(true);
    try {
      // Format date range for API request if needed
      const startDate = dateRange.start.toISOString();
      const endDate = dateRange.end.toISOString();
      
      // Call different endpoints based on user role
      const response = isAdmin 
        ? await OrderService.getAllOrders(page, limit, status, startDate, endDate)
        : await OrderService.getClientOrders(page, limit, status, startDate, endDate);
      
      console.log('Fetched orders response:', response);
      
      if (response && response.success && response.data) {
        const orderData = response.data.orders || [];
        setOrders(orderData);
        
        // Calculate and update statistics
        const calculatedStats = calculateOrderStats(orderData, response.data.totalCount);
        setStats(calculatedStats);
        
        setPagination({
          ...pagination,
          current: page,
          total: response.data.totalCount || 0
        });
      } else {
        setOrders([]);
        // Set default stats when no orders are found
        setStats({
          total: 0,
          items: 0,
          returns: 0,
          fulfilled: 0,
          growth: {
            total: 0,
            items: 0,
            returns: 0,
            fulfilled: 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(pagination.current, pagination.pageSize, statusFilter);
  }, [statusFilter, dateRange]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTableChange = (pagination) => {
    fetchOrders(pagination.current, pagination.pageSize, statusFilter);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPagination({...pagination, current: 1}); // Reset to first page when changing filter
  };

  const handleDateRangeChange = (start, end) => {
    setDateRange({ start, end });
    setPagination({...pagination, current: 1}); // Reset to first page when changing date range
  };

  // For demonstration - simulate date range selection
  const setLastMonthRange = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    handleDateRangeChange(start, end);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Export functions
  const toggleExportMenu = () => {
    setIsExportMenuVisible(!isExportMenuVisible);
  };

  const handleExportToCSV = async () => {
    try {
      setExportLoading(true);

      // For larger datasets, you might want to fetch all orders for export instead of using the current page
      // This depends on your API and requirements
      let ordersToExport = getFilteredOrders();
      
      if (ordersToExport.length === 0) {
        message.warning('No orders to export');
        return;
      }

      // Prepare data for export
      const exportData = prepareOrdersForExport(ordersToExport);
      
      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `orders_export_${date}.csv`;
      
      // Download CSV file
      downloadCSV(exportData, orderExportHeaders, filename);
      message.success('Orders exported successfully to CSV');
      
      // Close the export menu
      setIsExportMenuVisible(false);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      message.error('Failed to export orders to CSV. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);

      // For larger datasets, you might want to fetch all orders for export instead of using the current page
      let ordersToExport = getFilteredOrders();
      
      if (ordersToExport.length === 0) {
        message.warning('No orders to export');
        return;
      }

      // Prepare data for export
      const exportData = prepareOrdersForExport(ordersToExport);
      
      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `orders_export_${date}.xlsx`;
      
      // Download Excel file
      downloadExcel(exportData, orderExportHeaders, filename);
      message.success('Orders exported successfully to Excel');
      
      // Close the export menu
      setIsExportMenuVisible(false);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export orders to Excel. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Handle manual sync with ZRexpress
  const handleSyncWithZRexpress = async (orderId) => {
    try {
      setSyncingOrder(orderId);
      const response = await OrderService.syncOrderWithZRexpress(orderId);
      if (response && response.success) {
        message.success('Order successfully synced with ZRexpress');
        // Refresh orders to get updated sync status
        fetchOrders(pagination.current, pagination.pageSize, statusFilter);
      } else {
        message.error('Failed to sync order with ZRexpress');
      }
    } catch (error) {
      console.error('Error syncing with ZRexpress:', error);
      message.error(error.toString());
    } finally {
      setSyncingOrder(null);
    }
  };

  // Handle order confirmation
  const handleConfirmOrder = async (orderId) => {
    try {
      setConfirmingOrder(orderId);
      const response = await OrderService.confirmOrder(orderId);
      if (response && response.success) {
        message.success('Order successfully confirmed and synced with ZRexpress');
        // Refresh orders to get updated status
        fetchOrders(pagination.current, pagination.pageSize, statusFilter);
      } else {
        message.error('Failed to confirm order');
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      message.error(error.toString());
    } finally {
      setConfirmingOrder(null);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await OrderService.createOrder(values);
      message.success('Order created successfully');
      setIsModalVisible(false);
      form.resetFields();
      await fetchOrders(pagination.current, pagination.pageSize, statusFilter);
    } catch (error) {
      console.error('Error creating order:', error);
      message.error(error.toString());
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'orange', text: 'Pending' },
      confirmed: { color: 'blue', text: 'Confirmed' },
      shipped: { color: 'cyan', text: 'Shipped' },
      delivered: { color: 'green', text: 'Delivered' },
      returned: { color: 'red', text: 'Returned' },
      success: { color: 'green', text: 'Success' },
      fulfilled: { color: 'green', text: 'Fulfilled' },
      unfulfilled: { color: 'red', text: 'Unfulfilled' }
    };
    
    const config = statusConfig[status?.toLowerCase()] || { color: 'default', text: status };
    return <div className={`px-2 py-1 inline-block rounded-full text-xs ${
      theme === 'dark' 
        ? `bg-${config.color}-900 text-${config.color}-300` 
        : `bg-${config.color}-100 text-${config.color}-800`
    }`}>{config.text}</div>;
  };

  const viewOrderDetails = (order) => {
    Modal.info({
      title: 'Order Details',
      width: 700,
      content: (
        <div className="order-details">
          <h3>Customer Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <p><strong>Name:</strong> {order.customerName}</p>
              <p><strong>Primary Mobile:</strong> {order.mobile1}</p>
              {order.mobile2 && <p><strong>Secondary Mobile:</strong> {order.mobile2}</p>}
            </div>
            <div>
              <p><strong>Wilaya:</strong> {order.wilaya}</p>
              <p><strong>Commune:</strong> {order.commune}</p>
              <p><strong>Address:</strong> {order.address}</p>
            </div>
          </div>
          
          <h3>Order Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <p><strong>Order Type:</strong> {order.orderType}</p>
              <p><strong>Delivery Type:</strong> {order.deliveryType}</p>
              <p><strong>Status:</strong> <span style={{ 
                color: 
                  order.status === 'delivered' ? 'green' : 
                  order.status === 'shipped' ? 'blue' : 
                  order.status === 'confirmed' ? 'blue' :
                  order.status === 'returned' ? 'red' : 'orange' 
              }}>{order.status?.toUpperCase()}</span></p>
            </div>
            <div>
              <p><strong>Delivery Fees:</strong> {order.deliveryFees}</p>
              <p><strong>Return Fees:</strong> {order.returnFees || 0}</p>
              {order.trackingId && <p><strong>Tracking ID:</strong> {order.trackingId}</p>}
            </div>
          </div>
          
          {/* ZRexpress Integration Status - Only show for admins */}
          {isAdmin && (
            <>
              <h3>Shipping Integration</h3>
              <div style={{ marginBottom: '24px' }}>
                <p>
                  <strong>ZRexpress Sync Status:</strong> {' '}
                  {order.zrexpressSynced ? 
                    <Tag color="green">Synced</Tag> : 
                    <Tag color="orange">Not Synced</Tag>
                  }
                </p>
                {order.zrexpressReady && (
                  <p><strong>Ready for Shipping:</strong> <Tag color="blue">Ready</Tag></p>
                )}
                
                {/* Show confirmation button if order is pending */}
                {order.status === 'pending' && (
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<CheckCircleOutlined />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmOrder(order._id);
                    }}
                    loading={confirmingOrder === order._id}
                    style={{ marginRight: '8px', marginTop: '8px' }}
                  >
                    Confirm Order
                  </Button>
                )}
                
                {!order.zrexpressSynced && (
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<SyncOutlined />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSyncWithZRexpress(order._id);
                    }}
                    loading={syncingOrder === order._id}
                    style={{ marginTop: '8px' }}
                  >
                    Sync with ZRexpress
                  </Button>
                )}
              </div>
            </>
          )}
          
          <h3>Product Details</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{order.productDetails}</p>
          
          {order.note && (
            <>
              <h3>Notes</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{order.note}</p>
            </>
          )}
          
          <div style={{ marginTop: '24px' }}>
            <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
      ),
    });
  };

  // Format date range for display
  const formatDateRange = () => {
    const formatDate = (date) => {
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    };
    return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
  };

  // Helper to calculate item count for a specific order
  const getOrderItemCount = (order) => {
    if (order.items && Array.isArray(order.items)) {
      return order.items.length;
    }
    // If we can parse product details to estimate item count
    if (order.productDetails) {
      // This is a simplified approach - in reality, you'd need a more robust parsing method
      const lines = order.productDetails.split('\n').filter(line => line.trim().length > 0);
      return Math.max(lines.length, 1);
    }
    return 2; // Fallback default
  };

  // Frontend filtering function
  const getFilteredOrders = () => {
    if (!statusFilter || statusFilter === null) {
      return orders; // Show all orders when no filter selected
    }
    
    // Apply frontend filtering based on button clicked
    return orders.filter(order => {
      const status = order.status?.toLowerCase() || '';
      
      switch(statusFilter) {
        case 'unfulfilled':
          // Show orders that aren't delivered/fulfilled yet
          return !['delivered', 'fulfilled'].includes(status);
        case 'pending':
          // Show only pending/unpaid orders
          return status === 'pending';
        case 'open':
          // Show orders that are in progress
          return ['pending', 'confirmed', 'shipped'].includes(status);
        case 'closed':
          // Show orders that are completed
          return ['delivered', 'returned'].includes(status);
        default:
          return true;
      }
    });
  };

  // Admin columns with all available actions
  const adminColumns = [
    {
      title: 'Order',
      dataIndex: '_id',
      key: '_id',
      render: (id) => <span style={{ color: theme === 'dark' ? 'white' : 'inherit', fontWeight: 'bold' }}>#{id}</span>
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <span className={theme === 'dark' ? 'text-gray-300' : ''}>
        {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (name) => <span className={theme === 'dark' ? 'text-gray-300' : ''}>{name}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Total',
      dataIndex: 'deliveryFees',
      key: 'total',
      render: (fee) => <span className={theme === 'dark' ? 'text-gray-300' : ''}>${fee?.toFixed(2) || '0.00'}</span>
    },
    {
      title: 'Tracking',
      dataIndex: 'trackingId',
      key: 'trackingId',
      render: (trackingId, record) => (
        <Space size="small" direction="vertical">
          <span className={theme === 'dark' ? 'text-gray-300' : ''}>{trackingId || 'N/A'}</span>
          {record.zrexpressSynced && <Tag color="green" size="small">ZRexpress</Tag>}
        </Space>
      )
    },
    {
      title: 'Delivery',
      dataIndex: 'deliveryType',
      key: 'deliveryType',
      render: (type) => <span className={theme === 'dark' ? 'text-gray-300' : ''}>{type || 'N/A'}</span>
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, record) => <span className={theme === 'dark' ? 'text-gray-300' : ''}>{getOrderItemCount(record)} items</span>
    },
    {
      title: 'Fulfillment',
      dataIndex: 'status',
      key: 'fulfillment',
      render: (status) => getStatusTag(status === 'delivered' ? 'fulfilled' : 'unfulfilled')
    },
    {
      title: 'Action',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<FileTextOutlined style={{ color: theme === 'dark' ? 'white' : undefined }} />} 
              onClick={() => viewOrderDetails(record)}
            />
          </Tooltip>
          
          {/* Confirm order button for pending orders */}
          {record.status === 'pending' && (
            <Tooltip title="Confirm Order">
              <Button 
                type="text" 
                icon={<CheckCircleOutlined style={{ color: theme === 'dark' ? '#52c41a' : 'green' }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmOrder(record._id);
                }}
                loading={confirmingOrder === record._id}
              />
            </Tooltip>
          )}
          
          {!record.zrexpressSynced && (
            <Tooltip title="Sync with ZRexpress">
              <Button 
                type="text" 
                icon={<SyncOutlined style={{ color: theme === 'dark' ? 'white' : undefined }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSyncWithZRexpress(record._id);
                }}
                loading={syncingOrder === record._id}
              />
            </Tooltip>
          )}
          <Tooltip title="Message">
            <Button 
              type="text" 
              icon={<MessageOutlined style={{ color: theme === 'dark' ? 'white' : undefined }} />}
            />
          </Tooltip>
        </Space>
      ),
    }
  ];

  // Client columns - simpler version with fewer actions and columns
  const clientColumns = [
    {
      title: 'Order',
      dataIndex: '_id',
      key: '_id',
      render: (id) => <span style={{ color: theme === 'dark' ? 'white' : 'inherit', fontWeight: 'bold' }}>#{id}</span>
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <span className={theme === 'dark' ? 'text-gray-300' : ''}>
        {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Product',
      dataIndex: 'productDetails',
      key: 'productDetails',
      render: (details) => <span className={theme === 'dark' ? 'text-gray-300' : ''}>
        {details?.length > 30 ? `${details.substring(0, 30)}...` : details}
      </span>
    },
    {
      title: 'Payment',
      dataIndex: 'status',
      key: 'payment',
      render: (status) => getStatusTag(status === 'confirmed' || status === 'shipped' || status === 'delivered' ? 'success' : 'pending')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Total',
      dataIndex: 'deliveryFees',
      key: 'total',
      render: (fee) => <span className={theme === 'dark' ? 'text-gray-300' : ''}>${fee?.toFixed(2) || '0.00'}</span>
    },
    {
      title: 'Tracking',
      dataIndex: 'trackingId',
      key: 'trackingId',
      render: (trackingId) => <span className={theme === 'dark' ? 'text-gray-300' : ''}>{trackingId || 'N/A'}</span>
    },
    {
      title: 'Action',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<FileTextOutlined style={{ color: theme === 'dark' ? 'white' : undefined }} />} 
              onClick={() => viewOrderDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    }
  ];

  // Dark mode style overrides
  const getContainerStyle = () => {
    if (theme === 'dark') {
      return {
        backgroundColor: '#111827', 
        color: '#f3f4f6',
        padding: '20px',
      };
    }
    return { padding: '20px' };
  };

  const getCardStyle = () => {
    if (theme === 'dark') {
      return {
        backgroundColor: '#1f2937',
        color: 'white',
        border: 'none'
      };
    }
    return {};
  };

  const getTableStyle = () => {
    if (theme === 'dark') {
      return {
        backgroundColor: '#1f2937',
        color: 'white',
      };
    }
    return {};
  };

  const getButtonStyle = (isActive = false) => {
    if (theme === 'dark') {
      return {
        backgroundColor: isActive ? '#3b82f6' : '#1f2937',
        borderColor: isActive ? '#3b82f6' : '#374151',
        color: isActive ? 'white' : '#d1d5db',
      };
    }
    return isActive ? { backgroundColor: '#f0f0f0', color: '#000', border: 'none' } : {};
  };

  return (
    <div className="order-management" style={getContainerStyle()}>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0, color: theme === 'dark' ? 'white' : undefined }}>
          {isAdmin ? 'Orders' : 'My Orders'}
        </Title>
        <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
          {/* Export Button with Dropdown - Only for admins */}
          {isAdmin && (
            <div className="relative" ref={exportMenuRef} style={{ position: 'relative' }}>
              <Button 
                icon={<ExportOutlined />} 
                onClick={toggleExportMenu}
                style={theme === 'dark' ? { backgroundColor: '#1f2937', borderColor: '#374151', color: '#d1d5db' } : {}}
                loading={exportLoading}
              >
                Export <DownOutlined style={{ fontSize: '12px' }} />
              </Button>
              
              {isExportMenuVisible && (
                <div style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: '100%', 
                  marginTop: '4px', 
                  width: '180px', 
                  backgroundColor: theme === 'dark' ? '#1f2937' : 'white',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '4px',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000
                }}>
                  <div style={{ padding: '8px 0' }}>
                    <Button 
                      type="text" 
                      icon={<FileOutlined />}
                      onClick={handleExportToCSV}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        width: '100%', 
                        justifyContent: 'flex-start',
                        color: theme === 'dark' ? '#d1d5db' : undefined,
                        padding: '8px 12px'
                      }}>
                      Export as CSV
                    </Button>
                    <Button 
                      type="text" 
                      icon={<FileExcelOutlined />}
                      onClick={handleExportToExcel}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        width: '100%', 
                        justifyContent: 'flex-start',
                        color: theme === 'dark' ? '#d1d5db' : undefined,
                        padding: '8px 12px'
                      }}
                    >
                      Export as Excel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* More actions button - Only for admins */}
          {isAdmin && (
            <Tooltip title="More actions">
              <Button
                style={theme === 'dark' ? { backgroundColor: '#1f2937', borderColor: '#374151', color: '#d1d5db' } : {}}
              >
                More actions
              </Button>
            </Tooltip>
          )}
          
          {/* Create order button available for everyone */}
          <Button type="primary" onClick={showModal}>
            Create order
          </Button>
        </div>
      </div>

      {/* Only show statistics for admins */}
        <div style={{ marginBottom: '20px' }}>
          <div className="date-range" style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <Button 
              icon={<CalendarOutlined />} 
              style={{ 
                ...theme === 'dark' ? { backgroundColor: '#1f2937', borderColor: '#374151', color: '#d1d5db' } : {},
                display: 'flex', 
                alignItems: 'center' 
              }} 
              onClick={setLastMonthRange}
            >
              {formatDateRange()}
            </Button>
          </div>

          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card style={getCardStyle()}>
                <div>
                  <div style={{ fontSize: '14px', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '8px' }}>
                    Total Orders
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                    {stats.total}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <Text 
                      type={stats.growth.total >= 0 ? "success" : "danger"} 
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ 
                        transform: stats.growth.total >= 0 ? 'rotate(-45deg)' : 'rotate(45deg)', 
                        display: 'inline-block', 
                        marginRight: '4px' 
                      }}>
                        {stats.growth.total >= 0 ? '↑' : '↓'}
                      </span> 
                      {Math.abs(stats.growth.total)}% last week
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={getCardStyle()}>
                <div>
                  <div style={{ fontSize: '14px', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '8px' }}>
                    Order items over time
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                    {stats.items}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <Text 
                      type={stats.growth.items >= 0 ? "success" : "danger"} 
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ 
                        transform: stats.growth.items >= 0 ? 'rotate(-45deg)' : 'rotate(45deg)', 
                        display: 'inline-block', 
                        marginRight: '4px' 
                      }}>
                        {stats.growth.items >= 0 ? '↑' : '↓'}
                      </span> 
                      {Math.abs(stats.growth.items)}% last week
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={getCardStyle()}>
                <div>
                  <div style={{ fontSize: '14px', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '8px' }}>
                    Returns Orders
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                    {stats.returns}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <Text 
                      type={stats.growth.returns < 0 ? "success" : "danger"} 
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ 
                        transform: stats.growth.returns >= 0 ? 'rotate(-45deg)' : 'rotate(45deg)', 
                        display: 'inline-block', 
                        marginRight: '4px' 
                      }}>
                        {stats.growth.returns >= 0 ? '↑' : '↓'}
                      </span> 
                      {Math.abs(stats.growth.returns)}% last week
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={getCardStyle()}>
                <div>
                  <div style={{ fontSize: '14px', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '8px' }}>
                    Fulfilled orders over time
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                    {stats.fulfilled}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <Text 
                      type={stats.growth.fulfilled >= 0 ? "success" : "danger"} 
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ 
                        transform: stats.growth.fulfilled >= 0 ? 'rotate(-45deg)' : 'rotate(45deg)', 
                        display: 'inline-block', 
                        marginRight: '4px' 
                      }}>
                        {stats.growth.fulfilled >= 0 ? '↑' : '↓'}
                      </span> 
                      {Math.abs(stats.growth.fulfilled)}% last week
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
  

      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <Button 
          type={statusFilter === null ? "primary" : "default"} 
          style={getButtonStyle(statusFilter === null)}
          onClick={() => handleStatusFilterChange(null)}
        >
          All
        </Button>
        
        <Button 
          type={statusFilter === 'unfulfilled' ? "primary" : "default"}
          style={getButtonStyle(statusFilter === 'unfulfilled')}
          onClick={() => handleStatusFilterChange('unfulfilled')}
        >
          Unfulfilled
        </Button>
        
        {/* Admin-only filters */}
          <>
            <Button 
              type={statusFilter === 'pending' ? "primary" : "default"}
              style={getButtonStyle(statusFilter === 'pending')}
              onClick={() => handleStatusFilterChange('pending')}
            >
              Unpaid
            </Button>
            
            <Button 
              type={statusFilter === 'open' ? "primary" : "default"}
              style={getButtonStyle(statusFilter === 'open')}
              onClick={() => handleStatusFilterChange('open')}
            >
              Open
            </Button>
            
            <Button 
              type={statusFilter === 'closed' ? "primary" : "default"}
              style={getButtonStyle(statusFilter === 'closed')}
              onClick={() => handleStatusFilterChange('closed')}
            >
              Closed
            </Button>
          </>
        
        <Button 
          icon={<PlusOutlined />}
          onClick={showModal}
          style={theme === 'dark' ? { backgroundColor: '#1f2937', borderColor: '#374151', color: '#d1d5db' } : {}}
        >
          Add
        </Button>
      </div>

      <Table 
        columns={isAdmin ? adminColumns : clientColumns} 
        dataSource={getFilteredOrders()} 
        rowKey="_id" 
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        style={getTableStyle()}
        className={theme === 'dark' ? 'ant-table-dark' : ''}
        locale={{
          emptyText: <Empty 
            description={<span style={{ color: theme === 'dark' ? 'white' : undefined }}>No orders found</span>} 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        }}
      />

      <Modal
        title="Create New Order"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            deliveryType: 'Domicile',
            orderType: 'Normal',
            wilaya: 'Alger',
            deliveryFees: 0,
            returnFees: 0
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="customerName"
              label="Customer Name"
              rules={[{ required: true, message: 'Please enter customer name' }]}
            >
              <Input placeholder="Customer Name" />
            </Form.Item>

            <Form.Item
              name="mobile1"
              label="Primary Mobile"
              rules={[{ required: true, message: 'Please enter primary mobile number' }]}
            >
              <Input placeholder="Primary Mobile Number" />
            </Form.Item>

            <Form.Item
              name="mobile2"
              label="Secondary Mobile"
            >
              <Input placeholder="Secondary Mobile Number" />
            </Form.Item>

            <Form.Item
              name="wilaya"
              label="Wilaya"
              rules={[{ required: true, message: 'Please select wilaya' }]}
            >
              <Select placeholder="Select Wilaya">
                <Option value="Alger">Alger</Option>
                <Option value="Oran">Oran</Option>
                <Option value="Constantine">Constantine</Option>
                {/* Add more wilayas as needed */}
              </Select>
            </Form.Item>

            <Form.Item
              name="commune"
              label="Commune"
              rules={[{ required: true, message: 'Please enter commune' }]}
            >
              <Input placeholder="Commune" />
            </Form.Item>

            <Form.Item
              name="deliveryType"
              label="Delivery Type"
              rules={[{ required: true, message: 'Please select delivery type' }]}
            >
              <Select placeholder="Select Delivery Type">
                <Option value="Domicile">Domicile</Option>
                <Option value="Stop Desk">Stop Desk</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="orderType"
              label="Order Type"
              rules={[{ required: true, message: 'Please select order type' }]}
            >
              <Select placeholder="Select Order Type">
                <Option value="Normal">Normal</Option>
                <Option value="Express">Express</Option>
                <Option value="Fragile">Fragile</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="deliveryFees"
              label="Delivery Fees"
              rules={[{ required: true, message: 'Please enter delivery fees' }]}
            >
              <Input type="number" placeholder="Delivery Fees" />
            </Form.Item>

            <Form.Item
              name="returnFees"
              label="Return Fees"
            >
              <Input type="number" placeholder="Return Fees" />
            </Form.Item>
          </div>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <TextArea rows={2} placeholder="Full Address" />
          </Form.Item>

          <Form.Item
            name="productDetails"
            label="Product Details"
            rules={[{ required: true, message: 'Please enter product details' }]}
          >
            <TextArea rows={3} placeholder="Product Details" />
          </Form.Item>

          <Form.Item
            name="note"
            label="Note"
          >
            <TextArea rows={2} placeholder="Additional Notes" />
          </Form.Item>

          {/* Optional tracking ID field */}
          <Form.Item
            name="trackingId"
            label="Tracking ID (Optional)"
            tooltip="If left empty, a tracking ID will be generated automatically"
          >
            <Input placeholder="Enter tracking ID or leave empty for auto-generation" />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create Order
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .ant-table-dark .ant-table-thead > tr > th {
          background-color: #1f2937 !important;
          color: white !important;
          border-bottom: 1px solid #374151 !important;
        }
        .ant-table-dark .ant-table-tbody > tr > td {
          background-color: #1f2937 !important;
          color: #d1d5db !important;
          border-bottom: 1px solid #374151 !important;
        }
        .ant-table-dark .ant-table-tbody > tr:hover > td {
          background-color: #2d3748 !important;
        }
        .ant-table-dark .ant-empty-description {
          color: #d1d5db !important;
        }
        .ant-table-dark .ant-pagination-item-active {
          background-color: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .ant-table-dark .ant-pagination-item-active a {
          color: white !important;
        }
        .ant-table-dark .ant-pagination-item a {
          color: #d1d5db !important;
        }
        .ant-table-dark .ant-pagination-prev button, 
        .ant-table-dark .ant-pagination-next button {
          color: #d1d5db !important;
        }
      `}</style>
    </div>
  );
};

export default OrderManagement;