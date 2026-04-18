export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string' &&
    (error as { message?: string }).message?.trim()
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}
