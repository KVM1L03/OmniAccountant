"""Per-IP rate limits via slowapi (in-memory counters).

Counters are **process-local**. With multiple API replicas each instance tracks
its own counts — acceptable for the project's simplest deployment path; switch
limiter's ``storage_uri`` to Redis when scaling horizontally.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
