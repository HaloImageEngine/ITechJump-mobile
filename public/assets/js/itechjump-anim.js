(function () {
  const SELECTOR = ".itechjump-title .jump-j";
  let started = false;

  function startAnimation() {
    const j = document.querySelector(SELECTOR);
    if (!j || started) return false;

    started = true;
    j.style.display = "inline-block"; // needed for translateY

    // Web Animations API bounce
    j.animate(
      [
        { transform: "translateY(0px)" },
        { transform: "translateY(-12px)" },
        { transform: "translateY(0px)" },
        { transform: "translateY(3px)" },
        { transform: "translateY(0px)" }
      ],
      {
        duration: 1800,
        iterations: Infinity,
        easing: "ease-in-out"
      }
    );

    return true;
  }

  function init() {
    // try now
    if (startAnimation()) return;

    // retry for Angular render timing
    let tries = 0;
    const retry = setInterval(() => {
      tries++;
      if (startAnimation() || tries > 40) clearInterval(retry);
    }, 150);

    // observe DOM for route/render changes
    const observer = new MutationObserver(() => {
      if (startAnimation()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
