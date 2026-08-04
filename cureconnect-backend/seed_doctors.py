import json
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:997@localhost:5432/cureconnect"
engine = create_engine(DATABASE_URL)

with open("doctors_data.json", "r", encoding="utf-8") as file:
    doctors = json.load(file)

print(f"Seeding {len(doctors)} doctors...")

with engine.connect() as conn:
    # Clear existing doctors
    conn.execute(text("DELETE FROM doctors"))
    conn.commit()
    print("Cleared existing doctors")

    inserted = 0
    errors = 0
    for doc in doctors:
        try:
            conn.execute(text("""
                INSERT INTO doctors (
                    id, name, specialization, qualification, experience,
                    clinic, area, city, state, address, phone, fee,
                    rating, reviews, timings, languages, lat, lng
                ) VALUES (
                    :id, :name, :specialization, :qualification, :experience,
                    :clinic, :area, :city, :state, :address, :phone, :fee,
                    :rating, :reviews, :timings, :languages, :lat, :lng
                ) ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    rating = EXCLUDED.rating
            """), {
                **doc,
                "languages": ",".join(doc.get("languages", []))
            })
            inserted += 1
            if inserted % 500 == 0:
                conn.commit()
                print(f"  Inserted {inserted} doctors...")
        except Exception as e:
            errors += 1
            print(f"Error: {e}")

    conn.commit()
    print(f"\n[SUCCESS] Successfully seeded {inserted} doctors!")
    print(f"[ERRORS] Errors: {errors}")