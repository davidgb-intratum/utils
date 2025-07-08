#!/bin/bash

# Comprobar si se está ejecutando como root, si no, relanzar con sudo
if [ "$EUID" -ne 0 ]; then
  echo "Este script debe ejecutarse con privilegios root. Ejecutando con sudo..."
  exec sudo bash "$0" "$@"
fi

SQL_FILE="/srv/wordpress/template.sql"         # ruta fija
WP_TEMPLATE="/srv/wordpress/wp_template"       # carpeta plantilla WordPress
NGINX_TEMPLATE="/srv/wordpress/template.local" # config nginx plantilla
hosts_file="/etc/hosts"

echo "Seleccione una opción:"
echo "1) Crear sitio"
echo "2) Borrar sitio"
read -p "Opción: " opcion

if [ "$opcion" == "1" ]; then
  # Crear sitio
  read -p $'\nDominio web (Ej: example.local): ' domain
  read -p "Nombre de la empresa: " empresa

  db_base=$(echo "$domain" | cut -d'.' -f1)
  db_name="wp_${db_base}"

  echo -e "\nDominio: $domain"
  echo -e "Empresa: $empresa"
  echo -e "Base de datos: $db_name\n"

  if [ ! -f "$SQL_FILE" ]; then
    echo "El archivo SQL no existe en $SQL_FILE"
    exit 1
  fi

  if [ ! -d "$WP_TEMPLATE" ]; then
    echo "La plantilla WordPress no existe en $WP_TEMPLATE"
    exit 1
  fi

  if [ ! -f "$NGINX_TEMPLATE" ]; then
    echo "La plantilla de configuración nginx no existe en $NGINX_TEMPLATE"
    exit 1
  fi

  # Crear base de datos
  mariadb -u root -e "CREATE DATABASE IF NOT EXISTS \`$db_name\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"

  if [ $? -ne 0 ]; then
    echo "Error creando la base de datos."
    exit 1
  fi

  # Importar SQL
  mariadb -u root "$db_name" <"$SQL_FILE"

  if [ $? -ne 0 ]; then
    echo "Error importando el archivo SQL."
    exit 1
  fi

  # Actualizar siteurl, home y blogname en la base de datos
  siteurl="http://${db_base}.local"
  mariadb -u root -e "
    USE \`${db_name}\`;
    UPDATE wp_options SET option_value = '${siteurl}' WHERE option_name IN ('siteurl', 'home');
    UPDATE wp_options SET option_value = '${empresa}' WHERE option_name = 'blogname';
  "

  if [ $? -ne 0 ]; then
    echo "Error actualizando opciones en la base de datos."
    exit 1
  fi

  echo "Base de datos '$db_name' creada e importada correctamente."

  # Añadir entrada al /etc/hosts justo después de la línea '127.0.0.1	pma.local'
  host_entry="127.0.0.1\t${db_base}.local"

  if grep -q "^127\.0\.0\.1\s\+pma\.local" "$hosts_file"; then
    sed -i "/^127\.0\.0\.1\s\+pma\.local/a $host_entry" "$hosts_file"
    echo "Entrada '$host_entry' añadida a $hosts_file después de '127.0.0.1    pma.local'."
  else
    echo -e "$host_entry" >>"$hosts_file"
    echo "No se encontró '127.0.0.1    pma.local', se añadió '$host_entry' al final de $hosts_file."
  fi

  # Ruta destino para copiar plantilla WordPress
  dest_dir="/var/www/wp_${db_base}"

  # Copiar la plantilla WordPress
  cp -r "$WP_TEMPLATE" "$dest_dir"

  if [ $? -ne 0 ]; then
    echo "Error copiando la plantilla WordPress."
    exit 1
  fi

  # Cambiar permisos recursivamente a 777 (lectura, escritura y ejecución para todos)
  chmod -R 777 "$dest_dir"

  if [ $? -eq 0 ]; then
    echo "Plantilla WordPress copiada a '$dest_dir' con permisos 777."
  else
    echo "Error cambiando permisos en '$dest_dir'."
  fi

  # Modificar wp-config.php para actualizar DB_NAME
  wp_config_file="$dest_dir/wp-config.php"

  if [ -f "$wp_config_file" ]; then
    sed -i "s/define( *'DB_NAME', *'.*' *);/define( 'DB_NAME', '${db_name}' );/" "$wp_config_file"
    echo "Archivo wp-config.php actualizado con la base de datos '$db_name'."
  else
    echo "No se encontró el archivo wp-config.php en $dest_dir"
  fi

  # Configuración nginx
  domain_lower=$(echo "$domain" | tr '[:upper:]' '[:lower:]')

  nginx_available="/etc/nginx/sites-available/$domain_lower"
  nginx_enabled="/etc/nginx/sites-enabled/$domain_lower"
  log_dir="/var/log/nginx/$db_base"

  # Copiar plantilla nginx y reemplazar #TEMPLATE# por db_base
  sed "s/#TEMPLATE#/$db_base/g" "$NGINX_TEMPLATE" >"$nginx_available"

  if [ $? -ne 0 ]; then
    echo "Error creando archivo de configuración nginx en $nginx_available"
    exit 1
  fi

  # Crear carpeta de logs
  mkdir -p "$log_dir"

  if [ $? -ne 0 ]; then
    echo "Error creando carpeta de logs nginx en $log_dir"
    exit 1
  fi

  # Crear enlace simbólico para habilitar el sitio
  ln -sf "$nginx_available" "$nginx_enabled"

  # Test configuración nginx
  nginx -t

  if [ $? -ne 0 ]; then
    echo "Error en la configuración de nginx, no se recarga el servicio."
    exit 1
  fi

  # Recargar nginx para aplicar cambios
  systemctl reload nginx

  if [ $? -eq 0 ]; then
    echo "nginx recargado correctamente. Sitio habilitado: $db_base"
  else
    echo "Error recargando nginx."
  fi

  echo -e "\n✅ Sitio creado correctamente: http://${db_base}.local"

elif [ "$opcion" == "2" ]; then
  # Borrar sitio
  read -p $'\nDominio web (Ej: example.local): ' domain

  db_base=$(echo "$domain" | cut -d'.' -f1)
  db_name="wp_${db_base}"
  dest_dir="/var/www/wp_${db_base}"
  domain_lower=$(echo "$domain" | tr '[:upper:]' '[:lower:]')
  nginx_available="/etc/nginx/sites-available/$domain_lower"
  nginx_enabled="/etc/nginx/sites-enabled/$domain_lower"
  host_entry="127.0.0.1\t${db_base}.local"

  echo -e "\nBorrando sitio para dominio: $domain"

  # Borrar base de datos
  mariadb -u root -e "DROP DATABASE IF EXISTS \`$db_name\`;"
  if [ $? -eq 0 ]; then
    echo "Base de datos '$db_name' eliminada."
  else
    echo "Error eliminando la base de datos '$db_name'."
  fi

  # Borrar carpeta WordPress
  if [ -d "$dest_dir" ]; then
    rm -rf "$dest_dir"
    echo "Carpeta '$dest_dir' eliminada."
  else
    echo "No existe la carpeta '$dest_dir'."
  fi

  # Borrar configuraciones nginx
  if [ -f "$nginx_enabled" ]; then
    rm -f "$nginx_enabled"
    echo "Archivo '$nginx_enabled' eliminado."
  else
    echo "No existe '$nginx_enabled'."
  fi

  if [ -f "$nginx_available" ]; then
    rm -f "$nginx_available"
    echo "Archivo '$nginx_available' eliminado."
  else
    echo "No existe '$nginx_available'."
  fi

  # Eliminar línea del /etc/hosts
  target_domain="${db_base}.local"

  if grep -q "$target_domain" "$hosts_file"; then
    sed -i "/$target_domain/d" "$hosts_file"
    echo "Entradas con '$target_domain' eliminadas de $hosts_file."
  else
    echo "No se encontraron entradas con '$target_domain' en $hosts_file."
  fi

  # Recargar nginx
  nginx -t
  if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "nginx recargado correctamente."
  else
    echo "Error en la configuración de nginx. No se recargó el servicio."
  fi

else
  echo "Opción no válida."
  exit 1
fi
