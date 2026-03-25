---
title: "Backups"
description: "Copias de seguridad de los datos para poder recuperarlos en caso de pérdida o error."
category: "Datos"
icon: "database"
order: 7
question: "¿Cómo se protegen los datos contra pérdidas?"
related: ["base-de-datos", "persistencia", "monitoreo"]
---

Los **backups** son copias de seguridad de tus datos. Son tu red de seguridad para cuando algo sale mal: un error humano borra una tabla, un deploy introduce un bug que corrompe datos, o el servidor explota. Si no tenés backups, esos datos se perdieron para siempre.

## ¿Por qué importan?

La pregunta no es "¿va a fallar algo?" sino "¿cuándo?". Las [bases de datos](/base-de-datos) pueden fallar por mil razones: hardware dañado, errores de software, ataques, desastres naturales o simplemente alguien que ejecutó un `DELETE` sin `WHERE`. Un buen sistema de backups te permite recuperarte de cualquiera de estos escenarios.

## Tipos de backup

### Full (completo)

Copia **toda** la base de datos. Es el más seguro pero el más lento y el que más espacio ocupa.

### Incremental

Solo copia los **datos que cambiaron** desde el último backup (full o incremental). Es más rápido y liviano, pero para restaurar necesitás el backup full más todos los incrementales en orden.

### Diferencial

Copia los datos que cambiaron desde el **último backup full**. Es un punto medio: más rápido que el full, y para restaurar solo necesitás el full más el último diferencial.

## La regla 3-2-1

Una regla clásica para backups confiables:

- **3** copias de tus datos (el original más dos backups)
- **2** tipos diferentes de almacenamiento (disco local + nube, por ejemplo)
- **1** copia en una ubicación remota (por si hay un incendio en la oficina)

## Automatización con cron

Los backups manuales no sirven porque te vas a olvidar. Automatizalos:

```bash
#!/bin/bash
# backup_db.sh - Backup script for PostgreSQL

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="my_app_production"

# Create the dump
pg_dump $DB_NAME | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" \
  s3://my-backup-bucket/postgres/

# Delete local backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

```bash
# Cron job: run every day at 3 AM
# Edit with: crontab -e
0 3 * * * /scripts/backup_db.sh >> /var/log/backup.log 2>&1
```

## Probá tus backups

Un backup que nunca probaste restaurar **no es un backup**. Periódicamente tenés que verificar que podés restaurar los datos:

```bash
# Restore a backup in a test environment
gunzip -c backup_20240315_030000.sql.gz | psql my_app_test
```

Incluí estas pruebas en tu rutina de [monitoreo](/monitoreo). De nada sirve tener 100 backups si cuando los necesitás resulta que están corruptos o incompletos.

## Servicios de backup en la nube

Si usás bases de datos en la nube (AWS RDS, Google Cloud SQL, Supabase), muchos proveedores ofrecen **backups automáticos** con retención configurable y la posibilidad de restaurar tus datos a cualquier momento específico en el tiempo (lo que se conoce como point-in-time recovery). Esto no significa que no debas tener backups propios: la regla 3-2-1 sigue aplicando.

## Buenas prácticas

- **Automatizá todo**: si depende de que alguien se acuerde, va a fallar
- **Encriptá los backups**: contienen datos sensibles de tus usuarios
- **Documentá el proceso de restauración**: cuando necesites restaurar, vas a estar en crisis — no es momento de improvisar
- **Monitoreá que los backups se ejecuten**: un cron job silenciosamente roto es peor que no tener backup, porque te da falsa confianza
