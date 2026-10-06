(function () {
  // Why a separate engine from motion.js: that file is the reveal contract
  // and is deliberately observer-only (fade-in-text-contract.test.ts asserts
  // no scroll listener). Scroll-linked depth is a different job with a
  // different lifetime — it runs for the whole session, in both directions —
  // so it gets its own file and never touches the reveal timings.
  if (window.__novaScrollDepth) return;
  window.__novaScrollDepth = true;

  var DEPTH_ATTR = 'data-scroll-depth';
  var items = [];
  var observer = null;
  var rafId = 0;
  var lastY = -1;
  var lastHeight = -1;
  var cachedLimit = -1;

  function isReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isDisabled() {
    var root = document.documentElement;
    return root.hasAttribute('data-motion-disabled') || root.hasAttribute('data-motion-static');
  }

  // Why: motion runs from position, not direction. A value derived from where
  // the element sits relative to the viewport centre is automatically correct
  // scrolling down AND scrolling back up, with no separate up/down branch and
  // no state to get out of sync when the user reverses mid-gesture.
  function compute() {
    var viewportHeight = window.innerHeight;
    if (!viewportHeight) return;

    for (var index = 0; index < items.length; index += 1) {
      var item = items[index];
      if (!item.visible) continue;

      var rect = item.element.getBoundingClientRect();
      if (!rect.height) continue;

      // -1 when the element sits one viewport below centre, +1 one above.
      // Normalising by viewport height (not element height) keeps the rate
      // identical for a headline and a full-bleed photo.
      var centre = rect.top + rect.height / 2 - viewportHeight / 2;
      var offset = centre / viewportHeight;
      if (offset > 1.4) offset = 1.4;
      else if (offset < -1.4) offset = -1.4;

      // Clamp to the same ceiling motion.css declares, so a violent flick
      // cannot leave an element parked far from where it belongs.
      var shift = offset * item.depth * 100;
      var limit = maxShift();
      if (shift > limit) shift = limit;
      else if (shift < -limit) shift = -limit;

      item.element.style.setProperty('--scroll-depth-y', shift.toFixed(2) + 'px');
    }
  }

  // Reads the ceiling from the stylesheet once, then caches it: a
  // getComputedStyle call per frame per element would be the most expensive
  // thing in the file. Invalidated on resize and on scroll position change,
  // which are the only moments the token can differ.
  function maxShift() {
    if (cachedLimit < 0) {
      var raw = parseFloat(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--scroll-depth-max')
      );
      // Fall back to the stylesheet default if the token is missing or the
      // value is unparseable, so depth degrades to "slightly less" and never
      // to "unbounded".
      cachedLimit = isFinite(raw) && raw > 0 ? raw : 34;
    }
    return cachedLimit;
  }

  function onScroll() {
    var y = window.pageYOffset;
    var height = window.innerHeight;
    // Why: skip identical frames. Resize changes the divisor, so it has to
    // invalidate the cache as well.
    if (y === lastY && height === lastHeight) return;
    lastY = y;
    lastHeight = height;
    cachedLimit = -1;
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      rafId = 0;
      compute();
    });
  }

  function reset() {
    if (observer) observer.disconnect();
    observer = null;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    lastY = -1;
    lastHeight = -1;
    cachedLimit = -1;
    items = [];
  }

  function observe() {
    // Why: an observer here is not the reveal mechanism, it is a cost gate.
    // Off-screen elements are skipped in compute(), so a long page only ever
    // touches the handful that are actually on screen.
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var item = entry.target.__novaDepthItem;
        if (item) item.visible = entry.isIntersecting;
      });
    }, { rootMargin: '25% 0px 25% 0px' });
    items.forEach(function (item) { observer.observe(item.element); });
  }

  function init() {
    reset();
    if (isDisabled() || isReduced()) return;
    if (!('IntersectionObserver' in window)) return;

    var nodes = document.querySelectorAll('[' + DEPTH_ATTR + ']');
    nodes.forEach(function (element) {
      var depth = parseFloat(element.getAttribute(DEPTH_ATTR));
      if (!isFinite(depth) || depth === 0) return;
      var item = { element: element, depth: depth, visible: true };
      element.__novaDepthItem = item;
      items.push(item);
    });

    if (items.length === 0) return;
    observe();
    compute();
    lastY = window.pageYOffset;
    lastHeight = window.innerHeight;
  }

  function schedule() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      rafId = 0;
      init();
    });
  }

  // Both listeners are passive: this engine never cancels an event, so it
  // cannot affect scroll performance. The rAF guard above means one write per
  // frame at most.
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // View transitions swap the DOM out from under the measured positions.
  document.addEventListener('astro:before-swap', reset);
  document.addEventListener('astro:after-swap', schedule);
  document.addEventListener('astro:page-load', schedule);

  init();
})();
