(function () {
    if (!window.location.hostname.endsWith(".freepik.es")) {
        alert('Este script solo funciona en "freepik.es"');
        return;
    }

    window.downloadSource = function (element) {
        const imgContainer = document.querySelector('[class*="relative"][class*="mx-auto"][class*="max-w-full"][class*="overflow-hidden"][class*="sm:rounded-xl"][class*="transition-all"][class*="max-h-[--detail-preview-max-height-mobile]"][class*="xs:max-h-[--detail-preview-max-height]"]');
        const videoContainer = document.querySelector('[class*="relative"][class*="mx-auto"][class*="transition-all"][class*="aspect-video"][class*="min-h-full"][class*="max-w-full"][class*="self-center"][class*="overflow-hidden"][class*="rounded-none"][class*="object-contain"][class*="sm:rounded-none"][class*="lg:max-h-[calc(100vh-340px)]"]');
        const iconContainer = document.querySelector('[class*="flex"][class*="items-center"][class*="justify-center"][class*="relative"][class*="px-7"][class*="py-24"][class*="bg-white"][class*="lg:rounded-xl"][class*="lg:border"][class*="lg:border-solid"][class*="lg:border-surface-border-1"][class*="order-1"]');

        let srcData = {
            url: null,
            from: null,
            element: null
        };

        if (imgContainer) {
            const img = imgContainer.querySelector(":scope > img");
            const imgURL = img.getAttribute('srcset')
                .split(',')
                .map(entry => entry.trim())
                .find(entry => entry.endsWith('1380w'))
                ?.split(' ')[0];

            srcData.url = imgURL;
            srcData.from = "img";
            srcData.element = img.cloneNode(true);

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
            const input = Object.assign(document.createElement("input"), {
                type: "number",
                value: "1350",
                min: "1",
                style: `
                padding: 0.3rem 0.5rem;
                font-size: 1rem;
                width: 80px;
                border: 1px solid #ccc;
                border-radius: 4px;
            `
            });

            const button = Object.assign(document.createElement("button"), {
                textContent: "Actualizar",
                style: `
                margin-left: 0.5rem;
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

            button.onclick = () => {
                const newW = input.value;
                url.searchParams.set("w", newW);
                const newUrl = url.toString();

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

            popup.appendChild(input);
            popup.appendChild(button);
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
    };


    function addCustomUtilities(element) {
        const optionsContainer = document.querySelector('div[class*="-mb-3"][class*="min-h-10"][class*="xs:mb-0"] div[class*="flex"][class*="justify-end"]');
        if (!optionsContainer) {
            setTimeout(() => {
                addCustomUtilities(element);
            }, 500);

            return;
        }

        const downloadBtn = document.createElement('button');
        downloadBtn.type = 'button';
        downloadBtn.className = 'flex size-10 items-center justify-center leading-normal hover:text-surface-foreground-1 text-surface-foreground-3 hidden md:flex';
        downloadBtn.setAttribute('data-cy', 'add-to-collection-button');
        downloadBtn.setAttribute('data-state', 'closed');

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

        const span = document.createElement('span');
        span.className = '_1uvu8nb0';
        span.textContent = 'Guardar en colecciones';

        downloadBtn.appendChild(svg);
        downloadBtn.appendChild(span);

        downloadBtn.addEventListener("click", () => {
            downloadSource(element);
        });

        optionsContainer.insertBefore(downloadBtn, optionsContainer.firstChild);
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
                .filter(({ target: t }) => ["_btqskg3 $px-0 lg:$px-70 $mx-auto $relative $h-full $mt-20 $max-w-[2060px] w-full", "_btqskg3 $px-0 lg:$px-70 $mx-auto $relative $h-full $mt-20 $w-[1400px] $max-w-[100vw] xl:$max-w-full"].includes(t.className))
                .forEach(({ target: t }) => addCustomUtilities(t));
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


    alert("Running FreePik Utils!");
})();
