(function() {
  const urlParams = new URLSearchParams(window.location.search);
  let domain = urlParams.get('domain');

  if (!domain) {
    domain = prompt("Enter domain:");
  }

  if (domain) {
    window.location.href = `https://${domain}/wp-admin/plugin-install.php`;
  }
})();
