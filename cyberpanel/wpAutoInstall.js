(function () {
    const urlParams = new URLSearchParams(window.location.search);
    let domain = urlParams.get('domain');

    if (!domain) {
        domain = prompt("Enter domain:");
    }

    const expectedPath = `/websites/${domain}/wordpressInstall`;
    if (window.location.pathname !== expectedPath) {
        window.location.href = expectedPath + window.location.search;
        return;
    }

    const inputs = [...document.getElementById("createPackages").querySelectorAll("input")];
    const values = ["intratum", "intratum", "intratum", "intratum@intratum.com", ""];

    inputs.forEach((input, index) => {
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        valueSetter.call(input, values[index]);

        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    setTimeout(() => {
        const button = document.getElementById("createPackages").querySelector("button");
        if (button) button.click();
    }, 100);
})();
