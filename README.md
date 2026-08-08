<div align="center">

# 🎮 Zenova Playground
### *Convierte tu colección de juegos web en un sistema operativo de escritorio interactivo.*

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](#)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#)

[Características](#-características-principales) • [Inicio Rápido](#-inicio-rápido) • [Añadir Juegos](#-cómo-añadir-un-nuevo-juego) • [Arquitectura](#-arquitectura-y-api) • [Contribuir](#-contribuir)

</div>

---

## 💡 Filosofía
**Los juegos web no tienen por qué sentirse como simples páginas web.**
Zenova nace de una idea sencilla: un juego en el navegador debería poder abrirse como una aplicación nativa, convivir con otras apps, minimizarse, redimensionarse y formar parte de un entorno de escritorio unificado.

> 🎮 **Juegos Web** + 🖥️ **Experiencia de Escritorio** + 🎨 **Material You** + ⚡ **Fluidez** = 🌌 **Zenova Playground**

---

## ✨ Características Principales

| Categoría | Descripción |
| :--- | :--- |
| **🖥️ Escritorio Interactivo** | Ventanas flotantes con *drag & drop*, redimensionamiento, minimizar/maximizar, control de foco (*z-index*) y gestión de estado independiente. |
| **🎮 Sistema de Juegos** | Aislamiento mediante `<iframe>`. Los juegos mantienen su propia lógica mientras Zenova provee el entorno y el *tracking* de tiempo de juego. |
| **🎨 Diseño Material You** | Superficies redondeadas, desenfoques (*backdrop-filter*), temas dinámicos con cálculo automático de contraste y accesibilidad visual. |
| **⚙️ Personalización** | Fondos de escritorio, colores de acento y persistencia local (`localStorage`) o sincronizada con backend. |
| **📐 Adaptabilidad** | Ventanas con límites inteligentes, *scrollbars* minimalistas personalizadas y soporte para `prefers-reduced-motion`. |

---

## 🚀 Inicio Rápido

### 📦 Requisitos
- **Node.js** (v18 o superior)
- **pnpm** (`npm install -g pnpm`)
- Navegador moderno con soporte para ES Modules, ResizeObserver y Pointer Events.

### ⚡ Instalación y Desarrollo

```bash
# 1. Clona el repositorio
git clone https://github.com/CatChaos2025/Zenova-Playground.git
cd Zenova-Playground

# 2. Instala las dependencias
pnpm install

# 3. Inicia el entorno de desarrollo
pnpm dev
