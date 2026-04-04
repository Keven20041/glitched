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

// Some browser extensions inject non-React attributes (for example fdprocessedid)
// before hydration, which causes server/client attribute mismatches.
(function sanitizeHydrationAttributes() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const stripFdProcessedId = (root: ParentNode) => {
    const nodes = root.querySelectorAll("[fdprocessedid]");
    nodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        node.removeAttribute("fdprocessedid");
      }
    });
  };

  // Run immediately for any attributes already injected.
  stripFdProcessedId(document);

  // Keep stripping briefly during startup in case extensions mutate after parse.
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.attributeName === "fdprocessedid") {
        if (mutation.target instanceof HTMLElement) {
          mutation.target.removeAttribute("fdprocessedid");
        }
      }

      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.hasAttribute("fdprocessedid")) {
              node.removeAttribute("fdprocessedid");
            }
            stripFdProcessedId(node);
          }
        });
      }
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["fdprocessedid"],
  });

  window.setTimeout(() => {
    observer.disconnect();
  }, 10000);
})();
