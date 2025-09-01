(function () {
    function getStepStatus(stepName) {
        const uploadData = JSON.parse(sessionStorage.getItem("uploadData"));
        if (!uploadData || !uploadData.steps) return null;

        const step = uploadData.steps.find(s => s.name === stepName);
        return step ? step.done : null;
    }

    function updateStepStatus(stepName, doneValue) {
        const uploadData = JSON.parse(sessionStorage.getItem("uploadData"));
        if (!uploadData || !uploadData.steps) return;

        const step = uploadData.steps.find(s => s.name === stepName);
        if (step) {
            step.done = doneValue;

            sessionStorage.setItem("uploadData", JSON.stringify(uploadData));
            console.log(`Step "${stepName}" updated to done = ${doneValue}`);
        } else {
            console.warn(`Step "${stepName}" not found`);
        }
    }

    async function isWordPressSite(after) {
        try {
            const response = await fetch('/wp-admin/', { method: 'GET' });
            if (!response.ok) {
                after(false);
                return;
            }

            console.log(response);
            after(true);
        } catch (error) {
            after(false);
        }
    }

    window.updraftUpload = async function () {
        const pathname = window.location.pathname;
        if (pathname != '/wp-admin/plugin-install.php') {
            window.location.href = `https://${window.location.hostname}/wp-admin/plugin-install.php`;;
            return;
        }

        const inputElement = document.querySelector("input#pluginzip");
        const updraftFile = "https://resources.local/updraftplus_new.zip";
        if (!inputElement) { setTimeout(() => window.updraftUpload(), 200); return; }

        const getFile = await fetch(updraftFile);
        if (!getFile.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const blob = await getFile.blob();
        const file = new File([blob], "updraftplus_new.zip", { type: blob.type });

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        inputElement.files = dataTransfer.files;

        if (!inputElement.files[0]) {
            alert("¡El archivo no se ha subido!");
            return;
        }

        updateStepStatus("updraftUpload", true);
        inputElement.parentElement.submit();
    }

    window.activateUpdraft = async function () {
        const pathname = window.location.pathname;
        if (pathname != '/wp-admin/plugins.php') {
            window.location.href = `https://${window.location.hostname}/wp-admin/plugins.php`;;
            return;
        }

        const activateField = document.getElementById("activate-updraftplus-backup-restore");
        const deactivateField = document.getElementById("deactivate-updraftplus");
        if (!activateField && !deactivateField) { setTimeout(() => window.activateUpdraft(), 200); return; }

        if (deactivateField) {
            updateStepStatus("activateUpdraft", true);
            return;
        }

        if (!activateField) { setTimeout(() => window.activateUpdraft(), 200); return; }
        updateStepStatus("activateUpdraft", true);
        activateField.click();
    }

    window.hideUpdraftMessageAndEnterUpload = async function (retry = 0) {
        const pathname = window.location.pathname;
        if (pathname != '/wp-admin/plugins.php') {
            window.location.href = `https://${window.location.hostname}/wp-admin/plugins.php`;;
            return;
        }

        const closeMessage = document.querySelector("a.shepherd-cancel-link");
        if (!closeMessage) { if (retry <= 15) { setTimeout(() => window.hideUpdraftMessageAndEnterUpload(retry + 1), 200) } else { updateStepStatus("hideUpdraftMessageAndEnterUpload", true); }; return; }

        closeMessage.click();
        setTimeout(() => {
            updateStepStatus("hideUpdraftMessageAndEnterUpload", true);
            window.location.href = "/wp-admin/options-general.php?page=updraftplus";
        }, 500);
    }

    window.uploadBackup = async function () {
        const { pathname, search, hostname } = window.location;
        if (pathname + search != '/wp-admin/options-general.php?page=updraftplus') {
            window.location.href = `https://${window.location.hostname}/wp-admin/options-general.php?page=updraftplus`;;
            return;
        }

        const openField = document.querySelector("a.updraft_uploader_toggle");
        if (!openField) { setTimeout(() => window.uploadBackup(), 200); return; }

        openField.click();
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth"
            });
        }, 500);

        function onFileListChanged(e, fileList) {
            const scopeFiles = [...fileList.querySelectorAll(":scope > div.file")];
            const files = [...fileList.querySelectorAll(":scope > div.file > div.file")];
            if (files.length < scopeFiles.length) return;

            let backupName = null;

            const uploadDone = files.every(e => {
                backupName = e.textContent.split(".zip")[0];
                return e.textContent.endsWith("- Complete");
            });
            if (!uploadDone) return;

            const nameSplit = backupName.split("_");
            const backupId = nameSplit[nameSplit.length - 1].split("-")[0];

            const backup = document.querySelector(`tr.updraft_existing_backups_row[data-nonce='${backupId}']`);
            if (!backup) { setTimeout(() => { onFileListChanged(e, fileList) }, 200); return; }

            const restoreBtn = backup.querySelector(".restore-button button");
            if (!restoreBtn) { setTimeout(() => { onFileListChanged(e, fileList) }, 200); return; }
            restoreBtn.click();

            const restoreBackup = async () => {
                const restoreOptionsForm = document.getElementById("updraft_restore_form");
                if (!restoreOptionsForm) { setTimeout(restoreBackup(), 200); return; };

                const restoreOptions = [...restoreOptionsForm.querySelectorAll(".updraft-restore-item")].filter(e => e.style.display != "none");
                restoreOptions.forEach(e => e.querySelector("input").click());

                setTimeout(() => {
                    document.querySelector(".updraft-restore--next-step").click();

                    setTimeout(() => {
                        document.querySelector(".updraft-restore--next-step").click();
                        updateStepStatus("uploadBackup", true);
                    }, 2000);
                }, 500);
            };

            setTimeout(() => {
                if (sessionStorage.getItem("restoringBackup") == null) {
                    sessionStorage.setItem("restoringBackup", "true");
                    restoreBackup();
                }
            }, 2000);
        }

        const fileList = document.getElementById("filelist");
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === "childList") {
                    mutation.addedNodes.forEach(node => {
                        onFileListChanged(node, fileList);
                    });
                    mutation.removedNodes.forEach(node => {
                        onFileListChanged(node, fileList);
                    });
                }

                if (mutation.type === "attributes") {
                    onFileListChanged(mutation.target, fileList);
                }

                if (mutation.type === "characterData") {
                    onFileListChanged(mutation.target.parentNode, fileList);
                }
            }
        });

        observer.observe(fileList, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
    }

    window.deleteOldFiles = async function () {
        const { pathname, search, hostname } = window.location;
        if (pathname + search != '/wp-admin/options-general.php?page=updraftplus' || sessionStorage.getItem("restoringBackup") != null) {
            if (sessionStorage.getItem("restoringBackup") != null) sessionStorage.removeItem("restoringBackup");

            window.location.href = `https://${window.location.hostname}/wp-admin/options-general.php?page=updraftplus`;;
            return;
        }

        const deleteBtn = document.getElementById("updraft_delete_old_dirs_pagediv");
        if (!deleteBtn) { updateStepStatus("deleteOldFiles", true); return; } 

        deleteBtn.querySelector("input[type='submit']").click();
        updateStepStatus("deleteOldFiles", true);
    }

    window.deactivateWpOptimize = async function () {
        const pathname = window.location.pathname;
        if (pathname != '/wp-admin/plugins.php') {
            window.location.href = `https://${window.location.hostname}/wp-admin/plugins.php`;;
            return;
        }

        const deactivateBtn = document.getElementById("deactivate-wp-optimize");
        if (!deactivateBtn) { updateStepStatus("deactivateWpOptimize", true); return; }

        updateStepStatus("deactivateWpOptimize", true);
        deactivateBtn.click();
    }

    window.activateGTranslate = async function () {
        const pathname = window.location.pathname;
        if (pathname != '/wp-admin/plugins.php') {
            window.location.href = `https://${window.location.hostname}/wp-admin/plugins.php`;;
            return;
        }

        const deactivateBtn = document.getElementById("deactivate-gtranslate");
        if (deactivateBtn) { updateStepStatus("activateGTranslate", true); return; }

        const activateBtn = document.getElementById("activate-gtranslate");
        if (!activateBtn) { setTimeout(() => window.activateGTranslate(), 200); return; }

        updateStepStatus("activateGTranslate", true);
        activateBtn.click();
    }

    window.activateLiteSpeed = async function () {
        const pathname = window.location.pathname;
        if (pathname != '/wp-admin/plugins.php') {
            window.location.href = `https://${window.location.hostname}/wp-admin/plugins.php`;;
            return;
        }

        const deactivateBtn = document.getElementById("deactivate-litespeed-cache");
        if (deactivateBtn) { updateStepStatus("activateLiteSpeed", true); window.refreshLiteSpeed(); return; }

        const activateBtn = document.getElementById("activate-litespeed-cache");
        if (!activateBtn) { setTimeout(() => window.activateLiteSpeed(), 200); return; }

        updateStepStatus("activateLiteSpeed", true);
        activateBtn.click();
    }

    window.refreshLiteSpeed = async function () {
        const pathname = window.location.pathname;
        if (pathname != '/wp-admin/plugins.php') {
            window.location.href = `https://${window.location.hostname}/wp-admin/plugins.php`;;
            return;
        }

        const refreshButton = document.getElementById("wp-admin-bar-litespeed-purge-all");
        if (!refreshButton) { setTimeout(() => window.refreshLiteSpeed(), 200); return; }

        updateStepStatus("refreshLiteSpeed", true);
        refreshButton.querySelector("a").click();
    }

    window.uploadDone = async function () {
        updateStepStatus("uploadDone", true);
        alert("El script ha terminado! Si necesitas algún otro cambio hazlo.");
    }

    const sslErrorContinue = document.getElementById("proceed-link");
    if (sslErrorContinue) { sslErrorContinue.click(); return; }

    const urlParams = new URLSearchParams(window.location.search);
    const domain = urlParams.get('domain');

    if (domain) {
        window.location.href = `https://${domain}/wp-admin/plugin-install.php`;
        return;
    }

    const pathname = window.location.pathname;
    const pathArray = pathname.split('/').filter(e => e != "");

    if (!pathArray.filter(e => e != "").includes("wp-admin") && pathname != "/wp-login.php") {
        isWordPressSite((isWP) => {
            if (!isWP) { alert("Este script solo funciona en sitios WordPress"); return; }
            window.location.href = `https://${window.location.hostname}/wp-admin/plugin-install.php`;;
        });
        return;
    }

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

    if (sessionStorage.getItem("uploadData") == null) {
        sessionStorage.setItem("uploadData", JSON.stringify({
            steps: [
                {
                    "name": "updraftUpload",
                    "done": false,
                },
                {
                    "name": "activateUpdraft",
                    "done": false,
                },
                {
                    "name": "hideUpdraftMessageAndEnterUpload",
                    "done": false,
                },
                {
                    "name": "uploadBackup",
                    "done": false,
                },
                {
                    "name": "deleteOldFiles",
                    "done": false,
                },
                {
                    "name": "deactivateWpOptimize",
                    "done": false,
                },
                {
                    "name": "activateGTranslate",
                    "done": false,
                },
                {
                    "name": "activateLiteSpeed",
                    "done": false,
                },
                {
                    "name": "refreshLiteSpeed",
                    "done": false,
                },
                {
                    "name": "uploadDone",
                    "done": false,
                },
            ],
        }));

        sessionStorage.removeItem("restoringBackup");
    }


    const rawData = JSON.parse(sessionStorage.getItem("uploadData"));
    const data = rawData.steps.filter(({ done }) => !done);
    if (data.length <= 0) { alert("¡No hay más acciones pendientes por hacer!"); return; }

    const event = data[0];
    if (typeof window[event.name] === "function") {
        window[event.name]();
    } else {
        alert("¡Algo inesperado ha sucedido!");
    }
})();
