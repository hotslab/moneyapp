#!/bin/bash

set -e
set -u

showInfo() {
  echo
  echo "======================================================="
  echo -e ${1}
  echo "======================================================="
  echo
}

path=$(pwd)
showInfo "Starting migration script on path $path..."

# migrate dev environemnt
showInfo "Migrating dev database..."
node ace migration:run
node ace db:seed

# migrate prod environemnt
cd build/
showInfo "Migrating prod database..."
node ace migration:run --force
node ace db:seed
