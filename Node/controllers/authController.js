import mongoose from "mongoose";
import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { transporter } from "../config/nodemailerConfig.js";
import dotenv from "dotenv";

dotenv.config();

// Updated token generation to explicitly include role
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id,
            email: user.email,
            role: user.role || 'CLIENT'  // Ensure role is included with default fallback
        },
        process.env.Secret || 'your-secret-key',
        { expiresIn: '24h' }
    );
};

export class AuthController {
    getSignUpPage = (req, res) => {
        res.status(200).json({ message: "Signup page" });
    }

    getSignInPage = (req, res) => {
        res.status(200).json({ message: "Signin page" });
    }

    homePage = (req, res) => {
        const email = req.session.userEmail;
        if (!email) {
            return res.status(401).json({ message: "Please sign in to view the homepage" });
        }
        res.status(200).json({ message: "Homepage", email });
    }

    getForgotPassword = (req, res) => {
        res.status(200).json({ message: "Forgot password page" });
    }

    getChangePassword = (req, res) => {
        const email = req.session.userEmail;
        if (!email) {
            return res.status(401).json({ message: "Please sign in to change the password" });
        }
        res.status(200).json({ message: "Change password page" });
    }

    logoutUser = (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error signing out:', err);
                res.status(500).json({ message: 'Error signing out' });
            } else {
                res.status(200).json({ message: "Logged out successfully" });
            }
        });
    }

    // Updated createUser to ensure role is set and included in response
    createUser = async (req, res) => {
        const { username, email, password, cpassword, role = 'CLIENT' } = req.body;
        if (password !== cpassword) {
            return res.status(400).json({ message: "Passwords don't match" });
        }
        
        try {
            const existingUser = await User.findOne({ email: email });
            if (existingUser) {
                return res.status(400).json({ message: "User already exists" });
            }

            const newUser = new User({ 
                username, 
                email, 
                password: password,  // Don't hash here - let the model middleware handle it
                role // Use provided role or default to CLIENT
            });
            await newUser.save();
            
            const token = generateToken(newUser);
            res.status(201).json({ 
                message: "User created successfully",
                user: {
                    email: newUser.email,
                    username: newUser.username,
                    role: newUser.role
                },
                token
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Updated signInUser to include role in response
    signInUser = async (req, res) => {
        const { email, password } = req.body;

        try {
            const existingUser = await User.findOne({ email: email });
            
            if (!existingUser) {
                return res.status(404).json({ message: "User doesn't exist" });
            }
        
            const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
            
            if (!isPasswordCorrect) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            const token = generateToken(existingUser);
            req.session.userEmail = email;
            
            res.status(200).json({ 
                message: "Logged in successfully",
                user: {
                    email: existingUser.email,
                    username: existingUser.username,
                    role: existingUser.role
                },
                token
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    forgotPassword = async (req, res) => {
        const { email } = req.body;
        try {
            const existingUser = await User.findOne({ email: email });
            if (!existingUser) {
                return res.status(404).json({ message: "User doesn't exist" });
            }

            const newPassword = Math.random().toString(36).slice(-8);

            try {
                await transporter.sendMail({
                    from: process.env.EMAIL,
                    to: email,
                    subject: 'Password Reset',
                    text: `Your new password is: ${newPassword}`
                });
            } catch (error) {
                return res.status(500).json({ message: "Error sending email: " + error.message });
            }

            existingUser.password = newPassword;  // Let the model middleware hash it
            await existingUser.save();
            
            res.status(200).json({ message: "New password sent to your email" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    changePassword = async (req, res) => {
        const { oldPassword, newPassword } = req.body;
        try {
            const email = req.session.userEmail;
            if (!email) {
                return res.status(401).json({ message: "Please sign in first" });
            }

            const existingUser = await User.findOne({ email: email });
            if (!existingUser) {
                return res.status(404).json({ message: "User doesn't exist" });
            }

            const isPasswordCorrect = await bcrypt.compare(oldPassword, existingUser.password);
            if (!isPasswordCorrect) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }

            existingUser.password = newPassword;  // Let the model middleware hash it
            await existingUser.save();
            
            const token = generateToken(existingUser);
            res.status(200).json({ 
                message: "Password changed successfully",
                token 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Updated signInSuccess to include role in response
    signInSuccess = async (req, res) => {
        try {
            console.log('SignInSuccess called, req.user:', req.user); // Add debugging log
            console.log('Session data:', req.session); // Add session debugging
            
            if (!req.user) {
                console.log('No user data in request'); // Debug log
                return res.status(403).json({
                    success: false,
                    message: "Authentication failed: No user data received"
                });
            }
            
            const userData = req.user._json;
            console.log('User data from Google:', userData); // Debug log
            
            const { email, name, sub } = userData;
            if (!email) {
                console.log('No email in user data'); // Debug log
                return res.status(403).json({
                    success: false,
                    message: "Not Authorized - Email required"
                });
            }

            let user = await User.findOne({ email: email });
            if (!user) {
                console.log('Creating new user for:', email); // Debug log
                user = new User({
                    username: name || email.split('@')[0], // Fallback username
                    email: email,
                    password: sub,
                    authProvider: 'google',
                    role: 'CLIENT' // Default role for Google auth users
                });
                await user.save();
                console.log('New user created'); // Debug log
            }

            const token = generateToken(user);
            req.session.userEmail = email;
            
            console.log('Authentication successful for:', email); // Debug log
            
            return res.status(200).json({
                success: true,
                message: "Successfully authenticated with Google",
                user: {
                    email: user.email,
                    username: user.username,
                    role: user.role
                },
                token
            });
        } catch (error) {
            console.error('Google Sign In Error:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error during Google authentication"
            });
        }
    }

    signInFailed = (req, res) => {
        res.status(401).json({
            success: false,
            message: "Google authentication failed"
        });
    }

    // Updated handleCallback to include user role in token
    handleCallback = async (req, res) => {
        try {
            if (!req.user) {
                return res.redirect(`${process.env.CLIENT_URL}/auth/signin?error=Google authentication failed`);
            }
            const email = req.user._json.email;
            req.session.userEmail = email;
            
            const user = await User.findOne({ email });
            const token = generateToken(user);
            
            res.redirect(`${process.env.CLIENT_URL}/homepage?token=${token}`);
        } catch (error) {
            console.error('Google Callback Error:', error);
            res.redirect(`${process.env.CLIENT_URL}/auth/signin?error=Authentication error`);
        }
    }

    // Debug endpoint to check authentication status
    debugAuth = (req, res) => {
        res.status(200).json({
            session: req.session,
            user: req.user,
            isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
            sessionID: req.sessionID
        });
    }
}