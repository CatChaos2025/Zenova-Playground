# 🎮 Zenova Playground

Un playground de juegos web con una experiencia de escritorio interactiva inspirada en Material You.

Zenova Playground es una plataforma de juegos web diseñada para transformar una colección tradicional de juegos HTML en una experiencia similar a un sistema operativo de escritorio directamente dentro del navegador.

En lugar de presentar los juegos únicamente como tarjetas o enlaces, Zenova los integra dentro de un entorno de escritorio interactivo, con ventanas flotantes, barra superior, dock, minimización, maximización, redimensionamiento, configuración visual y navegación entre juegos.

El proyecto busca combinar la simplicidad y accesibilidad de los juegos web con una interfaz moderna, dinámica y agradable de utilizar.

📸 Vista general

Zenova está pensado como una capa de escritorio sobre una colección de juegos web.

La experiencia gira alrededor de tres conceptos:

🎮 Juegos: cada juego funciona como una aplicación web independiente.

🖥️ Ventanas: los juegos se abren dentro de ventanas que pueden moverse, redimensionarse, minimizarse y maximizarse.

🎨 Personalización: el escritorio utiliza colores, fondos y componentes visuales inspirados en Material You.

El objetivo no es reemplazar los juegos, sino proporcionarles un entorno común que haga que toda la colección se sienta como una sola plataforma.

✨ Características

🖥️ Escritorio interactivo

Zenova utiliza una interfaz que simula un entorno de escritorio directamente dentro del navegador.

Incluye:

Ventanas flotantes.

Arrastrar ventanas.

Redimensionamiento mediante un controlador visual.

Minimizar y restaurar ventanas.

Maximizar y restaurar ventanas.

Control de foco mediante z-index.

Múltiples ventanas abiertas simultáneamente.

Dock con las ventanas abiertas.

Barra superior con información del escritorio.

Animaciones de apertura, minimización y cierre.

Gestión independiente del estado de cada ventana.

Aplicaciones internas además de juegos externos.

Área de trabajo separada de la barra superior y el dock.

La intención es que abrir un juego se sienta más parecido a abrir una aplicación que a navegar hacia otra página.

🎮 Sistema de juegos

Los juegos se sirven como aplicaciones web independientes.

Cada juego puede vivir dentro de su propio directorio:

games/
├── snake/
│   └── index.html
│
├── chess/
│   └── index.html
│
├── tetris/
│   └── index.html
│
└── ...

El escritorio puede obtener la colección de juegos desde el backend y utilizar la información disponible para construir sus accesos directos.

Una estructura típica de un juego es:

games/
└── snake/
    ├── index.html
    ├── assets/
    ├── css/
    └── js/

Cada juego mantiene su propia lógica y recursos, mientras Zenova se encarga de proporcionar el entorno donde se ejecuta.

🔲 Carga de juegos mediante ventanas

Los juegos se ejecutan dentro de iframe, permitiendo mantener el escritorio y el juego separados.

Conceptualmente:

Zenova Desktop
│
├── Window
│   └── iframe
│       └── /games/snake/index.html
│
├── Window
│   └── iframe
│       └── /games/chess/index.html
│
└── Window
    └── SettingsApp

Esto permite abrir diferentes aplicaciones sin abandonar el escritorio.

Además, Zenova puede enviar información de tamaño al juego mediante postMessage, permitiendo que los juegos reaccionen a cambios en el tamaño de su ventana.

🧭 Navegación y menú de escritorio

El escritorio cuenta con elementos destinados a facilitar la navegación por la colección de juegos.

La interfaz está preparada para permitir:

Visualizar los juegos disponibles.

Buscar juegos.

Abrir juegos desde el menú.

Restaurar juegos minimizados.

Cambiar rápidamente entre ventanas abiertas.

Mantener las aplicaciones abiertas dentro de la misma sesión del escritorio.

El objetivo es que el usuario no tenga que abandonar el entorno de Zenova para encontrar otro juego.

🎨 Material You

La interfaz está inspirada en los principios visuales de Material You.

Entre sus características visuales se encuentran:

Superficies redondeadas.

Controles compactos.

Sombras suaves.

Transparencias.

Efectos de desenfoque.

Animaciones cortas.

Colores dinámicos.

Componentes visuales consistentes.

Jerarquía visual basada en superficies y contraste.

El color principal puede personalizarse y utilizarse en elementos importantes del escritorio, como ventanas, iconos y controles.

