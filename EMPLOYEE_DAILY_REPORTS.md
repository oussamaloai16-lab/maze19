# Employee Daily Report System

## Overview
A comprehensive daily reporting system where employees can submit daily work reports that are automatically sent to Telegram at 11:00 PM.

## Features Implemented

### Backend (Node.js)
- **Report Model**: Added `employee_daily_report` type to support employee submissions
- **API Endpoints**: 
  - `POST /daily-reports/employee/submit` - Submit/update daily report
  - `GET /daily-reports/employee/my-today` - Get current user's today report
  - `GET /daily-reports/employee/all` - Get all employee reports (admin only)
- **Scheduled Task**: Automatic Telegram sending at 11:00 PM daily
- **Database**: All reports are preserved with full history

### Frontend (React)
- **EmployeeDailyReport Component**: Clean interface for report submission
- **Navigation**: Added "Daily Report" menu item in sidebar
- **Authentication**: Integrated with existing auth system
- **API Service**: Dedicated service for daily report API calls

### Telegram Integration
- **Format**: `👤 Employee Name (Role)\n📝 Report content...`
- **Schedule**: Sends automatically at 11:00 PM every day
- **Persistence**: Previous reports never disappear
- **Fallback**: Sends notification if no reports submitted

## Usage Instructions

### For Employees
1. Navigate to "Daily Report" in the sidebar
2. Write your daily work summary
3. Submit before 11:00 PM (can update multiple times)
4. Report automatically sent to Telegram at 11:00 PM

### For Admins
- All employee reports are visible in the Reports section
- Reports include employee name, role, date, and content
- Full history is maintained in the database

## API Endpoints

### Submit Daily Report
```http
POST /daily-reports/employee/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Today I handled 15 customer calls...",
  "summary": "Customer service and appointments"
}
```

### Get Today's Report
```http
GET /daily-reports/employee/my-today
Authorization: Bearer <token>
```

### Get All Employee Reports (Admin)
```http
GET /daily-reports/employee/all?date=2024-01-15&page=1&limit=10
Authorization: Bearer <token>
```

## Telegram Message Format

```
📋 Daily Reports - 1/15/2024

👤 Habiba (RECEPTIONIST)
📝 Today I handled 15 customer calls, scheduled 8 appointments, and processed 3 new client registrations. Resolved 2 customer complaints successfully.

👤 Ahmed (CLOSER)
📝 Made 25 cold calls, validated 3 potential clients, generated 2 qualified leads. Updated CRM with new prospects and scheduled follow-ups.

📊 Total reports: 2
```

## Database Schema

The reports are stored with:
- `reportId`: Unique identifier
- `type`: 'employee_daily_report'
- `content`: Main report content
- `summary`: Optional brief summary
- `employeeInfo`: Employee ID, name, and role
- `reportDate`: Date of the report
- `telegramInfo`: Tracking of Telegram delivery

## Security

- All API endpoints require authentication
- Users can only submit/view their own reports
- Admins can view all reports
- Reports are tied to specific users and dates
- JWT token validation on all requests

## Scheduled Task

The system runs a cron job at 11:00 PM daily (`0 23 * * *`) that:
1. Fetches all employee reports for the current day
2. Formats them for Telegram
3. Sends to the configured Telegram group
4. Updates delivery status in database
5. Sends notification if no reports found

This ensures that managers receive daily updates from all team members in a consistent, organized format. 