# 📐 Análisis Numérico — Portfolio de Trabajos Prácticos

Una colección de proyectos de los trabajos prácticos opcionales de la materia **Análisis Numérico** — UTN FRLP.

---

## 👥 Integrantes

| Nombre | Legajo | Email |
|---|---|---|
| Mateo Arturo Geffroy | 32.027 | mateogeffroy@gmail.com |
| Francisco Nicolás Buscaglia | 32.308 | francisconicolasbuscaglia@alu.frlp.utn.edu.ar |
| Gerónimo Garrote | 33.277 | garrote.gero@gmail.com |
| Nicolás Martín Coria | 32.635 | nicolasmartincoria@alu.frlp.utn.edu.ar |

---

## 🛠️ Stack del Proyecto

| Tecnología | Descripción |
|---|---|
| [Next.js 14](https://nextjs.org/) | Framework React con App Router |
| [TypeScript](https://www.typescriptlang.org/) | Tipado estático |
| [Tailwind CSS](https://tailwindcss.com/) | Estilos utility-first |

---

## 📁 Proyectos

### 1. Calculadora de Series de Fourier

> Herramienta interactiva para calcular y visualizar series de Fourier. Permite cargar ejercicios precargados o ingresar funciones propias, simples o a trozos, con visualización de componentes armónicos en tiempo real.

#### Tecnologías utilizadas

| Librería | Uso |
|---|---|
| [Math.js](https://mathjs.org/) | Evaluación y parsing de expresiones matemáticas |
| [Recharts](https://recharts.org/) | Visualización gráfica de la función y sus armónicos |
| [html2canvas](https://html2canvas.hertzen.com/) | Exportación del gráfico como imagen |

---

#### ¿Cómo se usa?

1. **Elegir una función**: seleccioná uno de los ejercicios precargados o ingresá tu propia función (simple o a trozos).
2. **Configurar parámetros**: definí el período $T$ y la cantidad de armónicos $N$ a calcular.
3. **Visualizar**: el gráfico se actualiza en tiempo real mostrando la aproximación de la serie junto a la función original.
4. **Exportar**: podés descargar el gráfico generado como imagen PNG usando el botón de exportación.

---

#### Base matemática

Una **Serie de Fourier** permite representar una función periódica $f(t)$ de período $T$ como una suma infinita de funciones seno y coseno:

$$
f(t) = \frac{a_0}{2} + \sum_{n=1}^{N} \left[ a_n \cos\left(\frac{2\pi n t}{T}\right) + b_n \sin\left(\frac{2\pi n t}{T}\right) \right]
$$

donde los **coeficientes de Fourier** se calculan como:

$$
a_0 = \frac{2}{T} \int_{0}^{T} f(t) \, dt
$$

$$
a_n = \frac{2}{T} \int_{0}^{T} f(t) \cos\left(\frac{2\pi n t}{T}\right) dt
$$

$$
b_n = \frac{2}{T} \int_{0}^{T} f(t) \sin\left(\frac{2\pi n t}{T}\right) dt
$$

> A mayor cantidad de armónicos $N$, mejor es la aproximación a la función original. Este fenómeno se conoce como **convergencia de la serie**.

---

#### Implementación

El cálculo numérico de los coeficientes se realiza mediante **integración numérica** (en lugar de integración analítica), lo que permite soportar funciones arbitrarias ingresadas por el usuario. El proceso es el siguiente:

1. **Parsing de la función**: la expresión ingresada por el usuario es parseada y evaluada con `Math.js`, lo que permite soportar funciones como `sin(x)`, `x^2`, condicionales, etc.

2. **Integración numérica**: los coeficientes $a_0$, $a_n$ y $b_n$ se calculan usando la **Regla de Simpson compuesta** o **sumas de Riemann** sobre el intervalo $[0, T]$, dividido en $M$ subintervalos.

3. **Evaluación de la serie**: con los coeficientes calculados, se evalúa la sumatoria para cada punto $t$ del dominio y se construye la señal aproximada.

4. **Renderizado**: la función original y la aproximación se grafican simultáneamente con `Recharts`, permitiendo comparar visualmente la convergencia.

---

#### Funciones de ejemplo soportadas

| Función | Expresión ingresable |
|---|---|
| Onda cuadrada | `x < T/2 ? 1 : -1` |
| Onda triangular | `abs(x - T/2)` |
| Diente de sierra | `x / T` |
| Función personalizada | Cualquier expresión válida de `Math.js` |

---

*Los proyectos se irán actualizando a medida que se completen los trabajos prácticos.*