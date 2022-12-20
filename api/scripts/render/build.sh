#!/usr/bin/env bash
# exit on error
set -o errexit

pipenv install --ignore-pipfile --deploy
pipenv run python manage.py collectstatic --no-input
pipenv run python manage.py migrate