Zenova también calcula colores de contraste para mantener la legibilidad de los elementos sobre el color principal.

🌈 Variación visual de los juegos

Para evitar que todos los juegos tengan exactamente la misma apariencia, el sistema puede proporcionar variaciones visuales a los accesos directos de los juegos.

Esto permite que una colección grande no termine convirtiéndose en una cuadrícula repetitiva de iconos idénticos.

La variación puede aplicarse a:

Color de fondo del icono.

Iconografía.

Acentos visuales.

Identidad individual del juego.

Cuando un juego no dispone de un icono específico, Zenova utiliza un icono genérico de juegos en lugar de mostrar el nombre del juego como sustituto visual.

Esto mantiene la interfaz limpia y evita que nombres largos o identificadores internos rompan la consistencia del escritorio.

⚙️ Configuración

Zenova incluye una aplicación de configuración integrada en el escritorio.

Actualmente la configuración está orientada principalmente a la apariencia.

Puede incluir:

Fondo del escritorio.

Color principal.

Persistencia de preferencias.

Sincronización con el backend.

La configuración puede almacenarse localmente mediante localStorage para conservar preferencias entre sesiones y también puede sincronizarse con el servidor.

💾 Persistencia

Zenova utiliza mecanismos de persistencia para conservar determinadas preferencias.

Por ejemplo:

localStorage
    │
    ├── background_image
    └── theme_color

Cuando existe un backend disponible, estas preferencias también pueden sincronizarse mediante la API.

Esto permite que la interfaz pueda recuperarse sin tener que configurar nuevamente el escritorio después de cada visita.

⏱️ Seguimiento del tiempo de juego

El escritorio incorpora soporte para contabilizar el tiempo que un usuario pasa jugando.

El tiempo se registra mientras:

El juego está abierto.

La ventana no está minimizada.

El elemento corresponde a un juego y no a una aplicación interna.

Al cerrar la ventana, el tiempo acumulado puede enviarse al backend para su almacenamiento.

La intención es crear una base para futuras funciones como:

Estadísticas.

Historial de juegos.

Tiempo total jugado.

Juegos más utilizados.

Métricas personales.

📐 Ventanas adaptativas

Las ventanas están diseñadas para adaptarse al espacio disponible del escritorio.

Incluyen:

Tamaño mínimo.

Límites de posición.

Límites de redimensionamiento.

Maximización respetando los márgenes del workspace.

Restauración del tamaño y posición anteriores.

Ajuste automático al cambiar el tamaño del viewport.

Esto evita que una ventana quede completamente fuera del área visible después de un cambio de resolución.

📜 Scrollbar personalizada

Zenova reemplaza el scrollbar visual predeterminado del navegador por una versión más discreta y coherente con el diseño de la plataforma.

La intención es mantener una barra:

Delgada.

Minimalista.

Redondeada.

Poco intrusiva.

Compatible con interfaces claras y oscuras.

Inspirada en Material You.

También existe soporte para ocultar completamente el scrollbar cuando una interfaz concreta no necesita mostrarlo.

Ejemplo de clases disponibles:

.zenova-scrollbar-hidden
.zenova-scrollbar-subtle

El diseño también contempla prefers-reduced-motion para evitar animaciones innecesarias cuando el usuario ha solicitado reducir el movimiento.

🧩 Arquitectura

Zenova separa la experiencia de escritorio de los juegos individuales.

Una representación simplificada de la arquitectura es:

┌─────────────────────────────────────────────┐
│                  Zenova                     │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │           Desktop / Workspace         │  │
│  │                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Window     │  │   Window     │  │  │
│  │  │              │  │              │  │  │
│  │  │    Snake     │  │    Chess     │  │  │
│  │  │    iframe    │  │    iframe    │  │  │
│  │  └──────────────┘  └──────────────┘  │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                 Dock                  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

El escritorio administra las ventanas y su estado, mientras cada juego conserva su independencia.

Esto facilita añadir nuevos juegos sin tener que modificar la lógica interna de cada uno.

🗂️ Estructura del proyecto

Una estructura aproximada del proyecto es:

Zenova-Playground/
│
├── public/
│   └── games/
│       ├── snake/
│       │   └── index.html
│       ├── chess/
│       │   └── index.html
│       └── ...
│
├── src/
│   ├── apps/
│   │   └── SettingsApp.tsx
│   │
│   ├── components/
│   │   └── ...
│   │
│   ├── core/
│   │   └── utils/
│   │       └── colorUtils.ts
│   │
│   └── ...
│
├── server.js
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── README.md

