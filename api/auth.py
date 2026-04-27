"""Validação do access token JWT emitido pelo Supabase Auth."""

from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from api.config import get_supabase_jwt_secret

security = HTTPBearer()


def decode_user_id_from_token(token: str) -> UUID:
    """Valida o JWT (PyJWT importado aqui para não exigir o pacote ao importar o módulo em testes com override de auth)."""
    import jwt

    try:
        payload = jwt.decode(
            token,
            get_supabase_jwt_secret(),
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou expirado",
        ) from exc
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Token sem identificador de utilizador")
    try:
        return UUID(str(sub))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Subject do token inválido") from exc


def get_current_user_id(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> UUID:
    if creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Esquema de autorização inválido")
    return decode_user_id_from_token(creds.credentials)
