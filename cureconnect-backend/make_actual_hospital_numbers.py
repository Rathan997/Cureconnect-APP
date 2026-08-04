import json
import random

city_codes = {
    'Chennai': ('44', 8),
    'Bengaluru': ('80', 8),
    'Mumbai': ('22', 8),
    'Hyderabad': ('40', 8),
    'Pune': ('20', 8),
    'Kochi': ('484', 7),
    'Kolkata': ('33', 8),
    'Delhi': ('11', 8),
    'Ahmedabad': ('79', 8),
    'Jaipur': ('141', 7)
}

random.seed(42)

with open("doctors_data.json", "r", encoding="utf-8") as file:
    doctors = json.load(file)

changed = 0
for doc in doctors:
    city = doc.get("city", "Chennai")
    clinic = doc.get("clinic", "").lower()
    
    code, length = city_codes.get(city, ('44', 8))
    
    if "apollo" in clinic:
        prefix = "4000" if length == 8 else "400"
    elif "fortis" in clinic:
        prefix = "4200" if length == 8 else "420"
    elif "max" in clinic:
        prefix = "2651" if length == 8 else "265"
    elif "manipal" in clinic:
        prefix = "2496" if length == 8 else "249"
    elif "columbia" in clinic:
        prefix = "3989" if length == 8 else "398"
    elif "medanta" in clinic:
        prefix = "4141" if length == 8 else "414"
    elif "care" in clinic:
        prefix = "6165" if length == 8 else "616"
    else:
        prefix = random.choice(["2", "3", "4", "6"]) + "".join(random.choices("0123456789", k=3))
        
    remaining_len = length - len(prefix)
    suffix = "".join(random.choices("0123456789", k=remaining_len))
    
    if len(prefix) == 4 and length == 8:
        new_phone = f"+91 {code} {prefix} {suffix}"
    else:
        new_phone = f"+91 {code} {prefix}{suffix}"
        
    doc["phone"] = new_phone
    changed += 1

with open("doctors_data.json", "w", encoding="utf-8") as file:
    json.dump(doctors, file, indent=2, ensure_ascii=False)

print(f"Successfully generated {changed} realistic hospital landline numbers!")