La estructura exacta puede evolucionar a medida que el proyecto crezca.

🛠️ Tecnologías

Tecnología

Uso

React

Construcción de la interfaz y gestión de componentes.

TypeScript

Tipado estático y seguridad durante el desarrollo.

Vite

Servidor de desarrollo y proceso de build.

Node.js

Ejecución del backend y servicios del proyecto.

Express

Servir la aplicación y proporcionar endpoints de la API, cuando corresponde.

CSS / CSS-in-JS inline

Estilos y comportamiento visual de los componentes.

Material Symbols

Iconografía de la interfaz.

pnpm

Gestión de dependencias y ejecución de scripts.

📦 Requisitos

Antes de ejecutar Zenova localmente necesitas:

Node.js compatible con las versiones utilizadas por el proyecto.

pnpm.

Un navegador moderno con soporte para:

ES Modules.

iframe.

ResizeObserver.

Pointer Events.

localStorage.

postMessage.

Puedes comprobar las herramientas instaladas con:

node --version
pnpm --version

🚀 Instalación

Clona el repositorio:

git clone <https://github.com/CatChaos2025/Zenova-Playground.git>

Entra en el directorio:

cd Zenova-Playground

Instala las dependencias:

pnpm install

💻 Desarrollo

Para iniciar el entorno de desarrollo:

pnpm dev

Vite iniciará el servidor de desarrollo y proporcionará la dirección local correspondiente.

El modo de desarrollo es el recomendado para trabajar en:

Componentes React.

Ventanas.

Escritorio.

Estilos.

Juegos.

Integración con el backend.

🏗️ Build de producción

Para generar una compilación de producción:

pnpm build

Este comando ejecuta el proceso de TypeScript y posteriormente genera el build de Vite.

▶️ Ejecutar producción

El proyecto incluye un script de producción:

pnpm start

que ejecuta:

node server.js

También existe:

pnpm product

que combina:

pnpm build && pnpm start

👀 Preview

Para probar localmente el build generado mediante Vite:

pnpm preview

📜 Scripts disponibles

Los scripts principales definidos actualmente son:

pnpm dev
pnpm build
pnpm lint
pnpm start
pnpm preview
pnpm product

Descripción:

Script

Función

pnpm dev

Inicia el servidor de desarrollo de Vite.

pnpm build

Comprueba TypeScript y genera el build de producción.

pnpm lint

Ejecuta Oxlint.

pnpm start

Ejecuta el servidor de producción mediante Node.js.

pnpm preview

Sirve localmente el build de Vite para previsualización.

pnpm product

Construye el proyecto y después inicia producción.

🎮 Cómo añadir un juego

Añadir un juego está pensado para ser sencillo.

1. Crea su directorio

Por ejemplo:

public/games/pong/

1. Añade el punto de entrada

public/games/pong/index.html

1. Añade los recursos del juego

Por ejemplo:

public/games/pong/
├── index.html
├── assets/
├── css/
└── js/

1. Registra el juego

El backend o la fuente de datos utilizada por el escritorio debe proporcionar la información del juego, incluyendo al menos:

{
  "id": "pong",
  "title": "Pong",
  "folder": "pong"
}

Zenova utilizará el folder para construir la ruta del juego:

/games/pong/index.html

1. Icono

Si el juego dispone de un icono compatible con el sistema de iconos de Zenova, puede utilizarlo.

Si no existe un icono específico, el escritorio utiliza un icono genérico de juegos en lugar de convertir el nombre del juego en un icono textual.

🔌 API

Zenova puede comunicarse con un backend para obtener información del escritorio y guardar preferencias.

Entre los endpoints utilizados por la aplicación se encuentran:

GET  /api/games
GET  /api/settings
POST /api/settings
POST /api/save-time

GET /api/games

Devuelve la colección de juegos disponible para el escritorio.

Ejemplo:

[
  {
    "id": "snake",
    "title": "Snake",
    "folder": "snake"
  },
  {
    "id": "chess",
    "title": "Chess",
    "folder": "chess"
  }
]

GET /api/settings

Obtiene la configuración visual disponible en el servidor.

POST /api/settings

Guarda preferencias como:

{
  "background_image": "...",
  "theme_color": "#D0BCFF"
}

POST /api/save-time

Permite guardar el tiempo acumulado de juego:

