(function () {
    const pathname = window.location.pathname;

    if (pathname !== "/wp-login.php") {
        const urlParams = new URLSearchParams(window.location.search);
        let domain = urlParams.get('domain');

        if (!domain) {
            domain = prompt("Enter domain:");
        }

        if (domain) {
            window.location.href = `https://${domain}/wp-admin/plugin-install.php`;
        }

        return;
    }

    const userInput = document.getElementById("user_login");
    const passInput = document.getElementById("user_pass");
    const submitBtn = document.getElementById("wp-submit");

    if (userInput && passInput && submitBtn) {
        userInput.value = "intratum";
        passInput.value = "intratum";

        userInput.dispatchEvent(new Event("input", { bubbles: true }));
        passInput.dispatchEvent(new Event("input", { bubbles: true }));

        setTimeout(() => submitBtn.click(), 100);
    }
})();
