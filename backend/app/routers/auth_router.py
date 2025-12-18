from fastapi import APIRouter, HTTPException, Depends
from app.models.models import LoginRequest, Token
from app.core.security import authenticate_user, create_access_token, get_current_user
from datetime import timedelta

auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post("/login")
def login(credentials: LoginRequest):
	user = authenticate_user(credentials.e_id, credentials.password)
	if not user:
		raise HTTPException(status_code=401, detail="Invalid e_id or password")
	access_token_expires = timedelta(minutes=30)
	token = create_access_token(subject=str(user.e_id), expires_delta=access_token_expires)
	
	# Convert roles enum list to string values
	roles_list = [role.value for role in user.roles] if user.roles else ["Developer"]
	
	return {
		"access_token": token,
		"token_type": "bearer",
		"user": {
			"e_id": user.e_id,
			"roles": roles_list,
			"status": user.status.value
		}
	}

@auth_router.get("/me")
def me(current_user=Depends(get_current_user)):
	return current_user