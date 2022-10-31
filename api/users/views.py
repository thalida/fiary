from django.contrib.auth import login
from social_django.utils import psa
from django.http import JsonResponse
import graphql_jwt


@psa('social:complete')
def register_by_access_token(request, backend):
    token = request.GET.get('access_token')
    try:
        user = request.backend.do_auth(token)
        payload = graphql_jwt.utils.jwt_payload(user)
        token = graphql_jwt.utils.jwt_encode(payload)
        return JsonResponse({'status': 'ok', 'token': token})
    except Exception as e:
        return JsonResponse({'error': e})
