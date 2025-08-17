// services/paymentPlanService.js
import PaymentPlan from '../models/paymentPlanModel.js';
import User from '../models/userModel.js';
import NotificationService from './notificationService.js';

export class PaymentPlanService {
  constructor() {
    this.notificationService = new NotificationService();
  }

  async createPaymentPlan(planData) {
    try {
      // Validate commission percentage
      if (planData.commissionPercentage < 0 || planData.commissionPercentage > 100) {
        throw new Error('Commission percentage must be between 0 and 100');
      }

      const plan = new PaymentPlan({
        ...planData,
        services: this.#validateAndFormatServices(planData.services)
      });

      await plan.save();
      await this.notificationService.sendNewPlanNotification(plan);
      return plan;
    } catch (error) {
      throw new Error(`Error creating payment plan: ${error.message}`);
    }
  }

  async getActivePlans() {
    try {
      return await PaymentPlan.find({ 
        active: true 
      }).sort({ price: 1 });
    } catch (error) {
      throw new Error(`Error fetching active plans: ${error.message}`);
    }
  }

  async getPlanById(planId) {
    try {
      const plan = await PaymentPlan.findById(planId);
      if (!plan) {
        throw new Error('Payment plan not found');
      }
      return plan;
    } catch (error) {
      throw new Error(`Error fetching plan: ${error.message}`);
    }
  }

  async updatePaymentPlan(planId, updateData) {
    try {
      // Validate commission percentage if provided
      if (updateData.commissionPercentage && 
          (updateData.commissionPercentage < 0 || updateData.commissionPercentage > 100)) {
        throw new Error('Commission percentage must be between 0 and 100');
      }

      // Format services if provided
      if (updateData.services) {
        updateData.services = this.#validateAndFormatServices(updateData.services);
      }

      const plan = await PaymentPlan.findByIdAndUpdate(
        planId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!plan) {
        throw new Error('Payment plan not found');
      }

      // Notify affected clients if price or services changed
      if (updateData.price || updateData.services) {
        const affectedClients = await User.find({ paymentPlan: planId });
        await this.notificationService.sendPlanUpdateNotification(plan, affectedClients);
      }

      return plan;
    } catch (error) {
      throw new Error(`Error updating payment plan: ${error.message}`);
    }
  }

  async deactivatePlan(planId) {
    try {
      const plan = await PaymentPlan.findById(planId);
      if (!plan) {
        throw new Error('Payment plan not found');
      }

      // Check for active clients using this plan
      const activeClients = await User.find({ paymentPlan: planId });
      if (activeClients.length > 0) {
        throw new Error('Cannot deactivate plan with active clients');
      }

      plan.active = false;
      plan.deactivatedAt = new Date();
      await plan.save();

      return plan;
    } catch (error) {
      throw new Error(`Error deactivating plan: ${error.message}`);
    }
  }

  async assignPlanToClient(clientId, planId) {
    try {
      const [client, plan] = await Promise.all([
        User.findById(clientId),
        PaymentPlan.findById(planId)
      ]);

      if (!client) {
        throw new Error('Client not found');
      }
      if (!plan) {
        throw new Error('Payment plan not found');
      }
      if (!plan.active) {
        throw new Error('Cannot assign inactive plan');
      }

      client.paymentPlan = planId;
      client.planAssignedAt = new Date();
      await client.save();

      await this.notificationService.sendPlanAssignmentNotification(client, plan);
      return client;
    } catch (error) {
      throw new Error(`Error assigning plan to client: ${error.message}`);
    }
  }

  async getClientPlan(clientId) {
    try {
      const client = await User.findById(clientId).populate('paymentPlan');
      if (!client) {
        throw new Error('Client not found');
      }
      if (!client.paymentPlan) {
        throw new Error('Client has no assigned payment plan');
      }
      return client.paymentPlan;
    } catch (error) {
      throw new Error(`Error fetching client's plan: ${error.message}`);
    }
  }

  async calculatePlanCosts(planId, orderValue) {
    try {
      const plan = await PaymentPlan.findById(planId);
      if (!plan) {
        throw new Error('Payment plan not found');
      }

      const commission = (orderValue * plan.commissionPercentage) / 100;
      const totalCost = plan.price;

      return {
        planCost: plan.price,
        commission,
        totalCost,
        breakdown: {
          basePlanPrice: plan.price,
          commissionPercentage: plan.commissionPercentage,
          commissionAmount: commission,
          includedServices: plan.services
        }
      };
    } catch (error) {
      throw new Error(`Error calculating plan costs: ${error.message}`);
    }
  }

  async getPlanUsageStats(planId) {
    try {
      const plan = await PaymentPlan.findById(planId);
      if (!plan) {
        throw new Error('Payment plan not found');
      }

      const activeClients = await User.countDocuments({ 
        paymentPlan: planId,
        planAssignedAt: { $exists: true }
      });

      return {
        planId: plan._id,
        name: plan.name,
        activeClients,
        price: plan.price,
        status: plan.active ? 'active' : 'inactive',
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        deactivatedAt: plan.deactivatedAt
      };
    } catch (error) {
      throw new Error(`Error fetching plan usage stats: ${error.message}`);
    }
  }

  // Private helper methods
  #validateAndFormatServices(services) {
    if (!Array.isArray(services)) {
      throw new Error('Services must be an array');
    }

    return services.map(service => {
      if (!service.name || !service.quantity) {
        throw new Error('Each service must have a name and quantity');
      }

      return {
        name: service.name,
        quantity: parseInt(service.quantity),
        details: service.details || ''
      };
    });
  }
}