{
  "gameFolder": "snake",
  "timeSeconds": 120
}

La implementación exacta de estos endpoints depende del backend configurado para el proyecto.

📨 Comunicación entre Zenova y los juegos

Zenova puede comunicarse con un juego mediante postMessage.

Uno de los mensajes utilizados para comunicar el tamaño disponible es conceptualmente:

{
  "type": "webos:resize",
  "version": 1,
  "windowId": "snake",
  "width": 760,
  "height": 430,
  "devicePixelRatio": 1
}

Un juego puede escuchar estos mensajes desde su propio contexto:

window.addEventListener('message', (event) => {
  if (event.data?.type !== 'webos:resize') {
    return;
  }

  const { width, height } = event.data;

  // Ajustar el juego al nuevo espacio disponible.
});

Esto permite construir juegos que se adapten correctamente cuando el usuario:

Redimensiona una ventana.

Maximiza una ventana.

Cambia el tamaño del navegador.

Restaura una ventana.

🎨 Personalización

Zenova utiliza una configuración visual centralizada para mantener coherencia entre sus componentes.

Ejemplo:

{
  "background_image": "",
  "theme_color": "#D0BCFF"
}

El color principal puede utilizarse para:

Ventanas.

Botones.

Iconos.

Elementos activos.

Accesos directos.

Componentes de configuración.

También se calcula automáticamente un color de contraste para intentar mantener una buena legibilidad.

📜 Scrollbars

Zenova incluye un scrollbar personalizado para evitar depender completamente de la apariencia predeterminada del navegador.

El diseño busca que el scrollbar sea visualmente secundario y no compita con el contenido.

Características:

Tamaño reducido.

Thumb redondeado.

Fondo transparente.

Estados hover y active.

Variante sutil para paneles.

Opción para ocultarlo.

Compatibilidad con Firefox y navegadores basados en Chromium/WebKit.

Respeto por prefers-reduced-motion.

Clases auxiliares:

.zenova-scrollbar-hidden
.zenova-scrollbar-subtle

♿ Accesibilidad

Aunque Zenova prioriza una experiencia visual de escritorio, el proyecto también considera aspectos de accesibilidad.

Entre ellos:

Controles con title.

Estados visuales diferenciados.

Contraste calculado para elementos principales.

Soporte para prefers-reduced-motion.

Uso de elementos interactivos nativos como button.

Tamaños mínimos razonables para controles.

Evitar depender exclusivamente del color para comunicar acciones importantes.

La accesibilidad seguirá evolucionando a medida que el proyecto avance.

⚡ Rendimiento

Zenova intenta evitar actualizaciones innecesarias durante operaciones que ocurren con mucha frecuencia, especialmente al mover o redimensionar ventanas.

Entre las técnicas utilizadas se encuentran:

requestAnimationFrame para operaciones visuales de alta frecuencia.

ResizeObserver para detectar cambios reales de tamaño.

useRef para almacenar valores utilizados durante interacciones.

Evitar cálculos innecesarios durante cada render.

Separación entre estado visual y referencias utilizadas durante drag/resize.

Carga independiente de los juegos mediante iframe.

El objetivo es conseguir una interfaz fluida incluso cuando existen varias ventanas abiertas.

🔐 Seguridad

Los juegos se ejecutan como contenido web independiente dentro de iframe.

Al utilizar comunicación mediante postMessage, cualquier implementación de producción que procese mensajes provenientes de juegos debería validar adecuadamente:

event.origin.

Estructura del mensaje.

Tipo de mensaje.

Datos recibidos.

La aplicación debe evitar confiar directamente en datos provenientes de un iframe externo.

Asimismo, cualquier endpoint del backend que permita guardar configuraciones o estadísticas debería aplicar las validaciones y controles de seguridad correspondientes.

🧪 Estado del proyecto

Zenova Playground se encuentra en desarrollo.

La arquitectura actual está orientada a construir progresivamente una experiencia de escritorio completa para juegos web.

Ya implementado

Escritorio interactivo.

Ventanas flotantes.

Drag & drop de ventanas.

Redimensionamiento.

Minimizar/restaurar.

Maximizar/restaurar.

Dock de ventanas.

Barra superior.

Aplicación de configuración.

Fondo personalizable.

Color principal personalizable.

Persistencia local de preferencias.

Integración con API de juegos.

Carga de juegos mediante iframe.

Comunicación de resize con juegos.

Seguimiento básico del tiempo de juego.

