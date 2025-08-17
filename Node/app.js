// app.js - Updated with daily reports
import express from "express"; // Importing express for the web framework
import bodyParser from "body-parser"; // Importing bodyParser for parsing request bodies
import ejsLayouts from "express-ejs-layouts"; // Importing express-ejs-layouts for layout support
import path from "path"; // Importing express-ejs-layouts for layout support
import dotenv from "dotenv"; // Importing dotenv to load environment variables
import session from "express-session"; // Importing express-session for session management
import passport from "passport"; // Importing passport for authentication
import { Strategy as GoogleStrategy } from "passport-google-oauth20"; // Importing Google OAuth 2.0 strategy for passport

import cors from 'cors';
import { connectUsingMongoose } from "./config/mongodb.js"; // Importing MongoDB connection function
import redisService from './config/redis.js'; // Importing Redis service
import authrouter from "./routes/authRoutes.js"; // Importing authentication routes

//importer les routes
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js'; 
import taskRoutes from './routes/taskRoutes.js';
import paymentPlanRoutes from './routes/paymentPlanRoutes.js';
import protect from "./middleware/authMiddleware.js";
import zrexpressRoutes from "./routes/zrexpressRoutes.js" 
import verificationRoutes from "./routes/verificationRoutes.js"
import transactionRoutes from './routes/transactionRoutes.js';
import suggestedClientRoutes from './routes/suggestedClientRoutes.js'; // ADD THIS LINE
import serviceRoutes from './routes/services.js';
import telegramRoutes from './routes/telegramRoutes.js'; // NEW: Import Telegram routes
import dailyReportRoutes from './routes/dailyReportRoutes.js'; // NEW: Import Daily Report routes
import reportRoutes from './routes/reportRoutes.js'; // NEW: Import Report routes
import { startScheduledTasks } from "./scheduleTask.js";
import creditRoutes from './routes/creditRoutes.js'; // NEW: Import Daily Report routes
import clientRoutes from './routes/clientRoutes.js'; // NEW: Import Client routes
import salaryRoutes from './routes/salaryRoutes.js'; // NEW: Import Salary routes


dotenv.config(); // Loading environment variables from .env file
const app = express(); // Initializing express application

//SESSION
app.use(
  session({
    secret: process.env.Secret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(cors({
  origin: ['http://localhost:5173','http://3.239.221.215','http://www.mazedz.com','http://mazedz.com','https://www.mazedz.com','https://mazedz.com'], // Your React app URL
  credentials: true 
}));

//MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

//Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.API_URL || 'http://localhost:3001'}/auth/google/callback`,
      scope: ["profile", "email"],
    },
    function (accessToken, refreshToken, profile, callback) {
      console.log('Google OAuth Profile:', profile); // Add logging for debugging
      callback(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// DB and Cache Connections
const initializeServices = async () => {
  try {
    // Connect to MongoDB
    await connectUsingMongoose();
    console.log('✅ MongoDB connected successfully');
    
    // Connect to Redis (optional - app will work without Redis)
    const redisConnected = await redisService.connect();
    if (redisConnected) {
      console.log('✅ Redis connected successfully - Caching enabled');
    } else {
      console.log('⚠️ Redis connection failed - Running without cache');
    }
    
    // Start scheduled tasks including daily reports
    startScheduledTasks();
    console.log('✅ Scheduled tasks started');
    
  } catch (err) {
    console.error('❌ Failed to initialize services:', err);
    // Don't exit - let the app run without Redis if needed
  }
};

initializeServices();

//ROUTES
app.get("/", (req, res) => {
  res.send("Hey Ninja ! Go to /auth/signin for the login page.");
});

app.use("/auth", authrouter);
app.use('/orders',orderRoutes);
app.use('/payments', paymentRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/tasks', taskRoutes);
app.use('/payment-plans', paymentPlanRoutes);
app.use("/users", userRoutes)
app.use('/api/zrexpress', zrexpressRoutes);
app.use('/suggested-clients', suggestedClientRoutes);
app.use(verificationRoutes)
app.use('/transactions', transactionRoutes);
app.use('/services', serviceRoutes);
app.use('/telegram', telegramRoutes);
app.use('/daily-reports', dailyReportRoutes); // NEW: Add Daily Report routes
app.use('/reports', reportRoutes); // NEW: Add Report routes
app.use('/credits', creditRoutes);// Dynamically import credit routes
app.use('/api/clients', clientRoutes); // NEW: Add Client routes
app.use('/api', salaryRoutes); // NEW: Add Salary routes

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

//LISTEN
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server is running on port ${process.env.PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  try {
    await redisService.disconnect();
    console.log('✅ Redis disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting Redis:', error.message);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  
  try {
    await redisService.disconnect();
    console.log('✅ Redis disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting Redis:', error.message);
  }
  
  process.exit(0);
});

export default app;