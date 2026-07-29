# Configurar codificación UTF-8 para evitar problemas con caracteres especiales
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Función auxiliar para ejecutar cada paso, manejar errores y ofrecer reintento
function EjecutarPasoConReintento {
    param(
        [string]$NombrePaso,
        [scriptblock]$Accion,
        [string]$MensajeExito
    )

    Write-Host "`n==================================================================" -ForegroundColor DarkGray
    Write-Host "  $NombrePaso" -ForegroundColor Cyan
    Write-Host "==================================================================" -ForegroundColor DarkGray

    while ($true) {
        try {
            # Limpiar código de salida anterior
            $global:LASTEXITCODE = $null 
            
            # Ejecutar la acción
            & $Accion

            # Verificar si el comando externo falló
            if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
                throw "El proceso externo finalizó con código de error: $LASTEXITCODE"
            }

            Write-Host "`n[EXITO] $MensajeExito" -ForegroundColor Green
            break # Salir del bucle y continuar con el siguiente paso
        }
        catch {
            Write-Host "`n[ERROR DETECTADO]" -ForegroundColor Red
            Write-Host "Paso que falló: $NombrePaso" -ForegroundColor Red
            Write-Host "Detalle del error: $($_.Exception.Message)" -ForegroundColor Red
            
            $reintentar = Read-Host "`nDesea reintentar este paso? (S/N)"
            if ($reintentar -notin @('S', 's', 'Y', 'y', 'SI', 'si', 'Yes', 'yes')) {
                Write-Host "`nOperación cancelada por el usuario. Saliendo del script." -ForegroundColor Yellow
                exit 1
            }
            Write-Host "`nReintentando $NombrePaso..." -ForegroundColor Yellow
        }
    }
}

Write-Host "`n[1/5] Iniciando proceso de despliegue de Zenova..." -ForegroundColor Cyan

# Paso 2: Git Pull
EjecutarPasoConReintento -NombrePaso "[2/5] Descargando últimos cambios de la rama main (Git)" -Accion {
    git pull origin main
} -MensajeExito "La descarga de los últimos cambios desde GitHub se ha completado correctamente."

# Paso 3: Instalar dependencias
EjecutarPasoConReintento -NombrePaso "[3/5] Instalando dependencias del proyecto (pnpm)" -Accion {
    pnpm install
} -MensajeExito "Todas las dependencias se han instalado y resuelto de forma exitosa."

# Paso 4: Compilación
EjecutarPasoConReintento -NombrePaso "[4/5] Compilando proyecto de salida (Backend y Frontend)" -Accion {
    pnpm build
} -MensajeExito "La compilación del backend y frontend ha finalizado sin errores."

# Paso 5: Reiniciar/Iniciar en PM2
EjecutarPasoConReintento -NombrePaso "[5/5] Gestionando servicio en PM2" -Accion {
    # Verificar si la aplicación ya existe en PM2 de forma silenciosa
    pm2 describe zenova-app > $null 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "La aplicación 'zenova-app' no existe en PM2. Iniciándola por primera vez..." -ForegroundColor Yellow
        pm2 start apps/server/dist/index.js --name "zenova-app"
        if ($LASTEXITCODE -ne 0) { throw "No se pudo iniciar la aplicación en PM2." }
    } 
    else {
        Write-Host "Aplicación encontrada en PM2. Reiniciando servicio..." -ForegroundColor Yellow
        pm2 restart zenova-app
        if ($LASTEXITCODE -ne 0) { throw "No se pudo reiniciar la aplicación en PM2." }
    }
    
    # Guardar el estado de PM2
    pm2 save
} -MensajeExito "El servidor se está ejecutando correctamente y el estado de PM2 ha sido guardado."

# Mensaje final
Write-Host "`n==================================================================" -ForegroundColor DarkGray
Write-Host "  DESPLIEGUE COMPLETADO" -ForegroundColor Green
Write-Host "  El servidor de Zenova está corriendo al 100%." -ForegroundColor Green
Write-Host "==================================================================`n" -ForegroundColor DarkGray