(function () {
    if (!window.location.hostname.endsWith(".freepik.es")) {
        alert('Este script solo funciona en "freepik.es"');
        return;
    }

    window.gcd = function(a, b) {
        const d = (b === 0 ? a : gcd(b, a % b).divisor);

        return {
            ratio: [a / d, b / d],
            divisor: d,
        };
    }

    window.downloadSource = function (container) {
        const imgContainer = container.querySelector('[class*="relative"][class*="mx-auto"][class*="max-w-full"][class*="overflow-hidden"][class*="sm:rounded-xl"][class*="transition-all"][class*="max-h-[--detail-preview-max-height-mobile]"][class*="xs:max-h-[--detail-preview-max-height]"]');
        const videoContainer = container.querySelector('[class*="relative"][class*="mx-auto"][class*="transition-all"][class*="aspect-video"][class*="min-h-full"][class*="max-w-full"][class*="self-center"][class*="overflow-hidden"][class*="rounded-none"][class*="object-contain"][class*="sm:rounded-none"][class*="lg:max-h-[calc(100vh-340px)]"]');
        const iconContainer = container.querySelector('[class*="flex"][class*="items-center"][class*="justify-center"][class*="relative"][class*="px-7"][class*="py-24"][class*="bg-white"][class*="lg:rounded-xl"][class*="lg:border"][class*="lg:border-solid"][class*="lg:border-surface-border-1"][class*="order-1"]');

        let srcData = {
            url: null,
            from: null,
            element: null,
            premium: container.querySelector('[class*="flex"][class*="px-2"][class*="items-center"][class*="justify-center"][class*="rounded-full"][class*="bg-neutral-900/60"][class*="text-white"][class*="gap-2"][class*="text-xs"][class*="font-semibold"][class*="aspect-square"][class*="size-8"]') != null,
        };

        if (imgContainer) {
            const img = imgContainer.querySelector(":scope > img");
            if (!img.complete) {
                setTimeout(() => {
                    downloadSource(container);    
                }, 1000);

                return;
            }
            
            const imgURL = img.getAttribute('srcset')
                .split(',')
                .map(entry => entry.trim())
                .find(entry => entry.endsWith('1380w'))
                ?.split(' ')[0];

            const ratio = gcd(img.naturalWidth, img.naturalHeight).ratio;
            let calculatedWidth = img.naturalWidth;
            
            if (ratio[0] > ratio[1]) {
                calculatedWidth = (Math.round((img.naturalWidth * 0.8) / 100) * 100);
            } else if (ratio[0] < ratio[1] || ratio[0] == ratio[1]) {
                calculatedWidth = (Math.round((img.naturalWidth * 0.55) / 100) * 100);
            }

            srcData.url = imgURL;
            srcData.from = "img";
            srcData.optimalWidth = srcData.premium ? calculatedWidth : 1380;

            const url = new URL(srcData.url);
            const newW = srcData.optimalWidth;
            url.searchParams.set("w", newW);
            const newUrl = url
                .toString()
                .replaceAll("%3D", "=")
                .replaceAll("%7E", "~");

            const newImg = document.createElement("img");
            newImg.src = newUrl;
            newImg.style.display = "block";
            newImg.style.marginTop = "1rem";
            newImg.style.maxWidth = "100%";
            newImg.style.border = "1px solid #ddd";
            newImg.style.borderRadius = "4px";

            srcData.element = newImg;

        } else if (videoContainer) {
            const video = videoContainer.querySelector(":scope > video source");
            srcData.url = video.src;
            srcData.from = "video";

            const videoElem = document.createElement("video");
            videoElem.src = video.src;
            videoElem.controls = true;
            videoElem.style.maxWidth = "100%";
            srcData.element = videoElem;
        } else if (iconContainer) {
            const icon = iconContainer.querySelector(":scope > img");
            srcData.url = icon.src;
            srcData.from = "icon";
            srcData.element = icon.cloneNode(true);
        }

        const url = new URL(srcData.url);
        const originalUrl = url.toString();

        const existing = document.getElementById("custom-image-popup");
        if (existing) existing.remove();

        const popup = Object.assign(document.createElement("div"), {
            id: "custom-image-popup",
            style: `
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 1rem;
            z-index: 2147483647;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
            border-radius: 8px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: auto;
            font-family: sans-serif;
        `
        });

        const closeBtn = Object.assign(document.createElement("button"), {
            textContent: "×",
            style: `
            position: absolute;
            top: 5px;
            right: 10px;
            background: transparent;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
        `
        });
        closeBtn.onclick = () => popup.remove();
        popup.appendChild(closeBtn);

        if (srcData.from === "img") {
            const form = Object.assign(document.createElement("form"), {
                style: "margin-top: 1rem; display: flex; align-items: center; gap: 0.5rem;"
            });

            const input = Object.assign(document.createElement("input"), {
                type: "number",
                value: srcData.optimalWidth,
                min: "1",
                style: `
                padding: 0.3rem 0.5rem;
                font-size: 1rem;
                width: 80px;
                border: 1px solid #ccc;
                border-radius: 4px;
            `
            });

            const submitBtn = Object.assign(document.createElement("button"), {
                type: "submit",
                textContent: "Actualizar",
                style: `
                padding: 0.3rem 0.8rem;
                font-size: 1rem;
                background-color: #3498db;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            `
            });

            const statusText = Object.assign(document.createElement("div"), {
                textContent: "Imagen actual.",
                style: `
                margin-top: 0.5rem;
                font-size: 0.9rem;
                color: #666;
            `
            });

            form.onsubmit = (e) => {
                e.preventDefault();

                const newW = input.value;
                url.searchParams.set("w", newW);
                const newUrl = url
                    .toString()
                    .replaceAll("%3D", "=")
                    .replaceAll("%7E", "~");

                if (srcData.element && srcData.element.parentNode) {
                    srcData.element.parentNode.removeChild(srcData.element);
                }

                const newImg = document.createElement("img");
                newImg.src = newUrl;
                newImg.style.display = "block";
                newImg.style.marginTop = "1rem";
                newImg.style.maxWidth = "100%";
                newImg.style.border = "1px solid #ddd";
                newImg.style.borderRadius = "4px";

                srcData.element = newImg;
                popup.appendChild(newImg);

                statusText.textContent = (newUrl === originalUrl)
                    ? "Imagen original."
                    : `URL actualizada a ancho = ${newW}`;
            };

            form.appendChild(input);
            form.appendChild(submitBtn);
            popup.appendChild(form);
            popup.appendChild(statusText);
        }

        srcData.element.style.display = "block";
        srcData.element.style.marginTop = "1rem";
        srcData.element.style.maxWidth = "100%";
        srcData.element.style.border = "1px solid #ddd";
        srcData.element.style.borderRadius = "4px";
        popup.appendChild(srcData.element);

        if (imgContainer) imgContainer.appendChild(popup);
        if (videoContainer) videoContainer.appendChild(popup);
        if (iconContainer) iconContainer.appendChild(popup);

        function outsideClickListener(e) {
            const popup = document.getElementById("custom-image-popup");
            if (!popup) {
                document.removeEventListener("click", outsideClickListener);
                document.removeEventListener("keydown", escapeKeyListener);
                return;
            }

            const isDownloadBtn = [...document.querySelectorAll(".customDownloadBtn")].some(btn => btn?.contains(e.target));

            if (!popup.contains(e.target) && !isDownloadBtn) {
                popup.remove();
                document.removeEventListener("click", outsideClickListener);
                document.removeEventListener("keydown", escapeKeyListener);
            }
        }

        function escapeKeyListener(e) {
            if (e.key === "Escape") {
                const popup = document.getElementById("custom-image-popup");
                if (popup) {
                    popup.remove();
                }
                document.removeEventListener("click", outsideClickListener);
                document.removeEventListener("keydown", escapeKeyListener);
            }
        }

        document.addEventListener("click", outsideClickListener);
        document.addEventListener("keydown", escapeKeyListener);
    };


    function addCustomUtilities(retry = true) {
        const optionsContainers = [...document.querySelectorAll('div[class*="-mb-3"][class*="min-h-10"][class*="xs:mb-0"] div[class*="flex"][class*="justify-end"]')];
        if (optionsContainers.length <= 0) {
            if (retry) {
                setTimeout(() => {
                    addCustomUtilities();
                }, 500);
            }

            return;
        }

        optionsContainers.forEach(c => {
            if (c.querySelector(".customDownloadBtn")) return;
            const customDownloadBtn = document.createElement('button');

            customDownloadBtn.type = 'button';
            customDownloadBtn.className = 'customDownloadBtn flex size-10 items-center justify-center leading-normal hover:text-surface-foreground-1 text-surface-foreground-3 hidden md:flex';
            customDownloadBtn.setAttribute('data-cy', 'add-to-collection-button');
            customDownloadBtn.setAttribute('data-state', 'closed');

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('fill', '#000000');
            svg.setAttribute('width', '16');
            svg.setAttribute('height', '16');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('class', 'icon glyph');

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M18,11.74a1,1,0,0,0-.52-.63L14.09,9.43,15,3.14a1,1,0,0,0-1.78-.75l-7,9a1,1,0,0,0-.17.87,1,1,0,0,0,.59.67l4.27,1.71L10,20.86a1,1,0,0,0,.63,1.07A.92.92,0,0,0,11,22a1,1,0,0,0,.83-.45l6-9A1,1,0,0,0,18,11.74Z');
            svg.appendChild(path);

            customDownloadBtn.appendChild(svg);
            customDownloadBtn.addEventListener("click", () => {
                downloadSource(c.closest('[class*="max-w-[1920px]"][class*="mx-auto"][class*="grid"][class*="gap-5"][class*="grid-cols-1"][class*="xs:grid-cols-[1fr_auto]"]'));
            });

            c.insertBefore(customDownloadBtn, c.firstChild);
        });
    }

    let currentObserver = null;

    function initObserver() {
        const contentContainer = document.querySelector('main[class*="max-w-[100vw]"][class*="flex-1"]');
        if (!contentContainer) {
            setTimeout(() => {
                initObserver();
            }, 100);

            return;
        }

        if (currentObserver) currentObserver.disconnect();
        const observer = new MutationObserver((mutations) => {
            mutations
                .filter(({ target: t }) => [
                    "_btqskg3 $px-0 lg:$px-70 $mx-auto $relative $h-full $mt-20 $max-w-[2060px] w-full",
                    "_btqskg3 $px-0 lg:$px-70 $mx-auto $relative $h-full $mt-20 $w-[1400px] $max-w-[100vw] xl:$max-w-full",
                    "relative mx-auto max-w-full overflow-hidden sm:rounded-xl transition-all max-h-[--detail-preview-max-height-mobile] xs:max-h-[--detail-preview-max-height]",
                    "relative mx-auto transition-all aspect-video min-h-full max-w-full self-center overflow-hidden rounded-none object-contain sm:rounded-none lg:max-h-[calc(100vh-340px)]",
                    "flex items-center justify-center relative px-7 py-24 bg-white lg:rounded-xl lg:border lg:border-solid lg:border-surface-border-1 order-1"
                ].includes(t.className))
                .forEach(_ => addCustomUtilities());
        });

        observer.observe(contentContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
        });

        currentObserver = observer;
    }

    function hookNavigation(callback) {
        const pushState = history.pushState;
        const replaceState = history.replaceState;

        function trigger() {
            setTimeout(callback, 250);
        }

        history.pushState = function () {
            pushState.apply(history, arguments);
            trigger();
        };

        history.replaceState = function () {
            replaceState.apply(history, arguments);
            trigger();
        };

        window.addEventListener("popstate", trigger);
    }

    hookNavigation(initObserver);
    initObserver();

    addCustomUtilities(false);

    alert("Running FreePik Utils!");
})();
