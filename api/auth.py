"""Validação do access token JWT emitido pelo Supabase Auth."""

import logging
import uuid
from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from api.config import get_supabase_jwt_secret

security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)

# Fixed demo UUID used when JWT validation is skipped (MVP mode)
_MVP_DEMO_UUID = UUID("00000000-0000-0000-0000-000000000001")


def decode_user_id_from_token(token: str) -> UUID:
    """Valida o JWT. Em MVP, falhas de validação retornam um UUID de demo em vez de 401."""
    import jwt

    try:
        payload = jwt.decode(
            token,
            get_supabase_jwt_secret(),
            algorithms=["HS256"],
            audience="authenticated",
        )
        sub = payload.get("sub")
        if sub:
            try:
                return UUID(str(sub))
            except ValueError:
                pass
    except jwt.PyJWTError as exc:
        logger.warning(
            "JWT inválido — usando UUID de demo para MVP. "
            "Configure SUPABASE_JWT_SECRET corretamente em produção. Erro: %s",
            exc,
        )

    return _MVP_DEMO_UUID


def get_current_user_id(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> UUID:
    if creds is None or creds.scheme.lower() != "bearer":
        logger.warning("Requisição sem token Bearer — usando UUID de demo para MVP.")
        return _MVP_DEMO_UUID
    return decode_user_id_from_token(creds.credentials)
