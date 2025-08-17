# Maze Platform BTEA

## Overview
Maze Platform BTEA is a web-based system that streamlines order management, user authentication, and payment processing while integrating third-party APIs and AI chatbot models.

## Technologies Used
- **Frontend:** React.js, Bootstrap
- **Backend:** Node.js
- **Database:** PostgreSQL / MongoDB / Amazon Redshift
- **Cloud Provider:** Google Cloud
- **Analytics:** Google Analytics
- **Security:** OAuth2, SSL/TLS, Cloudflare
- **AI Integration:** Chatbot Model

## Key Features
### User Authentication & Role-Based Access Control (RBAC)
- Sign-up, login, and profile management
- Role-based access control (Super Admin, Receptionist, Accountant, etc.)

### Order Management
- Create, view, and track orders
- Manage order details, shipping addresses, COD amount, and order statuses
- Automatic integration with maze API for shipping

### Cash on Delivery (COD)
- Clients define COD amount
- System calculates shipping costs & total COD
- Unique ID assigned to each client

### Admin Panel
- Manage orders, clients, and shipping details
- View reports & analytics

## Roles & Permissions
1. **Super Admin** - Full access, manage users, view reports
2. **Chef de Bureau** - Approves shipments & payments
3. **Receptionist** - Adds orders, schedules appointments
4. **Graphic Designer** - Uploads work, chats with clients
5. **Confirmation Team** - Confirms unverified orders
6. **Accountant** - Manages financial transactions

## Database Structure
### Tables
- **Users:** Stores client details & roles
- **Orders:** Stores order information
- **Payments:** Tracks payments
- **Tasks:** Stores design tasks
- **Appointments:** Tracks service schedules
- **Commissions:** Manages commissions per order

## Third-Party API Integrations
- **Google Calendar API** - For scheduling appointments
- **Payment Gateway (Stripe/PayPal)** - For transactions
- **Chat System (WebSockets / Socket.io / Pusher)** - Real-time chat

## Frontend Development
- Role-based dashboards
- Forms for order management
- Integrated chat system
- Payment interface for approving transactions

## Backend Development
- JWT / OAuth2 authentication
- Secure file upload system
- Order & Payment management API
- Google Calendar API integration

## Deployment & Maintenance
- Hosted on **Google Cloud**
- CI/CD pipelines for automated deployment
- Monitoring tools: **New Relic, Sentry**

## Workflow Summary
1. **Receptionist** - Adds order, schedules appointments
2. **Graphic Designer** - Uploads work & tracks time
3. **Chef de Bureau** - Validates shipments, approves payments
4. **Confirmation Team** - Confirms orders, tracks commissions
5. **Accountant** - Manages financial transactions
6. **Super Admin** - Oversees entire system

## Payment Plans
### Default Plans
- **Basic Plan (35,000 DZD):**
  - 1 product, 50 confirmations, 2 creatives, 2 hours of shooting
  - 15% commission on net profit
- **Luxury Plan (78,000 DZD):**
  - 3 products, 50 confirmations, 5 creatives, 2 hours per product
  - 20% commission on net profit

### Payment Structure
- **50% upfront** upon signup
- **50% at the end** of job completion
- Notifications for upcoming payments

## Example Scenarios
### Basic Plan Client
- Pays **17,500 DZD** upfront
- Receives services & pays **17,500 DZD** at the end

### Luxury Plan Client
- Pays **39,000 DZD** upfront
- Receives services & pays **39,000 DZD** at the end

## Installation & Setup
### Prerequisites
- Node.js
- PostgreSQL/MongoDB
- Google Cloud Account
- Stripe/PayPal Account (for payments)

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/DanaAmine/maze_marketing
   cd maze-platform-btea
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (`.env` file):
   ```plaintext
   DATABASE_URL=your_database_url
   GOOGLE_CLOUD_API_KEY=your_google_api_key
   PAYMENT_GATEWAY_KEY=your_payment_gateway_key
   ...
   ```
4. Run the project:
   ```bash
   npm start
   ```

## Contribution Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature-branch`)
3. Commit changes (`git commit -m "Added new feature"`)
4. Push to GitHub (`git push origin feature-branch`)
5. Create a pull request

## License
This project is licensed under the MIT License.

