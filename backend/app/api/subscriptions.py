from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User
from app.api import deps

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

@router.post("/checkout")
def create_checkout_session(db: Session = Depends(get_db), current_user: User = Depends(deps.get_current_user)):
    # In a real app, this calls Stripe API to generate a session URL
    # For now, we mock the checkout URL routing directly to success
    return {"checkout_url": f"/pricing/success?session_id=mock_session_{current_user.id}"}

@router.post("/webhook-mock")
def stripe_webhook_mock(db: Session = Depends(get_db), current_user: User = Depends(deps.get_current_user)):
    # Simulates Stripe webhook arriving after successful payment
    current_user.subscription_tier = "Pro"
    current_user.stripe_customer_id = f"cus_mock_{current_user.id}"
    db.commit()
    return {"status": "success", "tier": "Pro"}
