// services/paymentService.js
import Payment from '../models/paymentModel.js';
import Commission from '../models/commissionModel.js';
import NotificationService from './notificationService.js';
import {PaymentPlanService}  from './paymentPlanService.js';

export class PaymentService {
  constructor() {
    this.notificationService = new NotificationService();
    this.paymentPlanService = new PaymentPlanService();
  }

  async createPayment(paymentData) {
    try {
      const payment = new Payment(paymentData);
      await payment.save();
      await this.notificationService.sendPaymentCreation(payment);
      return payment;
    } catch (error) {
      throw new Error(`Error creating payment: ${error.message}`);
    }
  }

  async createInitialPayment(order) {
    try {
      const paymentPlan = await this.paymentPlanService.getClientPlan(order.clientId);
      const initialAmount = (order.details.codAmount * 50) / 100; // 50% upfront

      const payment = new Payment({
        orderId: order._id,
        clientId: order.clientId,
        amount: initialAmount,
        type: 'advance',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      });

      await payment.save();
      return payment;
    } catch (error) {
      throw new Error(`Error creating initial payment: ${error.message}`);
    }
  }

  async processFinalPayment(order) {
    try {
      const remainingAmount = (order.details.codAmount * 50) / 100; // Remaining 50%

      const payment = new Payment({
        orderId: order._id,
        clientId: order.clientId,
        amount: remainingAmount,
        type: 'final',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      await payment.save();
      await this.#createCommission(order);
      return payment;
    } catch (error) {
      throw new Error(`Error processing final payment: ${error.message}`);
    }
  }

  async approvePayment(paymentId, approverId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      payment.status = 'completed';
      payment.approvedBy = approverId;
      payment.paidAt = new Date();

      await payment.save();
      await this.notificationService.sendPaymentApproval(payment);

      return payment;
    } catch (error) {
      throw new Error(`Error approving payment: ${error.message}`);
    }
  }

  async processRefund(order) {
    try {
      const payments = await Payment.find({
        orderId: order._id,
        status: 'completed'
      });

      for (const payment of payments) {
        const refund = new Payment({
          orderId: order._id,
          clientId: order.clientId,
          amount: -payment.amount,
          type: 'refund',
          status: 'pending',
          relatedPaymentId: payment._id
        });

        await refund.save();
        await this.notificationService.sendRefundInitiation(refund);
      }
    } catch (error) {
      throw new Error(`Error processing refund: ${error.message}`);
    }
  }

  async #createCommission(order) {
    try {
      const paymentPlan = await this.paymentPlanService.getClientPlan(order.clientId);
      const commissionAmount = (order.details.codAmount * paymentPlan.commissionPercentage) / 100;

      const commission = new Commission({
        userId: order.clientId,
        orderId: order._id,
        amount: commissionAmount,
        percentage: paymentPlan.commissionPercentage
      });

      await commission.save();
      return commission;
    } catch (error) {
      throw new Error(`Error creating commission: ${error.message}`);
    }
  }
}