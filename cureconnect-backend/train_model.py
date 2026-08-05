import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# ── Training Data ──────────────────────────────────────
training_data = [
    # General Physician
    ("fever headache body ache fatigue weakness", "General Physician"),
    ("cold cough runny nose sneezing sore throat", "General Physician"),
    ("flu symptoms mild fever tiredness", "General Physician"),
    ("general checkup routine health check", "General Physician"),
    ("vomiting nausea food poisoning", "General Physician"),
    ("diarrhea loose motion stomach upset", "General Physician"),
    ("high temperature chills sweating", "General Physician"),
    ("body pain weakness fatigue", "General Physician"),
    ("mild chest cold congestion", "General Physician"),
    ("throat pain difficulty swallowing fever", "General Physician"),
    ("eye infection redness itching", "General Physician"),
    ("urinary burning frequent urination", "General Physician"),
    ("constipation bloating indigestion", "General Physician"),
    ("acidity heartburn reflux", "General Physician"),
    ("weakness dizziness lightheadedness", "General Physician"),

    # Cardiologist
    ("chest pain heart palpitations", "Cardiologist"),
    ("shortness of breath heart racing", "Cardiologist"),
    ("high blood pressure hypertension", "Cardiologist"),
    ("irregular heartbeat arrhythmia", "Cardiologist"),
    ("heart attack symptoms crushing chest pain", "Cardiologist"),
    ("angina chest tightness exertion", "Cardiologist"),
    ("swollen legs ankles heart failure", "Cardiologist"),
    ("cholesterol check heart disease", "Cardiologist"),
    ("palpitations fast heart rate tachycardia", "Cardiologist"),
    ("breathlessness walking stairs heart", "Cardiologist"),
    ("ecg check heart monitoring", "Cardiologist"),
    ("chest discomfort left arm pain", "Cardiologist"),
    ("cardiac risk assessment family history", "Cardiologist"),
    ("congestive heart failure", "Cardiologist"),
    ("bypass surgery follow up", "Cardiologist"),

    # Dermatologist
    ("skin rash itching redness", "Dermatologist"),
    ("acne pimples face skin", "Dermatologist"),
    ("eczema psoriasis skin inflammation", "Dermatologist"),
    ("hair loss baldness thinning hair", "Dermatologist"),
    ("fungal infection ringworm skin", "Dermatologist"),
    ("mole spot skin lesion", "Dermatologist"),
    ("dry skin flaking peeling", "Dermatologist"),
    ("allergic reaction hives urticaria", "Dermatologist"),
    ("skin darkening pigmentation", "Dermatologist"),
    ("nail infection discoloration", "Dermatologist"),
    ("warts skin growth removal", "Dermatologist"),
    ("sunburn skin damage", "Dermatologist"),
    ("vitiligo white patches skin", "Dermatologist"),
    ("seborrhea dandruff scalp", "Dermatologist"),
    ("cosmetic skin treatment", "Dermatologist"),

    # Orthopedic
    ("back pain spine disc", "Orthopedic"),
    ("knee pain swelling joint", "Orthopedic"),
    ("shoulder pain rotator cuff", "Orthopedic"),
    ("fracture bone break injury", "Orthopedic"),
    ("arthritis joint pain stiffness", "Orthopedic"),
    ("sports injury ankle sprain", "Orthopedic"),
    ("neck pain cervical spondylosis", "Orthopedic"),
    ("hip replacement bone surgery", "Orthopedic"),
    ("slip disc sciatica nerve pain", "Orthopedic"),
    ("muscle pain cramp stiffness", "Orthopedic"),
    ("carpal tunnel wrist pain", "Orthopedic"),
    ("osteoporosis bone density", "Orthopedic"),
    ("foot pain plantar fasciitis", "Orthopedic"),
    ("elbow pain tennis elbow", "Orthopedic"),
    ("joint replacement surgery", "Orthopedic"),

    # Neurologist
    ("headache migraine severe", "Neurologist"),
    ("seizure epilepsy fits", "Neurologist"),
    ("memory loss forgetfulness dementia", "Neurologist"),
    ("numbness tingling hands feet", "Neurologist"),
    ("stroke paralysis weakness one side", "Neurologist"),
    ("dizziness vertigo balance", "Neurologist"),
    ("tremor shaking Parkinson", "Neurologist"),
    ("nerve pain shooting burning", "Neurologist"),
    ("multiple sclerosis MS", "Neurologist"),
    ("brain tumor headache neurological", "Neurologist"),
    ("confusion disorientation mental", "Neurologist"),
    ("sleep disorder insomnia", "Neurologist"),
    ("fainting blackout consciousness loss", "Neurologist"),
    ("speech problem slurred words", "Neurologist"),
    ("anxiety panic neurological", "Neurologist"),

    # Pediatrician
    ("child fever baby sick", "Pediatrician"),
    ("infant colic crying baby", "Pediatrician"),
    ("vaccination immunization child", "Pediatrician"),
    ("growth development child", "Pediatrician"),
    ("child nutrition diet", "Pediatrician"),
    ("newborn jaundice baby yellow", "Pediatrician"),
    ("childhood asthma breathing child", "Pediatrician"),
    ("ear infection child pain", "Pediatrician"),
    ("rash diaper baby skin", "Pediatrician"),
    ("child obesity weight", "Pediatrician"),
    ("toddler constipation baby", "Pediatrician"),
    ("school children health check", "Pediatrician"),
    ("pediatric allergy child reaction", "Pediatrician"),
    ("ADHD child behavior", "Pediatrician"),
    ("childhood diabetes sugar", "Pediatrician"),

    # Gynecologist
    ("periods menstruation irregular", "Gynecologist"),
    ("pregnancy prenatal check", "Gynecologist"),
    ("PCOS ovarian cyst", "Gynecologist"),
    ("fertility problem conception", "Gynecologist"),
    ("menopause symptoms", "Gynecologist"),
    ("vaginal discharge infection", "Gynecologist"),
    ("pelvic pain lower abdomen women", "Gynecologist"),
    ("uterine fibroids", "Gynecologist"),
    ("cervical cancer screening pap smear", "Gynecologist"),
    ("breast lump pain", "Gynecologist"),
    ("contraception family planning", "Gynecologist"),
    ("endometriosis", "Gynecologist"),
    ("postpartum care delivery", "Gynecologist"),
    ("heavy bleeding periods", "Gynecologist"),
    ("infertility treatment IVF", "Gynecologist"),

    # Gastroenterologist
    ("stomach pain abdomen", "Gastroenterologist"),
    ("digestive problem IBS", "Gastroenterologist"),
    ("acid reflux GERD esophagus", "Gastroenterologist"),
    ("liver problem jaundice", "Gastroenterologist"),
    ("colonoscopy endoscopy", "Gastroenterologist"),
    ("Crohn's disease colitis", "Gastroenterologist"),
    ("gallstone gallbladder", "Gastroenterologist"),
    ("blood in stool rectal bleeding", "Gastroenterologist"),
    ("swallowing difficulty dysphagia", "Gastroenterologist"),
    ("hepatitis liver infection", "Gastroenterologist"),
    ("pancreatitis pancreas", "Gastroenterologist"),
    ("celiac gluten intolerance", "Gastroenterologist"),
    ("colon cancer screening", "Gastroenterologist"),
    ("chronic diarrhea stool problem", "Gastroenterologist"),
    ("abdominal bloating gas distension", "Gastroenterologist"),

    # Diabetologist
    ("diabetes blood sugar high", "Diabetologist"),
    ("insulin resistance type 2 diabetes", "Diabetologist"),
    ("HbA1c sugar control", "Diabetologist"),
    ("diabetic foot complication", "Diabetologist"),
    ("blood glucose monitoring", "Diabetologist"),
    ("diabetes diet nutrition", "Diabetologist"),
    ("pre-diabetes borderline sugar", "Diabetologist"),
    ("insulin pump therapy", "Diabetologist"),
    ("diabetic neuropathy nerve", "Diabetologist"),
    ("gestational diabetes pregnancy sugar", "Diabetologist"),
    ("obesity metabolic syndrome", "Diabetologist"),
    ("thyroid diabetes hormonal", "Diabetologist"),
    ("low blood sugar hypoglycemia", "Diabetologist"),
    ("diabetes kidney complication", "Diabetologist"),
    ("type 1 diabetes juvenile", "Diabetologist"),

    # ENT Specialist
    ("ear pain infection discharge", "ENT Specialist"),
    ("hearing loss deafness", "ENT Specialist"),
    ("nose bleed epistaxis", "ENT Specialist"),
    ("tonsil swollen tonsillitis", "ENT Specialist"),
    ("sinus sinusitis nasal congestion", "ENT Specialist"),
    ("throat hoarseness voice change", "ENT Specialist"),
    ("adenoids child snoring", "ENT Specialist"),
    ("deviated nasal septum", "ENT Specialist"),
    ("vertigo ear balance inner", "ENT Specialist"),
    ("tinnitus ringing in ear", "ENT Specialist"),
    ("nasal polyp blockage", "ENT Specialist"),
    ("laryngitis voice box", "ENT Specialist"),
    ("snoring sleep apnea", "ENT Specialist"),
    ("allergy nasal rhinitis", "ENT Specialist"),
    ("ear wax removal", "ENT Specialist"),
]

