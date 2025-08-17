import express from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/authController.js';

const router = express.Router();
const authController = new AuthController();

// Regular auth routes
router.get('/signup', authController.getSignUpPage);
router.get('/signin', authController.getSignInPage);
router.get('/homepage', authController.homePage);
router.get('/signout', authController.logoutUser);
router.get('/forgot-password', authController.getForgotPassword);
router.get('/change-password', authController.getChangePassword);

router.post('/signup', authController.createUser);
router.post('/signin', authController.signInUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/change-password', authController.changePassword);

// Google OAuth routes
router.get("/google",
    passport.authenticate('google', {
        scope: ['email', 'profile']
    })
);

router.get("/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/auth/login/failed",
        session: true
    }),
    authController.handleCallback
);

router.get("/login/success", authController.signInSuccess);
router.get("/login/failed", authController.signInFailed);

// Debug route (remove in production)
router.get("/debug", authController.debugAuth);

export default router;
