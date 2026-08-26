# Análisis Numérico — Portfolio de Trabajos Prácticos

Una colección de proyectos de los trabajos prácticos opcionales de la materia **Análisis Numérico — UTN FRLP**. El sitio es un landing con una página por trabajo práctico, pensado como experiencia instructiva (no sólo calculadoras sueltas): teoría desarrollada paso a paso, componentes interactivos y una identidad visual propia compartida entre vistas.

---

## Integrantes

| Nombre | Legajo | Email |
|---|---|---|
| Francisco Nicolás Buscaglia | 32.308 | francisconicolasbuscaglia@alu.frlp.utn.edu.ar |
| Nicolás Martín Coria | 32.635 | nicolasmartincoria@alu.frlp.utn.edu.ar |
| Gerónimo Garrote | 33.277 | garrote.gero@gmail.com |
| Mateo Arturo Geffroy | 32.027 | mateogeffroy@gmail.com |

---

## Stack del Proyecto

| Tecnología | Uso |
|---|---|
| [Next.js 14](https://nextjs.org/) (App Router) | Framework React, ruteo por carpetas |
| [TypeScript](https://www.typescriptlang.org/) | Tipado estático |
| [Tailwind CSS](https://tailwindcss.com/) | Estilos utility-first |
| [Literata](https://fonts.google.com/specimen/Literata) (`next/font/google`) | Tipografía serif de lectura extensa — la identidad "libro de matemática" del sitio. Los controles (botones, inputs) usan una sans de sistema para mantenerse legibles |
| [Lenis](https://github.com/darkroomengineering/lenis) | Scroll suave e inercial en todo el sitio, incluida la navegación por anclas (navbar y guías laterales) |
| [KaTeX](https://katex.org/) | Renderizado de fórmulas matemáticas (cargado dinámicamente, componente propio) |
| [MathLive](https://cortexjs.io/mathlive/) | Teclado matemático para el ingreso de funciones en Fourier |
| [Math.js](https://mathjs.org/) | Parsing y evaluación de expresiones matemáticas |
| [Recharts](https://recharts.org/) | Gráfico de función original vs. aproximación |
| [html2canvas](https://html2canvas.hertzen.com/) | Exportación de gráficos como imagen |

---

## 🚀 Instalación y uso local

**Requisitos previos:** Node.js 18+ y npm (o yarn).

1. **Cloná el repositorio:**
```bash
git clone https://github.com/mateogeffroy/landing-AN.git
cd landing-AN
```

2. **Instalá las dependencias:**
```bash
npm install
```

3. **Levantá el servidor de desarrollo:**
```bash
npm run dev
```
Abrí [http://localhost:3000](http://localhost:3000) en tu navegador.

4. **Para compilar y correr en producción:**
```bash
npm run build
npm start
```

---

## 🗺️ Estructura del sitio

| Ruta | Contenido |
|---|---|
| `/` | Home: hero, grilla de proyectos (tarjetas tipo "capítulo") e integrantes |
| `/fourier` | Trabajo práctico de Series de Fourier: teoría + calculadora interactiva |
| `/crout` | Trabajo práctico del método de Crout (L·U): teoría + calculadora interactiva |

Ambas vistas de proyecto comparten el mismo patrón de navegación: una **guía lateral fija** (sólo en escritorio) con un ícono propio por sección que hace scroll suave (vía Lenis) hasta el bloque correspondiente. La navbar superior también es sensible a la ruta: en el home muestra anclas a "Proyectos"/"Integrantes"; en las vistas de proyecto muestra "Inicio · Fourier · Crout" en ese orden, resaltando la sección activa, con menú hamburguesa en mobile.

---

## 📁 Proyectos

### 1. Calculadora de Series de Fourier (`/fourier`)

> Herramienta interactiva para calcular y visualizar series de Fourier. Permite cargar ejercicios precargados o ingresar funciones propias, simples o a trozos, con visualización de componentes armónicos en tiempo real.

Guía lateral con 4 secciones: **Definición** de la función, **Gráfico**, **Coeficientes** y **Aproximación** final.

#### ¿Cómo se usa?

1. **Elegir una función**: seleccioná uno de los ejercicios precargados o ingresá tu propia función (simple o a trozos).
2. **Configurar parámetros**: definí el período $T$ y la cantidad de armónicos $N$ a calcular.
3. **Visualizar**: el gráfico se actualiza en tiempo real mostrando la aproximación de la serie junto a la función original.
4. **Exportar**: podés descargar el gráfico generado como imagen PNG usando el botón de exportación, o los coeficientes como CSV.

#### Base matemática

Una **Serie de Fourier** permite representar una función periódica $f(t)$ de período $T$ como una suma infinita de funciones seno y coseno:

$$
f(t) = \frac{a_0}{2} + \sum_{n=1}^{N} \left[ a_n\cdot \cos(n\omega t) + b_n\cdot \sin(n\omega t) \right]
$$

donde los **coeficientes de Fourier** se calculan como:

$$
a_0 = \frac{2}{T}\cdot \int_{T} f(t) \, dt
$$

$$
a_n = \frac{2}{T}\cdot \int_{T} f(t)\cdot \cos(n\omega t)\cdot dt
$$

$$
b_n = \frac{2}{T}\cdot \int_{T} f(t)\cdot \sin(n\omega t)\cdot dt
$$

> Cuando la cantidad de armónicos $N$ tiende a $\infty$ mejor es la aproximación a la función original. Este fenómeno se conoce como **convergencia de la serie**.

#### Implementación

El cálculo numérico de los coeficientes se realiza mediante **integración numérica** (regla del trapecio compuesta), lo que permite soportar funciones arbitrarias ingresadas por el usuario:

1. **Parsing de la función**: la expresión ingresada por el usuario es parseada y evaluada con `Math.js`, lo que permite soportar funciones como `sin(x)`, `x^2`, condicionales, etc.
2. **Integración numérica**: los coeficientes $a_0$, $a_n$ y $b_n$ se calculan integrando por trapecios sobre el intervalo $[-L, L]$, con detección automática de paridad (par/impar) para simplificar el cálculo y limpiar ruido numérico.
3. **Evaluación de la serie**: con los coeficientes calculados, se evalúa la sumatoria para cada punto $t$ del dominio y se construye la señal aproximada.
4. **Renderizado**: la función original y la aproximación se grafican simultáneamente con `Recharts`, permitiendo comparar visualmente la convergencia.

---

### 2. Método Directo de Crout — L·U (`/crout`)

> Página instructiva sobre la factorización LU por el método de Crout, pensada para entender el método paso a paso y no como una simple calculadora. Incluye teoría extendida, un desarrollo interactivo de cómo se llega a cada fórmula, y una calculadora funcional al final.

Guía lateral con 4 secciones:

1. **Fundamentos Matemáticos**: ubica a Crout entre los métodos directos de resolución de sistemas lineales, repasa conceptos previos (matriz triangular, diagonal, propiedades de cierre, determinante), el teorema de existencia y unicidad (menores principales $\Delta_1 \ldots \Delta_n \neq 0$), el conteo de ecuaciones/incógnitas que motiva fijar la diagonal de U en 1, y la fórmula general de Crout para un sistema $n \times n$.
2. **Construcción de Matrices**: particulariza la fórmula general en $n=3$ con un visualizador interactivo de las 9 ecuaciones. Al pasar el cursor por una celda de A o una ecuación se resaltan entre sí, y cada fórmula tiene un desarrollo desplegable (botón con flecha animada, expansión suave) que muestra el producto fila·columna del que sale y el despeje hasta llegar a la fórmula final.
3. **Resolución del Sistema**: sustitución hacia adelante ($L \cdot \vec{y} = \vec{b}$) y hacia atrás ($U \cdot \vec{x} = \vec{y}$).
4. **Calculadora Interactiva**: aplica el algoritmo general a sistemas de **1×1 hasta 5×5** (dimensión seleccionable), verificando el teorema mediante los menores principales, mostrando las matrices L y U factorizadas y la solución paso a paso ($\vec{y}$ y $\vec{x}$). El tope de 5×5 es deliberado, para que las matrices sigan entrando con claridad en el diseño.

#### Base matemática

El método factoriza una matriz cuadrada $A$ como producto de una triangular inferior y una superior, fijando la diagonal de $U$ en 1 para garantizar unicidad:

$$
\underline{\underline{A}} = \underline{\underline{L}} \cdot \underline{\underline{U}}
$$

Fórmula general de Crout para un sistema $n \times n$:

$$
l_{i1} = a_{i1} \qquad u_{1j} = \frac{a_{1j}}{l_{11}}
$$

$$
l_{ik} = a_{ik} - \sum_{p=1}^{k-1} l_{ip}\,u_{pk} \qquad u_{kj} = \frac{a_{kj} - \sum_{p=1}^{k-1} l_{kp}\,u_{pj}}{l_{kk}}
$$

#### Implementación

1. **Verificación del teorema**: se calculan los menores principales $\Delta_1, \ldots, \Delta_n$ (determinante por expansión de cofactores) y se exige que ninguno sea nulo, dentro de una tolerancia, antes de factorizar.
2. **Factorización**: se aplica la fórmula general de arriba de forma iterativa, columna a columna.
3. **Resolución**: sustitución hacia adelante para $\vec{y}$ y hacia atrás para $\vec{x}$.
4. Todo el cálculo es genérico en $n$ (1 a 5), reutilizado tanto por el visualizador de 9 ecuaciones (caso particular $n=3$) como por la calculadora.

---

## 🎨 Sistema de diseño

- **Tipografía**: Literata (serif) como base de todo el sitio — títulos, párrafos, glosarios — con los controles interactivos (botones, inputs, selects) forzados a una sans de sistema para no perder legibilidad en la interfaz.
- **Fondo**: textura de cuadriculado muy sutil (`fondo-cuadriculado`) en todas las vistas, como guiño a la hoja de matemática.
- **Navegación**: navbar consciente de la ruta (con menú mobile) + guía lateral sticky por página de proyecto, ambas con scroll suave vía Lenis.
- **Animaciones**: revelado progresivo de secciones al hacer scroll (`RevelarAlEntrar`, respeta `prefers-reduced-motion`), transiciones fluidas en acordeones (técnica `grid-template-rows`, sin saltos bruscos), micro-interacciones en tarjetas y botones.
- **Componentes reutilizables clave**: `KaTeX` (carga dinámica del motor de fórmulas), `GlifoMatriz` (ícono SVG de guía lateral, generado a partir de un patrón de celdas), `RevelarAlEntrar`, `DesplazamientoSuave` (monta Lenis a nivel global).

---

*Los proyectos se irán actualizando en este repositorio a medida que se completen los trabajos prácticos.*
