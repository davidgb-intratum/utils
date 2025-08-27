[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Auto-elevate to Administrator if not already
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $IsAdmin) {
    Start-Process PowerShell "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# Cambiar al directorio donde está el script
Set-Location -Path $PSScriptRoot


# ------------------ Variables Globales ------------------
$global:serverIp = $null
$global:serverPassword = $null
$global:domain = $null



# ------------------ Funciones ------------------
function Empezar-Documentacion {
    Clear-Host
    Write-Host "`nIniciando documentación..." -ForegroundColor Green

    # Preguntar si quiere conectarse a un host externo
    $respuesta = Read-Host "¿Quieres conectarte a un host externo para iniciar la documentación? (S/N) [S]"
    if ([string]::IsNullOrWhiteSpace($respuesta)) { $respuesta = "S" }
    $serverIp = $global:serverIp

    if ($respuesta -match '^[Ss]$') {
        # Pedir IP del servidor
        while ([string]::IsNullOrWhiteSpace($serverIp)) {
            $serverIp = Read-Host "Introduce la IP del servidor"
            if ([string]::IsNullOrWhiteSpace($serverIp)) {
                Write-Host "La IP no puede estar vacía. Intenta de nuevo." -ForegroundColor Red
            }
        }

        # Path to plink.exe (make sure it's in PATH or provide full path)
        $plinkPath = Join-Path -Path $PSScriptRoot -ChildPath "plink.exe"
        
        # Construir comando SSH
        $sshCommand = "$plinkPath -ssh -t ubuntu@$global:serverIp -pw $global:serverPassword `"curl -fsSL -o /tmp/serverDoc.sh https://raw.githubusercontent.com/davidgb-intratum/utils/refs/heads/main/wordpress/server/serverDoc.sh && chmod +x /tmp/serverDoc.sh && sudo /tmp/serverDoc.sh $global:domain 1`""

        Write-Host "`nEjecutando comando SSH en $serverIp ..." -ForegroundColor Yellow
        Invoke-Expression $sshCommand
    } else {
        Write-Host "`nSe usará la documentación local..." -ForegroundColor Cyan
    }

    # Carpeta de certificados
    $pendingCertsFolder = Join-Path -Path $PSScriptRoot -ChildPath "pendingDocs"
    $activeCertsFolder = Join-Path -Path $PSScriptRoot -ChildPath "activeDocs"

    # Asegurarse de que las carpetas existan
    if (-not (Test-Path $pendingCertsFolder)) {
        New-Item -ItemType Directory -Path $pendingCertsFolder | Out-Null
    }

    if (-not (Test-Path $activeCertsFolder)) {
        New-Item -ItemType Directory -Path $activeCertsFolder | Out-Null
    }

    # Buscar archivos .crt en la carpeta
    $crtFiles = Get-ChildItem -Path $pendingCertsFolder -Filter "*.crt" -File

    if ($crtFiles.Count -eq 0) {
        Write-Host "`nNo hay webs pendientes... Descarga una a continuación." -ForegroundColor Yellow

        # Pedir al usuario que pegue el comando SSH completo
        $sshCommand = Read-Host "`nPega aquí el comando SSH completo para descargar el certificado"

        if (-not [string]::IsNullOrWhiteSpace($sshCommand)) {
            $pscpPath = Join-Path -Path $PSScriptRoot -ChildPath "pscp.exe"

            # Build the command
            $scpCommand = "$pscpPath -pw $global:serverPassword $sshCommand"

            Write-Host "`nDescargando certificado desde $serverIp ..." -ForegroundColor Yellow
            Invoke-Expression $scpCommand
        } else {
            Write-Host "No se proporcionó ningún comando. Saliendo de la función." -ForegroundColor Red
            return
        }
    } else {
        Write-Host "`n¡Se encontraron webs pendientes!" -ForegroundColor Green
        $crtFiles | ForEach-Object { Write-Host "  $($_.BaseName)" }

        # Preguntar si quiere descargar un nuevo certificado o usar los existentes
        $respuesta = Read-Host "`n¿Quieres descargar un nuevo certificado? (S/N) [N]"
        if ([string]::IsNullOrWhiteSpace($respuesta)) { $respuesta = "N" }

        if ($respuesta -match '^[Ss]$') {
            $sshCommand = Read-Host "`nPega aquí el comando SSH completo para descargar el certificado"

            if (-not [string]::IsNullOrWhiteSpace($sshCommand)) {
                $pscpPath = Join-Path -Path $PSScriptRoot -ChildPath "pscp.exe"

                # Build the command
                $scpCommand = "$pscpPath -pw $global:serverPassword $sshCommand"
                
                Write-Host "`nDescargando certificado desde $serverIp ..." -ForegroundColor Yellow
                Invoke-Expression $scpCommand

                Write-Host "`n¡Certificado descargado con éxito!`n" -ForegroundColor Green
            } else {
                Write-Host "No se proporcionó ningún comando. Saliendo de la función." -ForegroundColor Red
                return
            }
        } else {
            Write-Host "`nUsando los certificados existentes para continuar..." -ForegroundColor Green
        }
    }


    # Obtener todos los archivos .crt
    $crtFiles = Get-ChildItem -Path $pendingCertsFolder -Filter "*.crt" -File

    if ($crtFiles.Count -eq 0) {
        Write-Host "`n¡No hay webs disponibles para empezar una documentación!" -ForegroundColor Red
        Write-Host "El script no puede continuar."
        Read-Host "`nPresiona Enter para salir..."
        exit
    }
    
    # Mostrar menú de selección
    Write-Host "`nWebs disponibles para documentación:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $crtFiles.Count; $i++) {
        Write-Host "  $($i+1)) $($crtFiles[$i].BaseName)"
    }

    $isValid = $false
    while (-not $isValid) {
        $selection = Read-Host "`nSelecciona el certificado a usar [1-$($crtFiles.Count)]"

        if ($selection -match "^[1-9][0-9]*$" -and $selection -ge 1 -and $selection -le $crtFiles.Count) {
            $selectedCert = $crtFiles[$selection - 1]
            $selectedCertPath = $selectedCert.FullName
            $isValid = $true
        } else {
            Write-Host "Opción inválida. Intenta de nuevo." -ForegroundColor Red
        }
    }

    $destFile = Join-Path -Path $activeCertsFolder -ChildPath $selectedCert.Name
    if (Test-Path $destFile) {
        Write-Host "¡Parece que esa web ya está en proceso de documentación!" -ForegroundColor Yellow
        Write-Host "Se eliminará el certificado antiguo para evitar conflictos." -ForegroundColor Yellow
        Remove-Item -Path $destFile -Force
    }

    Move-Item -Path $selectedCertPath -Destination $destFile
    $certPath = $destFile
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store "Root","LocalMachine"
    $store.Open("ReadWrite")
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 $certPath
    $store.Add($cert)
    $store.Close()

    # Verificar si fue agregado correctamente
    $certBaseName = $selectedCert.BaseName
    $installedCert = Get-ChildItem -Path Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*$certBaseName*" }

    if (-not $installedCert) {
        Write-Host "`nError: El certificado no se encuentra en el almacén después de intentar importarlo." -ForegroundColor Red
        return
    }

    Write-Host "`n¡Certificado autorizado con éxito!" -ForegroundColor Green

    while ([string]::IsNullOrWhiteSpace($serverIp)) {
        $serverIp = Read-Host "Introduce la IP del servidor"
        if ([string]::IsNullOrWhiteSpace($serverIp)) {
            Write-Host "La IP no puede estar vacía. Intenta de nuevo." -ForegroundColor Red
        }
    }

    # === Agregar entrada al archivo hosts ===
    $hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
    $newEntry  = "$serverIp`t$certBaseName"

    # Verificar si ya existe la entrada
    $alreadyExists = Select-String -Path $hostsPath -Pattern $certBaseName -SimpleMatch -Quiet
    if ($alreadyExists) {
        Write-Host "La entrada para '$certBaseName' ya existe en el archivo hosts. No se agregará de nuevo." -ForegroundColor Yellow
    } else {
        Add-Content -Path $hostsPath -Value $newEntry
        Write-Host "`nEntrada agregada al archivo hosts:" -ForegroundColor Green
        Write-Host "  $newEntry"
    }

    Write-Host "¡Ya se puede empezar a hacer la documentación!" -ForegroundColor Green
}

