// Retry Handler with Exponential Backoff
// Improves reliability of API calls and async operations

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

export class RetryHandler {
  private static defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    jitter: true, // Add randomness to prevent thundering herd
    onRetry: () => {},
    shouldRetry: (error: Error) => {
      // Retry on network errors and 5xx server errors
      return (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT')
      );
    }
  };

  /**
   * Execute an async function with retry logic
   */
  static async execute<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error;
    let delay = opts.initialDelay;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (attempt === opts.maxRetries || !opts.shouldRetry(lastError)) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);

        // Add jitter if enabled
        if (opts.jitter) {
          delay = delay * (0.5 + Math.random());
        }

        console.log(`⚠️ Retry attempt ${attempt + 1}/${opts.maxRetries} after ${Math.round(delay)}ms`, lastError.message);

        // Call onRetry callback
        opts.onRetry(attempt + 1, lastError);

        // Wait before retry
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Sleep helper
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry with circuit breaker pattern
   */
  static async executeWithCircuitBreaker<T>(
    fn: () => Promise<T>,
    options?: RetryOptions & {
      failureThreshold?: number;
      recoveryTimeout?: number;
    }
  ): Promise<T> {
    const failureThreshold = options?.failureThreshold || 5;
    const recoveryTimeout = options?.recoveryTimeout || 60000; // 1 minute

    // Simple circuit breaker state (in production, use a proper circuit breaker library)
    let failures = 0;
    let lastFailureTime = 0;
    let circuitOpen = false;

    // Check if circuit is open
    if (circuitOpen) {
      const timeSinceLastFailure = Date.now() - lastFailureTime;
      if (timeSinceLastFailure < recoveryTimeout) {
        throw new Error('Circuit breaker is open - service unavailable');
      }
      circuitOpen = false;
      failures = 0;
    }

    try {
      const result = await this.execute(fn, options);
      failures = 0;
      return result;
    } catch (error) {
      failures++;
      lastFailureTime = Date.now();

      if (failures >= failureThreshold) {
        circuitOpen = true;
        console.error('🔌 Circuit breaker opened due to repeated failures');
      }

      throw error;
    }
  }
}

// Convenience function for simple retry
export async function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return RetryHandler.execute(fn, options);
}
