#!/bin/bash


start_documentation() {
    echo -e "\nIniciando documentación para el dominio: $DOMAIN"

    CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
    [ -d "$CERT_PATH" ] || { echo -e "No existe la carpeta de los certificados: $CERT_PATH.\n¿Está la web subida?"; exit 1; }

    echo "Verificando certificados existentes..."
    FILES_MISSING=false
    if [ ! -f "$CERT_PATH/fullchain.pem.old" ] || [ ! -f "$CERT_PATH/privkey.pem.old" ]; then
        for FILE in fullchain.pem privkey.pem; do
            if [ -f "$CERT_PATH/$FILE" ] && [ ! -f "$CERT_PATH/$FILE.old" ]; then
                echo "Renombrando $FILE a $FILE.old"
                mv "$CERT_PATH/$FILE" "$CERT_PATH/$FILE.old"
            elif [ ! -f "$CERT_PATH/$FILE" ] && [ ! -f "$CERT_PATH/$FILE.old" ]; then
                echo "Archivo no encontrado: $FILE"
                FILES_MISSING=true
            fi
        done
    else
        echo "Certificados antiguos ya existen (.old), no se requiere renombrar."
    fi

    if [ "$FILES_MISSING" = true ]; then
        echo "Algunos de los certificados no existen en el servidor."
        exit 1
    fi

    TEMP_DIR="$CERT_PATH/temporalCert"
    echo "Preparando carpeta temporal: $TEMP_DIR"
    if [ -d "$TEMP_DIR" ]; then
        echo "Carpeta temporal existente encontrada, eliminando..."
        rm -rf "$TEMP_DIR"
    fi
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR" || { echo "No se pudo entrar en $TEMP_DIR"; exit 1; }

    echo "Generando clave privada..."
    openssl genrsa -out "$DOMAIN.key.pem" 2048

    echo "Creando archivo de configuración SAN (san.cnf)..."
    cat > san.cnf <<EOL
[ req ]
default_md      = sha256
prompt          = no
distinguished_name = dn
x509_extensions = req_ext

[ dn ]
C  = ES
ST = Murcia
L  = Murcia
O  = Intratum
OU = Intratum
CN = $DOMAIN

[ req_ext ]
subjectAltName = @alt_names
basicConstraints = critical,CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[ alt_names ]
DNS.1 = $DOMAIN
DNS.2 = www.$DOMAIN
EOL

    echo "Generando certificado X.509..."
    openssl req -x509 -new -nodes \
      -key "$DOMAIN.key.pem" \
      -out "$DOMAIN.cert.pem" \
      -days 397 \
      -config san.cnf -extensions req_ext

    echo "Convirtiendo certificado a formato DER (.crt)..."
    openssl x509 -outform der \
      -in "$DOMAIN.cert.pem" \
      -out "$DOMAIN.crt"

    echo "Copiando clave y certificado a $CERT_PATH..."
    cp "$TEMP_DIR/$DOMAIN.key.pem" "$CERT_PATH/privkey.pem"
    cp "$TEMP_DIR/$DOMAIN.cert.pem" "$CERT_PATH/fullchain.pem"

    echo "Reiniciando LSWS para aplicar los nuevos certificados..."
    systemctl restart lsws && echo "LSWS recargado con éxito!"

    DOWNLOAD_DIR="/tmp/${DOMAIN}_cert"
    echo "Preparando carpeta de descarga: $DOWNLOAD_DIR"
    if [ -d "$DOWNLOAD_DIR" ]; then
        echo "Carpeta de descarga existente encontrada, eliminando..."
        rm -rf "$DOWNLOAD_DIR"
    fi
    mkdir -p "$DOWNLOAD_DIR"
    cp "$TEMP_DIR/$DOMAIN.crt" "$DOWNLOAD_DIR/"

    echo -e "\n\nResumen de pasos para descargar y finalizar la documentación del certificado:"
    echo -e "\n1. Abrir CMD en Windows:"
    echo "   - Ve a la carpeta llamada \"docs\" en el escritorio de la maquina."

    echo -e "\n2. Copiar el certificado desde el servidor:"
    echo "   - Abre el archivo que se llama \"Terminal\"."
    echo "     scp $(who -m | awk '{print $1}')@$(hostname -I | awk '{print $1}'):$DOWNLOAD_DIR/$DOMAIN.crt pendingDocs/$DOMAIN.crt"
    echo "   - Al ejecutar este comando, te pedirá la contraseña de esta máquina (esta VPS)."

    echo -e "\n3. Una vez que termine, deberías ver un archivo llamado \"$DOMAIN.crt\" en la carpeta \"pendingDocs\" dentro de la carpeta de \"docs\" del escritorio. Si es así, cierra la CMD (ventana negra)."

    echo -e "\n4. Para continuar, en la carpeta de \"docs\" del escritorio, ejecuta el archivo llamado \"Empezar Doc\"."

    echo -e "\n5. Finalizar documentación:"
    echo "   - Una vez terminada la documentación, vuelve a ejecutar este script en Linux y selecciona:"
    echo "     2) Terminar documentación"
}


