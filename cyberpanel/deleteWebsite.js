(function () {
    const path = "/websites/deleteWebsite";

    if (window.location.pathname !== path) {
        const params = new URLSearchParams(window.location.search);
        let domain = params.get("domain");
        if (!domain) {
            domain = prompt("Please enter the domain name:");
            if (!domain) return;
        }
        window.location.href = `${path}?domain=${encodeURIComponent(domain)}`;
        return;
    }

    let domain = new URLSearchParams(window.location.search).get("domain");
    if (!domain) {
        domain = prompt("Please enter the domain name:");
        if (!domain) return;
        window.location.href = `${path}?domain=${encodeURIComponent(domain)}`;
        return;
    }

    function retry(fn, delay = 300) {
        setTimeout(() => fn(domain), delay);
    }

    function trySelectAndDelete(domain) {
        const select = document.querySelector("select[ng-model='websiteToBeDeleted']");
        if (!select) return retry(trySelectAndDelete);

        const $select = angular.element(select);
        const $scope = $select.scope();
        if (!$scope) return retry(trySelectAndDelete);

        const ctrl = $select.controller("ngModel");
        if (!ctrl) return retry(trySelectAndDelete);

        const optionExists = [...select.options].some(opt => opt.value === domain);
        if (!optionExists) return retry(trySelectAndDelete);

        ctrl.$setViewValue(domain);
        ctrl.$render();
        $scope.$apply();

        if (typeof $scope.fetchDetails === 'function') {
            try {
                $scope.fetchDetails();
            } catch (e) {
                console.error("Error calling fetchDetails()", e);
            }
        }

        const deleteBtn = document.querySelector("button[ng-click='deleteWebsiteFinal()']");
        if (!deleteBtn) return retry(trySelectAndDelete);

        deleteBtn.disabled = false;
        deleteBtn.click();
    }

    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => trySelectAndDelete(domain), 500);
    });

    trySelectAndDelete(domain);
})();
