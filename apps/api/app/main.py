"""AyurVeda Platform — FastAPI Application Entry Point"""
import sentry_sdk
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# ── Import ALL models here so SQLAlchemy registers them before first request ──
from app.models.user import User                        # noqa: F401
from app.models.category import Category                # noqa: F401
from app.models.product import Product, ProductImage    # noqa: F401
from app.models.address import Address                  # noqa: F401
from app.models.order import Order, OrderItem           # noqa: F401
from app.models.payment import Payment                  # noqa: F401
from app.models.review import Review                    # noqa: F401
from app.models.coupon import Coupon                    # noqa: F401
from app.models.wishlist import WishlistItem            # noqa: F401
from app.models.audit_log import AuditLog               # noqa: F401

from app.api.v1.auth.routes import router as auth_router
from app.api.v1.cart.routes import router as cart_router
from app.api.v1.orders.routes import router as orders_router
from app.api.v1.payments.routes import router as payments_router
from app.api.v1.products.routes import router as products_router
from app.api.v1.reviews.routes import router as reviews_router
from app.api.v1.users.routes import router as users_router
from app.api.v1.admin.routes import router as admin_router
from app.core.config import settings

if settings.SENTRY_DSN and settings.is_production:
    sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.1, environment=settings.APP_ENV)

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="Production-grade Ayurvedic E-commerce REST API",
        version="1.0.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
        expose_headers=["X-Total-Count", "X-Page", "X-Page-Size"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        logger.info(f"→ {request.method} {request.url.path}")
        response = await call_next(request)
        logger.info(f"← {response.status_code} {request.url.path}")
        return response

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Internal server error"},
        )

    @app.on_event("startup")
    async def startup():
        logger.info(f"{settings.APP_NAME} starting [{settings.APP_ENV}]")

    @app.on_event("shutdown")
    async def shutdown():
        logger.info("Shutting down gracefully...")

    prefix = settings.API_V1_PREFIX
    app.include_router(auth_router, prefix=prefix)
    app.include_router(products_router, prefix=prefix)
    app.include_router(cart_router, prefix=prefix)
    app.include_router(orders_router, prefix=prefix)
    app.include_router(payments_router, prefix=prefix)
    app.include_router(reviews_router, prefix=prefix)
    app.include_router(users_router, prefix=prefix)
    app.include_router(admin_router, prefix=prefix)

    @app.get("/health", tags=["Health"], include_in_schema=False)
    async def health():
        return {"status": "ok", "env": settings.APP_ENV}

    return app


app = create_app()
