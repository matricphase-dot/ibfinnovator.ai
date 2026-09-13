import * as Sentry from "@sentry/nextjs";
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: dsn?.length ? 0.1 : 0,
});
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
