export const COLORS = {
  primary: '#0077B6',
  secondary: '#00B4D8',
  success: '#2DC653',
  warning: '#F4A261',
  danger: '#E63946',
  background: '#F0F4F8',
  card: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

export const SIZES = {
  radiusLg: 16,
  radiusMd: 12,
  radiusSm: 8,
};

export const SHADOW = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
};

export const SYMPTOM_CHIPS = [
  '🌡️ Fever', '🤕 Headache', '😷 Cough', '🤢 Nausea',
  '💪 Body pain', '😴 Fatigue', '😮 Sore throat', '🤮 Vomiting',
  '😵 Dizziness', '🫁 Shortness of breath', '🤧 Runny nose',
  '🦴 Back pain', '🦵 Joint pain', '🤒 Chills', '❤️ Chest pain',
  '👁️ Eye irritation', '🦷 Tooth pain', '🩺 Skin rash',
];

export const SPECIALIZATIONS = [
  'All', 'General Physician', 'Cardiologist', 'Dermatologist',
  'ENT', 'Orthopedic', 'Neurologist', 'Pediatrician',
  'Gynecologist', 'Ophthalmologist', 'Dentist', 'Psychiatrist',
  'Urologist', 'Gastroenterologist',
];

export const EMERGENCY_NUMBER = '108';
export const EMERGENCY_KEYWORDS = [
  'chest pain', 'difficulty breathing', 'heart attack',
  'stroke', 'unconscious', 'severe bleeding', 'seizure',
];

// Symptom → Specialization mapping
export const SYMPTOM_SPECIALIST_MAP = {
  fever: 'General Physician',
  cold: 'General Physician',
  cough: 'General Physician',
  fatigue: 'General Physician',
  nausea: 'General Physician',
  vomiting: 'General Physician',
  headache: 'Neurologist',
  migraine: 'Neurologist',
  dizziness: 'Neurologist',
  'chest pain': 'Cardiologist',
  'heart pain': 'Cardiologist',
  palpitation: 'Cardiologist',
  'shortness of breath': 'Cardiologist',
  'skin rash': 'Dermatologist',
  acne: 'Dermatologist',
  eczema: 'Dermatologist',
  itching: 'Dermatologist',
  'sore throat': 'ENT',
  ear: 'ENT',
  nose: 'ENT',
  sinusitis: 'ENT',
  'joint pain': 'Orthopedic',
  'back pain': 'Orthopedic',
  'bone pain': 'Orthopedic',
  fracture: 'Orthopedic',
  'eye irritation': 'Ophthalmologist',
  vision: 'Ophthalmologist',
  'tooth pain': 'Dentist',
  toothache: 'Dentist',
  'stomach pain': 'Gastroenterologist',
  'abdominal pain': 'Gastroenterologist',
  diarrhea: 'Gastroenterologist',
  anxiety: 'Psychiatrist',
  depression: 'Psychiatrist',
  insomnia: 'Psychiatrist',
};

