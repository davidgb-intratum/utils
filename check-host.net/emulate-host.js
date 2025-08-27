function run() {
    const iframe = document.createElement('iframe');
    const urlParams = new URLSearchParams(window.location.search);
    const domain = decodeURI(urlParams.get("host")) || "check-host.net";

    const ip = prompt("Enter IP address:");
    if (!ip) {
        alert("No IP provided. Exiting.");
        return;
    }

    iframe.src = `https://check-host.net/ip-info?host=${ip}`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.height = "100dvh";

    document.body.style.minHeight = "100dvh";

    [...document.body.children].forEach(e => e.style.display = "none");

    document.body.appendChild(iframe);
    iframe.onload = function () {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const iframeContent = iframeDoc.getElementById("content2");
            const originalContent = document.getElementById("content2");

            if (iframeContent && originalContent) {
                const clonedNode = iframeContent.cloneNode(true);

                originalContent.parentNode.insertBefore(clonedNode, originalContent);
                originalContent.remove();

                const hostip = iframeDoc.getElementById("hostip");
                hostip.value = domain;

                const host = iframeDoc.getElementById("lang-selector").previousElementSibling.querySelector("span");
                host.textContent = new URL(domain).host;
            }
        } catch (e) {
            console.error("Error accessing iframe content:", e);
        }


    };
}

run();