Variación visual de los accesos directos.

Icono genérico para juegos sin icono específico.

Scrollbar personalizada.

🚧 En desarrollo / futuras mejoras

Sistema de búsqueda de juegos más avanzado.

Categorías y filtros.

Favoritos.

Historial de juegos.

Estadísticas del usuario.

Mejor sistema de metadatos de juegos.

Sistema de iconos más completo.

Temas adicionales.

Mejoras de accesibilidad.

Soporte más avanzado para dispositivos táctiles.

Sincronización de preferencias entre dispositivos.

Sistema de actualización de juegos.

Mejoras de seguridad para contenido embebido.

Experiencias multijugador cuando el juego lo permita.

🧑‍💻 Desarrollo

Si quieres contribuir al proyecto:

Haz un fork del repositorio.

Crea una rama para tu cambio:

git checkout -b feature/nueva-funcion

Instala las dependencias:

pnpm install

Realiza tus cambios.

Ejecuta las comprobaciones correspondientes:

pnpm build
pnpm lint

Prueba la aplicación.

Crea un commit descriptivo:

git commit -m "feat: añadir nueva función"

Envía tu rama y abre un Pull Request.

📝 Convenciones de commits

Se recomienda utilizar commits descriptivos siguiendo una estructura similar a Conventional Commits:

feat: nueva funcionalidad
fix: corrección de un error
refactor: cambio interno sin alterar comportamiento
style: cambios visuales o de formato
docs: documentación
perf: mejora de rendimiento
chore: tareas de mantenimiento

Ejemplos:

git commit -m "feat: añadir búsqueda de juegos"
git commit -m "fix: corregir carga de juegos"
git commit -m "style: mejorar scrollbar"
git commit -m "docs: actualizar README"

📁 .gitignore

El repositorio no debería incluir archivos generados o información sensible.

Como mínimo, deberían ignorarse elementos como:

node_modules/
dist/
.env
.env.*
!.env.example

*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*

.DS_Store
Thumbs.db

.vscode/
.idea/

coverage/

Los archivos que contengan credenciales, tokens, contraseñas, claves privadas o configuración específica del entorno nunca deberían subirse al repositorio.

🌐 Compatibilidad

Zenova está orientado a navegadores modernos.

Se recomienda utilizar versiones recientes de:

Chromium.

Google Chrome.

Microsoft Edge.

Mozilla Firefox.

Safari.

Algunas características visuales, como backdrop-filter, pueden depender del soporte del navegador.

📄 Licencia

Este proyecto puede distribuirse bajo la licencia que defina el propietario del repositorio.

Si el proyecto utiliza una licencia específica, debe añadirse un archivo LICENSE en la raíz del repositorio y reemplazar esta sección por los términos correspondientes.

🤝 Contribuciones

Las contribuciones, ideas, correcciones y nuevos juegos son bienvenidos.

Puedes contribuir mediante:

Nuevos juegos.

Correcciones de errores.

Mejoras visuales.

Nuevos componentes.

Optimizaciones.

Mejoras de accesibilidad.

Documentación.

Nuevas herramientas para administrar juegos.

La prioridad del proyecto es mantener una experiencia coherente, ligera y fácil de ampliar.

💡 Filosofía del proyecto

Zenova nace de una idea sencilla:

Los juegos web no tienen por qué sentirse como simples páginas web.

Un juego puede abrirse como una aplicación, convivir con otras aplicaciones, minimizarse, restaurarse, redimensionarse y formar parte de un entorno completo.

Por eso Zenova intenta combinar:

🎮 Juegos web
      +
🖥️ Experiencia de escritorio
      +
🎨 Material You
      +
⚡ Interacciones fluidas
      +
🧩 Arquitectura modular
      =
🌌 Zenova Playground

El proyecto está pensado para crecer progresivamente sin perder esa idea central: convertir una colección de juegos independientes en una experiencia unificada.

🔗 Repositorio

Zenova Playground

<https://github.com/CatChaos2025/Zenova-Playground>

⭐ Si te gusta el proyecto

Si Zenova te resulta interesante, puedes:

⭐ Darle una estrella al repositorio.

🐛 Reportar errores.

💡 Proponer nuevas funciones.

🎮 Crear o añadir nuevos juegos.

🔧 Contribuir con código.

📖 Mejorar la documentación.

<div align="center">

🎮 Zenova Playground

Un escritorio web para jugar.

Games should feel like applications.

</div>
