(function () {
  const targetPath = "/serverstatus/services";

  if (window.location.pathname !== targetPath) {
    const a = document.createElement("a");
    a.href = targetPath;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
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
