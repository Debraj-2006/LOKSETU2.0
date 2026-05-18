require('dotenv').config();
const { db } = require('./config/firebase');

const schemesData = [
  {
    title: 'Kanyashree Prakalpa (Annual Scholarship & One-time Grant)',
    department: 'Education & Youth',
    description: 'An award-winning financial aid initiative designed to prevent child marriage and encourage girls to pursue high school education, vocational courses, and higher studies.',
    eligibility: '• Unmarried girls residing in West Bengal aged 13 to 18 (K1) or 18 to 19 (K2).\n• Currently enrolled in Class VIII to XII or pursuing equivalent vocational/technical training.\n• Family income must be equal to or less than ₹1,20,000 per annum (income limit waived for girls with disabilities).',
    benefits: '• K1: Annual scholarship of ₹1,000 per year directly to the girl\'s bank account to cover schooling expenses.\n• K2: A one-time lump-sum grant of ₹25,000 paid when the girl reaches 18 years of age, ensuring she continues her higher education.',
    apply_link: 'https://www.wbkanyashree.gov.in/',
    created_at: new Date().toISOString(),
    created_by: 'seed',
    created_by_name: 'Government Seed Bot'
  },
  {
    title: 'Sabooj Sathi (Free Bicycle Distribution Scheme)',
    department: 'Education & Youth',
    description: 'A transformative state-wide initiative distributing high-quality bicycles to school-going youngsters, easing transit barriers and reducing high school dropout rates.',
    eligibility: '• All students of Class IX, X, XI, and XII enrolled in Government-run, Government-aided, or Government-sponsored schools and Madrasahs across the state.',
    benefits: '• A brand new, free, heavy-duty bicycle complete with safety reflectors, a carrier, and a front basket, easing daily commutes.',
    apply_link: 'https://wbsaboojsathi.gov.in/',
    created_at: new Date().toISOString(),
    created_by: 'seed',
    created_by_name: 'Government Seed Bot'
  },
  {
    title: 'Swasthya Sathi (Cashless Smart Card Health Insurance)',
    department: 'Health & Family Welfare',
    description: 'A comprehensive cashless health insurance cover up to ₹5 Lakhs per family per year, issued strictly in the name of the female head of the household.',
    eligibility: '• Resident families of West Bengal who are not already covered under any governmental health scheme or employee insurance.',
    benefits: '• Cashless active health cover of ₹5,00,000 per annum for basic and tertiary care at registered multi-specialty hospitals.\n• Fully covers pre-existing diseases and medical conditions without waiting periods.',
    apply_link: 'https://swasthyasathi.gov.in/',
    created_at: new Date().toISOString(),
    created_by: 'seed',
    created_by_name: 'Government Seed Bot'
  },
  {
    title: 'Lakshmir Bhandar (Women Financial Support Scheme)',
    department: 'Social Welfare & Women Development',
    description: 'Direct basic income benefit distributed monthly to female heads of household to ensure financial independence, household dignity, and economic empowerment.',
    eligibility: '• Permanent resident women of West Bengal aged 25 to 60 years.\n• Must have a registered Swasthya Sathi health card.\n• Must not draw regular government pensions or government salaries.',
    benefits: '• Monthly direct benefit transfer of ₹1,000 for General category women.\n• Monthly direct benefit transfer of ₹1,200 for SC/ST category women.',
    apply_link: 'https://socialsecurity.wb.gov.in/',
    created_at: new Date().toISOString(),
    created_by: 'seed',
    created_by_name: 'Government Seed Bot'
  },
  {
    title: 'Khadya Sathi (State Subsidized Food Security)',
    department: 'Agriculture & Food Supply',
    description: 'Food security initiative distributing essential food grains (rice, wheat) at highly subsidized rates or free of cost to marginal and economically weaker households.',
    eligibility: '• Residents holding digital ration cards classified under Antyodaya Anna Yojana (AAY), Priority Households (PHH), or RKSY categories.',
    benefits: '• Allocation of 5kg of rice and wheat per month per family member completely free of cost or at highly reduced rates (e.g. ₹2 per kg).',
    apply_link: 'https://food.wb.gov.in/',
    created_at: new Date().toISOString(),
    created_by: 'seed',
    created_by_name: 'Government Seed Bot'
  },
  {
    title: 'Krishak Bandhu (Assured Income & Farmer Death Benefit)',
    department: 'Agriculture & Food Supply',
    description: 'Financial assistance and support scheme designed for farmers to buy agricultural inputs and secure families against unexpected farming deaths.',
    eligibility: '• Farmers who own cultivable land or are officially recorded sharecroppers (Tantuj).\n• Deceased farmers aged 18 to 60 for death claim benefits.',
    benefits: '• Up to ₹10,000 per acre per year guaranteed financial aid (minimum ₹2,000) paid in two installments during Kharif & Rabi seasons.\n• In the case of death, a direct ₹2,00,000 one-time grant is disbursed to the farmer\'s family nominee.',
    apply_link: 'https://krishakbandhu.wb.gov.in/',
    created_at: new Date().toISOString(),
    created_by: 'seed',
    created_by_name: 'Government Seed Bot'
  },
  {
    title: 'Bishwakarma Shram Samman (Skill & Artisanal Tools)',
    department: 'Employment & Skills',
    description: 'Professional skill upgradation and toolkit assistance program targeting traditional local craftsmen and micro-entrepreneurs to boost domestic product sales.',
    eligibility: '• Local artisans, tailors, potters, blacksmiths, barbers, and weavers aged 18 to 60.\n• Prior experience in traditional crafting is desired.',
    benefits: '• 6 days of high-end expert training with standard daily stipends.\n• Complete premium toolkits (e.g. heavy sewing machines, metal cutters, furnaces) gifted free of cost upon training graduation.\n• High bank loan subsidies up to ₹1,00,000 to launch local shops.',
    apply_link: 'https://diupmsme.upsdc.gov.in/',
    created_at: new Date().toISOString(),
    created_by: 'seed',
    created_by_name: 'Government Seed Bot'
  }
];

async function seed() {
  console.log('🌱 Starting to seed state schemes into Firestore...');
  try {
    const batch = db.batch();
    const schemesColl = db.collection('schemes');
    
    // Clear existing schemes seeded previously to prevent duplicates
    const existingSnap = await schemesColl.where('created_by', '==', 'seed').get();
    if (!existingSnap.empty) {
      console.log(`🧹 Found ${existingSnap.size} existing seeded schemes, removing...`);
      existingSnap.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    // Add new ones
    schemesData.forEach(scheme => {
      const docRef = schemesColl.doc();
      batch.set(docRef, scheme);
      console.log(`➕ Queuing scheme: ${scheme.title}`);
    });

    await batch.commit();
    console.log('✅ Government Schemes seeded successfully! 🔥');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed government schemes:', error);
    process.exit(1);
  }
}

seed();
