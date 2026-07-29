#!/bin/bash

# ==========================================
# Script nativo de Bash para Linux / macOS
# ==========================================
echo -e "\033[33m[Linux] Verificando el demonio de Docker...\033[0m"

# Comprobar si Docker está activo
if ! docker info > /dev/null 2>&1; then
    echo -e "\033[31m[Linux] ERROR: Docker no está activo o no tienes permisos para acceder al socket.\033[0m"
    echo -e "\033[33m[Linux] Prueba iniciando el servicio con: sudo systemctl start docker\033[0m"
    exit 1
fi

echo -e "\033[36m[Linux] Docker está activo. Construyendo y levantando contenedores...\033[0m"
docker compose up --build -d

if [ $? -eq 0 ]; then
    echo -e "\033[32m[Linux] ¡Entorno configurado e iniciado con éxito!\033[0m"
else
    echo -e "\033[31m[Linux] Hubo un problema al levantar los contenedores.\033[0m"
    exit 1
fi