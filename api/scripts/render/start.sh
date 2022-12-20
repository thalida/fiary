#!/usr/bin/env bash
# exit on error
set -o errexit

pipenv run gunicorn api.api.wsgi:application
