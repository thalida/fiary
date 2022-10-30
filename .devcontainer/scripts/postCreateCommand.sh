#!/bin/bash
set -o allexport
source /workspace/.env
set +o allexport

cd /workspace/api
pipenv install --system

cd /workspace/app
npm install
