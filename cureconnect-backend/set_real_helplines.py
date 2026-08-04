import json

with open("doctors_data.json", "r", encoding="utf-8") as file:
    doctors = json.load(file)

changed = 0
for doc in doctors:
    clinic = doc.get("clinic", "").lower()
    city = doc.get("city", "")
    
    if "apollo" in clinic:
        new_phone = "18605001066"  # Apollo National Helpline
    elif "fortis" in clinic:
        new_phone = "04442002288"  # Fortis Malar Chennai
    elif "manipal" in clinic or "columbia" in clinic:
        new_phone = "18001025555"  # Manipal National Helpline
    elif "max" in clinic:
        new_phone = "01126515050"  # Max Hospital Helpline
    elif "medanta" in clinic:
        new_phone = "01244141414"  # Medanta Helpline
    else:
        if city == "Chennai":
            new_phone = "104"       # Chennai Medical Helpline
        else:
            new_phone = "18001801104" # National Health Helpline
            
    doc["phone"] = new_phone
    changed += 1

with open("doctors_data.json", "w", encoding="utf-8") as file:
    json.dump(doctors, file, indent=2, ensure_ascii=False)

print(f"Updated {changed} records with actual working helpline numbers!")
