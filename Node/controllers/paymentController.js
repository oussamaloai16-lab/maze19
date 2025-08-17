// controllers/paymentController.js
import Payment from '../models/paymentModel.js';
import { PaymentService } from '../services/paymentService.js';

export class PaymentController {
  constructor() {
    this.paymentService = new PaymentService();
  }

  createPayment = async (req, res) => {
    try {
      const paymentData = {
        ...req.body,
        clientId: req.user._id
      };
      const payment = await this.paymentService.createPayment(paymentData);
      res.status(201).json({
        success: true,
        data: payment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  approvePayment = async (req, res) => {
    try {
      const { paymentId } = req.params;
      const payment = await this.paymentService.approvePayment(paymentId, req.user._id);
      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  getClientPayments = async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const payments = await this.paymentService.getClientPayments(req.user._id, page, limit, status);
      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  getAllPayments = async (req, res) => {
    try {
      const { page = 1, limit = 10, status, type } = req.query;
      const payments = await this.paymentService.getAllPayments(page, limit, status, type);
      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}