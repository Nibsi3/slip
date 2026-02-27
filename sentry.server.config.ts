import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,

  beforeSend(event) {
    // Never send passwords or tokens to Sentry
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      delete data.password;
      delete data.token;
      delete data.totpCode;
    }
    return event;
  },
});
