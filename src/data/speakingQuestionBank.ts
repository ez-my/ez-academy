
export interface SpeakingPart2Topic {
  id: string;
  theme: 'People and Culture' | 'Health and Environment' | 'Science and Technology' | 'Consumerism and Financial Awareness';
  topic: string;
  prompts: string[];
  prepTip: string;
}

export interface SpeakingPart3Topic {
  id: string;
  theme: 'People and Culture' | 'Health and Environment' | 'Science and Technology' | 'Consumerism and Financial Awareness';
  topic: string;
  prompts: string[];
  guides?: string[];
  decisionQuestion: string;
  hotQuestion: string;
}

export const SPEAKING_PART2_BANK: SpeakingPart2Topic[] = [
  // --- PEOPLE AND CULTURE (10) ---
  {
    id: 'sp2_pc_1',
    theme: 'People and Culture',
    topic: 'Talk about a traditional craft in your community.',
    prompts: ['What the craft is', 'How it is made', 'Who usually makes it', 'Why it is important to preserve it'],
    prepTip: 'Think about the materials used, like wood, fabric, or clay, to add specific detail to your description.'
  },
  {
    id: 'sp2_pc_2',
    theme: 'People and Culture',
    topic: 'Talk about a local legend or story from your hometown.',
    prompts: ['What the story is about', 'The characters in the story', 'What happened in the end', 'The lesson learned from it'],
    prepTip: 'Use storytelling words like "Once upon a time," "Eventually," and "As a result" to guide your narrative.'
  },
  {
    id: 'sp2_pc_3',
    theme: 'People and Culture',
    topic: 'Talk about an important historical building in your country.',
    prompts: ['Where the building is', 'What it looks like', 'What happened there in the past', 'Why students should visit it'],
    prepTip: 'Visualize the architectural style—is it old, colonial, or traditional? Use adjectives to paint a picture.'
  },
  {
    id: 'sp2_pc_4',
    theme: 'People and Culture',
    topic: 'Talk about a traditional game you played as a child.',
    prompts: ['What the game is', 'How it is played', 'Who you played it with', 'Why you enjoyed it'],
    prepTip: 'Explain the simple rules clearly so the listener can imagine the game being played.'
  },
  {
    id: 'sp2_pc_5',
    theme: 'People and Culture',
    topic: 'Talk about a person who is a role model in your community.',
    prompts: ['Who the person is', 'What they have achieved', 'Why they are respected', 'How they inspire you'],
    prepTip: 'Focus on their character traits, such as "perseverance," "kindness," or "leadership."'
  },
  {
    id: 'sp2_pc_6',
    theme: 'People and Culture',
    topic: 'Talk about a cultural event you attended recently.',
    prompts: ['What the event was', 'Where it took place', 'What you saw or did there', 'How you felt during the event'],
    prepTip: 'Describe the sounds and smells (like music or traditional food) to make your talk more immersive.'
  },
  {
    id: 'sp2_pc_7',
    theme: 'People and Culture',
    topic: 'Talk about a traditional dish that is unique to your region.',
    prompts: ['What the dish is', 'The main ingredients', 'When it is usually eaten', 'Why it is special to you'],
    prepTip: 'Use words like "fragrant," "spicy," or "tender" to describe the flavors vividly.'
  },
  {
    id: 'sp2_pc_8',
    theme: 'People and Culture',
    topic: 'Talk about a family tradition that you want to continue.',
    prompts: ['What the tradition is', 'How often it happens', 'Who is involved', 'Why it is meaningful to your family'],
    prepTip: 'Explain the emotional connection—does it bring the family closer together?'
  },
  {
    id: 'sp2_pc_9',
    theme: 'People and Culture',
    topic: 'Talk about a value that is important in your culture (e.g., respect, hospitality).',
    prompts: ['What the value is', 'How it is shown in daily life', 'An example of when you practiced it', 'Why it is important for society'],
    prepTip: 'Give a specific real-life example to illustrate how this value is applied.'
  },
  {
    id: 'sp2_pc_10',
    theme: 'People and Culture',
    topic: 'Talk about a traditional musical instrument you are interested in.',
    prompts: ['What the instrument is', 'What it is made of', 'The sound it produces', 'Why you find it interesting'],
    prepTip: 'Try to describe the sound—is it "soulful," "upbeat," or "relaxing"?'
  },

  // --- HEALTH AND ENVIRONMENT (10) ---
  {
    id: 'sp2_he_1',
    theme: 'Health and Environment',
    topic: 'Talk about your favorite way to stay fit and healthy.',
    prompts: ['What the activity is', 'How often you do it', 'What equipment you need', 'How it makes you feel'],
    prepTip: 'Mention the mental benefits, like "feeling less stressed" or "having a clearer mind."'
  },
  {
    id: 'sp2_he_2',
    theme: 'Health and Environment',
    topic: 'Talk about a place in nature where you like to spend time.',
    prompts: ['Where the place is', 'What you can see there', 'What you do there', 'Why you like being in nature'],
    prepTip: 'Describe the natural surroundings—are there trees, mountains, or a river? Focus on the tranquility.'
  },
  {
    id: 'sp2_he_3',
    theme: 'Health and Environment',
    topic: 'Talk about an environmental project you participated in.',
    prompts: ['What the project was', 'What your role was', 'What the result was', 'What you learned from it'],
    prepTip: 'Emphasize the teamwork involved and the positive impact on the environment.'
  },
  {
    id: 'sp2_he_4',
    theme: 'Health and Environment',
    topic: 'Talk about how you reduce waste in your daily life.',
    prompts: ['What kind of waste you reduce', 'What actions you take', 'How hard or easy it is', 'Why it matters'],
    prepTip: 'Talk about simple things like "reusable bags" or "composting" to show practical awareness.'
  },
  {
    id: 'sp2_he_5',
    theme: 'Health and Environment',
    topic: 'Talk about a healthy meal you know how to prepare.',
    prompts: ['What the meal is', 'The ingredients used', 'The steps to prepare it', 'Why it is a healthy choice'],
    prepTip: 'Explain the nutritional benefits, like "high in protein" or "full of vitamins."'
  },
  {
    id: 'sp2_he_6',
    theme: 'Health and Environment',
    topic: 'Talk about a sport that you would like to try in the future.',
    prompts: ['What the sport is', 'Why you are interested in it', 'What skills you need to learn', 'Where you would like to do it'],
    prepTip: 'Express your enthusiasm and mention any challenges you might face while learning.'
  },
  {
    id: 'sp2_he_7',
    theme: 'Health and Environment',
    topic: 'Talk about a time you visited a park or garden.',
    prompts: ['Where the park/garden was', 'Who you went with', 'What you did there', 'Why urban green spaces are important'],
    prepTip: 'Mention the contrast between the "concrete jungle" of the city and the "green lung" of the park.'
  },
  {
    id: 'sp2_he_8',
    theme: 'Health and Environment',
    topic: 'Talk about an animal species that is endangered in your country.',
    prompts: ['What animal it is', 'Where it lives', 'Why it is in danger', 'How we can help protect it'],
    prepTip: 'Use words like "habitat loss," "poaching," and "conservation" to demonstrate topic-specific vocabulary.'
  },
  {
    id: 'sp2_he_9',
    theme: 'Health and Environment',
    topic: 'Talk about the importance of drinking enough water.',
    prompts: ['How much water you drink daily', 'The benefits of staying hydrated', 'How you remind yourself to drink', 'The dangers of dehydration'],
    prepTip: 'Think about how water affects your physical performance and brain function.'
  },
  {
    id: 'sp2_he_10',
    theme: 'Health and Environment',
    topic: 'Talk about a habit you want to change to live a more eco-friendly life.',
    prompts: ['What the habit is', 'Why you want to change it', 'How you plan to do it', 'The impact it will have'],
    prepTip: 'Focus on the "before and after" transition—why is the new way better?'
  },

  // --- SCIENCE AND TECHNOLOGY (10) ---
  {
    id: 'sp2_st_1',
    theme: 'Science and Technology',
    topic: 'Talk about a website or app that helps you with your studies.',
    prompts: ['What the website/app is', 'How it works', 'What features you like most', 'How it has improved your learning'],
    prepTip: 'Identify a specific problem the app solved for you, like "understanding complex formulas."'
  },
  {
    id: 'sp2_st_2',
    theme: 'Science and Technology',
    topic: 'Talk about a gadget that you use every day.',
    prompts: ['What the gadget is', 'What you use it for', 'How long you have had it', 'What you would do if it broke'],
    prepTip: 'Describe its design and functionality—is it "sleek," "user-friendly," or "portable"?'
  },
  {
    id: 'sp2_st_3',
    theme: 'Science and Technology',
    topic: 'Talk about an invention that has changed the world.',
    prompts: ['What the invention is', 'When it was invented (if you know)', 'How it changed daily life', 'Why it is so significant'],
    prepTip: 'Contrast life "then" vs "now" to emphasize the impact of the invention.'
  },
  {
    id: 'sp2_st_4',
    theme: 'Science and Technology',
    topic: 'Talk about a science topic you found interesting in school.',
    prompts: ['What the topic was', 'What you learned about it', 'The experiment you did (if any)', 'Why you found it fascinating'],
    prepTip: 'Use scientific terms correctly to show your knowledge of the field.'
  },
  {
    id: 'sp2_st_5',
    theme: 'Science and Technology',
    topic: 'Talk about how you use social media responsibly.',
    prompts: ['Which platforms you use', 'The time you spend online', 'How you avoid online risks', 'The benefits of staying connected'],
    prepTip: 'Discuss the concept of "digital footprint" and "privacy settings."'
  },
  {
    id: 'sp2_st_6',
    theme: 'Science and Technology',
    topic: 'Talk about a technology you would like to see in the future.',
    prompts: ['What the technology is', 'What it could do', 'How it would help people', 'Whether it might be dangerous'],
    prepTip: 'Be creative! Think of something that doesn\'t exist yet, like "instant translator" or "flying cars."'
  },
  {
    id: 'sp2_st_7',
    theme: 'Science and Technology',
    topic: 'Talk about an experience you had with online learning.',
    prompts: ['When and what you studied', 'The platform used', 'The challenges you faced', 'The benefits compared to a physical class'],
    prepTip: 'Talk about "flexibility" and "self-discipline" in the context of remote learning.'
  },
  {
    id: 'sp2_st_8',
    theme: 'Science and Technology',
    topic: 'Talk about a visit to a science museum or exhibition.',
    prompts: ['Where it was', 'What exhibits you saw', 'What you learned', 'Why children should go there'],
    prepTip: 'Recall an interactive display that made a difficult concept easy to understand.'
  },
  {
    id: 'sp2_st_9',
    theme: 'Science and Technology',
    topic: 'Talk about the advantages of using robots in industries.',
    prompts: ['Which industries use robots', 'What tasks they perform', 'How they help workers', 'The risks of automation'],
    prepTip: 'Focus on "efficiency," "precision," and "safety" for boring or dangerous jobs.'
  },
  {
    id: 'sp2_st_10',
    theme: 'Science and Technology',
    topic: 'Talk about why it is important to take breaks from technology.',
    prompts: ['How often you take breaks', 'What activities you do during the break', 'How you feel after a "digital detox"', 'Why eyes and brain need rest'],
    prepTip: 'Connect the usage of screens to physical issues like "eye strain" or "poor posture."'
  },

  // --- CONSUMERISM AND FINANCIAL AWARENESS (10) ---
  {
    id: 'sp2_cf_1',
    theme: 'Consumerism and Financial Awareness',
    topic: 'Talk about a time you saved money for something special.',
    prompts: ['What you were saving for', 'How you saved the money', 'How long it took', 'How you felt when you finally bought it'],
    prepTip: 'Explain the goal-setting process and the satisfaction of "delayed gratification."'
  },
  {
    id: 'sp2_cf_2',
    theme: 'Consumerism and Financial Awareness',
    topic: 'Talk about a purchase you regret making.',
    prompts: ['What you bought', 'Why you decided to buy it', 'What went wrong', 'What you learned from the experience'],
    prepTip: 'Use phrases like "impulse buy" or "influenced by ads" to explain the mistake.'
  },
  {
    id: 'sp2_cf_3',
    theme: 'Consumerism and Financial Awareness',
    topic: 'Talk about how you decide what to buy.',
    prompts: ['How you compare products', 'Where you look for reviews', 'Whether you care about brands', 'The importance of value for money'],
    prepTip: 'Discuss the factors like "quality," "durability," and "price comparison."'
  },
  {
    id: 'sp2_cf_4',
    theme: 'Consumerism and Financial Awareness',
    topic: 'Talk about your experience with online shopping.',
    prompts: ['What you usually buy online', 'The platforms you use', 'The pros and cons', 'How to stay safe from scams'],
    prepTip: 'Talk about the "convenience" versus the "risk of package damage" or "mismatching sizes."'
  },
  {
    id: 'sp2_cf_5',
    theme: 'Consumerism and Financial Awareness',
    topic: 'Talk about a gift you bought for someone else.',
    prompts: ['Who it was for', 'What you decided to buy', 'How much it cost (approximately)', 'The person\'s reaction'],
    prepTip: 'Focus on the "thoughtfulness" behind the gift—why did you choose that specific item?'
  },
  {
    id: 'sp2_cf_6',
    theme: 'Consumerism and Financial Awareness',
    topic: 'Talk about the benefits of shopping during big sales.',
    prompts: ['The types of sales (e.g. 11.11, Year-end)', 'What items you usually hunt for', 'How much you can save', 'The disadvantages of sale crowds'],
    prepTip: 'Discuss the "excitement" of finding a "bargain" or a "steep discount."'
  },
  {
    id: 'sp2_cf_7',
    theme: 'Consumerism and Financial Awareness',
    topic: 'Talk about why it is important for teenagers to learn about money.',
    prompts: ['What skills should be learned', 'Who should teach them', 'What happens if we don\'t manage money well', 'The benefit of starting early'],
    prepTip: 'Focus on "financial literacy" and "independence" for the future.'
  },
  {
    id: 'sp2_cf_8',
    theme: 'Consumerism and Financial Awareness',
    topic: 'Talk about a shop or market that you enjoy visiting.',
    prompts: ['Where it is', 'What they sell', 'What the atmosphere is like', 'Why you prefer it over other shops'],
    prepTip: 'Describe the "vibrant" environment or the "friendly service" of the staff.'
  },
  {
    id: 'sp2_cf_9',
    theme: 'Consumerism and Financial Awareness',
    topic: 'Talk about the influence of social media influencers on your spending.',
    prompts: ['An example of an influencer you follow', 'What products they promote', 'Whether you have ever bought something because of them', 'The danger of following trends'],
    prepTip: 'Discuss critically—do they provide "honest reviews" or is it just "clever marketing"?'
  },
  {
    id: 'sp2_cf_10',
    theme: 'Consumerism and Financial Awareness',
    topic: 'Talk about your thoughts on "Buy Now, Pay Later" schemes.',
    prompts: ['How these schemes work', 'Why they are popular with young people', 'The risks of using them', 'An alternative way to pay'],
    prepTip: 'Explain the concept of "interest-free installments" vs "hidden debt traps."'
  }
];

