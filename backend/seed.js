require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const User = require('./models/User');
const Resource = require('./models/Resource');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing data
  await User.deleteMany({});
  await Resource.deleteMany({});

  // Create users
  const salt = await bcrypt.genSalt(10);

  const admin = await User.create({
    name: 'Admin User', email: 'admin@demo.com',
    password: 'demo123', role: 'admin'
  });

  const counselor = await User.create({
    name: 'Dr. Meera Sharma', email: 'counselor@demo.com',
    password: 'demo123', role: 'counselor',
    specialization: 'Student Counseling & Anxiety Management',
    bio: 'Certified psychologist with 8+ years of experience in student mental health.'
  });

  const counselor2 = await User.create({
    name: 'Dr. Arjun Patel', email: 'counselor2@demo.com',
    password: 'demo123', role: 'counselor',
    specialization: 'Stress & Depression Counseling',
    bio: 'Specialized in CBT and mindfulness-based therapies for young adults.'
  });

  const student = await User.create({
    name: 'Priya Nair', email: 'student@demo.com',
    password: 'demo123', role: 'student'
  });

  // Seed resources
  const resources = [
    { title: '4-7-8 Breathing Technique', category: 'Breathing', description: 'A powerful breathing exercise to reduce anxiety and stress instantly.', content: 'Breathe in for 4 seconds through your nose. Hold your breath for 7 seconds. Exhale completely through your mouth for 8 seconds. Repeat 4 cycles. Practice twice daily for best results.', addedBy: admin._id },
    { title: 'Body Scan Meditation', category: 'Meditation', description: 'A guided mindfulness exercise to release physical tension and calm the mind.', content: 'Lie down comfortably. Close your eyes. Start from your toes and slowly move your attention up through your body, noticing sensations without judgment. Spend 15-20 minutes on this practice.', addedBy: admin._id },
    { title: '5-4-3-2-1 Grounding Technique', category: 'Tips', description: 'Use your five senses to anchor yourself in the present moment during anxiety.', content: 'Name 5 things you can see. 4 things you can touch. 3 things you can hear. 2 things you can smell. 1 thing you can taste. This interrupts anxiety spirals effectively.', addedBy: admin._id },
    { title: 'Understanding Exam Anxiety', category: 'Articles', description: 'Evidence-based strategies to manage stress before and during examinations.', url: 'https://www.mindful.org', addedBy: admin._id },
    { title: 'iCall Mental Health Helpline', category: 'Emergency', description: 'Free professional counseling helpline for students in India.', content: 'Call: 9152987821 | Available: Monday–Saturday, 8am–10pm | Languages: English, Hindi, Marathi | Free & Confidential', addedBy: admin._id },
    { title: 'Progressive Muscle Relaxation', category: 'Meditation', description: 'Systematically tense and release muscle groups to reduce stress and improve sleep.', content: 'Starting from your feet, tense each muscle group for 5 seconds then release for 30 seconds. Move up: feet → calves → thighs → abdomen → arms → face. Total time: 15-20 minutes.', addedBy: admin._id },
    { title: 'Sleep Hygiene for Students', category: 'Tips', description: '10 evidence-based habits for better sleep that improve academic performance and mood.', content: 'Maintain consistent sleep/wake times. Avoid screens 1 hour before bed. Keep your room cool (18-20°C). No caffeine after 2pm. Try relaxation techniques before bed.', addedBy: admin._id },
    { title: 'Box Breathing Exercise', category: 'Breathing', description: 'Used by Navy SEALs for focus and calm. Perfect before exams or stressful situations.', content: 'Inhale for 4 counts → Hold for 4 counts → Exhale for 4 counts → Hold for 4 counts. Repeat 4-5 cycles. Use this before presentations, exams, or difficult conversations.', addedBy: admin._id },
  ];

  await Resource.insertMany(resources);

  console.log('✅ Seeded successfully!');
  console.log('----------------------------');
  console.log('Demo accounts created:');
  console.log('Student:   student@demo.com   / demo123');
  console.log('Counselor: counselor@demo.com / demo123');
  console.log('Admin:     admin@demo.com     / demo123');
  console.log('----------------------------');

  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