end_documentation() {
    echo -e "\n🔹 Finalizando documentación para el dominio: $DOMAIN"

    CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
    [ -d "$CERT_PATH" ] || { echo -e "No existe la carpeta de los certificados: $CERT_PATH.\n¿Está la web subida?"; exit 1; }

    echo "Verificando certificados existentes..."
    FILES_MISSING=false

    for FILE in fullchain.pem privkey.pem; do
        if [ ! -f "$CERT_PATH/$FILE" ] && [ ! -f "$CERT_PATH/$FILE.old" ]; then
            echo "Faltan ambos: $FILE y $FILE.old"
            FILES_MISSING=true
        else
            echo "Existe al menos uno: $FILE o $FILE.old"
        fi
    done

    if [ "$FILES_MISSING" = true ]; then
        echo "Algunos de los certificados no existen en el servidor."
        exit 1
    else
        echo "Todos los certificados están presentes (actuales o .old)."
    fi

    TEMP_DIR="$CERT_PATH/temporalCert"
    if [ -d "$TEMP_DIR" ]; then
        echo "Eliminando carpeta temporal de certificados..."
        rm -rf "$TEMP_DIR"
    fi

    echo "Eliminando certificados actuales..."
    rm $CERT_PATH/fullchain.pem $CERT_PATH/privkey.pem

    echo "Restaurando certificados .old → activos..."
    if [ -f "$CERT_PATH/fullchain.pem.old" ]; then
        mv $CERT_PATH/fullchain.pem.old $CERT_PATH/fullchain.pem
    fi

    if [ -f "$CERT_PATH/privkey.pem.old" ]; then
        mv $CERT_PATH/privkey.pem.old $CERT_PATH/privkey.pem
    fi
    
    echo "Reiniciando LSWS para aplicar los nuevos certificados..."
    systemctl restart lsws && echo "LSWS recargado con éxito!"

    echo -e "\n\nDocumentación finalizada con éxito :D"
}



if [ "$EUID" -ne 0 ]; then
    echo "Este script debe ejecutarse con privilegios root. Ejecutando con sudo..."
    exec sudo bash "$0" "$@"
fi

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    read -p "Introduce el dominio de la web: " DOMAIN
    DOMAIN=$(echo "$DOMAIN" | xargs)
fi

if [[ -z "$DOMAIN" || "$DOMAIN" =~ [[:space:]] || ! "$DOMAIN" =~ ^[a-zA-Z0-9.-]+$ ]]; then
    echo "¡Dominio no válido!"
    exit 1
fi

# --- Menú de opciones ---
echo -e "\nSelecciona una opción: "
select OPTION in "Empezar documentación" "Terminar documentación" "Salir"; do
    case $REPLY in
        1)
            start_documentation
            break
            ;;
        2)
            end_documentation
            break
            ;;
        3)
            echo "Saliendo."
            exit 0
            ;;
        *)
            echo "Opción inválida. Saliendo..."
            exit 1
            ;;
    esac
done
