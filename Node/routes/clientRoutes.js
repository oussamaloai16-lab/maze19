import express from 'express';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  updateClientStatus,
  deleteClient,
  getClientStats
} from '../controllers/clientController.js';

const router = express.Router();

// Public route - no authentication required for client form submission
router.post('/', createClient);

// Protected routes (you may want to add authentication middleware here later)
router.get('/', getAllClients);
router.get('/stats', getClientStats);
router.get('/:id', getClientById);
router.put('/:id', updateClient);
router.patch('/:id/status', updateClientStatus);
router.delete('/:id', deleteClient);

export default router; 