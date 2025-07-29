(function() {
  const targetPath = "/serverstatus/services";

  if (window.location.pathname !== targetPath) {
    window.location.href = targetPath;
    return;
  }

  function tryClickButton(attemptsLeft = 10) {
    const button = document.querySelector("button[ng-click=\"serviceAction('lsws','restart')\"]");

    if (button && !button.disabled) {
      button.click();
    } else if (attemptsLeft > 0) {
      setTimeout(() => tryClickButton(attemptsLeft - 1), 500);
    }
  }

  tryClickButton();
})();
