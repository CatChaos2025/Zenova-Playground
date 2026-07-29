import os
import platform
import subprocess
import sys

def imprimir_color(texto, color="reset"):
    colores = {
        "cyan": "\033[96m",
        "verde": "\033[92m",
        "amarillo": "\033[93m",
        "rojo": "\033[91m",
        "reset": "\033[0m"
    }
    print(f"{colores.get(color, colores['reset'])}{texto}{colores['reset']}")

def main():
    if sys.version_info < (3, 10):
        imprimir_color("ERROR: Necesitas Python 3.10 o superior para ejecutar este asistente.", "rojo")
        sys.exit(1)

    sistema = platform.system()
    imprimir_color(f"--- DETECTANDO SISTEMA OPERATIVO: {sistema} ---", "cyan")

    # Validar existencia de .env básico
    if not os.path.exists(".env") and os.path.exists(".env.example"):
        imprimir_color("Configurando tu archivo .env inicial desde .env.example...", "amarillo")
        with open(".env.example", "r", encoding="utf-8") as f_src, open(".env", "w", encoding="utf-8") as f_dst:
            f_dst.write(f_src.read())

    # Redirigir y ejecutar el script nativo correspondiente
    if sistema == "Windows":
        imprimir_color("Ejecutando script nativo de PowerShell para Windows...", "cyan")
        script_path = os.path.join("scripts", "setup_windows.ps1")
        # Ejecutar mediante PowerShell con política de ejecución flexible para scripts locales
        resultado = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", script_path])
        sys.exit(resultado.returncode)

    elif sistema in ["Linux", "Darwin"]:
        imprimir_color("Ejecutando script nativo de Bash para Linux/macOS...", "cyan")
        script_path = os.path.join("scripts", "setup_linux.sh")
        # Asegurar permisos de ejecución en Bash y correrlo
        subprocess.run(["chmod", "+x", script_path])
        resultado = subprocess.run(["bash", script_path])
        sys.exit(resultado.returncode)

    else:
        imprimir_color(f"Sistema operativo no compatible: {sistema}", "rojo")
        sys.exit(1)

if __name__ == "__main__":
    main()