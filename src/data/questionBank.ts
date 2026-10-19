import { SPMTask } from '../lib/gemini';

export const PART1_QUESTION_BANK: SPMTask[] = [
  // --- PEOPLE AND CULTURE (20) ---
  {
    title: 'Traditional Dance Hobby',
    context: 'Your friend wants to learn a traditional dance.',
    emailBody: 'Hi! I saw a Zapin performance yesterday and it was amazing. I want to learn a traditional dance too, but I am not sure which one to pick. Should I choose Joget or Zapin? Which one is easier for a beginner? Also, where can I find a good teacher?',
    friendName: 'Farhan',
    friendEmail: 'farhan.dance@email.com',
    subject: 'Traditional dance?',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Celebrating Hari Raya',
    context: 'Your friend is celebrating Hari Raya for the first time.',
    emailBody: 'Hey! My family and I are coming to your house for your open house next week. I am so excited! What should I wear? Is there any specific etiquette I should know about? Also, what is your favorite traditional dish that I must try?',
    friendName: 'Chloe',
    friendEmail: 'chloe.raya@email.com',
    subject: 'Open house visit',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Cooking Nasi Lemak',
    context: 'Your friend wants to cook Nasi Lemak for a school competition.',
    emailBody: 'Hello! I entered the "Young Chef" competition and I want to cook Nasi Lemak. Do you have a secret family recipe? What makes a good Nasi Lemak—is it the rice or the sambal? Any tips to win?',
    friendName: 'Justin',
    friendEmail: 'justin.chef@email.com',
    subject: 'Nasi Lemak secrets',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Visiting a Museum',
    context: 'Your friend thinks museums are boring.',
    emailBody: 'Hi! Our school is having a trip to the National Museum next month, but I think it will be boring. Do you think it\'s worth going? What are the most interesting exhibits there? Maybe you can convince me to join!',
    friendName: 'Daniel',
    friendEmail: 'dan.muse@email.com',
    subject: 'Museum trip',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Learning Mandarin',
    context: 'Your friend wants to pick up a new language.',
    emailBody: 'Hey! I want to learn Mandarin to communicate better with my friends. Should I join an online class or just use Duolingo? Is it a difficult language for someone who only speaks English and Malay? Let me know your thoughts.',
    friendName: 'Sarah',
    friendEmail: 'sarah.lang@email.com',
    subject: 'Learning Mandarin',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Family Reunion Traditions',
    context: 'Your friend is hosting a family reunion.',
    emailBody: 'Hi! It is our turn to host the family reunion this year. My parents want to do something traditional besides just eating. What games do you play during your family gatherings? Any ideas to make it more fun for the younger cousins?',
    friendName: 'Mei Ling',
    friendEmail: 'mei.ling@email.com',
    subject: 'Family reunion ideas',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Charity Volunteer',
    context: 'Your friend wants to volunteer at a community center.',
    emailBody: 'Hey! I want to help out at the local community center this weekend. They need help with distributing food and teaching kids. Which task should I pick? What should I prepare before going there?',
    friendName: 'Raju',
    friendEmail: 'raju.volunteer@email.com',
    subject: 'Volunteering work',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Traditional Outfit Choice',
    context: 'Your friend needs to buy a Baju Melayu.',
    emailBody: 'Hi! I need to buy a Baju Melayu for a school event. Should I get a bright color like yellow or something classic like dark blue? Also, which brand is the most comfortable? I want to look sharp!',
    friendName: 'Arif',
    friendEmail: 'arif.style@email.com',
    subject: 'Baju Melayu advice',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Reading Local Novels',
    context: 'Your friend wants to read more Malaysian literature.',
    emailBody: 'Hello! I want to start reading books by local authors. Can you recommend a good local novel? I prefer mystery or horror. Who is your favorite Malaysian writer?',
    friendName: 'Sofia',
    friendEmail: 'sofia.books@email.com',
    subject: 'Book recommendations',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Local Film Night',
    context: 'Your friend wants to watch a local movie.',
    emailBody: 'Hey! We are having a movie night at my house. Should we watch an action film like "Mat Kilau" or a comedy like "Abang Long Fadil"? Which one is better for a group of friends? Any other suggestions?',
    friendName: 'Kevin',
    friendEmail: 'kevin.mov@email.com',
    subject: 'Movie night choice',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Preserving Heritage Sites',
    context: 'Your friend is worried about an old building being demolished.',
    emailBody: 'Hi! I heard that an old colonial building in our town is going to be demolished for a new shopping mall. I am so sad! Should we start a petition to save it? How can we get other students to care about our heritage?',
    friendName: 'Aishah',
    friendEmail: 'aishah.save@email.com',
    subject: 'Saving our history',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Being a Tour Guide',
    context: 'Your friend is showing a foreigner around.',
    emailBody: 'Guess what? My cousin from the UK is visiting! I want to take him for a day trip. Should we go to the Batu Caves or to Central Market? Where can we find the best street food that isn\'t too spicy for him?',
    friendName: 'Wei Ken',
    friendEmail: 'weiken.host@email.com',
    subject: 'Tour guide for a day',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Traditional Games Day',
    context: 'Your friend is organizing a traditional games day at school.',
    emailBody: 'Hey! I am in charge of the "Games Day" next month. We want to feature Congkak and Gasing. Do you know where I can buy these sets for cheap? Also, can you help me teach the rules to the other students?',
    friendName: 'Leo',
    friendEmail: 'leo.games@email.com',
    subject: 'Traditional games day',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Wedding Etiquette',
    context: 'Your friend is attending a Malay wedding for the first time.',
    emailBody: 'Hi! I received an invitation to my neighbor\'s daughter\'s wedding. I am not sure about what gift to bring. Is "duit salam" a must? Also, at what time should I arrive—early or is it okay to be a bit late?',
    friendName: 'Jessica',
    friendEmail: 'jess.wedding@email.com',
    subject: 'Wedding help!',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Cultural Exchange Program',
    context: 'Your friend wants to go to Japan for an exchange program.',
    emailBody: 'Hey! I have a chance to go to Japan for a cultural exchange month. I have to perform something Malaysian. Should I perform a silat demonstration or a traditional song? What would Japanese students find most interesting?',
    friendName: 'Amira',
    friendEmail: 'amira.travel@email.com',
    subject: 'Representing Malaysia',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Studying History',
    context: 'Your friend finds the History subject difficult.',
    emailBody: 'Hi. I am really struggling with the Sejarah subject. All those dates and names are so hard to remember! How do you study for it? Do you have any special notes or techniques to share?',
    friendName: 'Fatimah',
    friendEmail: 'fatimah.study@email.com',
    subject: 'Help with Sejarah',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Respecting Elders',
    context: 'Your friend had a misunderstanding with an elder.',
    emailBody: 'Hi. My grandmother got angry at me because I didn\'t greet her correctly yesterday. I feel really bad but I don\'t know how to apologize. What is the most respectful way to make things right in our culture?',
    friendName: 'Ryan',
    friendEmail: 'ryan.respect@email.com',
    subject: 'Sorry to Grandma',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Community Service Day',
    context: 'Your friend is planning a "Gotong-Royong".',
    emailBody: 'Hello! I want to organize a "Gotong-Royong" to clean up our neighborhood park. How can I get my neighbors to actually participate? What kind of snacks should I provide to keep everyone motivated?',
    friendName: 'Mrs. Tan',
    friendEmail: 'tan.gotong@email.com',
    subject: 'Gotong-Royong plan',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Regional Dialects',
    context: 'Your friend is moving to Kelantan.',
    emailBody: 'Hey! My family is moving to Kota Bharu next month. I am worried I won\'t understand the local dialect. Should I try to learn some words now? Is it very different from standard Malay?',
    friendName: 'Siti',
    friendEmail: 'siti.move@email.com',
    subject: 'Moving to Kelantan',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'National Day Celebration',
    context: 'Your friend wants to celebrate Merdeka Day.',
    emailBody: 'Hi! Merdeka Day is coming! I want to decorate my classroom with flags and posters. Where can I buy patriotic decorations for cheap? Also, do you want to join me at the parade at Putrajaya?',
    friendName: 'Haikal',
    friendEmail: 'haikal.merdeka@email.com',
    subject: 'Merdeka decorations',
    theme: 'People and Culture',
    practiceMode: 'Full'
  },

  // --- HEALTH AND ENVIRONMENT (20) ---
  {
    title: 'School Garden Project',
    context: 'Your friend wants to start a vertical garden.',
    emailBody: 'Hey! I saw a video about vertical gardening in schools. It looks so green and cool! Should we try it in our school? What plants are easy to grow? I need your help to convince the principal!',
    friendName: 'Amir',
    friendEmail: 'amir.green@email.com',
    subject: 'School garden plan',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Reducing Meat Intake',
    context: 'Your friend wants to become a vegetarian.',
    emailBody: 'Hi! I read that eating less meat is better for both health and the planet. I want to try being a vegetarian for a month. Do you think I will get enough protein? What are some delicious meatless dishes in our cafeteria?',
    friendName: 'Lisa',
    friendEmail: 'lisa.health@email.com',
    subject: 'Going vegetarian?',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Benefits of Cycling',
    context: 'Your friend wants to cycle to school.',
    emailBody: 'Hey! I want to start cycling to school instead of taking the bus. It is good for the environment and my fitness. But is it safe on our busy roads? What safety gear should I buy first?',
    friendName: 'Adam',
    friendEmail: 'adam.cycle@email.com',
    subject: 'Cycling to school',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Air Pollution Concerns',
    context: 'Your friend is worried about the haze.',
    emailBody: 'Hi. The haze is back and the air quality is really bad today. My eyes are stinging! Should I still go for football practice? What should we do to protect ourselves while outdoors?',
    friendName: 'Kumar',
    friendEmail: 'kumar.air@email.com',
    subject: 'Haze is back!',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Waste Disposal Habits',
    context: 'Your friend saw people littering in the park.',
    emailBody: 'Hey! I was at the park yesterday and it was full of plastic bottles and straws. It made me so angry! How can we educate people to use the recycling bins? Should we make some posters or a social media campaign?',
    friendName: 'Bella',
    friendEmail: 'bella.eco@email.com',
    subject: 'Littering problem',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Mental Health Awareness',
    context: 'Your friend is feeling burnt out.',
    emailBody: 'Hi. I feel so overwhelmed with schoolwork and tuition every day. I think my mental health is suffering. What do you do to relax when you are stressed? Should I take a break or just keep pushing?',
    friendName: 'Ryan',
    friendEmail: 'ryan.vent@email.com',
    subject: 'Feeling burnt out',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Drinking Enough Water',
    context: 'Your friend keeps forgetting to drink water.',
    emailBody: 'Hey! I have been getting headaches lately and my mom says it\'s because I don\'t drink enough water. I always forget! Can you recommend a good app or a trick to help me stay hydrated throughout the day?',
    friendName: 'Hana',
    friendEmail: 'hana.water@email.com',
    subject: 'Hydration help',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Exercise Routine',
    context: 'Your friend wants to start a morning workout.',
    emailBody: 'Hi! I want to start waking up early to exercise before school. Should I go for a jog or just do some yoga at home? How do you stay motivated to wake up early? I usually just press the snooze button!',
    friendName: 'Wei Hong',
    friendEmail: 'weihong.fit@email.com',
    subject: 'Morning workouts',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Deforestation Impact',
    context: 'Your friend saw a news report about forest clearing.',
    emailBody: 'Hey. I watched a video about how forests are being cleared for luxury houses. It is so sad for the animals! What can we do to help? Is there an organization we can donate to or a way to raise awareness at school?',
    friendName: 'Nadia',
    friendEmail: 'nadia.eco@email.com',
    subject: 'Save our forests',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Composting at Home',
    context: 'Your friend wants to start a compost bin.',
    emailBody: 'Hi! I want to turn our food scraps into fertilizer for my mom\'s plants. But she is worried that a compost bin will smell and attract rats. How can I keep it clean? Do you have a compost bin at your house?',
    friendName: 'Mrs. Tan',
    friendEmail: 'tan.compost@email.com',
    subject: 'Start composting?',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Energy Conservation',
    context: 'Your friend wants to reduce electricity usage.',
    emailBody: 'Hi! My dad is complaining about the high electricity bill. I want to help save energy. Aside from switching off the lights, what else can we do? Do solar panels really work in our country?',
    friendName: 'Suresh',
    friendEmail: 'suresh.save@email.com',
    subject: 'Saving energy',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Plastic-Free Canteen',
    context: 'Your friend wants the school canteen to stop using plastic containers.',
    emailBody: 'Hey! I noticed the canteen uses so much plastic every day. I want to propose that students bring their own containers. How should I talk to the canteen owner? What incentive can we offer to the students who bring their own?',
    friendName: 'Leo',
    friendEmail: 'leo.plasticfree@email.com',
    subject: 'Canteen project',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Protecting Wildlife',
    context: 'Your friend is concerned about Malayan tigers.',
    emailBody: 'Hi. I read that there are fewer than 150 Malayan tigers left in the wild. This is a tragedy! Should our school organize a charity run to raise money for tiger conservation? How can we get the media interested?',
    friendName: 'Ariel',
    friendEmail: 'ariel.tigers@email.com',
    subject: 'Save the tigers',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Health Screenings',
    context: 'Your friend is afraid of going for a medical check-up.',
    emailBody: 'Hey. My school is organizing a free health screening for all students next week. I am really afraid of needles and tests. Do you think it\'s important to go? What exactly do they check during these screenings?',
    friendName: 'Dina',
    friendEmail: 'dina.health@email.com',
    subject: 'Medical check-up?',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Importance of Breakfast',
    context: 'Your friend keeps skipping breakfast.',
    emailBody: 'Hi! I have been skipping breakfast to save time in the morning, but now I feel so tired during class. Do you think breakfast is really that important? What is a quick and healthy breakfast I can make in 5 minutes?',
    friendName: 'Emily',
    friendEmail: 'emily.food@email.com',
    subject: 'Skipping breakfast',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Managing Study Stress',
    context: 'Your friend is stressed about the final exams.',
    emailBody: 'Hi. The finals are next month and I can\'t sleep at night thinking about them. I feel like I am going to fail! How do you handle exam stress? Do you have any study tips that can help me feel more prepared and calm?',
    friendName: 'Zul',
    friendEmail: 'zul.study@email.com',
    subject: 'Exam stress help',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Sustainable Fishing',
    context: 'Your friend wants to buy ethical seafood.',
    emailBody: 'Hey! I learned that overfishing is destroying our oceans. How can I know if the fish I buy is caught sustainably? Are there any specific labels I should look for? Also, should I stop eating seafood altogether?',
    friendName: 'Mikhail',
    friendEmail: 'mikhail.ocean@email.com',
    subject: 'Sustainable seafood',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Natural Disaster Awareness',
    context: 'Your friend is worried about floods.',
    emailBody: 'Hi. The rainy season is coming and our area flooded last year. I am so scared it will happen again! What should my family prepare in an "emergency bag"? And what should we do if the water starts rising?',
    friendName: 'Zahir',
    friendEmail: 'zahir.flood@email.com',
    subject: 'Flood preparation',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Eco-Friendly Cleaning',
    context: 'Your friend wants to use natural cleaning products.',
    emailBody: 'Hey! I want to stop using harsh chemicals to clean my room. I heard vinegar and baking soda work well. Is it true? How do I use them? Any other eco-friendly cleaning tips for a student?',
    friendName: 'Sofia',
    friendEmail: 'sofia.clean@email.com',
    subject: 'Green cleaning',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Clean Water Access',
    context: 'Your friend is doing a project on water pollution.',
    emailBody: 'Hi. I am doing a geography project on river pollution in Malaysia. What do you think are the main causes? Is it factories or people throwing trash? Any suggestions on how we can improve our river quality?',
    friendName: 'Irfan',
    friendEmail: 'irfan.water@email.com',
    subject: 'River pollution project',
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },

  // --- SCIENCE AND TECHNOLOGY (20) ---
  {
    title: 'Coding for Kids',
    context: 'Your friend wants to teach their younger brother to code.',
    emailBody: 'Hey! I want to teach my 8-year-old brother some basic coding. Should I use Scratch or a real language like Python? Are there any fun projects we can do together to keep him interested?',
    friendName: 'Daniel',
    friendEmail: 'dan.code@email.com',
    subject: 'Teaching coding',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Robots in Hospitals',
    context: 'Your friend saw a robot assisting a nurse.',
    emailBody: 'Hi! I saw a robot at the hospital yesterday delivering medicine to the rooms. It was so cool! Do you think robots will eventually replace nurses? What are the pros and cons of having robots in healthcare?',
    friendName: 'Meera',
    friendEmail: 'meera.medtech@email.com',
    subject: 'Hospital robots',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Space Exploration',
    context: 'Your friend wants to become an astronaut.',
    emailBody: 'Hey! I have been watching documentaries about Mars missions. I really want to be an astronaut, but my parents say it\'s impossible for a Malaysian student. What do you think? What should I study to reach that goal?',
    friendName: 'Lucas',
    friendEmail: 'lucas.stars@email.com',
    subject: 'Astronaut dreams',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Artificial Intelligence Benefits',
    context: 'Your friend is curious about AI.',
    emailBody: 'Hi! Everyone is talking about AI like ChatGPT. How do you use it for your schoolwork? Is it helpful or do you think it makes us lazy? I want to try it but I don\'t want to "cheat".',
    friendName: 'Linda',
    friendEmail: 'linda.smart@email.com',
    subject: 'Using AI tools',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Online Safety',
    context: 'Your friend\'s social media was hacked.',
    emailBody: 'Hey! My Instagram got hacked yesterday and someone is sending spam to all my friends. I am so upset! How can I get it back? And what should I do to make my account more secure in the future?',
    friendName: 'Sarah',
    friendEmail: 'sarah.help@email.com',
    subject: 'I got hacked!',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Virtual Reality in Class',
    context: 'Your friend wants to use VR for history class.',
    emailBody: 'Hey! Imagine if we could use VR headsets to "visit" historical sites instead of just reading about them. Do you think our school should invest in some VR gear? How would it change the way we learn?',
    friendName: 'Zul',
    friendEmail: 'zul.vr@email.com',
    subject: 'VR in education',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: '5G Connectivity',
    context: 'Your friend is thinking of upgrading their phone plan.',
    emailBody: 'Hi! My telco is offering a 5G upgrade for my phone. Is it really that much faster than 4G? Do I need a new phone to use it? Tell me if you think it\'s worth the extra money.',
    friendName: 'Arif',
    friendEmail: 'arif.tech@email.com',
    subject: '5G upgrade?',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: '3D Printing',
    context: 'Your friend bought a 3D printer.',
    emailBody: 'Guess what? I bought a budget 3D printer! It\'s so cool. I want to print some useful things for school. Any ideas what I should print first? Also, do you want me to print something for you?',
    friendName: 'Mei Ling',
    friendEmail: 'meiling.maker@email.com',
    subject: 'My new 3D printer',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Electric Scooters',
    context: 'Your friend wants to buy an e-scooter for short commutes.',
    emailBody: 'Hey! I am thinking of buying an electric scooter to go to the grocery store nearby. It saves time and is fun! But my dad says it\'s dangerous. What do you think? Should I get one? Any brand suggestions?',
    friendName: 'Jason',
    friendEmail: 'jason.ride@email.com',
    subject: 'Buying an e-scooter',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Scientific Inventions',
    context: 'Your friend has an idea for a science project.',
    emailBody: 'Hi! I want to build a "solar-powered umbrella" that can also charge a phone. Does it sound like a good idea for the science fair? How should I start building the prototype? I need a science partner!',
    friendName: 'Brenda',
    friendEmail: 'brenda.invent@email.com',
    subject: 'Science fair idea',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Lab Safety',
    context: 'Your friend saw someone being careless in the school lab.',
    emailBody: 'Hi. Today during Chemistry, some students were playing around with the chemicals. It was so dangerous! Should I tell the teacher? What are the most important lab safety rules we should follow?',
    friendName: 'Siti',
    friendEmail: 'siti.lab@email.com',
    subject: 'Safety in the lab',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Renewable Energy Tech',
    context: 'Your friend is interested in wind turbines.',
    emailBody: 'Hey! I read that wind energy is becoming more popular. Do you think Malaysia has enough wind to make turbines worth it? Or should we focus more on solar energy? I am doing a tech report on this.',
    friendName: 'Wei Hong',
    friendEmail: 'weihong.energy@email.com',
    subject: 'Wind vs Solar',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Drones for Agriculture',
    context: 'Your friend\'s uncle wants to use drones on his farm.',
    emailBody: 'Hi! My uncle has a durian farm and he wants to use drones to spray fertilizer. Is it hard to learn how to fly a drone? And can a drone actually carry heavy liquid? He needs some tech advice!',
    friendName: 'Suresh',
    friendEmail: 'suresh.drone@email.com',
    subject: 'Farming drones help',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Cybersecurity Threats',
    context: 'Your friend is worried about online privacy.',
    emailBody: 'Hi. I heard that many apps are secretly collecting our data. It is so scary! Should I cover my laptop camera? And what is a "VPN"—do I really need one for my phone? Let me know your privacy tips.',
    friendName: 'Kevin',
    friendEmail: 'kevin.privacy@email.com',
    subject: 'Online privacy tips',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Mobile App Development',
    context: 'Your friend wants to build a homework tracking app.',
    emailBody: 'Hey! I want to create an app that helps students track their homework and exam dates. Since you are good with logic, can you help me design the interface? What features should a good student app have?',
    friendName: 'Nurul',
    friendEmail: 'nurul.app@email.com',
    subject: 'New app idea!',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Telescopes and Stars',
    context: 'Your friend bought a telescope.',
    emailBody: 'Hi! I finally got a telescope and I want to see the moon and planets tonight! Where is the darkest spot in our town for stargazing? Also, do I need a special lens to take photos with my phone?',
    friendName: 'Leo',
    friendEmail: 'leo.stars@email.com',
    subject: 'Stargazing tonight?',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Hybrid Engines',
    context: 'Your friend is asking about hybrid cars.',
    emailBody: 'Hey! My parents are buying a new car and they are torn between a petrol car and a hybrid car. Is a hybrid actually cheaper to maintain? And does it really save that much fuel for city driving?',
    friendName: 'Raju',
    friendEmail: 'raju.cars@email.com',
    subject: 'Petrol vs Hybrid',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Smart Home Devices',
    context: 'Your friend wants to buy a "smart speaker".',
    emailBody: 'Hi! I want to buy a Google Home or Alexa for my room. Is it actually useful or just a toy? Can it help me with my studies or just play music? Tell me your experience if you have one.',
    friendName: 'Jessica',
    friendEmail: 'jess.smart@email.com',
    subject: 'Are smart speakers good?',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Biotechnology in Food',
    context: 'Your friend is worried about GMO food.',
    emailBody: 'Hi. I read that many fruits and vegetables are genetically modified (GMO). My mom says they are unhealthy. Is there a scientific reason to worry? How can we tell if the food we buy at the supermarket is "natural"?',
    friendName: 'Emily',
    friendEmail: 'emily.science@email.com',
    subject: 'About GMO food',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Technology Addiction',
    context: 'Your friend can\'t stop checking their phone.',
    emailBody: 'Hey. I think I am addicted to my phone. I check it every 10 minutes, even during class! It is affecting my focus. How can I reduce my screen time without feeling bored? Help me quit this habit!',
    friendName: 'Sarah',
    friendEmail: 'sarah.phone@email.com',
    subject: 'Phone addiction',
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },

  // --- CONSUMERISM AND FINANCIAL AWARENESS (20) ---
  {
    title: 'Saving for University',
    context: 'Your friend wants to start saving for their degree.',
    emailBody: 'Hi! I realized that university fees are really expensive. I want to start saving my pocket money from now. How much should I save every week? And should I keep it in a piggy bank or a real bank account?',
    friendName: 'Amira',
    friendEmail: 'amira.save@email.com',
    subject: 'Saving for uni',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Impulse Buying on Shopee',
    context: 'Your friend spent all their money on a sale.',
    emailBody: 'Hey! I am so broke! I spent RM200 during the "Double Digit" sale on Shopee yesterday. Most of the things I bought were useless gadgets. How can I stop myself from panic-buying next time?',
    friendName: 'Jason',
    friendEmail: 'jason.sale@email.com',
    subject: 'I overspent again!',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Budgeting for Holidays',
    context: 'Your friend is planning a trip with friends.',
    emailBody: 'Hi! Five of us are planning to go to Genting Highlands after the exams. How should we split the costs for transport and food fairly? Is it better to have a "group fund" or just pay for ourselves?',
    friendName: 'Meera',
    friendEmail: 'meera.trip@email.com',
    subject: 'Holiday budget',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Opening a Bank Account',
    context: 'Your friend is 18 and needs a bank account.',
    emailBody: 'Hi! I just turned 18 and I need my own bank account. Should I go with Maybank or CIMB? Which one has a better mobile app? What documents do I need to bring with me to the bank?',
    friendName: 'Irfan',
    friendEmail: 'irfan.bank@email.com',
    subject: 'New bank account',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Credit vs Debit Cards',
    context: 'Your friend is confused about different payment cards.',
    emailBody: 'Hey! My sister says I should only use a debit card, but my brother uses a credit card for everything. What is the difference anyway? Isn\'t a credit card just free money from the bank? Explain it to me!',
    friendName: 'Lucas',
    friendEmail: 'lucas.cards@email.com',
    subject: 'Credit vs Debit',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Investing for Beginners',
    context: 'Your friend wants to buy stocks.',
    emailBody: 'Hi! I want my money to grow instead of just sitting in the bank. I heard about buying stocks or ASB. Is it risky for a student? How much money do I need to start investing? Give me some basic advice.',
    friendName: 'Wei Hong',
    friendEmail: 'weihong.money@email.com',
    subject: 'Starting to invest',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Second-Hand Shopping',
    context: 'Your friend wants to buy a used laptop.',
    emailBody: 'Hey! I found a second-hand MacBook on Carousell that looks like a great deal. But I am afraid it might be broken or a scam. What should I check before I pay? Is it better to just buy a cheaper new laptop?',
    friendName: 'Siti',
    friendEmail: 'siti.buy@email.com',
    subject: 'Buying used laptop',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Consumer Rights',
    context: 'Your friend bought a broken item and the shop won\'t refund.',
    emailBody: 'Hi. I bought a new headphones yesterday, but the left side doesn\'t work. The shop says "no refund or exchange". Is this legal? What are my rights as a consumer? Who can I complain to?',
    friendName: 'Kumar',
    friendEmail: 'kumar.rights@email.com',
    subject: 'Need a refund!',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Comparing Prices Online',
    context: 'Your friend is buying a present for their mother.',
    emailBody: 'Hi! I want to buy a branded handbag for my mom\'s birthday. I found it on three different websites with different prices. How can I tell which one is the original and not a fake? Should I just go to the mall?',
    friendName: 'Nurul',
    friendEmail: 'nurul.gift@email.com',
    subject: 'Shopping for mom',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Scam Awareness',
    context: 'Your friend received a suspicious SMS.',
    emailBody: 'Hey! I just got an SMS saying my bank account will be blocked unless I click this link and "verify" my info. It looks official but I am suspicious. What should I do? Is this a phishing scam?',
    friendName: 'Zahir',
    friendEmail: 'zahir.scam@email.com',
    subject: 'Suspicious SMS',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Financial Independence',
    context: 'Your friend wants to stop asking for money from parents.',
    emailBody: 'Hi. I feel bad always asking my dad for money for books and movies. I want to earn my own pocket money. Do you have any ideas on how I can make RM100 a month online? Maybe selling stuff or doing surveys?',
    friendName: 'Brenda',
    friendEmail: 'brenda.money@email.com',
    subject: 'Earning my own cash',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Spending vs Saving',
    context: 'Your friend is a "big spender".',
    emailBody: 'Hi! Every time I get my allowance, I spend it all within 3 days on bubble tea and games. Then I have to borrow money from you! How do you manage to save so much? Please teach me how to be more disciplined.',
    friendName: 'Leo',
    friendEmail: 'leo.spent@email.com',
    subject: 'Help me save money!',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Part-Time Job Income',
    context: 'Your friend is working as a delivery rider.',
    emailBody: 'Hey! I started working as a GrabFood rider after school. The money is great, but I am so tired I can\'t study. Should I quit or just work fewer hours? My parents are worried about my SPM results.',
    friendName: 'Farhan',
    friendEmail: 'farhan.job@email.com',
    subject: 'My part-time job',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Expensive Trends',
    context: 'Your friend wants to buy expensive branded sneakers.',
    emailBody: 'Hi! Everyone at school is wearing those new RM800 shoes. I really want a pair too so I don\'t feel left out. But my parents say it\'s a waste of money. Do you think I should use my savings to buy them?',
    friendName: 'Chloe',
    friendEmail: 'chloe.shoes@email.com',
    subject: 'Branded sneakers?',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Buying a Used Car',
    context: 'Your friend\'s brother is buying his first car.',
    emailBody: 'Hi! My older brother is buying a used Perodua Viva. What are some technical things he should check before buying? Also, is it better to buy from a dealership or directly from an owner?',
    friendName: 'Suresh',
    friendEmail: 'suresh.car@email.com',
    subject: 'Used car advice',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Subscription Costs',
    context: 'Your friend is spending too much on apps.',
    emailBody: 'Hey! I just realized I am paying for Netflix, Spotify, Disney+, and Canva every month. It adds up to RM150! Which one should I cancel first? Do you think sharing accounts with friends is a good way to save?',
    friendName: 'Tasha',
    friendEmail: 'tasha.apps@email.com',
    subject: 'Too many subscriptions!',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Charity Donations',
    context: 'Your friend wants to donate to a food bank.',
    emailBody: 'Hi! I want to donate some of my savings to a local food bank. Is it better to donate cash or buy actual food items like rice and oil? Also, how can I find a trustworthy charity organization?',
    friendName: 'Aishah',
    friendEmail: 'aishah.give@email.com',
    subject: 'Donating to charity',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Smart Shopping Tips',
    context: 'Your friend is going grocery shopping alone for the first time.',
    emailBody: 'Hi! I am staying alone this week and I need to buy groceries. How can I avoid buying unnecessary things? Should I make a list? And are house brands (store brands) usually as good as expensive ones?',
    friendName: 'Mei Ling',
    friendEmail: 'meiling.shop@email.com',
    subject: 'Grocery shopping help',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Understanding Interest Rates',
    context: 'Your friend is curious about bank interest.',
    emailBody: 'Hi. I saw an ad for a savings account with "high interest". What does that actually mean? Do they give me free money or is there a catch? Explain to me like I am five!',
    friendName: 'Arif',
    friendEmail: 'arif.bank@email.com',
    subject: 'What is interest?',
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
];

export const PART2_QUESTION_BANK: SPMTask[] = [
  // --- PEOPLE AND CULTURE (20) ---
  {
    title: 'A Traditional Festival',
    context: 'Every year, Malaysians celebrate many traditional festivals. Write an essay about a traditional festival you recently attended.',
    bulletPoints: [
      'What festival was it?',
      'How was it celebrated?',
      'Why is it important to keep these traditions?'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Promoting Local Culture',
    context: 'Many youngsters are more interested in Western culture than their own heritage. Write an essay about how we can promote local culture to the youth.',
    bulletPoints: [
      'The current situation among youth',
      'Suggestions to promote local culture',
      'The benefits of being proud of our heritage'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'A Visit to a Historical Town',
    context: 'You recently visited a historical town in Malaysia (e.g., Malacca or George Town). Write an essay about your experience.',
    bulletPoints: [
      'Which town did you visit?',
      'What did you see and do there?',
      'Why should we preserve such historical places?'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Traditional Wedding Customs',
    context: 'You attended a traditional Malaysian wedding. Write an essay describing the event.',
    bulletPoints: [
      'Whose wedding was it?',
      'Describe the main ceremonies involved.',
      'How did you feel about the experience?'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Our National Identity',
    context: 'National Day is a time to reflect on what it means to be Malaysian. Write an essay about our national identity.',
    bulletPoints: [
      'The unique characteristics of Malaysians',
      'The importance of unity and harmony',
      'How to show patriotism in daily life'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Traditional Crafts in Malaysia',
    context: 'Traditional crafts like Batik and Songket are famous in Malaysia. Write an essay about these crafts.',
    bulletPoints: [
      'Types of traditional crafts found in Malaysia',
      'The skills required to make them',
      'Ways to support local artisans'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'My Favorite Local Food',
    context: 'Malaysia is known for its diverse and delicious food. Write an essay about your favorite local dish.',
    bulletPoints: [
      'What is the name of the dish?',
      'Describe its ingredients and taste.',
      'Why is food a symbol of Malaysian unity?'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'A Community Clean-up Project',
    context: 'You recently participated in a "Gotong-Royong" session in your neighborhood. Write an essay about it.',
    bulletPoints: [
      'When and where did it take place?',
      'What activities were carried out?',
      'The importance of cooperation in the community'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Life in a Village vs City',
    context: 'Many people have different opinions about living in a village and a city. Write an essay comparing the two lifestyles.',
    bulletPoints: [
      'Advantages of living in a village',
      'Advantages of living in a city',
      'Which lifestyle do you prefer and why?'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Historical Figures of Malaysia',
    context: 'There are many leaders who contributed to the development of Malaysia. Write an essay about a historical figure you admire.',
    bulletPoints: [
      'Who is the figure?',
      'What were their major contributions?',
      'Lessons we can learn from their life'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Traditional Music Performance',
    context: 'You attended a concert featuring traditional musical instruments. Write an essay about the performance.',
    bulletPoints: [
      'What kind of music or instruments were featured?',
      'How was the atmosphere during the performance?',
      'The future of traditional music in the modern world'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'An Interesting Local Custom',
    context: 'Malaysia has many unique customs and social norms. Write an essay about one local custom that is important to you.',
    bulletPoints: [
      'What is the custom?',
      'When is it practiced?',
      'Why is it important to follow these social norms?'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'The Value of Family Traditions',
    context: 'Family traditions help to bond family members together. Write an essay about a tradition in your own family.',
    bulletPoints: [
      'Describe the tradition.',
      'How it started or how often it happens.',
      'The benefits of having family traditions'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Celebrating Together',
    context: 'Malaysia is a multiracial country where people celebrate together. Write an essay about racial harmony in festivals.',
    bulletPoints: [
      'The beauty of celebrating various festivals',
      'How celebrations foster unity',
      'Challenges in maintaining harmony and how to overcome them'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'A Visit to a Night Market',
    context: 'Night markets or "Pasar Malam" are unique to Malaysia. Write an essay about your experience visiting one.',
    bulletPoints: [
      'The sights and sounds of the night market',
      'Interesting things you bought or ate',
      'The role of night markets in our local community'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Learning Martial Arts',
    context: 'Traditional martial arts like Silat or Kung Fu are part of our heritage. Write an essay about learning them.',
    bulletPoints: [
      'Why you decided to learn a martial art',
      'The physical and mental benefits',
      'How martial arts teach discipline and respect'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Traditional Games we Play',
    context: 'Traditional games are slowly being forgotten by today’s children. Write an essay about a traditional game you enjoy.',
    bulletPoints: [
      'What game is it?',
      'How is it played?',
      'Why we should introduce these games to the next generation'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'A Day in a Traditional House',
    context: 'You stayed in a traditional wooden house during your holidays. Write an essay about your stay.',
    bulletPoints: [
      'Describe the architectural features of the house.',
      'How was the experience different from staying in a modern house?',
      'What you liked most about the stay'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'Our Diverse Languages',
    context: 'Besides Malay, many other languages and dialects are spoken in Malaysia. Write an essay about the importance of being multilingual.',
    bulletPoints: [
      'The variety of languages spoken in your community',
      'The advantages of speaking more than one language',
      'How languages connect different cultures'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },
  {
    title: 'My Visit to a Cultural Village',
    context: 'A visit to a cultural village (e.g., Sarawak Cultural Village) can be educational. Write an essay about such a visit.',
    bulletPoints: [
      'Where did you go?',
      'What did you learn about the different ethnic groups?',
      'Why should students go on field trips to cultural villages?'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  },

  // --- HEALTH AND ENVIRONMENT (20) ---
  {
    title: 'Healthy Lifestyle Habits',
    context: 'Maintaining a healthy lifestyle is crucial for students. Write an essay on the importance of living healthily.',
    bulletPoints: [
      'What makes a lifestyle healthy?',
      'The physical and mental benefits',
      'Suggestions to help students stay healthy'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Protecting Our Rivers',
    context: 'River pollution is a serious problem in our country. Write an essay about the importance of protecting our rivers.',
    bulletPoints: [
      'The causes of river pollution',
      'The consequences of having dirty rivers',
      'How everyone can help to keep rivers clean'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'The Dangers of Obesity',
    context: 'Obesity among school children is on the rise. Write an essay discussing this issue.',
    bulletPoints: [
      'The reasons behind the increase in obesity',
      'The health risks associated with being overweight',
      'The role of schools and parents in tackling this problem'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Saying No to Plastic',
    context: 'Plastic pollution is harming our environment. Write an essay on why we should reduce our use of plastic.',
    bulletPoints: [
      'The impact of plastic on wildlife and oceans',
      'Simple ways to reduce plastic usage in daily life',
      'Is a total ban on plastic possible? Why or why not?'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Managing Stress during Exams',
    context: 'Exam seasons can be very stressful for students. Write an essay on how to manage stress effectively.',
    bulletPoints: [
      'Symptoms of stress among students',
      'Effective study and relaxation techniques',
      'The importance of getting support from others'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'The World Without Trees',
    context: 'Deforestation is a global threat to our survival. Write an essay about the importance of forests.',
    bulletPoints: [
      'The functions of forests for the environment',
      'The effects of uncontrolled logging',
      'Actions we can take to save our forests'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Benefits of Outdoor Activities',
    context: 'Modern children spend too much time indoors. Write an essay about the benefits of outdoor activities.',
    bulletPoints: [
      'Types of outdoor activities for teenagers',
      'Physical health benefits',
      'How it helps with social and mental well-being'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Public Transport and the Environment',
    context: 'Using public transport can help to reduce our carbon footprint. Write an essay about this.',
    bulletPoints: [
      'The link between car usage and air pollution',
      'Advantages of using buses and trains',
      'How to encourage more people to use public transport'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Water Conservation at Home',
    context: 'Water is a precious resource that we often take for granted. Write an essay about saving water.',
    bulletPoints: [
      'Why we should not waste water',
      'Simple tips to save water at home',
      'The importance of educating the younger generation'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'The Importance of a Balanced Diet',
    context: 'Many teenagers prefer fast food over healthy meals. Write an essay about the importance of a balanced diet.',
    bulletPoints: [
      'What should a balanced diet consist of?',
      'The long-term effects of poor eating habits',
      'How to make healthy eating a habit'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'E-waste Management',
    context: 'Electronic waste or e-waste is a growing environmental problem. Write an essay on how to manage it.',
    bulletPoints: [
      'What is e-waste and why is it dangerous?',
      'How to dispose of electronics properly',
      'The 3Rs in relation to electronic devices'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Mental Well-being for Students',
    context: 'Mental health is just as important as physical health. Write an essay about mental well-being.',
    bulletPoints: [
      'Factors that affect a student\'s mental well-being',
      'Common mental health issues found among youth',
      'Where to seek help if one is struggling'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'The Miracle of Coral Reefs',
    context: 'Coral reefs are often called the rainforests of the sea. Write an essay about protecting them.',
    bulletPoints: [
      'The importance of coral reefs for marine life',
      'Threats to coral reefs today',
      'How tourism can be sustainable for reef protection'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Personal Hygiene Habits',
    context: 'Good personal hygiene is the first line of defense against diseases. Write an essay about its importance.',
    bulletPoints: [
      'Essential hygiene practices for teenagers',
      'How it prevents the spread of infections',
      'The connection between hygiene and self-confidence'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Climate Change and Us',
    context: 'Climate change is the biggest challenge of our time. Write an essay about what we can do.',
    bulletPoints: [
      'The signs of climate change in our country',
      'The role of human activities in global warming',
      'Small steps individuals can take to make a difference'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'The Danger of Smoking and Vaping',
    context: 'Many young people are picking up smoking or vaping. Write an essay on their dangers.',
    bulletPoints: [
      'The health risks of smoking and vaping',
      'Why do teenagers start these habits?',
      'Ways to stay away from peer pressure'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Eco-Friendly Shopping',
    context: 'Being a green consumer is good for the environment. Write an essay about eco-friendly shopping.',
    bulletPoints: [
      'Choosing products with less packaging',
      'Supporting local and organic products',
      'The importance of bringing your own bag'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'The Importance of Sleep',
    context: 'Many students stay up late to study or play games. Write an essay about the importance of sleep.',
    bulletPoints: [
      'The functions of sleep for the brain and body',
      'The consequences of sleep deprivation',
      'Tips for getting a good night\'s rest'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Living in a Sustainable House',
    context: 'Sustainable houses use fewer resources and produce less waste. Write an essay about these houses.',
    bulletPoints: [
      'Features of an eco-friendly house',
      'Benefits for the homeowners and the environment',
      'Is it possible to turn an old house into a sustainable one?'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Natural Disaster Preparedness',
    context: 'Being prepared can save lives during a natural disaster. Write an essay about disaster preparedness.',
    bulletPoints: [
      'Common natural disasters in Malaysia',
      'Essential items for an emergency kit',
      'The importance of knowing safety procedures'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },

  // --- SCIENCE AND TECHNOLOGY (20) ---
  {
    title: 'The Impact of Social Media',
    context: 'Social media has changed the way we communicate. Write an essay discussing its impact.',
    bulletPoints: [
      'Positive effects of social media',
      'Negative consequences for teenagers',
      'The importance of using social media responsibly'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Artificial Intelligence in Education',
    context: 'AI is becoming more common in schools. Write an essay about its role in education.',
    bulletPoints: [
      'How AI can help students and teachers',
      'Concerns about academic integrity and cheating',
      'The future of learning with AI technology'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Are We Too Dependent on Technology?',
    context: 'Technology is everywhere, and many fear we rely on it too much. Write an essay about this.',
    bulletPoints: [
      'Examples of how technology simplifies our life',
      'Risks of over-reliance on gadgets',
      'How to balance technology use with real-life interactions'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'The Future of Public Transport',
    context: 'Autonomous vehicles and high-speed trains are the talk of the town. Write an essay about the future of transportation.',
    bulletPoints: [
      'New technologies currently being used in transport',
      'Benefits for the environment and commuters',
      'Challenges in implementing these technologies'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Cybersecurity for Teenagers',
    context: 'Internet safety is a major concern today. Write an essay about cybersecurity.',
    bulletPoints: [
      'Common online threats for youth',
      'Ways to protect personal information',
      'The role of schools in teaching internet safety'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'The World of E-sports',
    context: 'E-sports have become a multi-million dollar industry. Write an essay about this trend.',
    bulletPoints: [
      'The rise of professional gaming',
      'Can gaming be a viable career path?',
      'Pros and cons of being a professional gamer'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Space Tourism: A New Frontier',
    context: 'Companies are now offering trips to space for wealthy individuals. Write an essay about space tourism.',
    bulletPoints: [
      'The appeal of traveling to space',
      'The environmental and ethical concerns',
      'Will space travel ever be affordable for common people?'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Renewable Energy Technologies',
    context: 'We need cleaner ways to produce energy. Write an essay about renewable energy.',
    bulletPoints: [
      'Types of renewable energy (Solar, Wind, etc.)',
      'How these technologies work',
      'The importance of switching from fossil fuels'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Robots in Our Daily Life',
    context: 'Robots are no longer just science fiction. Write an essay about their roles today.',
    bulletPoints: [
      'How robots help in industries and homes',
      'The fear of robots taking over jobs',
      'Future possibilities of robotics'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Online Shopping: Convenience or Curse?',
    context: 'E-commerce has boomed in recent years. Write an essay about online shopping.',
    bulletPoints: [
      'Why people prefer shopping online',
      'The hidden dangers and scams',
      'How to shop safely and wisely'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'The Power of the Internet',
    context: 'The internet is a vast source of information. Write an essay about its benefits and drawbacks.',
    bulletPoints: [
      'How the internet has revolutionized learning',
      'The problem of fake news and misinformation',
      'Tips for being a smart internet user'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Mobile Apps for Students',
    context: 'There are many apps designed specifically for education. Write an essay about them.',
    bulletPoints: [
      'Useful apps for organizing and studying',
      'How these apps improve productivity',
      'Are they better than traditional methods?'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: '3D Printing Technology',
    context: '3D printing is being used to create everything from toys to organs. Write an essay about this technology.',
    bulletPoints: [
      'How 3D printing works',
      'Current applications in various fields',
      'The limitations and future potential'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Virtual Reality in Education',
    context: 'VR can create immersive learning experiences. Write an essay about using VR in the classroom.',
    bulletPoints: [
      'The potential of VR for subjects like history and science',
      'Benefits for student engagement',
      'Challenges such as cost and equipment'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Smart Homes: The Future of Living',
    context: 'Smart home devices allow us to control our houses using our phones. Write an essay about them.',
    bulletPoints: [
      'Popular smart home features (Lighting, Security, etc.)',
      'The advantages of living in a smart home',
      'Concerns regarding privacy and security'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Technological Inventions for a Healthy Life',
    context: 'Wearable gadgets can track our health and activity. Write an essay about health-tech.',
    bulletPoints: [
      'Common health gadgets (Smartwatches, Fitness trackers)',
      'How they encourage a healthy lifestyle',
      'Are they always accurate?'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'The Challenge of Fake News',
    context: 'Fake news spreads faster than the truth on the internet. Write an essay about this issue.',
    bulletPoints: [
      'Why fake news is dangerous',
      'How to spot fake information',
      'The responsibility of social media companies'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Ethics in Science',
    context: 'Scientific advancements can sometimes raise ethical questions. Write an essay about this.',
    bulletPoints: [
      'Examples of ethical dilemmas in science (e.g., cloning)',
      'Why we need rules and guidelines for scientists',
      'The role of the public in scientific debates'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Building a Tech Startup',
    context: 'Many youngsters plan to build their own tech companies. Write an essay about being an entrepreneur.',
    bulletPoints: [
      'What skills are needed to start a tech company?',
      'The challenges faced by young entrepreneurs',
      'Success stories that inspire you'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'The Role of Modern Science in Medicine',
    context: 'New scientific discoveries lead to better treatments for diseases. Write an essay about this.',
    bulletPoints: [
      'Major medical breakthroughs in recent years',
      'The role of genetic engineering and biotechnology',
      'The hope for the future of medicine'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },

  // --- CONSUMERISM AND FINANCIAL AWARENESS (20) ---
  {
    title: 'Managing Pocket Money',
    context: 'Many students find it difficult to manage their allowance. Write an essay about saving money.',
    bulletPoints: [
      'Why is it important to save money?',
      'Practical tips for saving pocket money',
      'The benefits of being financially independent'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'The Influence of Advertising on Youth',
    context: 'Advertisements are everywhere, targetting young consumers. Write an essay about their influence.',
    bulletPoints: [
      'How ads affect our buying choices',
      'The danger of "wanting" rather than "needing"',
      'Tips for being a smart consumer'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Online Shopping: Pros and Cons',
    context: 'Online shopping is a lifestyle for many. Write an essay discussing its advantages and disadvantages.',
    bulletPoints: [
      'Why people prefer shopping online',
      'Risks of overspending and scams',
      'How to shop responsibly'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'The Importance of Budgeting',
    context: 'Budgeting helps people track their expenses. Write an essay about the importance of budgeting.',
    bulletPoints: [
      'What is a budget?',
      'How to create a simple budget plan',
      'The long-term benefits of budgeting'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Consumer Rights and Responsibilities',
    context: 'Consumers should know their rights. Write an essay about being an informed consumer.',
    bulletPoints: [
      'The basic rights of a consumer',
      'What to do if you are treated unfairly by a seller',
      'The responsibility of a consumer for a sustainable future'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'The Trap of Credit Cards',
    context: 'Credit cards can lead to serious debt if misused. Write an essay discussing this issue.',
    bulletPoints: [
      'How credit cards work',
      'The dangers of high-interest rates and overspending',
      'Advice for first-time credit card users'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Saving for University Education',
    context: 'Higher education is expensive today. Write an essay about saving for university.',
    bulletPoints: [
      'The costs of university education',
      'Benefits of starting to save early',
      'Ways to fund university (Scholarships, Loans, etc.)'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Recognizing Financial Scams',
    context: 'Financial scams are becoming more sophisticated. Write an essay about how to avoid them.',
    bulletPoints: [
      'Common types of financial scams',
      'Warning signs of a scam',
      'Who to contact if you suspect a scam'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'The Value of Thrift Shopping',
    context: 'Thrift shopping is both eco-friendly and budget-friendly. Write an essay about its popularity.',
    bulletPoints: [
      'Reasons for the rise in thrift shopping',
      'Benefits for the wallet and the planet',
      'Is thrift shopping always a good choice?'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Money Management for Fresh Graduates',
    context: 'Starting your first job requires good financial planning. Write an essay about money management.',
    bulletPoints: [
      'Essential first steps in managing your salary',
      'Saving for emergencies vs saving for big purchases',
      'The importance of financial discipline'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Peer Pressure and Spending Habits',
    context: 'Wanting to fit in can lead to unnecessary spending. Write an essay about this problem.',
    bulletPoints: [
      'How peers influence our buying choices',
      'The cost of "keeping up with the Joneses"',
      'Strategies to resist peer pressure'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Comparing Products before Buying',
    context: 'Smart consumers always compare before they pay. Write an essay about product comparison.',
    bulletPoints: [
      'Important factors to consider (Quality, Price, Reviews)',
      'The role of the internet in product research',
      'How comparing saves money in the long run'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Is Branding Always Better?',
    context: 'Many people believe branded items are higher quality. Write an essay discussing this.',
    bulletPoints: [
      'The appeal of branded products',
      'Are they always worth the extra cost?',
      'Tips for choosing based on value rather than name'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Financial Literacy in Schools',
    context: 'Should financial literacy be a compulsory subject in schools? Write an essay on this topic.',
    bulletPoints: [
      'Why students need to learn about money',
      'What should the syllabus include?',
      'The benefits for the future economy'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'E-Wallets and the Future of Cash',
    context: 'Digital payments are becoming more popular than cash. Write an essay about e-wallets.',
    bulletPoints: [
      'The convenience of using e-wallets',
      'Potential risks and security concerns',
      'Will cash eventually disappear?'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Ethical Consumerism',
    context: 'Ethical consumers choose products that do not harm people or the environment. Write an essay about this.',
    bulletPoints: [
      'What is ethical consumerism?',
      'How to identify ethical brands',
      'The impact of our choices on global issues'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'The Danger of Impulse Buying',
    context: 'Buying things on a whim can leave your wallet empty. Write an essay on how to stop impulse buying.',
    bulletPoints: [
      'Common triggers for impulse buying',
      'The long-term regret of unnecessary purchases',
      'The "30-day rule" and other strategies'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Building an Emergency Fund',
    context: 'An emergency fund is essential for financial security. Write an essay about its importance.',
    bulletPoints: [
      'What qualifies as a financial emergency?',
      'How much should be in an emergency fund?',
      'Tips for starting an emergency fund from scratch'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'The True Cost of Fast Fashion',
    context: 'Cheap clothes often come with high environmental and human costs. Write an essay about this issue.',
    bulletPoints: [
      'The impact of fast fashion on the world',
      'The hidden labor costs in producing cheap clothes',
      'How to be a sustainable fashion consumer'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Planning for Financial Goals',
    context: 'Setting goals is the first step to financial success. Write an essay about setting financial goals.',
    bulletPoints: [
      'Short-term vs long-term financial goals',
      'Why it is important to have a plan',
      'Reviewing and adjusting your goals over time'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Organising a School Charity Bazaar',
    context: 'Your school recently held a charity bazaar to raise funds for a local orphanage. Write an essay about your experience in organising the event.',
    bulletPoints: [
      'The preparations made before the event',
      'The challenges your team faced during the bazaar',
      'How the funds raised will benefit the orphanage'
    ],
    theme: 'Consumerism and Financial Awareness',
    practiceMode: 'Full'
  },
  {
    title: 'Dealing with Cyberbullying in School',
    context: 'There has been a rise in cyberbullying cases among students in your school. Your teacher has asked you to write an essay on how to address this problem.',
    bulletPoints: [
      'Common forms of cyberbullying seen among students',
      'The emotional impact on the victims',
      'Effective ways the school and students can stop cyberbullying'
    ],
    theme: 'Science and Technology',
    practiceMode: 'Full'
  },
  {
    title: 'Improving Local Public Transport',
    context: 'Many students have complained about the unreliable bus services to school. Write an essay suggesting ways to improve public transport in your area.',
    bulletPoints: [
      'The main problems with the current bus services',
      'Suggestions for improving efficiency and safety',
      'The benefits of a better transport system for students'
    ],
    theme: 'Health and Environment',
    practiceMode: 'Full'
  },
  {
    title: 'Hosting a Cultural Exchange Day',
    context: 'Your school is planning to host a Cultural Exchange Day for international students. Write an essay about what activities should be included.',
    bulletPoints: [
      'Traditional Malaysian food and games to showcase',
      'How to involve all students in the celebration',
      'The importance of cultural understanding among youth'
    ],
    theme: 'People and Culture',
    practiceMode: 'Full'
  }
];

export const PART3_QUESTION_BANK: SPMTask[] = [
  // --- PEOPLE AND CULTURE (Article) ---
  {
    title: 'The Importance of Traditional Festivals',
    context: 'Traditional festivals are becoming less popular among the younger generation. Write an article for your school magazine discussing why we should preserve our festivals.',
    bulletPoints: [
      'The reasons why festivals are important to our identity',
      'The role of modern technology in changing how we celebrate',
      'Ways to encourage youth to participate in traditional festivities'
    ],
    theme: 'People and Culture',
    essayType: 'Article',
    practiceMode: 'Full'
  },
  {
    title: 'Respecting Our Elders',
    context: 'Respect for elders is a key value in many cultures. Write an article for your school newsletter about why this value is still relevant today.',
    bulletPoints: [
      'The benefits of listening to elder wisdom',
      'How to show respect in everyday life',
      'The impact of respect on community harmony'
    ],
    theme: 'People and Culture',
    essayType: 'Article',
    practiceMode: 'Full'
  },
  // --- PEOPLE AND CULTURE (Story) ---
  {
    title: 'A Cultural Misunderstanding',
    context: 'Write a story about a person who visited a different community and experienced a cultural misunderstanding. Your story should end with: "...I realized then that differences make us stronger."',
    bulletPoints: [
      'Setting the scene and the characters involved',
      'The nature of the misunderstanding',
      'How it was resolved and the lesson learned'
    ],
    theme: 'People and Culture',
    essayType: 'Story',
    practiceMode: 'Full'
  },
  // --- HEALTH AND ENVIRONMENT (Report) ---
  {
    title: 'Report on School Cleanliness',
    context: 'As the secretary of the Environmental Club, write a report to your principal about the cleanliness of the school premises.',
    bulletPoints: [
      'Current state of cleanliness in the canteen and toilets',
      'The main causes of the littering problem',
      'Recommendations for improvement'
    ],
    theme: 'Health and Environment',
    essayType: 'Report',
    practiceMode: 'Full'
  },
  // --- SCIENCE AND TECHNOLOGY (Review) ---
  {
    title: 'A Review of a New Educational App',
    context: 'You have recently tried a new app that helps students with their studies. Write a review for a gadgets magazine.',
    bulletPoints: [
      'Description of the app and its features',
      'What you liked and disliked about it',
      'Whether you would recommend it to other students'
    ],
    theme: 'Science and Technology',
    essayType: 'Review',
    practiceMode: 'Full'
  },
  // --- CONSUMERISM AND FINANCIAL AWARENESS (Speech) ---
  {
    title: 'Financial Planning for Teenagers',
    context: 'You have been invited to give a speech during the school assembly about the importance of saving money.',
    bulletPoints: [
      'Why teenagers need to start saving early',
      'Practical tips on how to save pocket money',
      'The benefits of being financially independent'
    ],
    theme: 'Consumerism and Financial Awareness',
    essayType: 'Speech',
    practiceMode: 'Full'
  },
  // --- HEALTH AND ENVIRONMENT (Article) ---
  {
    title: 'The Plastic Menace',
    context: 'Plastic pollution is at an all-time high. Write an article for your school magazine about how we can reduce plastic waste in our daily lives.',
    bulletPoints: [
      'The harmful effects of plastic on the ocean and wildlife',
      'Simple swaps we can make (e.g., reusable bags, straws)',
      'Why community effort is key to a plastic-free future'
    ],
    theme: 'Health and Environment',
    essayType: 'Article',
    practiceMode: 'Full'
  },
  // --- SCIENCE AND TECHNOLOGY (Email) ---
  {
    title: 'Digital Literacy for Seniors',
    context: 'Your local community center is starting a program to teach senior citizens how to use smartphones. They have asked you to write an email to the residents explaining the benefits.',
    bulletPoints: [
      'Why it is important for seniors to stay connected digitally',
      'What the program will cover (e.g., video calls, online safety)',
      'How they can sign up for the free classes'
    ],
    theme: 'Science and Technology',
    essayType: 'Email',
    practiceMode: 'Full'
  },
  // --- CONSUMERISM AND FINANCIAL AWARENESS (Review) ---
  {
    title: 'Review: Budget-Friendly Smartphones',
    context: 'You have recently compared several affordable smartphones. Write a review discussing which one provides the best value for money.',
    bulletPoints: [
      'Top 3 budget features to look for',
      'Comparison of performance and camera quality',
      'Final verdict on the best choice for students'
    ],
    theme: 'Consumerism and Financial Awareness',
    essayType: 'Review',
    practiceMode: 'Full'
  },
  // --- PEOPLE AND CULTURE (Speech) ---
  {
    title: 'Harmony in Diversity',
    context: 'Write a speech for your school\'s Unity Day about the beauty of Malaysia\'s multicultural society.',
    bulletPoints: [
      'What makes Malaysia unique',
      'Examples of how different cultures interact daily',
      'The importance of tolerance and mutual respect'
    ],
    theme: 'People and Culture',
    essayType: 'Speech',
    practiceMode: 'Full'
  },
  // --- HEALTH AND ENVIRONMENT (Review) ---
  {
    title: 'Review of a Local Eco-Park',
    context: 'You visited a newly opened eco-park that focuses on sustainability. Write a review for a travel blog.',
    bulletPoints: [
      'The unique features of the park',
      'Educational value for visitors',
      'Facilities and maintenance quality'
    ],
    theme: 'Health and Environment',
    essayType: 'Review',
    practiceMode: 'Full'
  },
  // --- PEOPLE AND CULTURE (Report) ---
  {
    title: 'Report on Traditional Games Workshop',
    context: 'Your school recently held a workshop on traditional games. As the chairperson of the Culture Club, write a report for the school magazine.',
    bulletPoints: [
      'The types of games played',
      'The number of participants and their feedback',
      'Suggestions for future cultural workshops'
    ],
    theme: 'People and Culture',
    essayType: 'Report',
    practiceMode: 'Full'
  },
  // --- SCIENCE AND TECHNOLOGY (Article) ---
  {
    title: 'Living in a Smart Home',
    context: 'Smart home technology is becoming more affordable. Write an article for your school magazine about the pros and cons of living in a "smart" house.',
    bulletPoints: [
      'The convenience of smart devices (security, energy)',
      'Potential privacy and security risks',
      'The impact on our dependency on technology'
    ],
    theme: 'Science and Technology',
    essayType: 'Article',
    practiceMode: 'Full'
  },
  // --- CONSUMERISM AND FINANCIAL AWARENESS (Email) ---
  {
    title: 'Managing University Expenses',
    context: 'You have been asked to help a group of Year 11 students prepare for their university life. Write an email sharing tips on how to manage their expenses effectively.',
    bulletPoints: [
      'Budgeting for food and textbooks',
      'Finding part-time jobs on campus',
      'The importance of saving for emergencies'
    ],
    theme: 'Consumerism and Financial Awareness',
    essayType: 'Email',
    practiceMode: 'Full'
  },
  // --- HEALTH AND ENVIRONMENT (Story) ---
  {
    title: 'The Great Flood',
    context: 'Write a story about a community coming together to survive a natural disaster. Your story should begin with: "The rain had been falling for three days without stopping..."',
    bulletPoints: [
      'The escalation of the flood',
      'The act of bravery or teamwork observed',
      'The aftermath and the feeling of hope'
    ],
    theme: 'Health and Environment',
    essayType: 'Story',
    practiceMode: 'Full'
  },
  // --- SCIENCE AND TECHNOLOGY (Speech) ---
  {
    title: 'The Ethics of Robotics',
    context: 'You are participating in a regional public speaking competition. Your topic is: "Will Robots Replace Humans in the Workplace?"',
    bulletPoints: [
      'Jobs that are most at risk of automation',
      'The unique qualities humans have (empathy, creativity)',
      'How humans can adapt to a tech-driven future'
    ],
    theme: 'Science and Technology',
    essayType: 'Speech',
    practiceMode: 'Full'
  },
  // --- PEOPLE AND CULTURE (Review) ---
  {
    title: 'Review: Local Arts Festival',
    context: 'You attended a local arts and culture festival featuring music, dance, and crafts. Write a review for your school blog.',
    bulletPoints: [
      'The highlights of the performances',
      'The variety of cultural exhibitions',
      'Recommendations for visitors next year'
    ],
    theme: 'People and Culture',
    essayType: 'Review',
    practiceMode: 'Full'
  },
  // --- PEOPLE AND CULTURE (Email) ---
  {
    title: 'Cultural Exchange Program',
    context: 'You are interested in joining a cultural exchange program to Japan. Write an email to the program coordinator expressing your interest.',
    bulletPoints: [
      'Why you want to learn about Japanese culture',
      'How you can contribute as a representative of Malaysia',
      'Ask about the travel and accommodation details'
    ],
    theme: 'People and Culture',
    essayType: 'Email',
    practiceMode: 'Full'
  },
  // --- HEALTH AND ENVIRONMENT (Speech) ---
  {
    title: 'Mental Health Awareness',
    context: 'As the president of the Counseling Club, write a speech for Mental Health Day about the importance of managing stress among students.',
    bulletPoints: [
      'The common causes of academic stress',
      'Practical ways to maintain mental well-being (hobbies, sleep)',
      'Where to seek help within the school'
    ],
    theme: 'Health and Environment',
    essayType: 'Speech',
    practiceMode: 'Full'
  },
  // --- HEALTH AND ENVIRONMENT (Email) ---
  {
    title: 'Community Garden Project',
    context: 'You want to start a community garden in your neighborhood to grow organic vegetables. Write an email to your local council seeking permission and support.',
    bulletPoints: [
      'The benefits of a community garden for the environment',
      'How the project will involve local residents',
      'Requested resources (space, tools, seeds)'
    ],
    theme: 'Health and Environment',
    essayType: 'Email',
    practiceMode: 'Full'
  },
  // --- SCIENCE AND TECHNOLOGY (Story) ---
  {
    title: 'The Day Without Internet',
    context: 'Write a story about a day when a global technical glitch caused all internet connections to fail. Your story should begin with: "The screen flickered three times and then went black."',
    bulletPoints: [
      'The initial confusion and panic',
      'A humorous or challenging situation that occurred',
      'How people eventually adjusted and connected offline'
    ],
    theme: 'Science and Technology',
    essayType: 'Story',
    practiceMode: 'Full'
  },
  // --- SCIENCE AND TECHNOLOGY (Report) ---
  {
    title: 'Report on IT Laboratory Facilities',
    context: 'As the head prefect, write a report to the school board about the state of the computer laboratories and suggestion for upgrades.',
    bulletPoints: [
      'Current issues with hardware and software',
      'How these issues affect students\' learning',
      'Proposed budget and priority upgrades'
    ],
    theme: 'Science and Technology',
    essayType: 'Report',
    practiceMode: 'Full'
  },
  // --- CONSUMERISM AND FINANCIAL AWARENESS (Article) ---
  {
    title: 'Smart Shopping in the Digital Age',
    context: 'Online shopping is very popular among teenagers. Write an article for your school magazine about the benefits and risks of being an online consumer.',
    bulletPoints: [
      'Convenience and variety of online products',
      'Common scams and how to avoid them',
      'The importance of comparing prices before buying'
    ],
    theme: 'Consumerism and Financial Awareness',
    essayType: 'Article',
    practiceMode: 'Full'
  },
  // --- CONSUMERISM AND FINANCIAL AWARENESS (Story) ---
  {
    title: 'The Lesson of the Empty Wallet',
    context: 'Write a story about a teenager who spent all their savings on a luxury item only to regret it later. Your story should end with: "...I finally understood that value is not found in a price tag."',
    bulletPoints: [
      'The excitement of the purchase',
      'The realization of the consequences (missing a better opportunity)',
      'The resolution and the change in mindset'
    ],
    theme: 'Consumerism and Financial Awareness',
    essayType: 'Story',
    practiceMode: 'Full'
  },
  // --- CONSUMERISM AND FINANCIAL AWARENESS (Report) ---
  {
    title: 'Report on School Canteen Prices',
    context: 'As a member of the Student Council, write a report to your teacher advisor about the rising prices of food in the school canteen.',
    bulletPoints: [
      'Comparison of current prices with previous years',
      'Student feedback on the increase',
      'Suggestions for maintaining affordable prices for students'
    ],
    theme: 'Consumerism and Financial Awareness',
    essayType: 'Report',
    practiceMode: 'Full'
  },
  // --- PEOPLE AND CULTURE (Story) ---
  {
    title: 'An Unforgettable Homecoming',
    context: 'Write a story about someone returning to their hometown for a festival after being away for many years. Start your story with: "As the train pulled into the station, I felt a rush of memories..."',
    bulletPoints: [
      'The initial feelings and observations of changes',
      'Reconnecting with a specific person or place',
      'The celebration of the festival and a sense of belonging'
    ],
    theme: 'People and Culture',
    essayType: 'Story',
    practiceMode: 'Full'
  },
  // --- HEALTH AND ENVIRONMENT (Article) ---
  {
    title: 'Preserving Our Local Rivers',
    context: 'Many rivers in our country are heavily polluted. Write an article for an environmental magazine about why and how we should save our water sources.',
    bulletPoints: [
      'The ecological impact of water pollution',
      'The role of local industries and citizens',
      'Proposed solutions for river restoration'
    ],
    theme: 'Health and Environment',
    essayType: 'Article',
    practiceMode: 'Full'
  },
  // --- SCIENCE AND TECHNOLOGY (Review) ---
  {
    title: 'Review: A Future-Themed Movie',
    context: 'You recently watched a science fiction movie about Earth in the year 2050. Write a review for the cinema column of your school newspaper.',
    bulletPoints: [
      'The plot and the technological concepts presented',
      'The visual effects and acting quality',
      'Whether the movie\'s message about the future is convincing'
    ],
    theme: 'Science and Technology',
    essayType: 'Review',
    practiceMode: 'Full'
  },
  // --- CONSUMERISM AND FINANCIAL AWARENESS (Speech) ---
  {
    title: 'The Pitfalls of Credit Cards',
    context: 'As a financial counselor, write a speech for high school graduates about using credit cards responsibly.',
    bulletPoints: [
      'How interest rates and debt can accumulate',
      'The difference between "wants" and "needs"',
      'Strategies for building a good credit score early'
    ],
    theme: 'Consumerism and Financial Awareness',
    essayType: 'Speech',
    practiceMode: 'Full'
  },
  // --- PEOPLE AND CULTURE (Report) ---
  {
    title: 'Report on Heritage Visit',
    context: 'As the secretary of the History Club, write a report about a study trip to a historical site in Malaysia.',
    bulletPoints: [
      'Description of the site and its historical importance',
      'Activities conducted during the visit (guided tour, sketching)',
      'How the trip helped students appreciate their heritage'
    ],
    theme: 'People and Culture',
    essayType: 'Report',
    practiceMode: 'Full'
  },
  // --- HEALTH AND ENVIRONMENT (Review) ---
  {
    title: 'Review: An Organic Restaurant',
    context: 'You visited a restaurant that serves meals made from locally sourced organic ingredients. Write a review for a health magazine.',
    bulletPoints: [
      'The quality and taste of the organic dishes',
      'The ambiance and customer service',
      'Price comparison with non-organic alternatives'
    ],
    theme: 'Health and Environment',
    essayType: 'Review',
    practiceMode: 'Full'
  },
  // --- SCIENCE AND TECHNOLOGY (Email) ---
  {
    title: 'Coding for Kids Initiative',
    context: 'You are organizing a coding workshop for primary school students. Write an email to the school headmasters inviting their students to join.',
    bulletPoints: [
      'The importance of computational thinking',
      'Brief details of the workshop (duration, equipment needed)',
      'How to register the students'
    ],
    theme: 'Science and Technology',
    essayType: 'Email',
    practiceMode: 'Full'
  },
  // --- CONSUMERISM AND FINANCIAL AWARENESS (Article) ---
  {
    title: 'Supporting Local Products',
    context: 'Write an article for a business magazine about why consumers should prioritize buying "Made in Malaysia" products.',
    bulletPoints: [
      'The economic benefits for local small businesses',
      'The environmental impact (lower carbon footprint)',
      'The pride in our national identity and craftsmanship'
    ],
    theme: 'Consumerism and Financial Awareness',
    essayType: 'Article',
    practiceMode: 'Full'
  },
  // --- HEALTH AND ENVIRONMENT (Story) ---
  {
    title: 'The Secret Garden',
    context: 'Write a story about a group of children who transform a vacant, trash-filled lot into a beautiful garden. End your story with: "...the neighborhood was never the same again."',
    bulletPoints: [
      'The discovery of the lot and the initial plan',
      'The hard work and cooperation of the group',
      'The reaction of the neighbors and the final result'
    ],
    theme: 'Health and Environment',
    essayType: 'Story',
    practiceMode: 'Full'
  },
  // --- PEOPLE AND CULTURE (Article) ---
  {
    title: 'Preserving Indigenous Languages',
    context: 'Some indigenous languages in Malaysia are at risk of disappearing. Write an article for a cultural journal about why we must protect linguistic diversity.',
    bulletPoints: [
      'The link between language and cultural heritage',
      'The role of the community in teaching the youth',
      'Government and NGO efforts to record these languages'
    ],
    theme: 'People and Culture',
    essayType: 'Article',
    practiceMode: 'Full'
  }
];