export const SPEAKING_PART3_BANK: SpeakingPart3Topic[] = [
  // --- PEOPLE AND CULTURE (10) ---
  {
    id: 'sp3_pc_1',
    theme: 'People and Culture',
    topic: 'How to encourage people to visit local museums',
    prompts: ['Lower entrance fees', 'Interactive displays', 'School field trips', 'Social media publicity', 'Modernizing building facilities', 'Exclusive workshops'],
    decisionQuestion: 'Which is the most effective way to make museums more popular among the younger generation?',
    hotQuestion: 'In your opinion, are museums still relevant in the age of the internet where everything can be seen online?'
  },
  {
    id: 'sp3_pc_2',
    theme: 'People and Culture',
    topic: 'Ways to promote racial harmony in a multiracial country',
    prompts: ['Neighborhood gotong-royong', 'Inter-racial sports events', 'Cultural exchange programs', 'Celebrating festivals together', 'Respecting other beliefs', 'Learning different languages'],
    decisionQuestion: 'Which method best fosters a true sense of unity among different ethnic groups?',
    hotQuestion: 'Do you believe that sports can bring people of different backgrounds together more effectively than other activities?'
  },
  {
    id: 'sp3_pc_3',
    theme: 'People and Culture',
    topic: 'The importance of historical sites for the nation',
    prompts: ['Tourism revenue', 'National identity', 'Education for students', 'Architectural heritage', 'Preserving stories of the past', 'Attracting foreign investors'],
    decisionQuestion: 'What is the primary reason why we should spend money to preserve old buildings instead of building new ones?',
    hotQuestion: 'Should historical buildings be demolished if the land is needed for modern shopping malls or housing?'
  },
  {
    id: 'sp3_pc_4',
    theme: 'People and Culture',
    topic: 'How to support local artists and craftsmen',
    prompts: ['Buying local products', 'Government grants', 'Art galleries in schools', 'Online marketplaces', 'Heritage fairs', 'Media publicity'],
    decisionQuestion: 'Which form of support would best ensure the survival of traditional handicrafts?',
    hotQuestion: 'Is it better to preserve traditional arts exactly as they are, or should they be modernized to appeal to today\'s youth?'
  },
  {
    id: 'sp3_pc_5',
    theme: 'People and Culture',
    topic: 'The benefits of learning about other cultures',
    prompts: ['Broadening mindedness', 'Easier travel experiences', 'Personal growth', 'Career opportunities', 'Reducing prejudice', 'Developing empathy'],
    decisionQuestion: 'Which benefit is most significant for an individual living in a globalized world?',
    hotQuestion: 'Do you think globalization is making the world lose its cultural diversity by making everyone act the same way?'
  },
  {
    id: 'sp3_pc_6',
    theme: 'People and Culture',
    topic: 'Ways to revive traditional games',
    prompts: ['Organizing school competitions', 'Mobile game adaptations', 'Community workshops', 'Family play-days', 'Television shows', 'Promoting in parks'],
    decisionQuestion: 'What would most effectively compete with video games to make traditional games fun again?',
    hotQuestion: 'Are traditional games just "toys of the past," or do they teach important social skills that video games cannot?'
  },
  {
    id: 'sp3_pc_7',
    theme: 'People and Culture',
    topic: 'Supporting local tourism after a crisis',
    prompts: ['Cheaper travel packages', 'Safety certifications', 'Virtual tours', 'Supporting local homestays', 'National social media campaign', 'Improvement of facilities'],
    decisionQuestion: 'Which initiative would most successfully convince locals to travel within their own country?',
    hotQuestion: 'Should governments focus on local tourism over international tourism? Why or why not?'
  },
  {
    id: 'sp3_pc_8',
    theme: 'People and Culture',
    topic: 'Encouraging youth to volunteer for community service',
    prompts: ['School credit/points', 'Certificate of appreciation', 'Team-building activities', 'Inspiring success stories', 'Social media challenges', 'Peer influence'],
    decisionQuestion: 'Which motivation is most likely to produce long-term volunteers rather than one-time participants?',
    hotQuestion: 'Should community service be made compulsory for all secondary school students before they graduate?'
  },
  {
    id: 'sp3_pc_9',
    theme: 'People and Culture',
    topic: 'The role of language in national identity',
    prompts: ['Connecting different races', 'Preserving literature/poetry', 'Formal education', 'Sign of patriotism', 'Global communication', 'Official administration'],
    decisionQuestion: 'Which is the most vital role of a national language in a diverse society like ours?',
    hotQuestion: 'Is it possible for a country to have a strong national identity if several languages are spoken? Why?'
  },
  {
    id: 'sp3_pc_10',
    theme: 'People and Culture',
    topic: 'Ways to celebrate our national heroes',
    prompts: ['Producing documentaries', 'Naming roads/buildings after them', 'Incorporating stories in textbooks', 'Statues and monuments', 'Annual awards in their name', 'Interactive online archives'],
    decisionQuestion: 'Which method best ensures that the legacy of our heroes is remembered by future generations?',
    hotQuestion: 'What qualities make someone a "hero" in today\'s modern society compared to the past?'
  },

  // --- HEALTH AND ENVIRONMENT (10) ---
  {
    id: 'sp3_he_1',
    theme: 'Health and Environment',
    topic: 'How to reduce air pollution in urban areas',
    prompts: ['Using public transport', 'Planting more trees', 'Strict laws for factories', 'Zero-emission zones', 'Promoting cycling', 'Car-pooling'],
    decisionQuestion: 'Which strategy would have the most immediate impact on improving city air quality?',
    hotQuestion: 'Should governments ban all petrol cars in city centers? What would be the consequences?'
  },
  {
    id: 'sp3_he_2',
    theme: 'Health and Environment',
    topic: 'Ways to encourage a healthy diet among students',
    prompts: ['Canteen food regulations', 'Nutrition awareness talks', 'School vegetable gardens', 'Peer support groups', 'Celebrity influence', 'Parental involvement'],
    decisionQuestion: 'Which approach is best at changing a student\'s long-term eating habits?',
    hotQuestion: 'Should fast food companies be banned from advertising to children or sponsoring school events?'
  },
  {
    id: 'sp3_he_3',
    theme: 'Health and Environment',
    topic: 'Combatting plastic pollution in the ocean',
    prompts: ['Banning single-use plastic', 'Beach cleaning activities', 'Improved waste management', 'Educating local fishermen', 'Recycling plastic waste', 'Innovating biodegradable alternatives'],
    decisionQuestion: 'What is the most effective long-term solution to stop plastic from entering our oceans?',
    hotQuestion: 'Who should be more responsible for cleaning the oceans: the individuals who litter or the companies that produce the plastic?'
  },
  {
    id: 'sp3_he_4',
    theme: 'Health and Environment',
    topic: 'The benefits of regular physical exercise for youth',
    prompts: ['Reduced stress/anxiety', 'Physical strength/fitness', 'Social interaction', 'Better academic focus', 'Healthy heart/weight', 'Improved sleep quality'],
    decisionQuestion: 'Which is the most persuasive benefit for a teenager who dislikes sports?',
    hotQuestion: 'Is the obsession with "looking fit" on social media helping or hurting the mental health of young people?'
  },
  {
    id: 'sp3_he_5',
    theme: 'Health and Environment',
    topic: 'How to protect our rainforests from destruction',
    prompts: ['Stricter logging laws', 'Satellite monitoring', 'Promoting eco-tourism', 'International funding', 'Involving indigenous communities', 'Boycotting unsustainable products'],
    decisionQuestion: 'Which method best balances environmental protection with economic needs?',
    hotQuestion: 'Can a developing country achieve economic progress without damaging its natural environment?'
  },
  {
    id: 'sp3_he_6',
    theme: 'Health and Environment',
    topic: 'Dealing with the mental health of students during exams',
    prompts: ['Counselling services', 'Time management skills', 'Mindfulness exercises', 'Rest and sleep', 'Encouragement from family', 'Study groups'],
    decisionQuestion: 'Which factor is most crucial in preventing student burnout during finals?',
    hotQuestion: 'Does our current examination system place too much mental pressure on teenagers today?'
  },
  {
    id: 'sp3_he_7',
    theme: 'Health and Environment',
    topic: 'Ways to conserve water at home',
    prompts: ['Fixing leaks immediately', 'Using a bucket for showers', 'Harvesting rainwater', 'Efficient kitchen habits', 'Planting dry-weather gardens', 'Smart meter monitoring'],
    decisionQuestion: 'Which habit would result in the largest amount of water saved for a typical family?',
    hotQuestion: 'Should water prices be increased to discourage people from wasting this precious resource?'
  },
  {
    id: 'sp3_he_8',
    theme: 'Health and Environment',
    topic: 'Encouraging cycling as a primary mode of transport',
    prompts: ['Safe bicycle lanes', 'Cycling insurance', 'Bicycle-sharing rental', 'Workplace showers/lockers', 'Strict traffic rules for cars', 'Public safety campaigns'],
    decisionQuestion: 'What is the biggest obstacle preventing Malaysians from cycling to work or school?',
    hotQuestion: 'Is it possible for cities to become "car-free" in the future? What would be the advantages?'
  },
  {
    id: 'sp3_he_9',
    theme: 'Health and Environment',
    topic: 'The impact of haze on the community',
    prompts: ['Respiratory health issues', 'Decreased tourism', 'Poor outdoor safety', 'Economic production loss', 'Mental stress/frustration', 'School closures'],
    decisionQuestion: 'Which is the most concerning impact of the seasonal haze on our nation?',
    hotQuestion: 'How can neighboring countries effectively cooperate to stop transboundary haze once and for all?'
  },
  {
    id: 'sp3_he_10',
    theme: 'Health and Environment',
    topic: 'Methods to manage electronic waste (e-waste) safely',
    prompts: ['E-waste recycling bins', 'Trade-in programs', 'Public collection centers', 'Strict disposal laws', 'Innovation in parts replacement', 'Education on toxic materials'],
    decisionQuestion: 'Which initiative would most successfully keep old gadgets out of regular landfills?',
    hotQuestion: 'Should technology companies be legally required to take back their old products for recycling?'
  }
];
