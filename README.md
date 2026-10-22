# Smart Queue Customer Web

Production-oriented responsive customer PWA for iPhone Safari and desktop/mobile browsers. It uses the same NestJS API and customer accounts as the Android Expo app.

## Included

- Email registration, OTP verification and login
- Nearby shop discovery, search and 1 km queue restriction
- Shop details, seating selection and queue joining
- Active queues, live 15-second refresh, cancellation and full queue history
- Secure shop-specific QR scanning through the browser camera
- Live location map and shop navigation
- Server notifications, unread badge and read/delete actions
- Account, profile, password, settings, install guide and support
- Responsive desktop/mobile UI, iPhone safe areas, PWA manifest and service worker

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. Camera and geolocation require HTTPS in production (localhost is allowed for development).

## Production

Deploy the folder to Vercel and configure:

```text
NEXT_PUBLIC_API_URL=https://smart-q-backend-nestjs.onrender.com/api
```

The NestJS backend must allow the production website origin in CORS. On iPhone, open the HTTPS site in Safari and use **Share → Add to Home Screen**.
