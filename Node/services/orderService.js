// services/orderService.js
import Order from '../models/orderModel.js';
import NotificationService from './notificationService.js';
import { PaymentService } from './paymentService.js';
import { addPackage, markPackageAsReady } from './zrexpressService.js';
import { generateTrackingId } from '../utils/trackingUtils.js';
import fetch from 'node-fetch';


export class OrderService {
  constructor() {
    this.notificationService = new NotificationService();
    this.paymentService = new PaymentService();
  }

  async createOrder(orderData) {
    try {
      // Calculate delivery fees (replacing previous shipping cost logic)
      const deliveryFees = orderData.deliveryFees || 0;
      const returnFees = orderData.returnFees || 0;
      
      // Generate tracking ID if not provided
      if (!orderData.trackingId) {
        orderData.trackingId = generateTrackingId();
      }
      
      const order = new Order({
        ...orderData,
        deliveryFees,
        returnFees
      });
      await order.save();
      
      // Send confirmation message to customer
      await this.sendOrderConfirmationRequest(order);
      
      return order;
    } catch (error) {
      throw new Error(`Error creating order: ${error.message}`);
    }
  }
  
  async sendOrderConfirmationRequest(order) {
    try {
      // Static client ID
      const clientId = "32052347-9132-4588-9af8-6243f25d042o";
      
      // Format a beautiful confirmation message with order details
      const message = `🛍️ *NEW ORDER CONFIRMATION* 🛍️
  ━━━━━━━━━━━━━━━━━━━━━
  
  📦 *Order #:* ${order.trackingId}
  🏷️ *Product:* ${order.productDetails}
  💰 *Total:* ${order.deliveryFees} DZD
  📍 *Delivery Address:* 
     ${order.address}
     ${order.commune}, ${order.wilaya}
  
  ━━━━━━━━━━━━━━━━━━━━━
  ✅ *To confirm this order, please reply with "YES"*
  
  Thank you for shopping with us! Your package will be prepared for shipping once confirmed.`;
  
      console.log(order.mobile1);
      
      // Prepare the API call to your WhatsApp service
      const response = await fetch('http://localhost:3002/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientId,
          to: formatPhoneNumber(order.mobile1),
          message: message
        }),
      });
      
      function formatPhoneNumber(phone) {
        // Remove any spaces or non-digit characters
        let cleaned = phone.toString().replace(/\D/g, '');
        
        // If number starts with 0, remove it
        if (cleaned.startsWith('0')) {
          cleaned = cleaned.substring(1);
        }
        
        // If number doesn't start with 213, add it
        if (!cleaned.startsWith('213')) {
          cleaned = '213' + cleaned;
        }
        
        return cleaned;
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`Confirmation request sent for order ${order._id} to ${order.mobile1}`);
      } else {
        console.error(`Failed to send confirmation: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Error sending confirmation request: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async confirmOrder(orderId, userId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Update status to confirmed
      const oldStatus = order.status;
      order.status = 'confirmed';
      
      // Add to status history
      order.statusHistory.push({
        from: oldStatus,
        to: 'confirmed',
        changedBy: userId,
        changedAt: new Date()
      });

      await order.save();
      
      // Sync with ZRexpress now that the order is confirmed
      try {
        await this.syncOrderWithZRexpress(order);
      } catch (zrError) {
        console.error(`ZRexpress sync failed during confirmation: ${zrError.message}`);
        // Continue with order confirmation even if ZRexpress sync fails
        // We'll try again later with a background job
      }
      
      // Handle other status change logic
      await this.#handleStatusChange(order, oldStatus, 'confirmed');

      return order;
    } catch (error) {
      throw new Error(`Error confirming order: ${error.message}`);
    }
  }

  async syncOrderWithZRexpress(order) {
    // Skip if already synced or no tracking ID
    if (order.zrexpressSynced || !order.trackingId) {
      return;
    }
    
    // Prepare data for ZRexpress in the exact format required
    const packageData = [{
      "Tracking": order.trackingId,
      "TypeLivraison": order.deliveryType === 'Stop Desk' ? "1" : "0",
      "TypeColis": order.orderType === 'Express' ? "1" : "0",
      "Confrimee": order.status === 'confirmed' ? "1" : "",
      "Client": order.customerName,
      "MobileA": order.mobile1,
      "MobileB": order.mobile2 || "",
      "Adresse": order.address,
      "IDWilaya": order.wilaya,
      "Commune": order.commune,
      "Total": order.deliveryFees.toString(),
      "Note": order.note || "",
      "TProduit": order.productDetails,
      "id_Externe": order._id.toString(),
      "Source": ""
    }];
    
    // Send to ZRexpress
    await addPackage(packageData);
    
    // If order is confirmed, mark as ready to ship
    if (order.status === 'confirmed') {
      await markPackageAsReady(order.trackingId);
      order.zrexpressReady = true;
    }
    
    // Update order to mark as synced
    order.zrexpressSynced = true;
    await order.save();
    return order;
  }


  // backend services/orderService.js
async getOrdersByClient(clientId, page = 1, limit = 10, status = null, startDate = null, endDate = null) {
  try {
    // Create query with client ID
    const query = { clientId };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Add date range filter if provided
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find orders with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('confirmationAttempts.attemptedBy', 'username');
    
    // Get total count for pagination
    const totalCount = await Order.countDocuments(query);
    
    return {
      orders,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit))
    };
  } catch (error) {
    throw new Error(`Error fetching client orders: ${error.message}`);
  }
}

  async updateOrderStatus(orderId, status, userId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const oldStatus = order.status;
      order.status = status;
      
      order.statusHistory.push({
        from: oldStatus,
        to: status,
        changedBy: userId,
        changedAt: new Date()
      });

      await order.save();
      
      // If status is confirmed and the order has a tracking ID, mark as ready in ZRexpress
      if (status === 'confirmed' && order.trackingId) {
        try {
          // Ensure order is synced with ZRexpress first
          if (!order.zrexpressSynced) {
            await this.syncOrderWithZRexpress(order);
          } else {
            // Just mark as ready if already synced
            await markPackageAsReady(order.trackingId);
            order.zrexpressReady = true;
            await order.save();
          }
        } catch (zrError) {
          console.error(`ZRexpress status update failed: ${zrError.message}`);
          // Continue with order status update even if ZRexpress sync fails
        }
      }
      
      await this.#handleStatusChange(order, oldStatus, status);

      return order;
    } catch (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }
  }

  async getAllOrders(page = 1, limit = 10, status = null) {
    try {
      const query = {};
      
      // Add status filter if provided
      if (status) {
        query.status = status;
      }
      
      // Calculate skip value for pagination
      const skip = (page - 1) * limit;
      
      // Find orders with pagination
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .exec();
      
      // Get total count for pagination
      const totalCount = await Order.countDocuments(query);
      
      return {
        orders,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
      };
    } catch (error) {
      throw new Error(`Error fetching orders: ${error.message}`);
    }
  }

  async logConfirmationAttempt(orderId, attemptData) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      order.confirmationAttempts.push({
        ...attemptData,
        date: new Date()
      });

      order.totalAttempts = (order.totalAttempts || 0) + 1;
      order.lastAttemptDate = new Date();

      await order.save();

      if (order.confirmationAttempts.length >= 3) {
        await this.notificationService.sendMaxAttemptsAlert(order);
      }

      return order;
    } catch (error) {
      throw new Error(`Error logging confirmation attempt: ${error.message}`);
    }
  }

  // Private methods
  #calculateShippingCost(details) {
    const { weight, dimensions } = details;
    let cost = 500; // Base rate in DZD

    // Weight calculations (per kg)
    cost += weight * 100;

    // Dimension calculations
    const [length, width, height] = dimensions.split('x').map(Number);
    const volume = length * width * height;
    cost += volume * 0.5;

    return Math.round(cost);
  }

  async #handleStatusChange(order, oldStatus, newStatus) {
    if (newStatus === 'delivered') {
      await this.paymentService.processFinalPayment(order);
      await this.notificationService.sendDeliveryConfirmation(order);
    }

    if (newStatus === 'cancelled') {
      await this.paymentService.processRefund(order);
      await this.notificationService.sendCancellation(order);
    }

    await this.notificationService.sendStatusUpdate(order, oldStatus, newStatus);
  }

  // async syncOrderWithZRexpress(orderId) {
  //   try {
  //     const order = await Order.findById(orderId);
  //     if (!order) {
  //       throw new Error('Order not found');
  //     }
      
  //     await this.syncOrderWithZRexpress(order);
  //     return order;
  //   } catch (error) {
  //     throw new Error(`Error syncing order with ZRexpress: ${error.message}`);
  //   }
  // }
}