---
description: Despliegue del proyecto en Contabo VPS con Dokploy
---

# Deploy GuíaPymes

## Prerequisitos

- VPS Contabo con Ubuntu 24
- Docker instalado
- Dokploy configurado
- Variables de entorno en `.env`

## Pasos

1. **Verificar configuración local**

   ```bash
   // turbo
   npm run build
   ```

2. **Commit cambios**

   ```bash
   git add .
   git commit -m "feat: actualización previa a deploy"
   git push origin main
   ```

3. **Deploy con Dokploy**

   ```bash
   dokploy deploy --service guiapymes
   ```

4. **Verificar servicios**
   - Frontend: <https://guiapymes.com>
   - API: <https://api.guiapymes.com/health>
   - Admin: <https://admin.guiapymes.com>

5. **Verificar logs**

   ```bash
   dokploy logs --service guiapymes --tail 100
   ```

## Rollback

```bash
dokploy rollback --service guiapymes --version PREVIOUS
```

## Variables de Entorno Requeridas

- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_MAPS_API_KEY` (opcional si usa Puppeteer)
- `REDIS_URL`
