import express from 'express';
import { UserController } from '../controllers/userController.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import protect from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../utils/fileUpload.js'; // Import the multer configuration


const router = express.Router();
const userController = new UserController();

router.use(protect);

// User routes
router.get('/', checkPermission('users', 'read'), userController.getAllUsers);
router.post('/', checkPermission('users', 'create'), userController.createUser);
router.put('/:id', checkPermission('users', 'update'), userController.updateUser);
router.delete('/:id', checkPermission('users', 'delete'), userController.deactivateUser);

// Additional routes from your controller
router.get('/profile', userController.getProfile);
router.get('/call-stats', userController.getCallStats);
router.put('/:id/role', checkPermission('users', 'update'), userController.updateRole);
router.put('/:id/password', userController.updatePassword);
router.get('/:id', checkPermission('users', 'read'), userController.getUser);
router.post('/avatar', uploadAvatar.single('avatar'), userController.uploadAvatar);

// Get users by role
router.get('/role/:role', checkPermission('users', 'read'), userController.getUsersByRole);


export default router;