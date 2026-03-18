#!/bin/bash

# Script de backup para la base de datos y configuración de n8n
# chmod +x backup.sh antes de ejecutar

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📦 Iniciando backup..."

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Backup de la base de datos
echo "💾 Exportando base de datos MySQL..."
docker-compose exec -T mysql mysqldump -uroot -p20020715Jc! expert_finder_db > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Backup de n8n workflows
echo "🔧 Exportando configuración de n8n..."
docker run --rm \
  -v webscraping_n8n_data:/data \
  -v $(pwd)/$BACKUP_DIR:/backup \
  ubuntu tar czf /backup/n8n_backup_$TIMESTAMP.tar.gz /data

# Backup del archivo .env
echo "⚙️  Copiando archivo .env..."
cp .env "$BACKUP_DIR/env_backup_$TIMESTAMP"

echo ""
echo "✅ Backup completado!"
echo "📁 Archivos guardados en: $BACKUP_DIR/"
echo "   - db_backup_$TIMESTAMP.sql"
echo "   - n8n_backup_$TIMESTAMP.tar.gz"
echo "   - env_backup_$TIMESTAMP"
echo ""
echo "💡 Para restaurar:"
echo "   Base de datos: cat $BACKUP_DIR/db_backup_$TIMESTAMP.sql | docker-compose exec -T mysql mysql -uroot -p20020715Jc! expert_finder_db"
echo "   n8n: docker run --rm -v webscraping_n8n_data:/data -v \$(pwd)/$BACKUP_DIR:/backup ubuntu tar xzf /backup/n8n_backup_$TIMESTAMP.tar.gz -C /"
