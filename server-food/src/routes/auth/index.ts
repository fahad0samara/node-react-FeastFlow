import express from 'express';
import authRouter from './authRoutes';
import googleAuthRouter from './googleAuth';

const router = express.Router();

router.use('/', authRouter);
router.use('/', googleAuthRouter);

export default router;
