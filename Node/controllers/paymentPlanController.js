// controllers/paymentPlanController.js
import PaymentPlan from '../models/paymentPlanModel.js';
import { PaymentPlanService } from '../services/paymentPlanService.js';

export class PaymentPlanController {
  constructor() {
    this.paymentPlanService = new PaymentPlanService();
  }

  createPaymentPlan = async (req, res) => {
    try {
      const planData = {
        ...req.body,
        createdBy: req.user._id
      };
      const plan = await this.paymentPlanService.createPaymentPlan(planData);
      res.status(201).json({
        success: true,
        data: plan
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  getActivePlans = async (req, res) => {
    try {
      const plans = await this.paymentPlanService.getActivePlans();
      res.status(200).json({
        success: true,
        data: plans
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  updatePaymentPlan = async (req, res) => {
    try {
      const { planId } = req.params;
      const plan = await this.paymentPlanService.updatePaymentPlan(planId, req.body);
      res.status(200).json({
        success: true,
        data: plan
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  deactivatePlan = async (req, res) => {
    try {
      const { planId } = req.params;
      const plan = await this.paymentPlanService.deactivatePlan(planId);
      res.status(200).json({
        success: true,
        data: plan
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}