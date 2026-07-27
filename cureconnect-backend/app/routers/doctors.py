from fastapi import APIRouter, Depends, HTTPException, Query
from app.utils.auth import verify_token
import math, logging

logger = logging.getLogger(__name__)
router = APIRouter()

ALL_INDIA_DOCTORS = [
    # ── CHENNAI (Tamil Nadu) ──
    {"id": "doc_001", "name": "Dr. Priya Ramesh", "specialization": "General Physician",
     "qualification": "MBBS, MD", "experience": "14 years", "clinic": "Apollo Clinic",
     "area": "Anna Nagar", "city": "Chennai", "state": "Tamil Nadu",
     "address": "Apollo Clinic, Anna Nagar, Chennai - 600040",
     "phone": "+91 44 2626 1111", "fee": 500, "rating": 4.8, "reviews": 312,
     "timings": "Mon–Sat: 9AM–1PM, 5PM–8PM", "languages": ["Tamil", "English"],
     "lat": 13.0850, "lng": 80.2101},
    {"id": "doc_002", "name": "Dr. Karthik Suresh", "specialization": "Cardiologist",
     "qualification": "MBBS, MD, DM (Cardiology)", "experience": "20 years",
     "clinic": "Fortis Malar Hospital", "area": "Adyar", "city": "Chennai", "state": "Tamil Nadu",
     "address": "Fortis Malar Hospital, Adyar, Chennai - 600020",
     "phone": "+91 44 4289 2222", "fee": 900, "rating": 4.9, "reviews": 534,
     "timings": "Mon–Fri: 9AM–1PM", "languages": ["Tamil", "English"],
     "lat": 13.0067, "lng": 80.2574},
    {"id": "doc_003", "name": "Dr. Ananya Lakshmi", "specialization": "Dermatologist",
     "qualification": "MBBS, MD (Dermatology)", "experience": "9 years",
     "clinic": "Skin & Cosmo Clinic", "area": "T. Nagar", "city": "Chennai", "state": "Tamil Nadu",
     "address": "Skin & Cosmo Clinic, T. Nagar, Chennai - 600017",
     "phone": "+91 44 2431 5555", "fee": 600, "rating": 4.7, "reviews": 278,
     "timings": "Mon–Sat: 10AM–1PM, 4PM–7PM", "languages": ["Tamil", "English"],
     "lat": 13.0418, "lng": 80.2341},
    {"id": "doc_004", "name": "Dr. Lalitha Venkat", "specialization": "Pediatrician",
     "qualification": "MBBS, MD (Pediatrics)", "experience": "11 years",
     "clinic": "Child Care Clinic", "area": "Velachery", "city": "Chennai", "state": "Tamil Nadu",
     "address": "Child Care Clinic, Velachery, Chennai - 600042",
     "phone": "+91 44 2257 2222", "fee": 450, "rating": 4.7, "reviews": 387,
     "timings": "Mon–Sat: 9AM–1PM, 5PM–8PM", "languages": ["Tamil", "English"],
     "lat": 12.9815, "lng": 80.2180},
    {"id": "doc_005", "name": "Dr. Kavitha Subramanian", "specialization": "Diabetologist",
     "qualification": "MBBS, MD, FRCP", "experience": "15 years",
     "clinic": "Dr. Mohan Diabetes Centre", "area": "Gopalapuram", "city": "Chennai", "state": "Tamil Nadu",
     "address": "Dr. Mohan Diabetes Centre, Gopalapuram, Chennai - 600086",
     "phone": "+91 44 4396 8888", "fee": 700, "rating": 4.8, "reviews": 489,
     "timings": "Mon–Sat: 8AM–6PM", "languages": ["Tamil", "English"],
     "lat": 13.0359, "lng": 80.2464},

# ── VIJAYAWADA (Andhra Pradesh) ──
    {"id": "doc_1601", "name": "Dr. Ramakrishna Rao", "specialization": "Cardiologist",
     "qualification": "MBBS, MD, DM (Cardiology)", "experience": "20 years",
     "clinic": "Andhra Hospitals", "area": "Governorpet", "city": "Vijayawada", "state": "Andhra Pradesh",
     "address": "Andhra Hospitals, Governorpet, Vijayawada - 520002",
     "phone": "+91 866 247 8888", "fee": 800, "rating": 4.8, "reviews": 456,
     "timings": "Mon–Fri: 9AM–1PM, 5PM–7PM", "languages": ["Telugu", "English"],
     "lat": 16.5062, "lng": 80.6480},
    {"id": "doc_1602", "name": "Dr. Sunitha Devi", "specialization": "Gynecologist",
     "qualification": "MBBS, MS (OBG)", "experience": "16 years",
     "clinic": "Manipal Hospital", "area": "Tadepalli", "city": "Vijayawada", "state": "Andhra Pradesh",
     "address": "Manipal Hospital, Tadepalli, Vijayawada - 522501",
     "phone": "+91 866 245 5555", "fee": 700, "rating": 4.8, "reviews": 389,
     "timings": "Mon–Sat: 10AM–1PM, 4PM–7PM", "languages": ["Telugu", "English"],
     "lat": 16.4830, "lng": 80.6100},
    {"id": "doc_1603", "name": "Dr. Prasad Naidu", "specialization": "Orthopedic",
     "qualification": "MBBS, MS (Ortho)", "experience": "15 years",
     "clinic": "Apollo Hospital", "area": "Lingampalli", "city": "Vijayawada", "state": "Andhra Pradesh",
     "address": "Apollo Hospital, Lingampalli, Vijayawada - 521180",
     "phone": "+91 866 244 4444", "fee": 700, "rating": 4.7, "reviews": 312,
     "timings": "Mon–Sat: 9AM–1PM, 5PM–8PM", "languages": ["Telugu", "English"],
     "lat": 16.5193, "lng": 80.5960},
    {"id": "doc_1604", "name": "Dr. Lavanya Reddy", "specialization": "Pediatrician",
     "qualification": "MBBS, MD (Pediatrics)", "experience": "12 years",
     "clinic": "KIMS Hospital", "area": "Siddhartha Nagar", "city": "Vijayawada", "state": "Andhra Pradesh",
     "address": "KIMS Hospital, Siddhartha Nagar, Vijayawada - 520010",
     "phone": "+91 866 246 6666", "fee": 500, "rating": 4.7, "reviews": 278,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Telugu", "English"],
     "lat": 16.5116, "lng": 80.6320},
    {"id": "doc_1605", "name": "Dr. Subrahmanyam", "specialization": "Neurologist",
     "qualification": "MBBS, MD, DM (Neurology)", "experience": "18 years",
     "clinic": "NRI Hospital", "area": "Chinakakani", "city": "Guntur", "state": "Andhra Pradesh",
     "address": "NRI Hospital, Chinakakani, Guntur - 522503",
     "phone": "+91 863 223 4567", "fee": 900, "rating": 4.8, "reviews": 345,
     "timings": "Mon–Fri: 10AM–1PM", "languages": ["Telugu", "English"],
     "lat": 16.3410, "lng": 80.4500},
    {"id": "doc_1606", "name": "Dr. Padmavathi", "specialization": "Dermatologist",
     "qualification": "MBBS, MD (Dermatology)", "experience": "11 years",
     "clinic": "Sri Venkateshwara Hospital", "area": "Tirupati", "city": "Tirupati", "state": "Andhra Pradesh",
     "address": "Sri Venkateshwara Hospital, Tirupati - 517501",
     "phone": "+91 877 222 3456", "fee": 600, "rating": 4.7, "reviews": 267,
     "timings": "Mon–Sat: 10AM–1PM, 4PM–7PM", "languages": ["Telugu", "Tamil", "English"],
     "lat": 13.6288, "lng": 79.4192},
    {"id": "doc_1607", "name": "Dr. Venkata Raman", "specialization": "Gastroenterologist",
     "qualification": "MBBS, MD, DM", "experience": "17 years",
     "clinic": "Visakha Institute of Medical Sciences", "area": "Maharanipeta",
     "city": "Visakhapatnam", "state": "Andhra Pradesh",
     "address": "VIMS, Maharanipeta, Visakhapatnam - 530002",
     "phone": "+91 891 256 7890", "fee": 800, "rating": 4.8, "reviews": 398,
     "timings": "Mon–Fri: 9AM–1PM, 4PM–7PM", "languages": ["Telugu", "English"],
     "lat": 17.7231, "lng": 83.3012},
    {"id": "doc_1608", "name": "Dr. Aparna Krishna", "specialization": "General Physician",
     "qualification": "MBBS, MD", "experience": "14 years",
     "clinic": "Care Hospital", "area": "MVP Colony", "city": "Visakhapatnam", "state": "Andhra Pradesh",
     "address": "Care Hospital, MVP Colony, Visakhapatnam - 530017",
     "phone": "+91 891 278 9012", "fee": 500, "rating": 4.7, "reviews": 334,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Telugu", "English"],
     "lat": 17.7326, "lng": 83.2985},
    {"id": "doc_1609", "name": "Dr. Kiran Kumar", "specialization": "Diabetologist",
     "qualification": "MBBS, MD, FRCP", "experience": "15 years",
     "clinic": "Apollo Hospital", "area": "Waltair Uplands", "city": "Visakhapatnam", "state": "Andhra Pradesh",
     "address": "Apollo Hospital, Waltair Uplands, Visakhapatnam - 530003",
     "phone": "+91 891 256 0000", "fee": 750, "rating": 4.8, "reviews": 412,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Telugu", "English"],
     "lat": 17.7189, "lng": 83.3120},

    # ── MUMBAI (Maharashtra) ──
    {"id": "doc_101", "name": "Dr. Rajesh Mehta", "specialization": "Cardiologist",
     "qualification": "MBBS, MD, DM (Cardiology)", "experience": "22 years",
     "clinic": "Lilavati Hospital", "area": "Bandra", "city": "Mumbai", "state": "Maharashtra",
     "address": "Lilavati Hospital, Bandra West, Mumbai - 400050",
     "phone": "+91 22 2675 1000", "fee": 1200, "rating": 4.9, "reviews": 621,
     "timings": "Mon–Fri: 10AM–2PM, 5PM–8PM", "languages": ["Hindi", "Marathi", "English"],
     "lat": 19.0544, "lng": 72.8322},
    {"id": "doc_102", "name": "Dr. Sunita Patel", "specialization": "Gynecologist",
     "qualification": "MBBS, MS (OBG)", "experience": "18 years",
     "clinic": "Hinduja Hospital", "area": "Mahim", "city": "Mumbai", "state": "Maharashtra",
     "address": "Hinduja Hospital, Mahim, Mumbai - 400016",
     "phone": "+91 22 2445 1515", "fee": 900, "rating": 4.8, "reviews": 445,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Hindi", "Marathi", "English"],
     "lat": 19.0396, "lng": 72.8416},
    {"id": "doc_103", "name": "Dr. Amit Shah", "specialization": "Orthopedic",
     "qualification": "MBBS, MS (Ortho)", "experience": "16 years",
     "clinic": "Kokilaben Hospital", "area": "Andheri", "city": "Mumbai", "state": "Maharashtra",
     "address": "Kokilaben Hospital, Andheri West, Mumbai - 400053",
     "phone": "+91 22 3066 0000", "fee": 1000, "rating": 4.8, "reviews": 389,
     "timings": "Mon–Sat: 9AM–1PM, 5PM–8PM", "languages": ["Hindi", "English"],
     "lat": 19.1136, "lng": 72.8697},
    {"id": "doc_104", "name": "Dr. Priya Desai", "specialization": "Dermatologist",
     "qualification": "MBBS, MD (Dermatology)", "experience": "12 years",
     "clinic": "SkinCare Clinic", "area": "Juhu", "city": "Mumbai", "state": "Maharashtra",
     "address": "SkinCare Clinic, Juhu, Mumbai - 400049",
     "phone": "+91 22 2618 3344", "fee": 800, "rating": 4.7, "reviews": 267,
     "timings": "Mon–Sat: 10AM–1PM, 4PM–7PM", "languages": ["Hindi", "English"],
     "lat": 19.1075, "lng": 72.8263},
    {"id": "doc_105", "name": "Dr. Nikhil Joshi", "specialization": "Neurologist",
     "qualification": "MBBS, MD, DM (Neurology)", "experience": "19 years",
     "clinic": "Jaslok Hospital", "area": "Pedder Road", "city": "Mumbai", "state": "Maharashtra",
     "address": "Jaslok Hospital, Pedder Road, Mumbai - 400026",
     "phone": "+91 22 6657 3333", "fee": 1100, "rating": 4.9, "reviews": 412,
     "timings": "Mon–Fri: 10AM–1PM", "languages": ["Hindi", "English"],
     "lat": 18.9712, "lng": 72.8089},

    # ── DELHI (NCT) ──
    {"id": "doc_201", "name": "Dr. Anil Kumar", "specialization": "General Physician",
     "qualification": "MBBS, MD", "experience": "17 years",
     "clinic": "AIIMS OPD", "area": "Ansari Nagar", "city": "New Delhi", "state": "Delhi",
     "address": "AIIMS, Ansari Nagar, New Delhi - 110029",
     "phone": "+91 11 2658 8500", "fee": 300, "rating": 4.9, "reviews": 892,
     "timings": "Mon–Sat: 8AM–1PM", "languages": ["Hindi", "English"],
     "lat": 28.5672, "lng": 77.2100},
    {"id": "doc_202", "name": "Dr. Meera Singh", "specialization": "Cardiologist",
     "qualification": "MBBS, MD, DM (Cardiology)", "experience": "21 years",
     "clinic": "Fortis Escorts Heart Institute", "area": "Okhla", "city": "New Delhi", "state": "Delhi",
     "address": "Fortis Escorts, Okhla Road, New Delhi - 110025",
     "phone": "+91 11 4713 5000", "fee": 1200, "rating": 4.9, "reviews": 678,
     "timings": "Mon–Fri: 9AM–2PM", "languages": ["Hindi", "English"],
     "lat": 28.5614, "lng": 77.2730},
    {"id": "doc_203", "name": "Dr. Rohit Sharma", "specialization": "Orthopedic",
     "qualification": "MBBS, MS (Ortho)", "experience": "14 years",
     "clinic": "Max Super Speciality Hospital", "area": "Saket", "city": "New Delhi", "state": "Delhi",
     "address": "Max Hospital, Press Enclave Road, Saket, New Delhi - 110017",
     "phone": "+91 11 2651 5050", "fee": 900, "rating": 4.8, "reviews": 356,
     "timings": "Mon–Sat: 9AM–1PM, 5PM–8PM", "languages": ["Hindi", "English"],
     "lat": 28.5274, "lng": 77.2167},
    {"id": "doc_204", "name": "Dr. Pooja Gupta", "specialization": "Pediatrician",
     "qualification": "MBBS, MD (Pediatrics)", "experience": "13 years",
     "clinic": "Apollo Hospital", "area": "Sarita Vihar", "city": "New Delhi", "state": "Delhi",
     "address": "Apollo Hospital, Sarita Vihar, New Delhi - 110076",
     "phone": "+91 11 2692 5858", "fee": 700, "rating": 4.7, "reviews": 423,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Hindi", "English"],
     "lat": 28.5355, "lng": 77.2910},
    {"id": "doc_205", "name": "Dr. Vikram Batra", "specialization": "Gastroenterologist",
     "qualification": "MBBS, MD, DM", "experience": "16 years",
     "clinic": "Sir Ganga Ram Hospital", "area": "Rajinder Nagar", "city": "New Delhi", "state": "Delhi",
     "address": "Sir Ganga Ram Hospital, Rajinder Nagar, New Delhi - 110060",
     "phone": "+91 11 2575 0000", "fee": 1000, "rating": 4.8, "reviews": 312,
     "timings": "Mon–Fri: 10AM–1PM, 5PM–7PM", "languages": ["Hindi", "English"],
     "lat": 28.6394, "lng": 77.1893},

    # ── BENGALURU (Karnataka) ──
    {"id": "doc_301", "name": "Dr. Suresh Reddy", "specialization": "Cardiologist",
     "qualification": "MBBS, MD, DM (Cardiology)", "experience": "20 years",
     "clinic": "Narayana Health", "area": "Bommasandra", "city": "Bengaluru", "state": "Karnataka",
     "address": "Narayana Health, Bommasandra, Bengaluru - 560099",
     "phone": "+91 80 7122 2222", "fee": 900, "rating": 4.9, "reviews": 534,
     "timings": "Mon–Fri: 9AM–2PM", "languages": ["Kannada", "Telugu", "English"],
     "lat": 12.8082, "lng": 77.6975},
    {"id": "doc_302", "name": "Dr. Kavya Nair", "specialization": "Dermatologist",
     "qualification": "MBBS, MD (Dermatology)", "experience": "10 years",
     "clinic": "Manipal Hospital", "area": "HAL", "city": "Bengaluru", "state": "Karnataka",
     "address": "Manipal Hospital, HAL Airport Road, Bengaluru - 560017",
     "phone": "+91 80 2502 4444", "fee": 700, "rating": 4.7, "reviews": 298,
     "timings": "Mon–Sat: 10AM–1PM, 4PM–7PM", "languages": ["Kannada", "English"],
     "lat": 12.9591, "lng": 77.6473},
    {"id": "doc_303", "name": "Dr. Ravi Shankar", "specialization": "Neurologist",
     "qualification": "MBBS, MD, DM (Neurology)", "experience": "18 years",
     "clinic": "Fortis Hospital", "area": "Bannerghatta Road", "city": "Bengaluru", "state": "Karnataka",
     "address": "Fortis Hospital, Bannerghatta Road, Bengaluru - 560076",
     "phone": "+91 80 6621 4444", "fee": 1000, "rating": 4.8, "reviews": 367,
     "timings": "Mon–Fri: 10AM–1PM", "languages": ["Kannada", "Hindi", "English"],
     "lat": 12.8884, "lng": 77.5969},
    {"id": "doc_304", "name": "Dr. Anita Rao", "specialization": "Gynecologist",
     "qualification": "MBBS, MS (OBG)", "experience": "15 years",
     "clinic": "Columbia Asia Hospital", "area": "Hebbal", "city": "Bengaluru", "state": "Karnataka",
     "address": "Columbia Asia Hospital, Hebbal, Bengaluru - 560024",
     "phone": "+91 80 4069 4000", "fee": 800, "rating": 4.8, "reviews": 412,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Kannada", "English"],
     "lat": 13.0358, "lng": 77.5970},
    {"id": "doc_305", "name": "Dr. Prasad Kumar", "specialization": "Orthopedic",
     "qualification": "MBBS, MS (Ortho)", "experience": "17 years",
     "clinic": "Apollo Hospital", "area": "Bannerghatta", "city": "Bengaluru", "state": "Karnataka",
     "address": "Apollo Hospital, Bannerghatta Road, Bengaluru - 560076",
     "phone": "+91 80 2630 4050", "fee": 900, "rating": 4.7, "reviews": 334,
     "timings": "Mon–Sat: 9AM–1PM, 5PM–8PM", "languages": ["Kannada", "Telugu", "English"],
     "lat": 12.8733, "lng": 77.5969},

    # ── HYDERABAD (Telangana) ──
    {"id": "doc_401", "name": "Dr. Venkat Rao", "specialization": "Cardiologist",
     "qualification": "MBBS, MD, DM (Cardiology)", "experience": "22 years",
     "clinic": "CARE Hospitals", "area": "Banjara Hills", "city": "Hyderabad", "state": "Telangana",
     "address": "CARE Hospitals, Banjara Hills, Hyderabad - 500034",
     "phone": "+91 40 3041 8888", "fee": 1000, "rating": 4.9, "reviews": 589,
     "timings": "Mon–Fri: 9AM–2PM", "languages": ["Telugu", "Hindi", "English"],
     "lat": 17.4156, "lng": 78.4347},
    {"id": "doc_402", "name": "Dr. Lakshmi Prasad", "specialization": "Diabetologist",
     "qualification": "MBBS, MD, FRCP", "experience": "16 years",
     "clinic": "Apollo Hospital", "area": "Jubilee Hills", "city": "Hyderabad", "state": "Telangana",
     "address": "Apollo Hospital, Jubilee Hills, Hyderabad - 500033",
     "phone": "+91 40 2360 7777", "fee": 800, "rating": 4.8, "reviews": 445,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Telugu", "English"],
     "lat": 17.4318, "lng": 78.4071},
    {"id": "doc_403", "name": "Dr. Srinivas Reddy", "specialization": "Orthopedic",
     "qualification": "MBBS, MS (Ortho)", "experience": "14 years",
     "clinic": "Yashoda Hospital", "area": "Secunderabad", "city": "Hyderabad", "state": "Telangana",
     "address": "Yashoda Hospital, Secunderabad, Hyderabad - 500003",
     "phone": "+91 40 4567 4567", "fee": 700, "rating": 4.7, "reviews": 312,
     "timings": "Mon–Sat: 9AM–1PM, 5PM–8PM", "languages": ["Telugu", "Hindi", "English"],
     "lat": 17.4399, "lng": 78.4983},
    {"id": "doc_404", "name": "Dr. Padma Reddy", "specialization": "Gynecologist",
     "qualification": "MBBS, MS (OBG)", "experience": "19 years",
     "clinic": "Fernandez Hospital", "area": "Bogulkunta", "city": "Hyderabad", "state": "Telangana",
     "address": "Fernandez Hospital, Bogulkunta, Hyderabad - 500001",
     "phone": "+91 40 4023 4488", "fee": 850, "rating": 4.9, "reviews": 567,
     "timings": "Mon–Sat: 10AM–1PM, 4PM–7PM", "languages": ["Telugu", "English"],
     "lat": 17.3924, "lng": 78.4740},

    # ── KOLKATA (West Bengal) ──
    {"id": "doc_501", "name": "Dr. Subhash Ghosh", "specialization": "Cardiologist",
     "qualification": "MBBS, MD, DM (Cardiology)", "experience": "24 years",
     "clinic": "AMRI Hospital", "area": "Dhakuria", "city": "Kolkata", "state": "West Bengal",
     "address": "AMRI Hospital, Dhakuria, Kolkata - 700031",
     "phone": "+91 33 6680 0000", "fee": 900, "rating": 4.9, "reviews": 612,
     "timings": "Mon–Fri: 9AM–1PM", "languages": ["Bengali", "Hindi", "English"],
     "lat": 22.5092, "lng": 88.3635},
    {"id": "doc_502", "name": "Dr. Ritu Banerjee", "specialization": "Gynecologist",
     "qualification": "MBBS, MS (OBG)", "experience": "17 years",
     "clinic": "Fortis Hospital", "area": "Anandapur", "city": "Kolkata", "state": "West Bengal",
     "address": "Fortis Hospital, Anandapur, Kolkata - 700107",
     "phone": "+91 33 6628 4444", "fee": 800, "rating": 4.8, "reviews": 423,
     "timings": "Mon–Sat: 10AM–1PM, 4PM–7PM", "languages": ["Bengali", "English"],
     "lat": 22.5176, "lng": 88.3983},
    {"id": "doc_503", "name": "Dr. Amit Chakraborty", "specialization": "Neurologist",
     "qualification": "MBBS, MD, DM (Neurology)", "experience": "20 years",
     "clinic": "Apollo Gleneagles", "area": "Canal Circular Road", "city": "Kolkata", "state": "West Bengal",
     "address": "Apollo Gleneagles, Canal Circular Road, Kolkata - 700054",
     "phone": "+91 33 2320 3040", "fee": 1000, "rating": 4.8, "reviews": 356,
     "timings": "Mon–Fri: 10AM–1PM, 5PM–7PM", "languages": ["Bengali", "Hindi", "English"],
     "lat": 22.5726, "lng": 88.3832},
    {"id": "doc_504", "name": "Dr. Sanjay Das", "specialization": "General Physician",
     "qualification": "MBBS, MD", "experience": "15 years",
     "clinic": "Medica Superspecialty Hospital", "area": "Mukundapur", "city": "Kolkata", "state": "West Bengal",
     "address": "Medica Hospital, Mukundapur, Kolkata - 700099",
     "phone": "+91 33 6652 0000", "fee": 500, "rating": 4.7, "reviews": 389,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Bengali", "Hindi", "English"],
     "lat": 22.4955, "lng": 88.3893},

    # ── AHMEDABAD (Gujarat) ──
    {"id": "doc_601", "name": "Dr. Hardik Patel", "specialization": "Cardiologist",
     "qualification": "MBBS, MD, DM (Cardiology)", "experience": "18 years",
     "clinic": "UN Mehta Heart Institute", "area": "Civil Hospital", "city": "Ahmedabad", "state": "Gujarat",
     "address": "UN Mehta Institute, Civil Hospital Campus, Ahmedabad - 380016",
     "phone": "+91 79 2268 4321", "fee": 800, "rating": 4.9, "reviews": 534,
     "timings": "Mon–Fri: 9AM–1PM", "languages": ["Gujarati", "Hindi", "English"],
     "lat": 23.0395, "lng": 72.5869},
    {"id": "doc_602", "name": "Dr. Priti Shah", "specialization": "Pediatrician",
     "qualification": "MBBS, MD (Pediatrics)", "experience": "14 years",
     "clinic": "Sterling Hospital", "area": "Gurukul", "city": "Ahmedabad", "state": "Gujarat",
     "address": "Sterling Hospital, Gurukul Road, Ahmedabad - 380052",
     "phone": "+91 79 4000 4000", "fee": 600, "rating": 4.8, "reviews": 412,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Gujarati", "Hindi", "English"],
     "lat": 23.0469, "lng": 72.5520},
    {"id": "doc_603", "name": "Dr. Bhavesh Mehta", "specialization": "Orthopedic",
     "qualification": "MBBS, MS (Ortho)", "experience": "16 years",
     "clinic": "Apollo Hospital", "area": "Bhat", "city": "Ahmedabad", "state": "Gujarat",
     "address": "Apollo Hospital, Bhat, Ahmedabad - 382428",
     "phone": "+91 79 6670 1800", "fee": 700, "rating": 4.7, "reviews": 289,
     "timings": "Mon–Sat: 9AM–1PM, 5PM–8PM", "languages": ["Gujarati", "Hindi", "English"],
     "lat": 23.1136, "lng": 72.5678},

    # ── PUNE (Maharashtra) ──
    {"id": "doc_701", "name": "Dr. Santosh Kulkarni", "specialization": "General Physician",
     "qualification": "MBBS, MD", "experience": "16 years",
     "clinic": "Ruby Hall Clinic", "area": "Wanowrie", "city": "Pune", "state": "Maharashtra",
     "address": "Ruby Hall Clinic, Wanowrie, Pune - 411040",
     "phone": "+91 20 2616 3391", "fee": 600, "rating": 4.8, "reviews": 445,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Marathi", "Hindi", "English"],
     "lat": 18.4936, "lng": 73.9003},
    {"id": "doc_702", "name": "Dr. Sneha Joshi", "specialization": "Gynecologist",
     "qualification": "MBBS, MS (OBG)", "experience": "14 years",
     "clinic": "Jehangir Hospital", "area": "Sassoon Road", "city": "Pune", "state": "Maharashtra",
     "address": "Jehangir Hospital, Sassoon Road, Pune - 411001",
     "phone": "+91 20 6681 2222", "fee": 750, "rating": 4.8, "reviews": 389,
     "timings": "Mon–Sat: 10AM–1PM, 4PM–7PM", "languages": ["Marathi", "Hindi", "English"],
     "lat": 18.5204, "lng": 73.8567},
    {"id": "doc_703", "name": "Dr. Rahul Deshpande", "specialization": "Cardiologist",
     "qualification": "MBBS, MD, DM (Cardiology)", "experience": "19 years",
     "clinic": "Deenanath Mangeshkar Hospital", "area": "Erandwane", "city": "Pune", "state": "Maharashtra",
     "address": "Deenanath Mangeshkar Hospital, Erandwane, Pune - 411004",
     "phone": "+91 20 4015 1000", "fee": 950, "rating": 4.9, "reviews": 512,
     "timings": "Mon–Fri: 9AM–1PM", "languages": ["Marathi", "Hindi", "English"],
     "lat": 18.5089, "lng": 73.8259},

    # ── JAIPUR (Rajasthan) ──
    {"id": "doc_801", "name": "Dr. Mahesh Sharma", "specialization": "General Physician",
     "qualification": "MBBS, MD", "experience": "15 years",
     "clinic": "Fortis Escorts Hospital", "area": "Malviya Nagar", "city": "Jaipur", "state": "Rajasthan",
     "address": "Fortis Escorts, Malviya Nagar, Jaipur - 302017",
     "phone": "+91 141 254 7000", "fee": 500, "rating": 4.7, "reviews": 334,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Hindi", "Rajasthani", "English"],
     "lat": 26.8579, "lng": 75.8063},
    {"id": "doc_802", "name": "Dr. Rekha Agarwal", "specialization": "Gynecologist",
     "qualification": "MBBS, MS (OBG)", "experience": "16 years",
     "clinic": "Santokba Durlabhji Hospital", "area": "Bhawani Singh Road", "city": "Jaipur", "state": "Rajasthan",
     "address": "Santokba Durlabhji Hospital, Bhawani Singh Marg, Jaipur - 302015",
     "phone": "+91 141 256 6251", "fee": 700, "rating": 4.8, "reviews": 378,
     "timings": "Mon–Sat: 10AM–1PM, 4PM–7PM", "languages": ["Hindi", "English"],
     "lat": 26.8927, "lng": 75.8055},
    {"id": "doc_803", "name": "Dr. Ajay Mathur", "specialization": "Cardiologist",
     "qualification": "MBBS, MD, DM (Cardiology)", "experience": "20 years",
     "clinic": "Narayana Multispeciality Hospital", "area": "Sodala", "city": "Jaipur", "state": "Rajasthan",
     "address": "Narayana Hospital, Sodala, Jaipur - 302006",
     "phone": "+91 141 477 3777", "fee": 900, "rating": 4.8, "reviews": 423,
     "timings": "Mon–Fri: 9AM–1PM", "languages": ["Hindi", "English"],
     "lat": 26.9124, "lng": 75.7873},

    # ── LUCKNOW (Uttar Pradesh) ──
    {"id": "doc_901", "name": "Dr. Vinod Mishra", "specialization": "General Physician",
     "qualification": "MBBS, MD", "experience": "17 years",
     "clinic": "Medanta Hospital", "area": "Sushant Golf City", "city": "Lucknow", "state": "Uttar Pradesh",
     "address": "Medanta Hospital, Sushant Golf City, Lucknow - 226030",
     "phone": "+91 522 4500 000", "fee": 600, "rating": 4.8, "reviews": 412,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Hindi", "English"],
     "lat": 26.7606, "lng": 80.9467},
    {"id": "doc_902", "name": "Dr. Priya Srivastava", "specialization": "Pediatrician",
     "qualification": "MBBS, MD (Pediatrics)", "experience": "13 years",
     "clinic": "SGPGI", "area": "Raebareli Road", "city": "Lucknow", "state": "Uttar Pradesh",
     "address": "SGPGI, Raebareli Road, Lucknow - 226014",
     "phone": "+91 522 2668 700", "fee": 400, "rating": 4.9, "reviews": 589,
     "timings": "Mon–Sat: 8AM–1PM", "languages": ["Hindi", "English"],
     "lat": 26.7251, "lng": 80.9798},

    # ── BHOPAL (Madhya Pradesh) ──
    {"id": "doc_1001", "name": "Dr. Sunil Tiwari", "specialization": "General Physician",
     "qualification": "MBBS, MD", "experience": "14 years",
     "clinic": "Bansal Hospital", "area": "Shahpura", "city": "Bhopal", "state": "Madhya Pradesh",
     "address": "Bansal Hospital, Shahpura, Bhopal - 462016",
     "phone": "+91 755 422 0000", "fee": 500, "rating": 4.7, "reviews": 312,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Hindi", "English"],
     "lat": 23.1815, "lng": 77.4377},
    {"id": "doc_1002", "name": "Dr. Kavita Dubey", "specialization": "Gynecologist",
     "qualification": "MBBS, MS (OBG)", "experience": "15 years",
     "clinic": "Peoples Hospital", "area": "Bhanpur", "city": "Bhopal", "state": "Madhya Pradesh",
     "address": "Peoples Hospital, Bhanpur, Bhopal - 462037",
     "phone": "+91 755 409 9999", "fee": 600, "rating": 4.7, "reviews": 289,
     "timings": "Mon–Sat: 10AM–1PM, 4PM–7PM", "languages": ["Hindi", "English"],
     "lat": 23.2599, "lng": 77.4126},

    # ── PATNA (Bihar) ──
    {"id": "doc_1101", "name": "Dr. Rajan Kumar", "specialization": "General Physician",
     "qualification": "MBBS, MD", "experience": "16 years",
     "clinic": "Paras HMRI Hospital", "area": "Raja Bazaar", "city": "Patna", "state": "Bihar",
     "address": "Paras HMRI Hospital, Raja Bazaar, Patna - 800014",
     "phone": "+91 612 303 3333", "fee": 500, "rating": 4.7, "reviews": 334,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Hindi", "Bhojpuri", "English"],
     "lat": 25.6093, "lng": 85.1376},
    {"id": "doc_1102", "name": "Dr. Anjali Singh", "specialization": "Pediatrician",
     "qualification": "MBBS, MD (Pediatrics)", "experience": "12 years",
     "clinic": "Ruban Memorial Hospital", "area": "Boring Road", "city": "Patna", "state": "Bihar",
     "address": "Ruban Memorial Hospital, Boring Road, Patna - 800001",
     "phone": "+91 612 255 0000", "fee": 450, "rating": 4.6, "reviews": 278,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Hindi", "English"],
     "lat": 25.6214, "lng": 85.1040},

    # ── CHANDIGARH (Punjab/Haryana) ──
    {"id": "doc_1201", "name": "Dr. Gurpreet Singh", "specialization": "Cardiologist",
     "qualification": "MBBS, MD, DM (Cardiology)", "experience": "19 years",
     "clinic": "PGI Chandigarh", "area": "Sector 12", "city": "Chandigarh", "state": "Chandigarh",
     "address": "PGIMER, Sector 12, Chandigarh - 160012",
     "phone": "+91 172 275 6565", "fee": 300, "rating": 4.9, "reviews": 756,
     "timings": "Mon–Sat: 8AM–1PM", "languages": ["Punjabi", "Hindi", "English"],
     "lat": 30.7650, "lng": 76.7765},
    {"id": "doc_1202", "name": "Dr. Simran Kaur", "specialization": "Dermatologist",
     "qualification": "MBBS, MD (Dermatology)", "experience": "11 years",
     "clinic": "Fortis Hospital", "area": "Sector 62", "city": "Chandigarh", "state": "Chandigarh",
     "address": "Fortis Hospital, Sector 62, Mohali - 160062",
     "phone": "+91 172 469 2222", "fee": 700, "rating": 4.7, "reviews": 267,
     "timings": "Mon–Sat: 10AM–1PM, 4PM–7PM", "languages": ["Punjabi", "Hindi", "English"],
     "lat": 30.7128, "lng": 76.6884},

    # ── KOCHI (Kerala) ──
    {"id": "doc_1301", "name": "Dr. Thomas Mathew", "specialization": "Cardiologist",
     "qualification": "MBBS, MD, DM (Cardiology)", "experience": "21 years",
     "clinic": "Amrita Institute of Medical Sciences", "area": "Ponekkara", "city": "Kochi", "state": "Kerala",
     "address": "Amrita Hospital, Ponekkara, Kochi - 682041",
     "phone": "+91 484 280 1234", "fee": 900, "rating": 4.9, "reviews": 589,
     "timings": "Mon–Fri: 9AM–1PM", "languages": ["Malayalam", "English"],
     "lat": 10.0261, "lng": 76.3125},
    {"id": "doc_1302", "name": "Dr. Lekha Nair", "specialization": "Gynecologist",
     "qualification": "MBBS, MS (OBG)", "experience": "16 years",
     "clinic": "Lakeshore Hospital", "area": "NH Bypass", "city": "Kochi", "state": "Kerala",
     "address": "Lakeshore Hospital, NH Bypass, Kochi - 682040",
     "phone": "+91 484 270 3031", "fee": 750, "rating": 4.8, "reviews": 423,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Malayalam", "English"],
     "lat": 9.9816, "lng": 76.2999},
    {"id": "doc_1303", "name": "Dr. Biju Varghese", "specialization": "Orthopedic",
     "qualification": "MBBS, MS (Ortho)", "experience": "14 years",
     "clinic": "Medical Trust Hospital", "area": "MG Road", "city": "Kochi", "state": "Kerala",
     "address": "Medical Trust Hospital, MG Road, Kochi - 682016",
     "phone": "+91 484 235 8001", "fee": 700, "rating": 4.7, "reviews": 312,
     "timings": "Mon–Sat: 9AM–1PM, 5PM–8PM", "languages": ["Malayalam", "English"],
     "lat": 9.9312, "lng": 76.2673},

    # ── BHUBANESWAR (Odisha) ──
    {"id": "doc_1401", "name": "Dr. Subrat Mohanty", "specialization": "General Physician",
     "qualification": "MBBS, MD", "experience": "15 years",
     "clinic": "Apollo Hospital", "area": "Sainik School Road", "city": "Bhubaneswar", "state": "Odisha",
     "address": "Apollo Hospital, Sainik School Road, Bhubaneswar - 751005",
     "phone": "+91 674 660 1066", "fee": 500, "rating": 4.7, "reviews": 334,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Odia", "Hindi", "English"],
     "lat": 20.2961, "lng": 85.8245},
    {"id": "doc_1402", "name": "Dr. Sasmita Panda", "specialization": "Gynecologist",
     "qualification": "MBBS, MS (OBG)", "experience": "13 years",
     "clinic": "Care Hospital", "area": "Chandrasekharpur", "city": "Bhubaneswar", "state": "Odisha",
     "address": "Care Hospital, Chandrasekharpur, Bhubaneswar - 751016",
     "phone": "+91 674 230 1400", "fee": 600, "rating": 4.7, "reviews": 289,
     "timings": "Mon–Sat: 10AM–1PM, 4PM–7PM", "languages": ["Odia", "Hindi", "English"],
     "lat": 20.3380, "lng": 85.8245},

    # ── GUWAHATI (Assam) ──
    {"id": "doc_1501", "name": "Dr. Bipul Bora", "specialization": "General Physician",
     "qualification": "MBBS, MD", "experience": "14 years",
     "clinic": "Gauhati Medical College", "area": "Bhangagarh", "city": "Guwahati", "state": "Assam",
     "address": "GMCH, Bhangagarh, Guwahati - 781032",
     "phone": "+91 361 252 9457", "fee": 300, "rating": 4.7, "reviews": 389,
     "timings": "Mon–Sat: 8AM–1PM", "languages": ["Assamese", "Hindi", "English"],
     "lat": 26.1847, "lng": 91.7362},
    {"id": "doc_1502", "name": "Dr. Priya Goswami", "specialization": "Pediatrician",
     "qualification": "MBBS, MD (Pediatrics)", "experience": "12 years",
     "clinic": "Nemcare Hospital", "area": "Bhangagarh", "city": "Guwahati", "state": "Assam",
     "address": "Nemcare Hospital, GNB Road, Guwahati - 781005",
     "phone": "+91 361 246 0022", "fee": 500, "rating": 4.6, "reviews": 267,
     "timings": "Mon–Sat: 9AM–1PM, 4PM–7PM", "languages": ["Assamese", "Hindi", "English"],
     "lat": 26.1723, "lng": 91.7458},
]