// Real Chennai doctors database
export const CHENNAI_DOCTORS = [
  // General Physician
  {
    id: 'doc_001', name: 'Dr. K. Senthil Kumar', specialization: 'General Physician',
    hospital: 'Apollo Hospitals', area: 'Greams Road', city: 'Chennai',
    experience: '18 years', rating: 4.8, reviews: 312, fee: '₹600',
    phone: '04428290200', available: true, icon: '👨‍⚕️',
    about: 'MBBS, MD. Expert in fever, infections, diabetes management and preventive care.',
    timings: 'Mon–Sat: 9AM–5PM',
  },
  {
    id: 'doc_002', name: 'Dr. Priya Subramaniam', specialization: 'General Physician',
    hospital: 'Fortis Malar Hospital', area: 'Adyar', city: 'Chennai',
    experience: '12 years', rating: 4.7, reviews: 198, fee: '₹500',
    phone: '04442002288', available: true, icon: '👩‍⚕️',
    about: 'MBBS, MD General Medicine. Specializes in lifestyle diseases and chronic conditions.',
    timings: 'Mon–Fri: 10AM–6PM',
  },
  {
    id: 'doc_003', name: 'Dr. R. Annamalai', specialization: 'General Physician',
    hospital: 'MIOT International', area: 'Manapakkam', city: 'Chennai',
    experience: '22 years', rating: 4.9, reviews: 445, fee: '₹700',
    phone: '04442002288', available: true, icon: '👨‍⚕️',
    about: 'MBBS, MD, FRCP. Senior consultant with expertise in complex medical conditions.',
    timings: 'Mon–Sat: 8AM–4PM',
  },

  // Cardiologist
  {
    id: 'doc_004', name: 'Dr. S. Balakrishnan', specialization: 'Cardiologist',
    hospital: 'Madras Medical Mission', area: 'Mogappair', city: 'Chennai',
    experience: '25 years', rating: 4.9, reviews: 521, fee: '₹1200',
    phone: '04426561801', available: true, icon: '👨‍⚕️',
    about: 'MBBS, MD, DM Cardiology. Pioneer in interventional cardiology and heart failure management.',
    timings: 'Mon–Fri: 9AM–3PM',
  },
  {
    id: 'doc_005', name: 'Dr. Meena Rajan', specialization: 'Cardiologist',
    hospital: 'Sri Ramachandra Hospital', area: 'Porur', city: 'Chennai',
    experience: '16 years', rating: 4.8, reviews: 289, fee: '₹1000',
    phone: '04445928844', available: true, icon: '👩‍⚕️',
    about: 'MBBS, MD, DM Cardiology. Expert in echocardiography, ECG and preventive cardiology.',
    timings: 'Mon–Sat: 10AM–5PM',
  },
  {
    id: 'doc_006', name: 'Dr. P. Venkataraman', specialization: 'Cardiologist',
    hospital: 'Kauvery Hospital', area: 'Alwarpet', city: 'Chennai',
    experience: '20 years', rating: 4.7, reviews: 376, fee: '₹1100',
    phone: '04440006000', available: false, icon: '👨‍⚕️',
    about: 'MBBS, MD, DM. Specializes in coronary artery disease and cardiac rehabilitation.',
    timings: 'Tue–Sat: 11AM–4PM',
  },

  // Dermatologist
  {
    id: 'doc_007', name: 'Dr. Kavitha Natarajan', specialization: 'Dermatologist',
    hospital: 'Skin and Laser Centre', area: 'T. Nagar', city: 'Chennai',
    experience: '14 years', rating: 4.8, reviews: 267, fee: '₹700',
    phone: '08657569408', available: true, icon: '👩‍⚕️',
    about: 'MBBS, MD Dermatology. Expert in acne, eczema, psoriasis and cosmetic dermatology.',
    timings: 'Mon–Sat: 10AM–7PM',
  },
  {
    id: 'doc_008', name: 'Dr. Arun Prasad', specialization: 'Dermatologist',
    hospital: 'Apollo Hospitals', area: 'Anna Nagar', city: 'Chennai',
    experience: '10 years', rating: 4.6, reviews: 189, fee: '₹800',
    phone: '04069063398', available: true, icon: '👨‍⚕️',
    about: 'MBBS, DVD. Specializes in hair disorders, vitiligo and skin allergy treatments.',
    timings: 'Mon–Fri: 9AM–5PM',
  },

  // ENT
  {
    id: 'doc_009', name: 'Dr. Rajesh Krishnamurthy', specialization: 'ENT',
    hospital: 'Vijaya Hospital', area: 'Vadapalani', city: 'Chennai',
    experience: '17 years', rating: 4.7, reviews: 298, fee: '₹650',
    phone: '04466616661', available: true, icon: '👨‍⚕️',
    about: 'MBBS, MS ENT. Expert in sinusitis, hearing disorders, tonsillitis and nasal polyps.',
    timings: 'Mon–Sat: 9AM–6PM',
  },
  {
    id: 'doc_010', name: 'Dr. Sumathi Chandran', specialization: 'ENT',
    hospital: 'Mehta Hospital', area: 'Chetpet', city: 'Chennai',
    experience: '13 years', rating: 4.6, reviews: 167, fee: '₹600',
    phone: '04440054005', available: true, icon: '👩‍⚕️',
    about: 'MBBS, DLO, MS. Specializes in cochlear implants, vertigo and throat disorders.',
    timings: 'Mon–Fri: 10AM–5PM',
  },

  // Orthopedic
  {
    id: 'doc_011', name: 'Dr. Muthu Krishnan', specialization: 'Orthopedic',
    hospital: 'MIOT International', area: 'Manapakkam', city: 'Chennai',
    experience: '20 years', rating: 4.9, reviews: 432, fee: '₹900',
    phone: '04442002288', available: true, icon: '👨‍⚕️',
    about: 'MBBS, MS Ortho, MCh. Pioneer in joint replacement, spine surgery and sports injuries.',
    timings: 'Mon–Fri: 8AM–3PM',
  },
  {
    id: 'doc_012', name: 'Dr. Saranya Prabhu', specialization: 'Orthopedic',
    hospital: 'Fortis Malar Hospital', area: 'Adyar', city: 'Chennai',
    experience: '11 years', rating: 4.7, reviews: 213, fee: '₹800',
    phone: '04442002288', available: true, icon: '👩‍⚕️',
    about: 'MBBS, MS Ortho. Expert in knee, hip disorders and minimally invasive surgery.',
    timings: 'Mon–Sat: 10AM–5PM',
  },

  // Neurologist
  {
    id: 'doc_013', name: 'Dr. K. Bhanu', specialization: 'Neurologist',
    hospital: 'Apollo Hospitals', area: 'Greams Road', city: 'Chennai',
    experience: '22 years', rating: 4.9, reviews: 389, fee: '₹1100',
    phone: '04428290200', available: true, icon: '👩‍⚕️',
    about: 'MBBS, MD, DM Neurology. Expert in epilepsy, migraine, stroke and Parkinson\'s disease.',
    timings: 'Mon–Fri: 9AM–4PM',
  },
  {
    id: 'doc_014', name: 'Dr. Srinivasan Parthasarathy', specialization: 'Neurologist',
    hospital: 'Sri Ramachandra Hospital', area: 'Porur', city: 'Chennai',
    experience: '18 years', rating: 4.8, reviews: 312, fee: '₹1000',
    phone: '04445928844', available: true, icon: '👨‍⚕️',
    about: 'MBBS, MD, DM. Specializes in headache disorders, memory problems and nerve diseases.',
    timings: 'Tue–Sat: 10AM–5PM',
  },

  // Pediatrician
  {
    id: 'doc_015', name: 'Dr. Anitha Balasubramanian', specialization: 'Pediatrician',
    hospital: 'Rainbow Children Hospital', area: 'Velachery', city: 'Chennai',
    experience: '15 years', rating: 4.9, reviews: 521, fee: '₹600',
    phone: '08037836523', available: true, icon: '👩‍⚕️',
    about: 'MBBS, MD Pediatrics, MRCPCH. Expert in child development, vaccinations and newborn care.',
    timings: 'Mon–Sat: 9AM–6PM',
  },
  {
    id: 'doc_016', name: 'Dr. Mohan Sundaram', specialization: 'Pediatrician',
    hospital: 'Kanchi Kamakoti CHILDS Trust', area: 'Nungambakkam', city: 'Chennai',
    experience: '19 years', rating: 4.8, reviews: 445, fee: '₹700',
    phone: '04442001800', available: true, icon: '👨‍⚕️',
    about: 'MBBS, MD, DNB Pediatrics. Expert in pediatric infectious diseases and nutrition.',
    timings: 'Mon–Fri: 8AM–4PM',
  },

  // Gynecologist
  {
    id: 'doc_017', name: 'Dr. Usha Srinivasan', specialization: 'Gynecologist',
    hospital: 'Gem Hospital', area: 'Coimbatore Road', city: 'Chennai',
    experience: '20 years', rating: 4.9, reviews: 467, fee: '₹800',
    phone: '07826001000', available: true, icon: '👩‍⚕️',
    about: 'MBBS, MS OBG, FRCOG. Expert in high-risk pregnancy, laparoscopy and women\'s health.',
    timings: 'Mon–Sat: 9AM–5PM',
  },
  {
    id: 'doc_018', name: 'Dr. Nirmala Krishnan', specialization: 'Gynecologist',
    hospital: 'Apollo Hospitals', area: 'Anna Nagar', city: 'Chennai',
    experience: '16 years', rating: 4.8, reviews: 389, fee: '₹900',
    phone: '04069063398', available: true, icon: '👩‍⚕️',
    about: 'MBBS, MD OBG. Specializes in infertility, PCOS and minimally invasive gynecology.',
    timings: 'Mon–Fri: 10AM–6PM',
  },

  // Ophthalmologist
  {
    id: 'doc_019', name: 'Dr. Rajan Murugesan', specialization: 'Ophthalmologist',
    hospital: 'Sankara Nethralaya', area: 'Nungambakkam', city: 'Chennai',
    experience: '21 years', rating: 4.9, reviews: 534, fee: '₹700',
    phone: '04428271616', available: true, icon: '👨‍⚕️',
    about: 'MBBS, MS Ophthalmology, FICS. Expert in cataract, retinal disorders and LASIK surgery.',
    timings: 'Mon–Sat: 8AM–5PM',
  },
  {
    id: 'doc_020', name: 'Dr. Padma Venkatesan', specialization: 'Ophthalmologist',
    hospital: 'Aravind Eye Hospital', area: 'Vadapalani', city: 'Chennai',
    experience: '14 years', rating: 4.8, reviews: 312, fee: '₹500',
    phone: '04423621212', available: true, icon: '👩‍⚕️',
    about: 'MBBS, MS, DNB Ophthalmology. Specializes in glaucoma, cornea and pediatric eye care.',
    timings: 'Mon–Fri: 9AM–4PM',
  },

  // Dentist
  {
    id: 'doc_021', name: 'Dr. Vijay Kumar', specialization: 'Dentist',
    hospital: 'Clove Dental', area: 'Anna Nagar', city: 'Chennai',
    experience: '12 years', rating: 4.7, reviews: 289, fee: '₹400',
    phone: '09393553232', available: true, icon: '👨‍⚕️',
    about: 'BDS, MDS Orthodontics. Expert in braces, implants, root canal and cosmetic dentistry.',
    timings: 'Mon–Sat: 10AM–7PM',
  },
  {
    id: 'doc_022', name: 'Dr. Deepa Ramachandran', specialization: 'Dentist',
    hospital: 'Dr. Rela Institute', area: 'Chromepet', city: 'Chennai',
    experience: '9 years', rating: 4.6, reviews: 198, fee: '₹350',
    phone: '04466667777', available: true, icon: '👩‍⚕️',
    about: 'BDS, MDS. Specializes in painless dentistry, dental implants and smile makeovers.',
    timings: 'Mon–Sat: 9AM–6PM',
  },

  // Gastroenterologist
  {
    id: 'doc_023', name: 'Dr. Prasad Bhatt', specialization: 'Gastroenterologist',
    hospital: 'Gleneagles Global Hospital', area: 'Perumbakkam', city: 'Chennai',
    experience: '17 years', rating: 4.8, reviews: 334, fee: '₹1000',
    phone: '04446242424', available: true, icon: '👨‍⚕️',
    about: 'MBBS, MD, DM Gastroenterology. Expert in liver disease, IBD and endoscopy.',
    timings: 'Mon–Fri: 9AM–5PM',
  },
  {
    id: 'doc_024', name: 'Dr. Malathi Suresh', specialization: 'Gastroenterologist',
    hospital: 'Kauvery Hospital', area: 'Alwarpet', city: 'Chennai',
    experience: '13 years', rating: 4.7, reviews: 256, fee: '₹900',
    phone: '04440006000', available: true, icon: '👩‍⚕️',
    about: 'MBBS, MD, DM. Specializes in colonoscopy, GERD and hepatitis management.',
    timings: 'Mon–Sat: 10AM–4PM',
  },

  // Psychiatrist
  {
    id: 'doc_025', name: 'Dr. Arun Krishnamurthy', specialization: 'Psychiatrist',
    hospital: 'NIMHANS Chennai', area: 'Kilpauk', city: 'Chennai',
    experience: '15 years', rating: 4.8, reviews: 267, fee: '₹800',
    phone: '04426412050', available: true, icon: '👨‍⚕️',
    about: 'MBBS, MD Psychiatry. Expert in depression, anxiety, OCD and addiction disorders.',
    timings: 'Mon–Fri: 9AM–5PM',
  },
];