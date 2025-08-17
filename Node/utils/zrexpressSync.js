// utils/zrexpressSync.js
import Order from '../models/orderModel.js';
import { OrderService } from '../services/orderService.js';

export const syncPendingOrders = async () => {
  try {
    const orderService = new OrderService();
    
    // Find orders that need to be synced
    const pendingOrders = await Order.find({
      trackingId: { $exists: true, $ne: "" },
      zrexpressSynced: { $ne: true }
    });
    
    console.log(`Found ${pendingOrders.length} orders pending ZRexpress sync`);
    
    
    let succeeded = 0;
    let failed = 0;
    
    for (const order of pendingOrders) {
      try {
        console.log(`Syncing order ${order._id} with tracking ID ${order.trackingId}`);
        console.log(order)
        orderService.syncOrderWithZRexpress(order);
        succeeded++;
        console.log(`Successfully synced order ${order._id}`);
      } catch (error) {
        failed++;
        console.error(`Failed to sync order ${order._id}: ${error.message}`);
      }
      
      // Add a small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }


    
    console.log(`ZRexpress sync completed. Success: ${succeeded}, Failed: ${failed}`);
    
    return { succeeded, failed };
  } catch (error) {
    console.error('Error in bulk ZRexpress sync:', error);
    throw error;
  }
};