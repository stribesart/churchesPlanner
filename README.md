# Churches Planner

Aplicacion Next.js para administrar iglesias: usuarios, ministerios, eventos,
inventario, anuncios y ofrendas con separacion por tenant en MongoDB.

## Getting Started

Instala dependencias y levanta el servidor local:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

Crea `.env.local` a partir de `.env.example`:

```bash
cp .env.example .env.local
```

Variables requeridas:

- `MONGODB_URI`: conexion a MongoDB.
- `SESSION_SECRET`: secreto largo y aleatorio para firmar sesiones. Es obligatorio en produccion.

## Verificacion de contacto

El sistema permite confirmar cuenta por correo, SMS o WhatsApp desde `/verify`.
Para enviar correo real configura `RESEND_API_KEY` y `EMAIL_FROM`. Si no hay
API key en local, el correo queda en modo manual y la pantalla muestra el codigo
de prueba. En produccion no se muestran codigos manuales: correo requiere
Resend configurado y SMS/WhatsApp requieren conectar su proveedor.

## Production Checklist

Antes de publicar:

```bash
npm run lint
npm run build
```

En el proveedor de hosting, configura al menos `MONGODB_URI`, `SESSION_SECRET` y `NODE_ENV=production`.

El endpoint `/api/health` responde el estado basico de la API para monitoreo.
