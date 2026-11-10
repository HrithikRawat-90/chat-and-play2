import express from 'express';
import { getUsers, getUserById } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All user search/profile routes are protected

router.get('/', getUsers);
router.get('/:id', getUserById);

export default router;

