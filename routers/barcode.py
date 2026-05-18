
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(tags=["barcode"])
templates = Jinja2Templates(directory="templates")

@router.get("/api/barcode/{barcode_val}", response_class=HTMLResponse)
async def handle_barcode_scan(request: Request, barcode_val: str):
    # Imagine this dictionary comes directly from your external API request fetch
    # Some items might have all 6, some might only return 'Energy' and 'Proteins'
    api_nutriments_response = {
        "energy_value": 150,
        "energy_unit": "kcal",
        "fat_value": 4.2,
        "fat_unit": "g",
        "saturated-fat_value": 0.5,
        "saturated-fat_unit": "g",
        "carbohydrates_value": 22.0,
        "carbohydrates_unit": "g",
        "sugars_value": 12.5,
        "sugars_unit": "g",
        "proteins_value": 5.0,
        "proteins_unit": "g"
        # "salt_value" is completely missing here, which is fine!
    }

    # 1. Map and clean the keys into a human-readable display dictionary
    nutrition_stats = {}
    
    # We map the raw API targets to clean UI display labels
    mapping_rules = {
        "energy": ("Energy", "energy_value", "energy_unit"),
        "fat": ("Total Fat", "fat_value", "fat_unit"),
        "saturated-fat": ("Saturated Fat", "saturated-fat_value", "saturated-fat_unit"),
        "carbohydrates": ("Carbs", "carbohydrates_value", "carbohydrates_unit"),
        "sugars": ("Sugars", "sugars_value", "sugars_unit"),
        "proteins": ("Protein", "proteins_value", "proteins_unit"),
        "salt": ("Salt", "salt_value", "salt_unit"),
    }

    for ui_label, val_key, unit_key in mapping_rules.values():
        # Only add to our dictionary if the data actually exists in the API response
        if val_key in api_nutriments_response:
            value = api_nutriments_response[val_key]
            unit = api_nutriments_response.get(unit_key, "")
            nutrition_stats[ui_label] = f"{value}{unit}"

    # 2. Return the data structure to Jinja2 using modern keyword arguments
    return templates.TemplateResponse(
        request=request,
        name="components/product_card.html",
        context={
            "name": "Strawberry Greek Yogurt",
            "brand": "Fage",
            "code": barcode_val,
            "nutrition": nutrition_stats  # <-- This dictionary is now variable length!
        }
    )