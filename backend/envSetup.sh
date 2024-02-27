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
showInfo "Starting env setup script on path $path..."

if [[ -f build/.env ]]
then showInfo "Production .env file exists."
else cp .env.prod.example build/.env
fi

if [[ -f .env ]]
then showInfo "Development .env already file exists."
else cp .env.dev.example build/.env
fi

if [[ -f .env.test ]]
then showInfo "Test .env file exists."
else cp .env.test.example build/.env.test
fi