function Terminar-Documentacion {
    Clear-Host
    Write-Host "`nTerminando documentación..." -ForegroundColor Green

    # Preguntar si quiere conectarse a un host externo
    $respuesta = Read-Host "¿Quieres conectarte a un host externo para terminar la documentación? (S/N) [S]"
    if ([string]::IsNullOrWhiteSpace($respuesta)) { $respuesta = "S" }
    $serverIp = $global:serverIp

    if ($respuesta -match '^[Ss]$') {
        # Pedir IP del servidor
        while ([string]::IsNullOrWhiteSpace($serverIp)) {
            $serverIp = Read-Host "Introduce la IP del servidor"
            if ([string]::IsNullOrWhiteSpace($serverIp)) {
                Write-Host "La IP no puede estar vacía. Intenta de nuevo." -ForegroundColor Red
            }
        }

        # Path to plink.exe (make sure it's in PATH or provide full path)
        $plinkPath = Join-Path -Path $PSScriptRoot -ChildPath "plink.exe"
        
        # Construir comando SSH
        $sshCommand = "$plinkPath -ssh -t ubuntu@$global:serverIp -pw $global:serverPassword `"curl -fsSL -o /tmp/serverDoc.sh https://raw.githubusercontent.com/davidgb-intratum/utils/refs/heads/main/wordpress/server/serverDoc.sh && chmod +x /tmp/serverDoc.sh && sudo /tmp/serverDoc.sh $global:domain 2`""

        Write-Host "`nEjecutando comando SSH en $serverIp ..." -ForegroundColor Yellow
        Invoke-Expression $sshCommand
    } else {
        Write-Host "`nSe usará la documentación local..." -ForegroundColor Cyan
    }

    # Carpeta de certificados
    $activeCertsFolder = Join-Path -Path $PSScriptRoot -ChildPath "activeDocs"

    # Asegurarse de que la carpeta exista
    if (-not (Test-Path $activeCertsFolder)) {
        New-Item -ItemType Directory -Path $activeCertsFolder | Out-Null
    }

    # Buscar archivos .crt en la carpeta
    $crtFiles = Get-ChildItem -Path $activeCertsFolder -Filter "*.crt" -File
    if ($crtFiles.Count -eq 0) {
        Write-Host "`n¡No hay webs disponibles para finalizar su documentación!" -ForegroundColor Red
        Write-Host "El script no puede continuar."
        Read-Host "`nPresiona Enter para salir..."
        exit
    }
    
    Write-Host "`n¡Se encontraron webs en proceso!" -ForegroundColor Green
    Write-Host "`nWebs disponibles para finalizar documentación:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $crtFiles.Count; $i++) {
        Write-Host "  $($i+1)) $($crtFiles[$i].BaseName)"
    }

    $isValid = $false
    while (-not $isValid) {
        $selection = Read-Host "`nSelecciona la web a usar [1-$($crtFiles.Count)]"

        if ($selection -match "^[1-9][0-9]*$" -and $selection -ge 1 -and $selection -le $crtFiles.Count) {
            $selectedCert = $crtFiles[$selection - 1]
            $selectedCertPath = $selectedCert.FullName
            $isValid = $true
        } else {
            Write-Host "Opción inválida. Intenta de nuevo." -ForegroundColor Red
        }
    }

    $certBaseName = $selectedCert.BaseName
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store "Root","LocalMachine"
    $store.Open("ReadWrite")
    $certs = $store.Certificates | Where-Object {$_.Subject -like "*$certBaseName*"}
    foreach ($cert in $certs) {
        $store.Remove($cert)
        Write-Host "Borrando certificado:" $cert.Subject
    }
    $store.Close()

    # Verificar si fue eliminado correctamente
    $installedCert = Get-ChildItem -Path Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*$certBaseName*" }

    if ($installedCert) {
        Write-Host "`nError: El certificado todavía se encuentra en el almacén después de intentar borrarlo." -ForegroundColor Red
        return
    }

    Remove-Item -Path $selectedCertPath -Force
    Write-Host "`n¡Certificados borrados con éxito!" -ForegroundColor Green

    # === Eliminar entrada existente en el archivo hosts si existe ===
    $hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"

    if (Test-Path $hostsPath) {
        $hostsContent = Get-Content -Path $hostsPath
        $alreadyExists = $hostsContent | Where-Object { $_ -match [regex]::Escape($certBaseName) }

        if ($alreadyExists) {
            Write-Host "La entrada para '$certBaseName' existe en el archivo hosts. Eliminando..." -ForegroundColor Yellow
            $updatedContent = $hostsContent | Where-Object { $_ -notmatch [regex]::Escape($certBaseName) }
            Set-Content -Path $hostsPath -Value $updatedContent -Force
        }
    } else {
        Write-Host "Archivo hosts no encontrado. No se puede modificar." -ForegroundColor Red
    }

    Write-Host "¡Ya ha terminado la documentación!" -ForegroundColor Green
}

