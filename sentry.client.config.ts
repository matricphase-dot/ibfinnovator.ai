import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://3a353bbe5a2c739ad3167c29db8f550d@o4511148548161536.ingest.us.sentry.io/4511148549865472";

if (dsn && !Sentry.getClient()) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  });
}
