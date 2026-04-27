# Análisis Numérico - Landing Page

Una landing page moderna y responsiva para la materia de Análisis Numérico, construida con Next.js, TypeScript y Tailwind CSS. Diseñada para ser deployada fácilmente en Vercel.

## 🚀 Características

- ✨ Diseño moderno y atractivo con gradientes
- 🎨 Totalmente responsivo (Mobile, Tablet, Desktop)
- ⚡ Optimizado para velocidad (Next.js 14)
- 🔍 SEO friendly
- 🌙 Tema oscuro profesional
- 📱 Cards interactivos con hover effects
- 🚀 Listo para Vercel deployment

## 🛠️ Tecnologías

- **Next.js 14** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilos utilities
- **Vercel** - Hosting y deployment

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn

## 🔧 Instalación

1. Clona el repositorio:
```bash
git clone <repo-url>
cd landing-AN
```

2. Instala las dependencias:
```bash
npm install
# o
yarn install
```

## 🚀 Desarrollo Local

Para ejecutar el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

## 📦 Build

Para crear una build de producción:

```bash
npm run build
npm start
# o
yarn build
yarn start
```

## 🌐 Deployment en Vercel

La forma más fácil de deployar es usar [Vercel](https://vercel.com/), creada por los creadores de Next.js.

### Opción 1: Usando Vercel CLI

```bash
npm i -g vercel
vercel
```

### Opción 2: Usar GitHub

1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Conecta tu repositorio de GitHub
4. Vercel deployará automáticamente los cambios

## 📁 Estructura del Proyecto

```
landing-AN/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Página principal
│   └── globals.css     # Estilos globales
├── components/         # Componentes reutilizables
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ProjectCard.tsx
├── public/             # Archivos estáticos
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── vercel.json         # Configuración de Vercel
└── README.md
```

## 🎨 Personalización

### Agregar nuevos proyectos

Edita el array `projects` en [app/page.tsx](app/page.tsx):

```typescript
const projects = [
  {
    title: 'Mi Proyecto',
    description: 'Descripción del proyecto',
    icon: '📊',
    link: '/proyecto',
    tags: ['tag1', 'tag2'],
  },
  // ...
];
```

### Cambiar colores

Edita los colores en [tailwind.config.ts](tailwind.config.ts):

```typescript
colors: {
  primary: '#tu-color',
  secondary: '#tu-color',
}
```

### Modificar contenido

- **Header**: [components/Header.tsx](components/Header.tsx)
- **Footer**: [components/Footer.tsx](components/Footer.tsx)
- **Página Principal**: [app/page.tsx](app/page.tsx)

## 📝 Variables de Entorno

Crea un archivo `.env.local` si es necesario:

```bash
# Ejemplo (opcional)
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios mayores:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT - ver el archivo LICENSE para más detalles.

## 📞 Contacto

Para preguntas o sugerencias sobre el proyecto, siéntete libre de contactar.

---

⭐ Si te fue útil, considera dar una estrella en GitHub!
