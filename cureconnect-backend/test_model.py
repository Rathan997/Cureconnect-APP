import os
import pickle
import numpy as np

MODEL_PATH = "ml_model.pkl"

def load_model():
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model file '{MODEL_PATH}' not found. Please run 'python train_model.py' first to train and save the model.")
        return None
    try:
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        print("✅ ML Model loaded successfully!\n")
        return model
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None

def test_interactive(model):
    print("=" * 60)
    print("   CureConnect Symptom Classification ML Model Test Tool")
    print("=" * 60)
    print("Type your symptoms below to get predicted specialist recommendations.")
    print("Type 'exit' or 'quit' to exit the testing tool.")
    
    while True:
        try:
            symptoms = input("\nEnter Symptoms: ").strip()
            if not symptoms:
                continue
            if symptoms.lower() in ["exit", "quit"]:
                print("Goodbye!")
                break
            
            # Predict
            pred = model.predict([symptoms])[0]
            proba = model.predict_proba([symptoms])
            confidence = max(proba[0]) * 100
            
            print(f"🔮 Predicted Specialist: {pred}")
            print(f"📊 Confidence Score:   {confidence:.2f}%")
            
            # Display sorted probabilities
            classes = model.classes_
            probs = proba[0]
            sorted_idx = np.argsort(probs)[::-1]
            
            print("\nProbabilities breakdown:")
            for idx in sorted_idx[:3]: # top 3
                if probs[idx] > 0.01:
                    print(f"  - {classes[idx]}: {probs[idx]*100:.1f}%")
                    
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"❌ Error predicting: {e}")

if __name__ == "__main__":
    model = load_model()
    if model:
        test_interactive(model)
