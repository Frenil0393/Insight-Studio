import { projectsData } from "./data.js";
import { initPremiumScene } from "./scene.js";

// ==========================================
// 0. SAFE STORAGE HELPERS (Fixes Cookie/Incognito Error)
// ==========================================
const safeGetItem = (storageType, key) => {
  try {
    return window[storageType].getItem(key);
  } catch (e) {
    return null;
  }
};
const safeSetItem = (storageType, key, value) => {
  try {
    window[storageType].setItem(key, value);
  } catch (e) {
    console.warn("Storage disabled. Running in safe mode.");
  }
};

// ==========================================
// 0.1 URL CLEANUP & ID PRESERVATION
// ==========================================
let activeProjectId = new URLSearchParams(window.location.search).get("id");
if (activeProjectId) {
  safeSetItem("sessionStorage", "currentProjectId", activeProjectId);
} else {
  activeProjectId = safeGetItem("sessionStorage", "currentProjectId");
}

// URL Masking: Clean up .html and ?id=... from the address bar for a premium feel
try {
  const url = new URL(window.location.href);
  let path = url.pathname;
  let changed = false;

  if (path.endsWith(".html")) {
    path = path.replace(/\.html$/, "");
    changed = true;
  }
  if (path.endsWith("/index")) {
    path = path.replace(/\/index$/, "/");
    changed = true;
  }
  if (url.searchParams.has("id")) {
    url.searchParams.delete("id");
    changed = true;
  }

  if (changed) {
    const newUrl = path + (url.search ? url.search : "") + url.hash;
    window.history.replaceState(null, "", newUrl);
  }
} catch (e) {}

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 0.5 DYNAMIC ACTIVE NAV LINKS
  // ==========================================
  const setActiveNav = () => {
    let pathName = window.location.pathname;
    let pageName = pathName.split("/").pop().replace(".html", "") || "index";

    const navLinks = document.querySelectorAll(".nav-links a, .mobile-links a");
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const targetPage = href.split("/").pop().replace(".html", "") || "index";

      if (pageName === "project-detail" && targetPage === "work") {
        link.classList.add("active");
      } else if (targetPage === pageName) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  };

  // ==========================================
  // 1. Initialize Lenis (Smooth Scroll) & SYNC WITH GSAP
  // ==========================================
  const lenis = new window.Lenis({
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,
  });

  // CRITICAL FIX: Sync Lenis with GSAP ScrollTrigger
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
  } else {
      function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
  }

  // ==========================================
  // 2. PREMIUM PRELOADER (Runs once on index)
  // ==========================================
  const preloader = document.querySelector(".preloader-v2");
  const title = document.querySelector(".preloader-title");
  const line = document.querySelector(".preloader-line");

  if (preloader && title && line) {
    const hasSeenPreloader = safeGetItem("sessionStorage", "preloaderShown");
    const isHomePage =
      window.location.pathname === "/" ||
      window.location.pathname.endsWith("index");

    if (!hasSeenPreloader && isHomePage) {
      safeSetItem("sessionStorage", "preloaderShown", "true");
      lenis.stop();
      window.scrollTo(0, 0);

      const tl = gsap.timeline();
      tl.to(title, { opacity: 1, duration: 1, ease: "power2.out", delay: 0.2 })
        .to(line, { width: "100%", duration: 2, ease: "expo.inOut" }, "<0.5")
        .to(
          title,
          { y: -20, opacity: 0, duration: 0.8, ease: "power2.in" },
          "+=0.2",
        )
        .to(preloader, { yPercent: -100, duration: 1.2, ease: "expo.inOut" })
        .call(() => {
          lenis.start();
          preloader.style.display = "none";
        });
    } else {
      preloader.style.display = "none";
    }
  }

  // ==========================================
  // 3. Custom Magnetic Cursor Logic
  // ==========================================
  const dot = document.querySelector(".cursor-dot");
  const outline = document.querySelector(".cursor-outline");
  const hoverTargets = document.querySelectorAll("a, button, .hover-target");

  if (dot && outline) {
    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    gsap.set(outline, { xPercent: -50, yPercent: -50 });
    window.addEventListener("mousemove", (e) => {
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1 });
      gsap.to(outline, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.6,
        ease: "power3.out",
      });
    });

    hoverTargets.forEach((target) => {
      target.addEventListener("mouseenter", () =>
        outline.classList.add("hover-active"),
      );
      target.addEventListener("mouseleave", () =>
        outline.classList.remove("hover-active"),
      );
    });
  }

  // ==========================================
  // 4. Dynamic Header Shrink & Initialize Nav
  // ==========================================
  setActiveNav();

  const header = document.querySelector(".site-header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        header.style.transform = "translateY(-10px)";
        header.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";
        header.style.padding = "0.5rem 0";
      } else {
        header.style.transform = "translateY(0)";
        header.style.borderBottom = "1px solid rgba(255, 255, 255, 0.05)";
        header.style.padding = "0";
      }
    });
  }

  // ==========================================
  // 5. Initialize 3D Abstract Scene
  // ==========================================
  initPremiumScene();

  // ==========================================
  // 6. Mobile Menu Logic
  // ==========================================
  const navWrapper = document.querySelector(".nav-wrapper");
  if (navWrapper && window.innerWidth <= 768) {
    const toggleBtn = document.createElement("div");
    toggleBtn.className = "mobile-toggle";
    toggleBtn.innerHTML =
      '<div class="line line-1"></div><div class="line line-2"></div>';

    if (document.querySelector(".nav-links")) {
      navWrapper.appendChild(toggleBtn);
    }

    const mobileMenu = document.createElement("div");
    mobileMenu.className = "mobile-menu";
    mobileMenu.innerHTML = `
            <ul class="mobile-links">
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">Studio</a></li>
                <li><a href="work.html">Projects</a></li>
                <li><a href="contact.html">Contact</a></li>
            </ul>
        `;
    document.body.appendChild(mobileMenu);
    setActiveNav();

    let menuOpen = false;
    toggleBtn.addEventListener("click", () => {
      menuOpen = !menuOpen;
      toggleBtn.classList.toggle("active");

      if (menuOpen) {
        if (typeof lenis !== "undefined") lenis.stop();
        mobileMenu.classList.add("menu-active");
        gsap.to(mobileMenu, {
          yPercent: 100,
          duration: 0.8,
          ease: "expo.inOut",
        });
        gsap.fromTo(
          ".mobile-links li",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, delay: 0.2 },
        );
      } else {
        if (typeof lenis !== "undefined") lenis.start();
        mobileMenu.classList.remove("menu-active");
        gsap.to(mobileMenu, { yPercent: 0, duration: 0.8, ease: "expo.inOut" });
      }
    });
  }

  // ==========================================
  // 7. Render Projects & Add 3D Hover Triggers
  // ==========================================
  const renderProjects = (containerId, limit = null) => {
    const projContainer = document.getElementById(containerId);
    if (!projContainer) return;

    const dataToRender = limit ? projectsData.slice(0, limit) : projectsData;

    dataToRender.forEach((project) => {
      const card = document.createElement("a");
      card.href = `project-detail.html?id=${project.id}`;
      card.className = "project-card hover-target";
      card.innerHTML = `
                <div class="project-image-wrapper">
                    <img src="${project.image}" alt="${project.title}" class="project-image" loading="lazy">
                </div>
                <div class="project-info">
                    <div>
                        <h3 class="project-title">${project.title}</h3>
                        <span class="project-category">${project.category}</span>
                    </div>
                    <div class="project-year">${project.year}</div>
                </div>
            `;

      if (outline) {
        card.addEventListener("mouseenter", () =>
          outline.classList.add("hover-active"),
        );
        card.addEventListener("mouseleave", () =>
          outline.classList.remove("hover-active"),
        );
      }

      card.addEventListener("mouseenter", () => {
        window.dispatchEvent(
          new CustomEvent("projectHover", {
            detail: { color: project.themeColor },
          }),
        );
      });
      card.addEventListener("mouseleave", () => {
        window.dispatchEvent(new CustomEvent("projectLeave"));
      });

      projContainer.appendChild(card);
    });
  };

  renderProjects("featured-projects", 2);
  renderProjects("all-projects");

  // ==========================================
  // 8. Populate Project Detail Page & Lightbox
  // ==========================================
  if (document.querySelector("#pd-title")) {
    const projectId = activeProjectId;
    const project = projectsData.find((p) => p.id === projectId);

    if (project) {
      document.querySelector("#pd-title").innerText = project.title;
      document.querySelector("#pd-category").innerText =
        `${project.category} // ${project.year}`;
      document.querySelector("#pd-image").src = project.image;
      document.querySelector("#pd-client").innerText = project.client;
      document.querySelector("#pd-role").innerText = project.role;
      document.querySelector("#pd-duration").innerText = project.duration;

      const materialsList = document.querySelector("#pd-materials");
      if (materialsList) {
        materialsList.innerHTML = "";
        project.materials.forEach(
          (mat) => (materialsList.innerHTML += `<li>${mat}</li>`),
        );
      }

      document.querySelector("#pd-challenge").innerHTML = project.challenge;
      document.querySelector("#pd-solution").innerHTML = project.solution;

      // LIGHTBOX CREATION
      const lightbox = document.createElement("div");
      lightbox.className = "lightbox-overlay";
      lightbox.innerHTML = `
                <div class="lightbox-close hover-target">✕</div>
                <div class="lightbox-prev hover-target">❮</div>
                <img class="lightbox-img" src="" alt="Expanded View">
                <div class="lightbox-next hover-target">❯</div>
            `;
      document.body.appendChild(lightbox);

      const lbImg = lightbox.querySelector(".lightbox-img");
      let currentLbIndex = 0;

      const showLightboxImage = (index) => {
        lbImg.classList.remove("loaded");
        setTimeout(() => {
          lbImg.src = project.gallery[index];
          lbImg.onload = () => lbImg.classList.add("loaded");
        }, 300);
      };

      const galleryContainer = document.querySelector("#pd-gallery");
      if (galleryContainer && project.gallery) {
        project.gallery.forEach((imgUrl, index) => {
          const imgDiv = document.createElement("div");
          imgDiv.className = "pd-gallery-item gs-reveal hover-target";
          imgDiv.style.cursor = "pointer";
          imgDiv.innerHTML = `<img src="${imgUrl}" alt="Gallery Detail" class="parallax-img">`;

          imgDiv.addEventListener("click", () => {
            currentLbIndex = index;
            showLightboxImage(currentLbIndex);
            if (typeof lenis !== "undefined") lenis.stop();
            lightbox.classList.add("active");
          });

          galleryContainer.appendChild(imgDiv);
        });
      }

      // Lightbox Controls
      lightbox
        .querySelector(".lightbox-close")
        .addEventListener("click", () => {
          lightbox.classList.remove("active");
          if (typeof lenis !== "undefined") lenis.start();
        });

      const nextImg = () => {
        currentLbIndex = (currentLbIndex + 1) % project.gallery.length;
        showLightboxImage(currentLbIndex);
      };
      const prevImg = () => {
        currentLbIndex =
          (currentLbIndex - 1 + project.gallery.length) %
          project.gallery.length;
        showLightboxImage(currentLbIndex);
      };

      lightbox
        .querySelector(".lightbox-next")
        .addEventListener("click", nextImg);
      lightbox
        .querySelector(".lightbox-prev")
        .addEventListener("click", prevImg);

      // Lightbox Mobile Swipe Support
      let touchStartX = 0;
      lightbox.addEventListener(
        "touchstart",
        (e) => (touchStartX = e.changedTouches[0].screenX),
      );
      lightbox.addEventListener("touchend", (e) => {
        let touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50) nextImg();
        if (touchEndX > touchStartX + 50) prevImg();
      });

      if (project.nextProject && document.querySelector("#pd-next-title")) {
        document.querySelector("#pd-next-title").innerText =
          project.nextProject.title;
        document.querySelector("#pd-next-href").href =
          `project-detail.html?id=${project.nextProject.id}`;
      }
    }
  }

  // ==========================================
  // 9. GSAP Scroll Animations
  // ==========================================
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    const heroImg = document.querySelector("#pd-parallax-img");
    if (heroImg) {
      gsap.to(heroImg, {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: ".pd-hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    const splitTexts = document.querySelectorAll(".title-display, .title-xl");
    splitTexts.forEach((text) => {
      if (typeof SplitType !== "undefined") {
        const split = new SplitType(text, { types: "lines, words, chars" });
        gsap.from(split.chars, {
          y: 100,
          opacity: 0,
          rotationX: -90,
          stagger: 0.02,
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: { trigger: text, start: "top 90%" },
        });
      }
    });

    const revealElements = document.querySelectorAll(
      ".gs-reveal:not(.title-display):not(.title-xl)",
    );
    revealElements.forEach((el) => {
      gsap.fromTo(
        el,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );
    });
  }

  // ==========================================
  // 10. PROGRESSIVE WEB APP (PWA) INSTALL LOGIC
  // ==========================================
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.log("Service Worker failed", err));
    });
  }

  const initPWAPrompt = () => {
    if (safeGetItem("localStorage", "pwaDismissed") === "true") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;
    if (isStandalone) return;

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    let deferredPrompt;

    const popup = document.createElement("div");
    popup.className = "pwa-popup";
    document.body.appendChild(popup);

    const closePopup = () => {
      popup.classList.remove("show");
      safeSetItem("localStorage", "pwaDismissed", "true");
    };

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;

      popup.innerHTML = `
                <div class="pwa-content">
                    <img src="/favicon-96x96.png" alt="Insight App Icon">
                    <div>
                        <h4>Install The Studio App</h4>
                        <p>Add Insight Studio to your home screen for a faster, immersive experience.</p>
                    </div>
                </div>
                <div class="pwa-actions">
                    <button class="pwa-btn-dismiss" id="pwa-close">Not Now</button>
                    <button class="btn-primary" id="pwa-install" style="padding: 0.6rem 1.5rem; font-size: 0.8rem; border: none; cursor: pointer;">Install</button>
                </div>
            `;

      setTimeout(() => popup.classList.add("show"), 3000);

      document
        .getElementById("pwa-close")
        .addEventListener("click", closePopup);
      document
        .getElementById("pwa-install")
        .addEventListener("click", async () => {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === "accepted") popup.classList.remove("show");
          deferredPrompt = null;
        });
    });

    if (isIOS) {
      popup.innerHTML = `
                <div class="pwa-content">
                    <img src="/favicon-96x96.png" alt="Insight App Icon">
                    <div>
                        <h4>Install on iPhone</h4>
                        <p>Tap the <b>Share</b> icon below and select <b>Add to Home Screen</b> to install the app.</p>
                    </div>
                </div>
                <div class="pwa-actions">
                    <button class="pwa-btn-dismiss" id="pwa-close-ios">Got it</button>
                </div>
            `;
      setTimeout(() => popup.classList.add("show"), 3000);

      setTimeout(() => {
        const iosCloseBtn = document.getElementById("pwa-close-ios");
        if (iosCloseBtn) iosCloseBtn.addEventListener("click", closePopup);
      }, 3100);
    }
  };

  initPWAPrompt();

  // ==========================================
  // 11. CONTACT FORM AJAX & SUCCESS POPUP
  // ==========================================
  const contactForm = document.getElementById("custom-form");

  if (contactForm) {
    const successOverlay = document.createElement("div");
    successOverlay.className = "success-overlay";
    successOverlay.innerHTML = `
            <div class="success-modal">
                <div class="success-icon">✓</div>
                <h3 class="success-title">Inquiry <br>Received.</h3>
                <p class="success-text">Thank you for reaching out. Our principal architect will review your project details and connect with you shortly.</p>
                <button class="btn-primary" id="close-success" style="width: 100%;"><span>Return to Studio</span></button>
            </div>
        `;
    document.body.appendChild(successOverlay);

    const closeBtn = document.getElementById("close-success");
    closeBtn.addEventListener("click", () => {
      successOverlay.classList.remove("active");
      if (typeof lenis !== "undefined") lenis.start();
    });

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;

      submitBtn.innerHTML = "<span>Transmitting...</span>";
      submitBtn.style.pointerEvents = "none";
      submitBtn.style.opacity = "0.7";

      const formData = new FormData(contactForm);

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          contactForm.reset();
          const inputs = contactForm.querySelectorAll(".form-input");
          inputs.forEach((input) => input.blur());

          if (typeof lenis !== "undefined") lenis.stop();
          successOverlay.classList.add("active");
        } else {
          alert(
            "Something went wrong with the transmission. Please try emailing us directly.",
          );
        }
      } catch (error) {
        alert("Network error. Please check your connection and try again.");
      } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.style.pointerEvents = "auto";
        submitBtn.style.opacity = "1";
      }
    });
  }
  // ==========================================
  // 12. MAGNETIC BUTTON PHYSICS (DESKTOP ONLY)
  // ==========================================
  const magneticButtons = document.querySelectorAll(".btn-primary");

  // CRITICAL FIX: Only apply on devices with a real mouse/pointer and screens wider than 768px
  if (window.matchMedia("(pointer: fine)").matches && window.innerWidth > 768) {
    
    magneticButtons.forEach((btn) => {
      btn.style.transition = "none";

      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        // Pull button towards cursor
        gsap.to(btn, {
          x: x * 0.4,
          y: y * 0.4,
          duration: 0.6,
          ease: "power3.out",
        });

        // Parallax inner text
        const text = btn.querySelector("span");
        if (text) {
          gsap.to(text, {
            x: x * 0.2,
            y: y * 0.2,
            duration: 0.6,
            ease: "power3.out",
          });
        }
      });

      btn.addEventListener("mouseleave", () => {
        // Snap back to center
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 1,
          ease: "elastic.out(1, 0.3)",
        });

        const text = btn.querySelector("span");
        if (text) {
          gsap.to(text, {
            x: 0,
            y: 0,
            duration: 1,
            ease: "elastic.out(1, 0.3)",
          });
        }
      });
    });
  }
  // ==========================================