SYMPTOM_TO_SPEC = {
    "fever": "General Physician", "cold": "General Physician",
    "cough": "General Physician", "headache": "General Physician",
    "chest pain": "Cardiologist", "heart": "Cardiologist",
    "rash": "Dermatologist", "skin": "Dermatologist",
    "ear": "ENT Specialist", "throat": "ENT Specialist",
    "back pain": "Orthopedic", "joint": "Orthopedic",
    "migraine": "Neurologist", "seizure": "Neurologist",
    "child": "Pediatrician", "baby": "Pediatrician",
    "stomach": "Gastroenterologist", "diabetes": "Diabetologist",
    "gynecology": "Gynecologist", "pregnancy": "Gynecologist",
}


def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return round(R * 2 * math.asin(math.sqrt(a)), 1)


@router.get("/nearby")
async def nearby_doctors(
    lat: float = Query(20.5937),
    lng: float = Query(78.9629),
    specialization: str = Query("All"),
    radius: int = Query(5000000, le=10000000),
    city: str = Query("All"),
    state: str = Query("All"),
    token: dict = Depends(verify_token),
):
    results = []

    for doc in ALL_INDIA_DOCTORS:
        dist = haversine(lat, lng, doc["lat"], doc["lng"])

        if dist <= radius / 1000:
            if specialization == "All" or doc["specialization"] == specialization:
                if city == "All" or doc["city"].lower() == city.lower():
                    if state == "All" or doc["state"].lower() == state.lower():
                        results.append({**doc, "distance": dist})

    return {
        "doctors": sorted(results, key=lambda x: x["distance"]),
        "total": len(results)
    }


