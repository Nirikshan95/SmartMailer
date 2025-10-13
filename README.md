# Email Automation Tool

An efficient email automation solution built with Node.js, React, and Vite. This tool allows you to send personalized emails at scale while respecting email sending limits to maintain good sender reputation.

## Features

-  Fast and responsive UI with React and Vite
-  SMTP-based email sending with Gmail support
-  Built-in rate limiting (daily and hourly limits)
-  Real-time email statistics tracking
-  Automatic storage cleanup to prevent storage issues
-  Personalized email templates
-  CSV-based recipient management

## Prerequisites

- Node.js (version 14 or higher)
- A Gmail account (or other SMTP provider)
- Google App Password (for Gmail)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure SMTP Settings

The application uses Gmail SMTP by default. To send emails, you'll need to generate an App Password:

1. Visit [Google App Passwords](https://support.google.com/accounts/answer/185833)
2. Sign in to your Google Account
3. Navigate to Security settings
4. Enable 2-Step Verification if not already enabled
5. Generate an App Password specifically for this email automation tool
6. Use this App Password in the application instead of your regular Gmail password

### 3. Start the Application

```bash
# Start the backend server
node server.js

# In a new terminal, start the frontend development server
npm run dev
```

The application will be available at `http://localhost:5173` (frontend) and the API server at `http://localhost:3001` (backend).

## Usage

1. Prepare your recipient list in CSV format with columns: name, email, company
2. Load your CSV file in the application
3. Customize the email template with personalized variables
4. Configure your SMTP settings (Gmail recommended)
5. Set your daily and hourly email limits
6. Start sending personalized emails

## Configuration

The application can be configured via `config.json`:

```json
{
  "emailLimits": {
    "maxPerDay": 400,
    "maxPerHour": 50
  },
  "smtp": {
    "gmail": {
      "server": "smtp.gmail.com",
      "port": 587
    }
  },
  "defaultValues": {
    "name": "Hiring Manager",
    "company": "your company"
  },
  "retry": {
    "maxAttempts": 3,
    "delayMs": 5000
  }
}
```

## Rate Limiting

To maintain good sender reputation and comply with email provider policies:

- Daily limit: 400 emails per calendar day
- Hourly limit: 50 emails per hour

These limits help prevent your emails from being marked as spam.

## Storage Management

The application automatically manages storage by cleaning up old records:
- When daily records exceed 40 days, the oldest 10 days are automatically removed
- Hourly records are cleaned up along with their associated daily records
- This prevents storage issues and maintains optimal performance

## Security Best Practices

1. **Use App Passwords**: Never use your regular Gmail password. Always generate a dedicated App Password.
2. **Secure Configuration**: The `config.json` file contains sensitive information and is excluded from version control.
3. **Respect Limits**: Adhere to the configured email limits to maintain good sender reputation.

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Ensure you're using an App Password, not your regular Gmail password
2. **Rate Limit Exceeded**: Wait until the next hour/day for limits to reset
3. **Email Not Sending**: Check your SMTP configuration and internet connection

### Getting Help

If you encounter issues with App Passwords, visit the [Google App Passwords Help Page](https://support.google.com/accounts/answer/185833).

