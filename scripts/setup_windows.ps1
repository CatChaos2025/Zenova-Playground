# ==========================================
# Script nativo de PowerShell para Windows
# ==========================================
Write-Host "[Windows] Verificando el estado de Docker Desktop..." -ForegroundColor Yellow

# Comprobar si Docker responde
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Windows] ERROR: Docker Desktop no está encendido o no se encuentra activo." -ForegroundColor Red
    Write-Host "[Windows] Por favor, abre Docker Desktop y espera a que la ballena esté en verde." -ForegroundColor Yellow
    exit 1
}

Write-Host "[Windows] Docker está activo. Construyendo y levantando contenedores..." -ForegroundColor Cyan
docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "[Windows] ¡Entorno configurado e iniciado con éxito!" -ForegroundColor Green
} else {
    Write-Host "[Windows] Hubo un problema al levantar los contenedores." -ForegroundColor Red
    exit 1
}