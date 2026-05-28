const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
const catchAsyncMethod = (fn) => {
  return function(...args) {
    return Promise.resolve(fn.apply(this, args)).catch(args[args.length - 1]);
  };
};
const wrapAsyncMethods = (obj) => {
  const wrapped = {};
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'function') {
      wrapped[key] = catchAsync(obj[key]);
    } else {
      wrapped[key] = obj[key];
    }
  }
  return wrapped;
};
const wrapRouter = (router) => {
  const originalRoute = router.route;
  router.route = function(path) {
    const route = originalRoute.call(this, path);
    const originalMethods = {};
    ['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
      originalMethods[method] = route[method];
      route[method] = function(...handlers) {
        const wrappedHandlers = handlers.map(handler => {
          if (typeof handler === 'function' && handler.constructor.name === 'AsyncFunction') {
            return catchAsync(handler);
          }
          return handler;
        });
        return originalMethods[method].call(this, ...wrappedHandlers);
      };
    });
    return route;
  };
  return router;
};
const safeAsync = (fn) => {
  return async (...args) => {
    try {
      return { success: true, data: await fn(...args), error: null };
    } catch (error) {
      return { success: false, data: null, error };
    }
  };
};
const safeAsyncWithDefault = (fn, defaultValue = null) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Safe async error:', error.message);
      return defaultValue;
    }
  };
};
const withRetry = (fn, maxRetries = 3, delayMs = 1000) => {
  return async (...args) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }
    throw lastError;
  };
};
const withTimeout = (fn, timeoutMs = 30000) => {
  return async (...args) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    return await Promise.race([fn(...args), timeoutPromise]);
  };
};
const debounceAsync = (fn, waitMs = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    return new Promise((resolve, reject) => {
      timeout = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, waitMs);
    });
  };
};
const throttleAsync = (fn, limitMs = 1000) => {
  let lastCall = 0;
  let pending = null;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limitMs) {
      lastCall = now;
      return fn(...args);
    }
    if (!pending) {
      const timeLeft = limitMs - (now - lastCall);
      pending = new Promise((resolve, reject) => {
        setTimeout(async () => {
          pending = null;
          lastCall = Date.now();
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, timeLeft);
      });
    }
    return pending;
  };
};
const createAsyncQueue = () => {
  let queue = Promise.resolve();
  return {
    add: (fn) => {
      queue = queue.then(() => fn());
      return queue;
    },
    wait: () => queue
  };
};
module.exports = {
  catchAsync,
  catchAsyncMethod,
  wrapAsyncMethods,
  wrapRouter,
  safeAsync,
  safeAsyncWithDefault,
  withRetry,
  withTimeout,
  debounceAsync,
  throttleAsync,
  createAsyncQueue
};
