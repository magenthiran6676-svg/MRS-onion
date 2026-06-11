/* ═══════════════════════════════════════════════════════
   MRS Onion & Co. — Premium Website
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ══════════════════════════════════════════════
    // 1. SPLIT TEXT UTILITY
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
    // 2. MAIN INITIALIZATION
    // ══════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {

        // ── Lenis smooth scroll ──
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

        // Smooth nav anchor links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    lenis.scrollTo(href, { offset: -80 });
                }
            });
        });

        // ── Split titles ──
        splitText('.huge-text, .title-large');

        // ── Set initial hero states (hidden before loader exits) ──
        gsap.set('.hero-title .word-inner', { y: '110%' });
        gsap.set(['.hero-content .premium-badge', '.hero-since', '.hero-tagline'], { autoAlpha: 0, y: 20 });
        gsap.set('.scroll-indicator', { autoAlpha: 0, y: 10 });
        gsap.set('.hero-logo-center', { opacity: 0, scale: 0.6 });

        // ── Loader ──
        const loader    = document.querySelector('.loader');
        const loaderSpans = document.querySelectorAll('.loader-text span');
        const loaderSub   = document.querySelector('.loader-sub');

        const masterTL = gsap.timeline();
        masterTL
            // Brand letters drop in
            .to(loaderSpans, {
                y: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power4.out',
            })
            // "Since 1988" fades in
            .to(loaderSub, {
                opacity: 1,
                duration: 0.6,
                ease: 'power2.out',
            }, '-=0.3')
            // Brief pause, then slide loader up
            .to(loader, {
                yPercent: -100,
                duration: 1.2,
                delay: 0.7,
                ease: 'expo.inOut',
                onComplete: () => { loader.style.display = 'none'; },
            })
            // Hero badge
            .to('.hero-content .premium-badge', {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                ease: 'power3.out',
            }, '-=0.55')
            // Hero title words stagger up
            .to('.hero-title .word-inner', {
                y: '0%',
                duration: 1,
                stagger: 0.07,
                ease: 'power4.out',
            }, '-=0.5')
            // Since 1988
            .to('.hero-since', {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                ease: 'power3.out',
            }, '-=0.65')
            // Tagline
            .to('.hero-tagline', {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                ease: 'power3.out',
            }, '-=0.6')
            // Scroll indicator
            .to('.scroll-indicator', {
                autoAlpha: 1,
                y: 0,
                duration: 0.6,
                ease: 'power3.out',
            }, '-=0.5');

        // ══════════════════════════════════════════
        // 3. HERO SCROLL — TEXT OUT → LOGO IN
        // ══════════════════════════════════════════
        gsap.timeline({
            scrollTrigger: {
                trigger: '.hero-section',
                start: 'top top',
                end: '+=650',
                scrub: 1.5,
            }
        })
        // Text fades up and out
        .to('.hero-content', {
            opacity: 0,
            y: -60,
            ease: 'power2.in',
            duration: 0.45,
        }, 0)
        // Scroll indicator fades fast
        .to('.scroll-indicator', {
            opacity: 0,
            duration: 0.2,
        }, 0)
        // Logo scales up and fades in
        .fromTo('.hero-logo-center',
            { opacity: 0, scale: 0.6 },
            { opacity: 1, scale: 1, ease: 'power3.out', duration: 0.55 },
            0.3
        );

        // ══════════════════════════════════════════
        // 4. SECTION REVEAL ANIMATIONS
        // ══════════════════════════════════════════
        const revealTexts = document.querySelectorAll('.reveal-text');
        revealTexts.forEach(el => {
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
        // 4. IMAGE PARALLAX + CLIP-PATH REVEAL
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
        // 5. ALBUM GALLERY — SCATTER & SNAP
        // ══════════════════════════════════════════
        const albumCards = document.querySelectorAll('.album-card');
        albumCards.forEach((card) => {
            const rotateDeg = parseFloat(card.dataset.rotate) || 0;
            const xOffset = rotateDeg * 4;
            const yOffset = 60 + Math.abs(rotateDeg) * 3;

            gsap.set(card, {
                rotate: rotateDeg * 2.5,
                x: xOffset * 2,
                y: yOffset,
                opacity: 0,
                scale: 0.88,
            });

            gsap.to(card, {
                rotate: rotateDeg,
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

            card.addEventListener('mouseenter', () => {
                gsap.to(card, { y: -10, scale: 1.03, rotate: 0, duration: 0.4, ease: 'power2.out' });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { y: 0, scale: 1, rotate: rotateDeg, duration: 0.5, ease: 'power2.inOut' });
            });
        });

        // ══════════════════════════════════════════
        // 6. HANDWRITING REVEAL ANIMATION
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

            hwWords.forEach((word, i) => {
                hwTimeline.to(word, {
                    opacity: 1,
                    y: 0,
                    clipPath: 'inset(0 0% 0 0)',
                    duration: 0.5,
                    ease: 'power2.out',
                }, i * 0.12);
            });
        }

    }); // end DOMContentLoaded

    // ══════════════════════════════════════════════
    // 7. WHATSAPP FORM HANDLER (global)
    // ══════════════════════════════════════════════
    window.sendToWhatsapp = function () {
        const name    = document.getElementById('waName').value    || 'Customer';
        const phone   = document.getElementById('waPhone').value   || 'Not provided';
        const address = document.getElementById('waAddress').value || 'Not provided';
        const desc    = document.getElementById('waDesc').value    || 'Interested in premium shallots';

        const text = `Hi MRS Onion & Co,\n\n*Name:* ${name}\n*Phone:* ${phone}\n*Address:* ${address}\n*Description:* ${desc}`;
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/919551545786?text=${encodedText}`, '_blank');
    };

})();
