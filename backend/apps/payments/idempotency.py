def execute_idempotent(request, executor):
    key = request.headers.get("Idempotency-Key") or request.META.get("HTTP_IDEMPOTENCY_KEY")
    if not key:
        return executor() # Энэ нь (data, status) tuple буцаах ёстой

    cache_key = f"idempotency_{request.user.id}_{key}"
    cached_res = cache.get(cache_key)
    if cached_res:
        return cached_res["data"], cached_res["status"]

    # Шинээр ажиллуулах
    data, status_code = executor()
    
    # Зөвхөн амжилттай хариуг cache-лэх
    if 200 <= status_code < 300:
        cache.set(cache_key, {"data": data, "status": status_code}, timeout=3600)
        
    return data, status_code