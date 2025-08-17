// routes/taskRoutes.js
import express from 'express';
import { TaskController } from '../controllers/taskController.js';
import protect from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import PERMISSIONS from '../config/rbac/permissions.js';

const router = express.Router();
const taskController = new TaskController();

// Apply authentication middleware to all routes
router.use(protect);

// Task CRUD routes
router.post('/', checkPermission('tasks', 'create'), taskController.createTask);
router.post('/from-service', checkPermission('tasks', 'create'), taskController.createTasksFromService);
router.get('/', checkPermission('tasks', 'read'), taskController.getAllTasks);
router.get('/kanban', checkPermission('tasks', 'read'), taskController.getTasksKanban);
router.get('/stats', checkPermission('tasks', 'read'), taskController.getTaskStats);
router.get('/my-tasks', taskController.getMyTasks); // Users can always see their own tasks
router.get('/user/:userId', checkPermission('tasks', 'read'), taskController.getUserTasks);
router.get('/:taskId', checkPermission('tasks', 'read'), taskController.getTaskById);
router.put('/:taskId', checkPermission('tasks', 'update'), taskController.updateTask);
router.delete('/:taskId', checkPermission('tasks', 'delete'), taskController.deleteTask);

// Task status and assignment routes
router.patch('/:taskId/status', checkPermission('tasks', 'update'), taskController.updateTaskStatus);
router.patch('/:taskId/assign', checkPermission('tasks', 'update'), taskController.assignTask);
router.patch('/:taskId/progress', checkPermission('tasks', 'update'), taskController.updateProgress);
router.patch('/:taskId/block', checkPermission('tasks', 'update'), taskController.toggleTaskBlock);
router.patch('/:taskId/urgency', checkPermission('tasks', 'update'), taskController.toggleTaskUrgency);

// Task communication routes
router.post('/:taskId/comments', checkPermission('tasks', 'update'), taskController.addComment);
router.post('/:taskId/revisions', checkPermission('tasks', 'update'), taskController.addRevisionNote);

// File upload routes
router.post('/:taskId/attachments', checkPermission('tasks', 'update'), taskController.uploadAttachment);
router.post('/:taskId/deliverables', checkPermission('tasks', 'update'), taskController.uploadDeliverable);

// Legacy routes for backward compatibility
router.get('/designer/tasks', taskController.getDesignerTasks);
router.post('/:taskId/files', taskController.uploadTaskFile);

export default router;