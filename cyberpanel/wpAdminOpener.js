(function () {
    async function isWordPressSite(after) {
        try {
            const response = await fetch('/index.php/wp-json/', { method: 'GET' });
            if (!response.ok) {
                after(false);
                return;
            }
            const data = await response.json();
            const isWP = data.namespaces !== undefined || data.routes !== undefined;
            after(isWP);
        } catch (error) {
            after(false);
        }
    }

    const pathname = window.location.pathname;
    const pathArray = pathname.split('/').filter(e => e != "");

    if (pathname == "/wp-login.php") {
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
        
        return;
    }

    if (pathArray.filter(e => e != "").includes("wp-admin")) {
        return;
    }
    
    isWordPressSite((isWP) => {
        if (!isWP) return;
        window.location.href = `${window.location.origin}/wp-admin/plugin-install.php`;
    });
})();
