(function () {
    if (window.location.pathname !== "/websites/createWebsite") {
        const params = new URLSearchParams(window.location.search);
        const domain = params.get("domain");
        if (!domain) {
            window.location.href = "/websites/createWebsite";
            return;
        }
        window.location.href = "/websites/createWebsite?domain=" + encodeURIComponent(domain);
        return;
    }

    const domain = new URLSearchParams(window.location.search).get("domain");
    if (!domain) {
        alert("Missing domain param.");
        return;
    }

    function tryFillAndSubmit() {
        const form = document.querySelector("form[name='websiteCreationForm']");
        if (!form) return retry();

        const $form = angular.element(form);
        const $scope = $form.scope();
        if (!$scope) return retry();

        const inputs = [...form.querySelectorAll("input")].filter(e => e.id === "");
        if (inputs.length < 2) return retry();

        const values = [domain, `www@${domain}`];
        for (let i = 0; i < values.length; i++) {
            const input = inputs[i];
            const $input = angular.element(input);
            const ctrl = $input.controller("ngModel");
            if (!ctrl) return retry();
            ctrl.$setViewValue(values[i]);
            ctrl.$render();
        }

        const setSelectValue = (selector, value) => {
            const el = form.querySelector(selector);
            if (!el) return false;
            const $el = angular.element(el);
            const ctrl = $el.controller("ngModel");
            if (!ctrl) return false;
            ctrl.$setViewValue(value);
            ctrl.$render();
            return true;
        };

        if (!setSelectValue("select[ng-model='packageForWebsite']", "Default")) return retry();
        if (!setSelectValue("select[ng-model='phpSelection']", "PHP 8.2")) return retry();

        const ownerSelect = form.querySelector("select[ng-model='websiteOwner']");
        if (!ownerSelect || ![...ownerSelect.options].some(opt => opt.value === domain)) return retry();
        if (!setSelectValue("select[ng-model='websiteOwner']", domain)) return retry();

        try {
            $scope.$apply();
            const btn = form.querySelector("button[ng-click='createWebsite()']");
            if (!btn) return retry();

            btn.disabled = false;
            btn.click();
        } catch (err) {
            return retry();
        }
    }

    function retry() {
        setTimeout(tryFillAndSubmit, 300);
    }

    tryFillAndSubmit();
})();
