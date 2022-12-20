#!/bin/bash
set -o allexport
source /workspace/.env
source /workspace/app/.env
set +o allexport

cd /workspace/api
pipenv install --system

cd /workspace/app
npm install
