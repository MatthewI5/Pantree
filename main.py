from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from routers import dashboard, barcode

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(dashboard.router)
app.include_router(barcode.router)
