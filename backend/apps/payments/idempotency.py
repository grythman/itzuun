from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status


def execute_idempotent(request, executor):
    # 'Idempotency-Key' эсвэл 'HTTP_IDEMPOTENCY_KEY'-ээс авах
    key = request.headers.get("Idempotency-Key") or request.META.get("HTTP_IDEMPOTENCY_KEY")
    
    if not key:
        return executor()  # Түлхүүргүй бол шууд ажиллуулна

    # Check if the result is already in the cache
    cached_response = cache.get(key)
    if cached_response:
        # Reconstruct the Response object from cached data
        data, status_code = cached_response
        return Response(data, status=status_code)

    # Execute the actual function
    response_data, status_code = executor()

    # Cache the result
    # Note: Using Django's default cache timeout. 
    # For production, consider a more specific timeout (e.g., 24 hours).
    cache.set(key, (response_data, status_code))

    return Response(response_data, status=status_code)
