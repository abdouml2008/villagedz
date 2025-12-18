/**
 * Development-only logger utility
 * Prevents sensitive information from being logged in production
 */
export const logger = {
  log: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(message, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.error(message, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn(message, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.info(message, ...args);
    }
  }
};
