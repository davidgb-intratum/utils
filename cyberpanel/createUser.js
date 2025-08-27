if (window.location.pathname !== "/users/createUser") {
    window.location.href = "/users/createUser";
    return;
}

const domainsInput = prompt("Enter domain(s), comma-separated:");
const userPass = prompt("Enter user password:");

const domains = domainsInput
    .split(',')
    .map(d => d.trim())
    .filter(d => d.length);

const form = document.querySelector("form[name=createUser]");

function fillAndSubmit(domain, delay = 0) {
    setTimeout(() => {
        const $form = angular.element(form);
        const $scope = $form.scope();

        const data = {
            firstName: (domain =>
                (domain.split('.').slice(-2, -1)[0] || '')
                    .replace(/\d+/g, '')
                    .replace(/-/g, ' ')
                    .slice(0, 32)
            )(domain),
            lastName: "intratum",
            email: `www@${domain}`,
            websitesLimits: 1,
            userName: domain,
            password: userPass,
            selectedACL: "user",
            securityLevel: "HIGH"
        };

        Object.entries(data).forEach(([model, value]) => {
            const input = form.querySelector(`[ng-model='${model}']`);
            if (input) {
                const $input = angular.element(input);
                const ctrl = $input.controller('ngModel');
                if (ctrl) {
                    ctrl.$setViewValue(value);
                    ctrl.$render();
                }
            }
        });

        $scope.$apply();
        form.querySelector("button[ng-click='createUserFunc()']").click();
    }, delay);
}

domains.forEach((domain, i) => {
    fillAndSubmit(domain, i * 1500);
});

setTimeout(() => {
    domains.forEach(domain => {
        const a = document.createElement('a');
        a.href = `/websites/createWebsite?domain=${encodeURIComponent(domain)}`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
    });

}, domains.length * 1500 + 1000);
