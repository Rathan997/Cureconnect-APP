import json
import re

with open("doctors_data.json", "r", encoding="utf-8") as file:
    doctors = json.load(file)

changed = 0
for doc in doctors:
    phone = doc.get("phone", "")
    # Remove all non-digit characters except +
    digits = re.sub(r"[^\d]", "", phone)
    if digits.startswith("91"):
        number = digits[2:]
    else:
        number = digits
    
    # Truncate to 10 digits if it's longer
    if len(number) > 10:
        number = number[:10]
    elif len(number) < 10:
        # Pad with zeros if too short
        number = number.ljust(10, '0')
        
    new_phone = f"+91 {number}"
    if doc["phone"] != new_phone:
        doc["phone"] = new_phone
        changed += 1

with open("doctors_data.json", "w", encoding="utf-8") as file:
    json.dump(doctors, file, indent=2, ensure_ascii=False)

print(f"Successfully cleaned {changed} doctor phone numbers in doctors_data.json!")