function Salir {
    Write-Host "`nSaliendo..." -ForegroundColor Cyan
    exit
}

function Cambiar-Domain {
    $newDomain = Read-Host "Introduce el nuevo dominio"
    if (-not [string]::IsNullOrWhiteSpace($newDomain)) {
        $global:domain = $newDomain
        Write-Host "`nDominio cambiado a: $global:domain" -ForegroundColor Green
    } else {
        Write-Host "❌ No se ingresó un dominio válido. No se cambió." -ForegroundColor Red
    }
}

function Mostrar-Menu {
    do {
        Clear-Host
        Write-Host "===============================" -ForegroundColor Cyan
        Write-Host "    Script de Documentación    " -ForegroundColor Green
        Write-Host "===============================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Servidor Actual: $global:serverIp" -ForegroundColor Yellow
        Write-Host "Dominio actual: $global:domain" -ForegroundColor Yellow
        Write-Host ""

        Write-Host "Selecciona una opción:" -ForegroundColor Yellow
        Write-Host "  1) Empezar Documentación"
        Write-Host "  2) Terminar Documentación"
        Write-Host "  3) Cambiar Dominio"
        Write-Host "  4) Salir"
        Write-Host ""

        $choice = Read-Host "Ingresa tu opción [1-4]"

        switch ($choice) {
            1 { Empezar-Documentacion }
            2 { Terminar-Documentacion }
            3 { Cambiar-Domain }
            4 { Salir }
            Default { Write-Host "`nOpción inválida. Intenta de nuevo." -ForegroundColor Red }
        }

        Write-Host "`nRegresando al menú principal..." -ForegroundColor Cyan
        Start-Sleep -Seconds 3
    } while ($choice -ne 4)
}



# ------------------ Solicitar datos iniciales ------------------
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "    Script de Documentación    " -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Solicitar IP
while ([string]::IsNullOrWhiteSpace($global:serverIp)) {
    $global:serverIp = Read-Host "Introduce la IP del servidor"
    if ([string]::IsNullOrWhiteSpace($global:serverIp)) {
        Write-Host "La IP no puede estar vacía." -ForegroundColor Red
    }
}

# Solicitar contraseña (oculta la entrada)
while (-not $global:serverPassword) {
    $securePass = Read-Host "Introduce la contraseña del usuario 'ubuntu'" -AsSecureString
    if ($securePass.Length -eq 0) {
        Write-Host "Debes ingresar una contraseña." -ForegroundColor Red
    } else {
        # Convertir SecureString a texto plano solo para usar en Invoke-Command / SSH
        $global:serverPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
        )
    }
}

# Solicitar dominio
while ([string]::IsNullOrWhiteSpace($global:domain)) {
    $global:domain = Read-Host "Introduce el dominio con el que deseas trabajar"
    if ([string]::IsNullOrWhiteSpace($global:domain)) {
        Write-Host "Debes ingresar un dominio válido." -ForegroundColor Red
    }
}

Mostrar-Menu
