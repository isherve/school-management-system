# Email & login OTP (SMTP)

EduSMS sends **login codes**, **password reset links**, and **account notifications** via SMTP.

## Gmail (recommended for demos)

1. Enable 2-Step Verification on your Google account.
2. Create an **App Password**: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Edit `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM="EduSMS <your@gmail.com>"
FRONTEND_URL=http://localhost:8080
```

4. Restart the backend: `npm run dev` (from project root) or `npm run dev --prefix backend`.

## Verify configuration

- Open **Settings → Email & OTP** in the admin dashboard (staff only).
- Status should show **Email configured: Yes**.
- Test: Login → **Email Code** tab → enter a registered user email (e.g. `admin@demoschool.edu`).

## Development without SMTP

If `SMTP_USER` is empty:

- Codes are logged in the backend console: `[Login Code] email: 123456`
- In development, the **6-digit code also appears on the login screen** after you request it.

## Security notes

- Never commit `.env` or real passwords to git.
- Use App Passwords, not your main Gmail password.
- OTP codes expire in **10 minutes** and are stored hashed in the database.
