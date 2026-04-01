// Provide missing Performance APIs before hydration for environments where they are absent.
(function installPerformancePolyfill() {
  if (typeof window === "undefined") return;

  const perf = window.performance;
  if (!perf) return;

  const noop = () => {};

  const ensureCallable = (name: "clearMarks" | "clearMeasures") => {
    if (typeof perf[name] === "function") return;

    try {
      Object.defineProperty(perf, name, {
        configurable: true,
        writable: true,
        value: noop,
      });
    } catch {
      // Ignore and continue to other fallbacks.
    }

    if (typeof perf[name] === "function") return;

    try {
      (perf as Performance & Record<string, unknown>)[name] = noop;
    } catch {
      // Ignore and continue to other fallbacks.
    }

    if (typeof perf[name] === "function") return;

    try {
      const proto = Object.getPrototypeOf(perf);
      if (proto && typeof proto[name] !== "function") {
        Object.defineProperty(proto, name, {
          configurable: true,
          writable: true,
          value: noop,
        });
      }
    } catch {
      // Ignore failures in locked-down environments.
    }
  };

  ensureCallable("clearMarks");
  ensureCallable("clearMeasures");
})();
