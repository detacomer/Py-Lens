# PythonLens 🐍🧪

**PythonLens** es una herramienta educativa impulsada por Inteligencia Artificial (Gemini 1.5 Flash) diseñada para ayudar a estudiantes y programadores a dominar Python. Permite transcribir código desde imágenes (OCR) o texto, generando explicaciones académicas, guiones para exposiciones y análisis técnicos profundos.

## 🚀 Características

- **Análisis Académico**: Obtén un guión oral completo como si estuvieras presentando en clase.
- **Deep Dive**: Análisis técnico y pedagógico profundo de cada línea de código.
- **OCR Integrado**: Sube capturas de pantalla de código y la IA las transcribirá y explicará.
- **Consola Simulada**: Mira una predicción exacta de qué mostraría la terminal al ejecutar el código.
- **Chat de Dudas**: Haz preguntas específicas sobre la lógica del programa después del análisis.

## 🛠️ Tecnologías

- **Frontend**: React 18, Vite, Tailwind CSS, Motion (framer-motion).
- **Backend**: Node.js, Express.
- **IA**: Google Gemini SDK (`@google/genai`).

## 📦 Instalación Local

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/tu-usuario/pythonlens.git
    cd pythonlens
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno**:
    Crea un archivo `.env` en la raíz del proyecto y añade tu API Key de Gemini:
    ```env
    GEMINI_API_KEY=tu_clave_aqui
    ```

4.  **Iniciar en modo desarrollo**:
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

## 🌐 Despliegue (Cloud)

Este proyecto está configurado para desplegarse fácilmente en plataformas como **Render**, **Railway** o **Vercel**.

1.  Sube tu código a GitHub.
2.  Conecta tu repositorio a la plataforma de despliegue elegida.
3.  **Configura las Variables de Entorno** en el panel de control de la plataforma:
    -   `GEMINI_API_KEY`: Tu clave de Google AI Studio.
    -   `NODE_ENV`: `production`

## 📄 Licencia

Este proyecto es de uso educativo. Desarrollado con ❤️ para estudiantes de programación.
