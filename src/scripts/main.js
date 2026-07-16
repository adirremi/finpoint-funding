(() => {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  const logoImg = document.querySelector(".logo-img");

  const onScroll = () => {
    if (!header) return;
    const scrolled = window.scrollY > 24;
    header.classList.toggle("is-scrolled", scrolled);
    if (logoImg) {
      const light = logoImg.getAttribute("data-logo-light");
      const dark = logoImg.getAttribute("data-logo-dark");
      if (light && dark) {
        logoImg.src = scrolled || !header.classList.contains("on-dark") ? dark : light;
      }
    }
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 4, 3) * 0.08}s`;
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  const FORM_ERROR_MSG =
    "Something went wrong. Please email deals@finpointfunding.com or call (973) 692-7551.";
  const FORM_SUBMIT_URL = "https://formsubmit.co/ajax/deals@finpointfunding.com";

  document.querySelectorAll("form[data-lead-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const success = form.querySelector(".form-success");
      let errorEl = form.querySelector(".form-error");

      const showSuccess = () => {
        form.classList.add("is-sent");
        if (success) success.classList.add("is-visible");
        if (errorEl) errorEl.hidden = true;
      };

      const showError = () => {
        if (!errorEl) {
          errorEl = document.createElement("div");
          errorEl.className = "form-error";
          errorEl.setAttribute("role", "alert");
          errorEl.hidden = true;
          const anchor = form.querySelector(".form-success");
          if (anchor) anchor.insertAdjacentElement("afterend", errorEl);
          else form.prepend(errorEl);
        }
        errorEl.textContent = FORM_ERROR_MSG;
        errorEl.hidden = false;
      };

      const gotcha = form.querySelector('[name="_gotcha"]');
      if (gotcha && gotcha.value.trim()) {
        showSuccess();
        return;
      }

      if (!form.reportValidity()) return;

      const smsCheckbox = form.querySelector('[name="smsConsent"]');
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.smsConsent = smsCheckbox && smsCheckbox.checked ? "Yes" : "No";

      const isIso = form.getAttribute("data-form-type") === "iso";
      payload._subject = isIso ? "ISO Partner inquiry" : "New Finpoint Funding lead";
      payload._template = "table";
      payload._captcha = false;

      const originalLabel = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute("aria-busy", "true");
        submitBtn.textContent = "Sending…";
      }
      if (errorEl) errorEl.hidden = true;

      try {
        const response = await fetch(FORM_SUBMIT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        let data = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        const successFlag = data.success;
        const ok =
          response.ok &&
          (successFlag === true ||
            successFlag === "true" ||
            (successFlag === undefined && response.status === 200));

        if (ok) {
          showSuccess();
        } else {
          showError();
        }
      } catch {
        showError();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.removeAttribute("aria-busy");
          submitBtn.textContent = originalLabel;
        }
      }
    });
  });
})();
