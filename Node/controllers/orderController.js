// controllers/orderController.js
import Order from '../models/orderModel.js';
import { OrderService } from '../services/orderService.js';

export class OrderController {
  constructor() {
    this.orderService = new OrderService();
  }

  createOrder = async (req, res) => {
    try {
      const orderData = {
        ...req.body,
        clientId: req.user._id
      };
      const order = await this.orderService.createOrder(orderData);
      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }

  }

  confirmOrder = async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await this.orderService.confirmOrder(orderId, req.user._id);
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  getClientOrders = async (req, res) => {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;
      
      // Create a query object
      const query = { clientId: req.user.id };
      
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
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Find orders with filters and pagination
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .exec();
      
      // Get total count for pagination
      const totalCount = await Order.countDocuments(query);
      
      return res.json({
        success: true,
        data: {
          orders,
          totalCount,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit))
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  getAllOrders = async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const orders = await this.orderService.getAllOrders(page, limit, status);
      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  updateOrderStatus = async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const order = await this.orderService.updateOrderStatus(orderId, status, req.user._id);
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  logConfirmationAttempt = async (req, res) => {
    try {
      const { orderId } = req.params;
      const attempt = {
        ...req.body,
        attemptedBy: req.user._id
      };
      const order = await this.orderService.logConfirmationAttempt(orderId, attempt);
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  syncOrderWithZRexpress = async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await this.orderService.syncOrderWithZRexpress(orderId);
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
}