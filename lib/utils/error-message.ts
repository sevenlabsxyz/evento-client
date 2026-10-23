/**
 * Extract a readable message from an unknown thrown value.
 *
 * Supabase/PostgREST rejections are plain objects (`PostgrestError`), so they
 * are not `instanceof Error` and `String(error)` renders as "[object Object]".
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const { message, details, hint, code } = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    if (typeof message === 'string' && message.length > 0) {
      const context = [details, hint, code]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .join(' | ');

      return context ? `${message} (${context})` : message;
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== '{}') {
        return serialized;
      }
    } catch {
      // Circular or non-serializable value; fall back to String().
    }
  }

  return String(error);
}