# ── Prepare data ──────────────────────────────────────
X = [item[0] for item in training_data]
y = [item[1] for item in training_data]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── Train Pipeline ─────────────────────────────────────
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        stop_words='english',
        lowercase=True,
    )),
    ('classifier', RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        random_state=42,
        class_weight='balanced',
    ))
])

print("Training ML model...")
pipeline.fit(X_train, y_train)

# ── Evaluate ───────────────────────────────────────────
y_pred = pipeline.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\nModel Accuracy: {accuracy * 100:.1f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# ── Test predictions ───────────────────────────────────
test_symptoms = [
    "I have chest pain and shortness of breath",
    "my child has fever and cold",
    "skin rash and itching all over body",
    "back pain and knee joint problem",
    "diabetes sugar levels high",
    "headache migraine severe pain",
    "pregnancy check and periods irregular",
    "stomach pain digestion problem",
    "ear pain and hearing loss",
]

print("\nSample Predictions:")
for symptom in test_symptoms:
    pred = pipeline.predict([symptom])[0]
    proba = pipeline.predict_proba([symptom])
    confidence = max(proba[0]) * 100
    print(f"  '{symptom[:40]}...' -> {pred} ({confidence:.0f}%)")

# ── Save model ─────────────────────────────────────────
with open("ml_model.pkl", "wb") as f:
    pickle.dump(pipeline, f)

print("\nModel saved as ml_model.pkl!")