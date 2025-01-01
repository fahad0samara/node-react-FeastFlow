import express from 'express';
import { authController } from '../controllers/AuthController';
import { validate } from '../middleware/validate';
import { authValidation } from '../validation/auth.validation';

const router = express.Router();

// Authentication routes
router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/google', authController.googleLogin);

export default router;
