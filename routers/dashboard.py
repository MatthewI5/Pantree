
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(tags=["dashboard"])
templates = Jinja2Templates(directory="templates")

@router.get("/dashboard", response_class=HTMLResponse)
async def view_dashboard(request: Request):
    pantry_items = ["Milk", "Almond Butter", "Whole Wheat Bread"]
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={"items": pantry_items}
    )