@router.get("/all")
async def get_all_doctors(
    token: dict = Depends(verify_token),
):
    return {
        "doctors": ALL_INDIA_DOCTORS,
        "total": len(ALL_INDIA_DOCTORS)
    }


@router.get("/suggest")
async def suggest_doctors(
    symptoms: str = Query(""),
    token: dict = Depends(verify_token),
):
    lower = symptoms.lower()
    spec = "General Physician"
    for keyword, s in SYMPTOM_TO_SPEC.items():
        if keyword in lower:
            spec = s
            break
    doctors = [d for d in ALL_INDIA_DOCTORS if d["specialization"] == spec]
    if not doctors:
        doctors = [d for d in ALL_INDIA_DOCTORS if d["specialization"] == "General Physician"]
    return {"specialization": spec, "doctors": doctors, "total": len(doctors)}


@router.get("/cities")
async def get_cities():
    cities = sorted(list(set(d["city"] for d in ALL_INDIA_DOCTORS)))
    return {"cities": ["All"] + cities}


@router.get("/states")
async def get_states():
    states = sorted(list(set(d["state"] for d in ALL_INDIA_DOCTORS)))
    return {"states": ["All"] + states}


@router.get("/specializations")
async def get_specializations():
    return {
        "specializations": [
            "All", "General Physician", "Cardiologist", "Dermatologist",
            "ENT Specialist", "Orthopedic", "Neurologist", "Pediatrician",
            "Gynecologist", "Gastroenterologist", "Diabetologist",
        ]
    }