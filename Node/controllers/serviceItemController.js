import ServiceItem from '../models/serviceItemModel.js';

export class ServiceItemController {
  // Create a new service item
  createServiceItem = async (req, res) => {
    try {
      const serviceItem = new ServiceItem(req.body);
      await serviceItem.save();
      res.status(201).json({ success: true, data: serviceItem });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // Get all service items
  getAllServiceItems = async (req, res) => {
    try {
      const serviceItems = await ServiceItem.find({});
      res.status(200).json({ success: true, data: serviceItems });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // Get a single service item by ID
  getServiceItemById = async (req, res) => {
    try {
      const serviceItem = await ServiceItem.findById(req.params.id);
      if (!serviceItem) {
        return res.status(404).json({ success: false, message: 'Service item not found' });
      }
      res.status(200).json({ success: true, data: serviceItem });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // Update a service item
  updateServiceItem = async (req, res) => {
    try {
      const serviceItem = await ServiceItem.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!serviceItem) {
        return res.status(404).json({ success: false, message: 'Service item not found' });
      }
      res.status(200).json({ success: true, data: serviceItem });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // Delete a service item
  deleteServiceItem = async (req, res) => {
    try {
      const serviceItem = await ServiceItem.findByIdAndDelete(req.params.id);
      if (!serviceItem) {
        return res.status(404).json({ success: false, message: 'Service item not found' });
      }
      res.status(200).json({ success: true, message: 'Service item deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
} 