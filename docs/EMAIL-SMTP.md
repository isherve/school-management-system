# Email & login OTP (SMTP)

EduSMS sends **login verification codes**, **password reset links**, and **account notifications** via SMTP.

## Production (mandatory)

On **production** (`NODE_ENV=production`), login **cannot** send codes unless SMTP is fully configured. There is **no on-screen dev code** in production.

Required on the **API** Vercel project (`school-management-system-api`):

| Variable | Example |
|----------|---------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `ishimwehervin10@gmail.com` |
| `SMTP_PASS` | Gmail **App Password** (16 characters) |
| `EMAIL_FROM` | `EduSMS <ishimwehervin10@gmail.com>` |

After saving variables, **redeploy** the API project.

## Gmail App Password

1. Enable 2-Step Verification on your Google account.
2. Create an **App Password**: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Paste the password into **`SMTP_PASS`** (not your normal Gmail password).

## Local development

Copy `backend/.env.example` to `backend/.env` and set `SMTP_*`. Without SMTP, codes are logged in the console and shown on the login page **in development only**.

## Verify

- **Settings → Email & OTP** (staff): should show configured.
- **Login → Password**: after password, a code must arrive by email (production).

## Security

- Never commit `.env` or app passwords to git.
- OTP codes expire in **10 minutes** and are stored hashed in the database.
