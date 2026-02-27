import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV,

  beforeSend(event) {
    // Strip PII from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((b) => {
        if (b.data?.url) {
          try {
            const url = new URL(b.data.url);
            url.searchParams.delete("token");
            url.searchParams.delete("password");
            b.data.url = url.toString();
          } catch {
            // ignore
          }
        }
        return b;
      });
    }
    return event;
  },
});
