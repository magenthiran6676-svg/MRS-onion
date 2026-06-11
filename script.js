/* ═══════════════════════════════════════════════════════
   MRS Onion & Co. — Scroll-Triggered Image Sequence
   High-performance canvas renderer with GSAP, Lenis & Three.js
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Configuration ──
    const CONFIG = {
        frameCount: 300,
        imagePath: 'ezgif-34b43c240169e585-jpg/ezgif-frame-',
        imageExt: '.jpg',
        scrubSmooth: 0.5,       // GSAP scrub smoothness (seconds)
    };

    // ── State ──
    const state = {
        images: [],
        currentFrame: 0,
        canvasReady: false,
        scrollProgress: 0,
    };

    // ══════════════════════════════════════════════
    // 1. IMAGE PRELOADER
    // ══════════════════════════════════════════════
    function preloadImages() {
        return new Promise((resolve) => {
            const barFill = document.querySelector('.loader-bar-fill');
            const percentEl = document.querySelector('.loader-percent');
            
            // Number of frames to load before releasing the loader screen
            const CRITICAL_FRAMES = 30;
            let loaded = 0;

            // Initialize the image array
            for (let i = 1; i <= CONFIG.frameCount; i++) {
                state.images.push(new Image());
            }

            // Function to trigger load for a specific frame index (1-based)
            function loadFrame(i) {
                return new Promise((res) => {
                    const img = state.images[i - 1];
                    const idx = String(i).padStart(3, '0');
                    img.src = `${CONFIG.imagePath}${idx}${CONFIG.imageExt}`;
                    img.onload = img.onerror = () => {
                        res();
                    };
                });
            }

            // 1. Load critical frames first
            async function loadCritical() {
                const criticalPromises = [];
                for (let i = 1; i <= CRITICAL_FRAMES; i++) {
                    criticalPromises.push(loadFrame(i).then(() => {
                        loaded++;
                        const progress = Math.round((loaded / CRITICAL_FRAMES) * 100);
                        if (barFill) barFill.style.width = `${progress}%`;
                        if (percentEl) percentEl.textContent = `${progress}%`;
                    }));
                }
                
                await Promise.all(criticalPromises);
                
                // Release loader to reveal the page
                resolve();

                // 2. Load the remaining frames in the background in small batches
                loadRemaining();
            }

            // Load remaining frames in batches of 8 to avoid blocking browser requests
            async function loadRemaining() {
                const batchSize = 8;
                for (let i = CRITICAL_FRAMES + 1; i <= CONFIG.frameCount; i += batchSize) {
                    const batchPromises = [];
                    for (let j = 0; j < batchSize && (i + j) <= CONFIG.frameCount; j++) {
                        batchPromises.push(loadFrame(i + j));
                    }
                    await Promise.all(batchPromises);
                    // Minimal breathing space between batches
                    await new Promise(r => setTimeout(r, 40));
                }
            }

            loadCritical();
        });
    }

    // ══════════════════════════════════════════════
    // 2. CANVAS RENDERER
    // ══════════════════════════════════════════════
    class CanvasRenderer {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas.getContext('2d');
            this.dpr = Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x for max clarity
            this.resize();
            this._onResize = this._debounce(() => this.resize(), 200);
            window.addEventListener('resize', this._onResize);
        }

        resize() {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width * this.dpr;
            this.canvas.height = rect.height * this.dpr;
            this.canvas.style.width = `${rect.width}px`;
            this.canvas.style.height = `${rect.height}px`;
            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

            // Max clarity image smoothing
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';

            this.displayWidth = rect.width;
            this.displayHeight = rect.height;

            // Re-render current frame after resize
            if (state.canvasReady) {
                this.renderFrame(state.currentFrame);
            }
        }

        renderFrame(index) {
            const img = state.images[index];
            if (!img || !img.complete || img.naturalWidth === 0) return;

            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

            // Cover fit calculation
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const canvasRatio = this.displayWidth / this.displayHeight;

            let drawW, drawH, drawX, drawY;

            if (canvasRatio > imgRatio) {
                drawW = this.displayWidth;
                drawH = this.displayWidth / imgRatio;
                drawX = 0;
                drawY = (this.displayHeight - drawH) / 2;
            } else {
                drawH = this.displayHeight;
                drawW = this.displayHeight * imgRatio;
                drawX = (this.displayWidth - drawW) / 2;
                drawY = 0;
            }

            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            state.currentFrame = index;
        }

        _debounce(fn, ms) {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), ms);
            };
        }
    }

    // ══════════════════════════════════════════════
    // 4. SPLIT TEXT UTILITY
    // ══════════════════════════════════════════════
    function splitText(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            const html = el.innerHTML;
            el.innerHTML = '';
            const parts = html.split(/(<br\s*\/?>)/i);

            parts.forEach(part => {
                if (/<br\s*\/?>/i.test(part)) {
                    el.appendChild(document.createElement('br'));
                } else {
                    // Decode HTML entities (e.g. &amp; → &) before splitting
                    const temp = document.createElement('div');
                    temp.innerHTML = part;
                    const decoded = temp.textContent || temp.innerText || part;
                    const words = decoded.split(/(\s+)/);
                    words.forEach(word => {
                        if (word.trim() === '') {
                            el.appendChild(document.createTextNode(word));
                        } else {
                            const outer = document.createElement('span');
                            outer.style.display = 'inline-block';
                            outer.style.overflow = 'hidden';
                            outer.style.verticalAlign = 'top';

                            const inner = document.createElement('span');
                            inner.textContent = word;
                            inner.style.display = 'inline-block';
                            inner.style.willChange = 'transform';
                            inner.classList.add('word-inner');

                            outer.appendChild(inner);
                            el.appendChild(outer);
                        }
                    });
                }
            });
        });
    }

    // ══════════════════════════════════════════════
    // 5. MAIN INITIALIZATION
    // ══════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', async () => {

        // ── 5a. Init Lenis ──
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            touchMultiplier: 2,
        });

        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);

        // Smooth nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    lenis.scrollTo(href, { offset: -80 });
                }
            });
        });

        // ── 5b. Split text for titles ──
        splitText('.huge-text, .title-large');

        // ── 5c. Loader animation ──
        const loader = document.querySelector('.loader');
        const loaderSpans = document.querySelectorAll('.loader-text span');
        const loaderSub = document.querySelector('.loader-sub');
        const loaderProgress = document.querySelector('.loader-progress');

        const loaderTL = gsap.timeline();
        loaderTL
            .to(loaderSpans, {
                y: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power4.out',
            })
            .to(loaderSub, {
                opacity: 1,
                duration: 0.6,
                ease: 'power2.out',
            }, '-=0.3')
            .to(loaderProgress, {
                opacity: 1,
                duration: 0.5,
                ease: 'power2.out',
            }, '-=0.2');

        // ── 5d. Preload images ──
        await preloadImages();
        state.canvasReady = true;

        // ── 5e. Init Canvas ──
        const renderer = new CanvasRenderer('onion-canvas');
        renderer.renderFrame(0); // Render first frame immediately

        // ── 5f. Hide loader, reveal page ──
        const revealTL = gsap.timeline();
        revealTL
            .to(loader, {
                yPercent: -100,
                duration: 1.2,
                delay: 0.4,
                ease: 'expo.inOut',
            })
            .fromTo('.scroll-indicator', {
                opacity: 0,
                y: 20,
            }, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
            }, '-=0.3')
            .fromTo('.overlay-brand', {
                opacity: 0,
                y: 30,
            }, {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power3.out',
            }, '-=0.6');

        // ══════════════════════════════════════════
        // 6. SCROLL-TRIGGERED IMAGE SEQUENCE
        // ══════════════════════════════════════════
        const canvasSection = document.querySelector('.canvas-section');
        const frameObj = { frame: 0 };

        gsap.to(frameObj, {
            frame: CONFIG.frameCount - 1,
            ease: 'none',
            scrollTrigger: {
                trigger: canvasSection,
                start: 'top top',
                end: 'bottom bottom',
                scrub: CONFIG.scrubSmooth,
                onUpdate: (self) => {
                    state.scrollProgress = self.progress;
                },
            },
            onUpdate: () => {
                const idx = Math.round(frameObj.frame);
                if (idx !== state.currentFrame) {
                    renderer.renderFrame(idx);
                }
            },
        });


        // ══════════════════════════════════════════
        // 7. CANVAS TEXT OVERLAY ANIMATIONS
        // ══════════════════════════════════════════

        // Brand overlay: visible 0-20%, fades out 20-30%
        gsap.timeline({
            scrollTrigger: {
                trigger: canvasSection,
                start: 'top top',
                end: '30% top',
                scrub: true,
            }
        })
        .fromTo('.overlay-brand', { opacity: 1 }, { opacity: 0, duration: 1 }, 0.5);

        // Scroll indicator: fades out quickly
        gsap.to('.scroll-indicator', {
            opacity: 0,
            scrollTrigger: {
                trigger: canvasSection,
                start: '2% top',
                end: '8% top',
                scrub: true,
            },
        });



        // End overlay: fades in 75-85%
        const endTL = gsap.timeline({
            scrollTrigger: {
                trigger: canvasSection,
                start: '72% top',
                end: '92% top',
                scrub: true,
            }
        });
        endTL
            .fromTo('.overlay-end', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 })
            .to('.overlay-end', { opacity: 1, duration: 0.4 })
            .to('.overlay-end', { opacity: 0, duration: 0.2 });

        // Canvas transition gradient appears near end
        gsap.fromTo('.canvas-transition', { opacity: 0 }, {
            opacity: 1,
            scrollTrigger: {
                trigger: canvasSection,
                start: '85% top',
                end: '100% top',
                scrub: true,
            },
        });

        // ══════════════════════════════════════════
        // 8. SECTION REVEAL ANIMATIONS
        // ══════════════════════════════════════════
        const revealTexts = document.querySelectorAll('.reveal-text');
        revealTexts.forEach(el => {
            // Title split-text reveal
            if (el.classList.contains('title-large') || el.classList.contains('huge-text')) {
                const inners = el.querySelectorAll('.word-inner');
                if (inners.length > 0) {
                    gsap.fromTo(inners,
                        { y: '110%', rotationZ: 5 },
                        {
                            y: '0%',
                            rotationZ: 0,
                            duration: 1.2,
                            stagger: 0.05,
                            ease: 'power4.out',
                            scrollTrigger: { trigger: el, start: 'top 85%' },
                        }
                    );
                }
                gsap.set(el, { autoAlpha: 1 });
            } else {
                // Standard fade-up reveal
                gsap.fromTo(el,
                    { y: 40, autoAlpha: 0 },
                    {
                        y: 0,
                        autoAlpha: 1,
                        duration: 1,
                        ease: 'power3.out',
                        scrollTrigger: { trigger: el, start: 'top 85%' },
                    }
                );
            }
        });

        // ══════════════════════════════════════════
        // 9. IMAGE PARALLAX + CLIP-PATH REVEAL
        // ══════════════════════════════════════════
        const revealImages = document.querySelectorAll('.reveal-img');
        revealImages.forEach(container => {
            gsap.set(container, { autoAlpha: 1 });

            const img = container.querySelector('img');

            gsap.fromTo(container,
                { clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)' },
                {
                    clipPath: 'polygon(0 0%, 100% 0%, 100% 100%, 0 100%)',
                    duration: 1.5,
                    ease: 'power4.inOut',
                    scrollTrigger: { trigger: container, start: 'top 80%' },
                }
            );

            if (img && img.classList.contains('parallax-inner')) {
                gsap.fromTo(img,
                    { yPercent: -10 },
                    {
                        yPercent: 10,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: container,
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: true,
                        },
                    }
                );
            }
        });

        // ══════════════════════════════════════════
        // 10. ALBUM GALLERY — SCATTER & SNAP
        // ══════════════════════════════════════════
        const albumCards = document.querySelectorAll('.album-card');
        albumCards.forEach((card) => {
            const rotateDeg = parseFloat(card.dataset.rotate) || 0;
            const xOffset = rotateDeg * 4; // drift sideways proportional to tilt
            const yOffset = 60 + Math.abs(rotateDeg) * 3;

            // Set initial scattered state
            gsap.set(card, {
                rotate: rotateDeg * 2.5,   // start extra-rotated
                x: xOffset * 2,
                y: yOffset,
                opacity: 0,
                scale: 0.88,
            });

            // Snap to natural position on scroll
            gsap.to(card, {
                rotate: rotateDeg,          // settle at the "resting" tilt
                x: 0,
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 1.4,
                ease: 'power4.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 88%',
                    toggleActions: 'play none none reverse',
                },
            });

            // Subtle hover lift
            card.addEventListener('mouseenter', () => {
                gsap.to(card, { y: -10, scale: 1.03, rotate: 0, duration: 0.4, ease: 'power2.out' });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { y: 0, scale: 1, rotate: rotateDeg, duration: 0.5, ease: 'power2.inOut' });
            });
        });

        // ══════════════════════════════════════════
        // 11. HANDWRITING REVEAL ANIMATION
        // ══════════════════════════════════════════
        const hwWords = document.querySelectorAll('.hw-word');
        if (hwWords.length > 0) {
            const hwTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: '#philosophy-section',
                    start: 'top 65%',
                    toggleActions: 'play none none none',
                },
            });

            // Animate each word one by one — clip-path wipe + opacity + y
            hwWords.forEach((word, i) => {
                hwTimeline.to(word, {
                    opacity: 1,
                    y: 0,
                    clipPath: 'inset(0 0% 0 0)',
                    duration: 0.5,
                    ease: 'power2.out',
                }, i * 0.12); // stagger: each word starts 0.12s after the last
            });
        }

    }); // end DOMContentLoaded

    // ══════════════════════════════════════════════
    // 10. WHATSAPP FORM HANDLER (global)
    // ══════════════════════════════════════════════
    window.sendToWhatsapp = function () {
        const name = document.getElementById('waName').value || 'Customer';
        const phone = document.getElementById('waPhone').value || 'Not provided';
        const address = document.getElementById('waAddress').value || 'Not provided';
        const desc = document.getElementById('waDesc').value || 'Interested in premium shallots';

        const text = `Hi MRS Onion & Co,\n\n*Name:* ${name}\n*Phone:* ${phone}\n*Address:* ${address}\n*Description:* ${desc}`;
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/919551545786?text=${encodedText}`, '_blank');
    };

})();