// 13. BUTTERY 60FPS VIDEO SCRUB ENGINE
// ==========================================
const processWrapper = document.querySelector(".process-scroll-wrapper");

if (processWrapper && typeof gsap !== "undefined") {

  // Text animations (unchanged)
  const steps = document.querySelectorAll(".process-step-scroll");
  steps.forEach((step, index) => {
    const progressSegment = 100 / steps.length;
    const startEnter = index * progressSegment;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: processWrapper,
        start: `top+=${startEnter}% top`,
        end: `top+=${startEnter + progressSegment}% top`,
        scrub: 0.5,
      },
    });

    tl.fromTo(step, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1 });
    if (index !== steps.length - 1) {
      tl.to(step, { y: -50, autoAlpha: 0, duration: 1 }, "+=0.5");
    }
  });

  // ---- 60FPS VIDEO SCRUB ENGINE ----
  const processCanvas = document.getElementById("process-canvas");
  const processVideo = document.getElementById("process-video");

  if (processCanvas && processVideo) {

    // Loading overlay
    const videoWrapper = processCanvas.closest(".process-video-wrapper") || processCanvas.parentElement;
    if (getComputedStyle(videoWrapper).position === "static") {
      videoWrapper.style.position = "relative";
    }

    const loaderEl = document.createElement("div");
    loaderEl.id = "scrub-loader";
    loaderEl.style.cssText = `
      position:absolute; inset:0; z-index:10;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      background:rgba(0,0,0,0.4); backdrop-filter:blur(4px);
      transition:opacity 0.8s ease;
    `;
    loaderEl.innerHTML = `
      <div style="width:180px;height:2px;background:rgba(255,255,255,0.12);border-radius:2px;overflow:hidden;">
        <div id="scrub-bar" style="height:100%;width:0%;background:#fff;transition:width 0.15s linear;border-radius:2px;"></div>
      </div>
      <p id="scrub-label" style="color:rgba(255,255,255,0.45);font-size:11px;letter-spacing:0.15em;margin-top:12px;font-family:inherit;text-transform:uppercase;">Loading 60fps…</p>
    `;
    videoWrapper.appendChild(loaderEl);

    const loaderBar = document.getElementById("scrub-bar");
    const loaderLabel = document.getElementById("scrub-label");
    
    const setProgress = (pct, txt) => {
      if (loaderBar) loaderBar.style.width = `${pct}%`;
      if (loaderLabel) loaderLabel.textContent = txt;
    };
    
    const hideLoader = () => {
      loaderEl.style.opacity = "0";
      setTimeout(() => loaderEl.remove(), 900);
    };

    // High-performance canvas context
    const ctx = processCanvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    });

    // ---- OPTIMIZED 60FPS VIDEO SCRUB ----
    let videoDuration = 0;
    let targetTime = 0;
    let currentTime = 0;
    let isReady = false;
    let rafId = null;
    let lastPaintTime = 0;

    // Video setup
    processVideo.muted = true;
    processVideo.pause();
    processVideo.currentTime = 0;
    processVideo.playbackRate = 1;

    const initCanvas = () => {
      processCanvas.width = processVideo.videoWidth || 1920;
      processCanvas.height = processVideo.videoHeight || 1080;
    };

    const paintFrame = (force = false) => {
      if (processVideo.readyState >= 2) {
        const now = performance.now();
        // Throttle painting to ~60fps max
        if (!force && now - lastPaintTime < 16) return;
        
        ctx.drawImage(processVideo, 0, 0, processCanvas.width, processCanvas.height);
        lastPaintTime = now;
      }
    };

    // Optimized for 60fps video
    const LERP_SPEED = 0.16;      // Balanced smoothness
    const SEEK_THRESHOLD = 1/60;   // One frame at 60fps
    
    const renderLoop = () => {
      if (!isReady) return;
      rafId = requestAnimationFrame(renderLoop);

      const diff = targetTime - currentTime;
      
      // Early exit if we're close enough
      if (Math.abs(diff) < 0.001) {
        paintFrame(); // Still paint to handle any pending seeks
        return;
      }

      // Smooth lerp to target
      currentTime += diff * LERP_SPEED;

      // Only seek if we've moved more than one frame
      const seekDelta = Math.abs(processVideo.currentTime - currentTime);
      if (seekDelta >= SEEK_THRESHOLD) {
        processVideo.currentTime = Math.max(0, Math.min(videoDuration, currentTime));
      }

      paintFrame();
    };

    const startEngine = () => {
      videoDuration = processVideo.duration || 0;
      if (videoDuration === 0) {
        console.error("Video duration is 0");
        return;
      }

      initCanvas();
      paintFrame(true);
      hideLoader();
      isReady = true;

      console.log(`✅ 60fps Engine Ready | Duration: ${videoDuration.toFixed(2)}s | Frames: ~${Math.round(videoDuration * 60)}`);

      // Start render loop
      rafId = requestAnimationFrame(renderLoop);

      // ScrollTrigger integration
      ScrollTrigger.create({
        trigger: processWrapper,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.25,  // Optimized for 60fps
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          targetTime = self.progress * videoDuration;
        },
        onRefresh: (self) => {
          currentTime = self.progress * videoDuration;
          targetTime = currentTime;
          if (videoDuration > 0) {
            processVideo.currentTime = currentTime;
            paintFrame(true);
          }
        },
      });
    };

    // Initialize when metadata is loaded
    if (processVideo.readyState >= 1) {
      setProgress(100, "Ready");
      startEngine();
    } else {
      setProgress(50, "Loading metadata…");
      processVideo.addEventListener("loadedmetadata", () => {
        setProgress(100, "Ready");
        startEngine();
      }, { once: true });
    }

    // Progress tracking
    processVideo.addEventListener("progress", () => {
      if (processVideo.buffered.length > 0) {
        const bufferedEnd = processVideo.buffered.end(processVideo.buffered.length - 1);
        const duration = processVideo.duration;
        if (duration > 0) {
          const pct = Math.round((bufferedEnd / duration) * 100);
          setProgress(pct, `Loading ${pct}%…`);
        }
      }
    });

  } // end if processCanvas
} // end if processWrapper
}); // end DOMContentLoaded