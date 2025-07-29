const domainsInput = prompt("Enter domain(s), comma-separated:");
const domains = domainsInput
    .split(',')
    .map(d => d.trim())
    .filter(d => d.length);

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
