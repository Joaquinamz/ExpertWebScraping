#!/bin/bash
# Script para inicializar la base de datos en el orden correcto

set -e

echo "Ejecutando scripts de base de datos en orden..."

# Ejecutar scripts en orden
mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < /docker-entrypoint-initdb.d/00_setup_all.sql

echo "Base de datos inicializada correctamente"
