(function () {
    "use strict";

    if (typeof gsap === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    /* ─── 1. Smart Navbar: hide on scroll-down, reveal on scroll-up ─── */

    function initSmartNavbar() {
        const navbar = document.getElementById("navbar");
        if (!navbar) return;

        // Add CSS for the transform transition
        navbar.style.transition += ", transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)";

        ScrollTrigger.create({
            start: "top top",
            end: "max",
            onUpdate: (self) => {
                // Only hide when scrolling down past the navbar height
                if (self.direction === 1 && self.scroll() > 120) {
                    navbar.style.transform = "translateY(-100%)";
                } else {
                    navbar.style.transform = "translateY(0)";
                }
            }
        });
    }

    /* ─── 2. Blog Card 3D Tilt ─── */

    function initCardTilt() {
        const cards = document.querySelectorAll(".post-card-link, .random-post-card, .post-card");
        if (!cards.length) return;

        cards.forEach((card) => {
            card.style.transformStyle = "preserve-3d";
            card.style.transition = "transform 0.2s ease";

            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -4;
                const rotateY = ((x - centerX) / centerX) * 4;

                gsap.to(card, {
                    rotateX,
                    rotateY,
                    duration: 0.3,
                    ease: "power2.out",
                    transformPerspective: 800
                });
            });

            card.addEventListener("mouseleave", () => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.5,
                    ease: "elastic.out(1, 0.5)"
                });
            });
        });
    }

    /* ─── 3. Banner Parallax ─── */

    function initBannerParallax() {
        const banners = document.querySelectorAll(".banner-shell");
        if (!banners.length) return;

        banners.forEach((banner) => {
            const inner = banner.querySelector(".banner-inner");
            const overlay = banner.querySelector(".banner-overlay");

            if (inner) {
                gsap.to(inner, {
                    yPercent: 30,
                    ease: "none",
                    scrollTrigger: {
                        trigger: banner,
                        start: "top top",
                        end: "bottom top",
                        scrub: true
                    }
                });
            }

            if (overlay) {
                gsap.to(overlay, {
                    opacity: 0.6,
                    ease: "none",
                    scrollTrigger: {
                        trigger: banner,
                        start: "top top",
                        end: "bottom top",
                        scrub: true
                    }
                });
            }
        });
    }

    /* ─── 4. Banner Entry Animation ─── */

    function initBannerEntry() {
        const toolbar = document.querySelector(".banner-toolbar");
        const kicker = document.querySelector(".banner-kicker");
        const title = document.querySelector(".banner-title");
        const subtitle = document.querySelector(".banner-subtitle");
        const actions = document.querySelector(".banner-actions");

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        if (toolbar && toolbar.children.length) {
            tl.from(toolbar.children, { y: 15, opacity: 0, duration: 0.4, stagger: 0.06 });
        }
        if (kicker) {
            tl.from(kicker, { y: 20, opacity: 0, duration: 0.6 }, "-=0.2");
        }
        if (title) {
            tl.from(title, { y: 30, opacity: 0, duration: 0.7 }, "-=0.3");
        }
        if (subtitle) {
            tl.from(subtitle, { y: 20, opacity: 0, duration: 0.6 }, "-=0.35");
        }
        if (actions) {
            tl.from(actions, { y: 15, opacity: 0, duration: 0.5 }, "-=0.25");
        }
    }

    /* ─── 6. Blog List Cards Stagger Reveal ─── */

    function initBlogListReveal() {
        const blogList = document.getElementById("blogList");
        if (!blogList || !blogList.children.length) return;

        // Kill any existing tweens to prevent stacking
        gsap.killTweensOf(blogList.children);

        gsap.fromTo(blogList.children,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.08 }
        );
    }

    /* ─── 5. Section Panels Reveal on Scroll ─── */

    function initPanelReveal() {
        const panels = document.querySelectorAll(".panel, .project-card, .taxonomy-card, .route-stop");

        panels.forEach((panel, i) => {
            gsap.from(panel, {
                y: 40,
                opacity: 0,
                duration: 0.7,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: panel,
                    start: "top 88%",
                    toggleActions: "play none none none"
                },
                delay: (i % 3) * 0.08
            });
        });
    }

    /* ─── Boot ─── */

    function boot() {
        initSmartNavbar();
        initBannerParallax();
        initBannerEntry();
        initPanelReveal();

        // Cards need to wait for dynamic rendering
        setTimeout(() => {
            initCardTilt();
            initBlogListReveal();
        }, 600);

        // Re-init card tilt + reveal when blog list re-renders
        const observer = new MutationObserver(() => {
            setTimeout(() => {
                initCardTilt();
                initBlogListReveal();
            }, 100);
        });
        const blogList = document.getElementById("blogList");
        if (blogList) {
            observer.observe(blogList, { childList: true });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
