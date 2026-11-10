import express from 'express';
import {
  getUsers,
  getUserById,
  toggleBlockUser,
  getBlockedUsers,
  reportUser,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All user routes are protected

router.get('/', getUsers);
router.get('/me/blocked', getBlockedUsers);
router.post('/block/:id', toggleBlockUser);
router.post('/report', reportUser);
router.get('/:id', getUserById);

export default router;

