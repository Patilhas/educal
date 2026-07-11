import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    globals: false,
    // Pinned so date-fns/date-holidays day-of-week checks and ISO-string
    // assertions are deterministic regardless of the host machine's timezone.
    env: {
      TZ: "UTC",
    },
    coverage: {
      provider: "v8",
      include: [
        "server/calendar/rules/**/*.ts",
        "server/auth/crypto.ts",
        "shared/calendar/academic-year.ts",
        "server/shared/authorize.ts",
        "server/notifications/services/notification.service.ts",
      ],
      exclude: [
        "server/calendar/rules/**/*.test.ts",
        "server/calendar/rules/definitions/__fixtures__/**",
      ],
    },
  },
});
