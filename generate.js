const fs = require('fs');

const topics = [
  "Future Plans", "Travel & Holidays", "Shopping", "Food & Diet", "Technology",
  "Learning English", "Social Media", "Friendship", "Hometown", "Transportation",
  "Weather & Seasons", "Daily Routine", "Music", "Reading Habits", "Sports",
  "Fashion", "Memories", "Volunteering", "Weekend Activities", "Movies",
  "Stress & Relaxation", "Animals & Pets", "Art & Creativity", "Money Management", "Chores",
  "Public Transport", "Celebrations", "Health & Fitness", "Role Models", "Online Learning",
  "Cooking", "Photography", "Part-time Jobs", "Living Environment", "Childhood",
  "Fears", "Gifts", "Languages", "Nature", "Sleep Habits",
  "Local Festivals", "Time Management", "Inventions", "Outdoor Activities", "Board Games",
  "Fast Food", "Superstitions", "Punctuality", "Ambitions", "School Facilities"
];

const questionsBank1 = [
  "What do you want to be when you grow up?", "Where do you want to study after school?", "Do you want to work abroad?", "What is your dream job?",
  "Where did you go for your last holiday?", "Do you prefer the beach or the mountains?", "What is your dream holiday destination?", "Who do you usually travel with?",
  "How often do you go shopping?", "Do you prefer shopping online or in-store?", "What was the last thing you bought?", "Who do you usually go shopping with?",
  "What is your favorite type of food?", "How often do you eat out?", "Do you enjoy cooking?", "What do you usually eat for breakfast?",
  "How often do you use your smartphone?", "What is your favorite app?", "Do you think technology makes our lives better?", "At what age did you get your first phone?",
  "Why is it important to learn English?", "How long have you been studying English?", "What is the most difficult part of learning English?", "How do you practice English outside of school?",
  "Which social media platform do you use the most?", "How much time do you spend on social media?", "What are the advantages of social media?", "Do you ever post videos online?",
  "How important are friends to you?", "What do you usually do with your friends?", "Is it easy for you to make new friends?", "What makes a good friend?",
  "Where is your hometown?", "What do you like most about your hometown?", "Is your hometown changing?", "Would you like to live in your hometown in the future?",
  "How do you usually travel to school?", "Is public transport good in your city?", "Do you ever ride a bicycle?", "What is your favorite mode of transport?",
  "What is your favorite type of weather?", "Do you prefer hot or cold weather?", "How does the weather affect your mood?", "What do you do when it rains heavily?",
  "What time do you usually go to bed?", "What do you do right after waking up?", "Do you take naps in the afternoon?", "How do you relax after a long day?",
  "How often do you listen to music?", "Do you listen to music while studying?", "Have you ever been to a concert?", "Who is your favorite singer or band?",
  "What kind of books do you enjoy reading?", "Do you prefer physical books or e-books?", "How often do you visit the library?", "What was the last book you read?",
  "Do you prefer playing or watching sports?", "Who is your favorite athlete?", "What new sport would you like to try?", "Why is playing sports important?",
  "Do you follow fashion trends?", "What kind of clothes do you usually wear?", "Where do you buy your clothes?", "Do you think wearing a uniform is a good idea?",
  "What is your happiest childhood memory?", "Do you have a good memory for names?", "How do you remember important dates?", "Do you keep a diary or journal?",
  "Have you ever done volunteer work?", "What kind of volunteer work would you like to do?", "Why should young people volunteer?", "Is volunteering common in your country?",
  "What are your plans for this weekend?", "Do you usually stay home or go out on the weekend?", "What was the most exciting thing you did last weekend?", "Do you think weekends should be longer?",
  "How often do you go to the cinema?", "Do you prefer watching movies at home or in the cinema?", "What genre of movies do you dislike?", "Who is your favorite actor?",
  "What makes you feel stressed?", "How do you usually relax?", "Do you think students have too much stress today?", "Is it important to take breaks while studying?",
  "Do you have any pets?", "What is your favorite animal?", "Why do people keep pets?", "Have you ever visited a zoo?",
  "Do you enjoy drawing or painting?", "Are you a creative person?", "Do you visit art galleries?", "Is art important in education?",
  "Do you save money regularly?", "What do you usually spend your money on?", "Is it important to teach young people about money?", "Have you ever bought something very expensive?",
  "Do you help with housework at home?", "What is your least favorite chore?", "Who does most of the cooking in your house?", "Should teenagers be paid for doing chores?",
  "How often do you take the bus or train?", "What is the longest train journey you have taken?", "Is public transport expensive in your city?", "How can public transport be improved?",
  "What is your favorite festival?", "How do you celebrate the New Year?", "Do you give gifts during festivals?", "What do you eat during your favorite festival?",
  "What do you do to stay healthy?", "Do you think you eat a healthy diet?", "How important is drinking water?", "Do you ever eat fast food?",
  "Who is your role model?", "Why is it important to have a role model?", "Can celebrities be good role models?", "Who do you look up to in your family?",
  "Do you prefer online classes or physical classes?", "What are the benefits of online learning?", "Is it easy to focus during online classes?", "What device do you use for online learning?",
  "Who taught you how to cook?", "What is your signature dish?", "Do you prefer home-cooked food or restaurant food?", "Is it important for everyone to learn cooking?",
  "Do you take a lot of photos?", "What do you usually take photos of?", "Do you prefer taking selfies or landscapes?", "How do you store your photos?",
  "Have you ever had a part-time job?", "What kind of part-time job would you like?", "Why do students do part-time jobs?", "Is it hard to study and work at the same time?",
  "Do you live in an apartment or a house?", "What is your favorite room in your house?", "Would you like to move to a different city?", "Is your neighborhood quiet or noisy?",
  "What did you enjoy doing as a child?", "Who did you play with when you were young?", "Did you have a favorite toy?", "How have you changed since you were a child?",
  "Are you afraid of anything?", "Were you afraid of the dark as a child?", "How do people overcome their fears?", "Are there any insects or animals you fear?",
  "Do you like receiving gifts?", "What is the best gift you have ever received?", "Is it hard to choose gifts for other people?", "Do you prefer making or buying gifts?",
  "How many languages can you speak?", "Would you like to learn a new language?", "Why is learning a new language useful?", "Is it better to learn languages when young?",
  "Do you like spending time in nature?", "Are there any parks near your house?", "Have you ever been camping?", "How can we protect nature?",
  "How many hours do you usually sleep?", "Do you ever have trouble sleeping?", "Is sleep important to you?", "Do you ever sleep late on weekends?",
  "What local festival do you celebrate?", "Are traditional festivals still important today?", "What is the most popular festival in your country?", "Do festival celebrations change over time?",
  "Are you usually on time for appointments?", "How do you organize your daily schedule?", "Do you use a planner or an app?", "What do you do when you are running late?",
  "What do you think is the best invention ever?", "Could you live without electricity?", "How has the internet changed the world?", "What would you like someone to invent?",
  "What outdoor activities do you enjoy?", "Do you prefer indoor or outdoor activities?", "Have you ever tried hiking?", "Why are outdoor activities good for health?",
  "Do you ever play board games?", "What is your favorite board game?", "Who do you play board games with?", "Are board games better than video games?",
  "How often do you eat fast food?", "What is your favorite fast food?", "Why is fast food so popular?", "Do you think fast food is unhealthy?",
  "Are you a superstitious person?", "Do you believe in lucky numbers?", "What are some common superstitions in your country?", "Do you think superstitions are silly?",
  "Is being punctual important to you?", "Do you get annoyed when people are late?", "Why are some people always late?", "How can people improve their punctuality?",
  "What is your biggest ambition in life?", "Did your ambitions change as you grew older?", "Are you an ambitious person?", "Who supports you in achieving your goals?",
  "What is your favorite facility at school?", "How often do you use the school library?", "Is the sports field well-maintained?", "What new facility would you like your school to have?"
];

let generatedStr = '';
for (let i = 0; i < 50; i++) {
  generatedStr += `  {
    id: 's1p1_${12 + i}',
    topic: '${topics[i].replace(/'/g, "\\'")}',
    questions: [
      "${questionsBank1[i * 4].replace(/"/g, '\\"')}",
      "${questionsBank1[i * 4 + 1].replace(/"/g, '\\"')}",
      "${questionsBank1[i * 4 + 2].replace(/"/g, '\\"')}",
      "${questionsBank1[i * 4 + 3].replace(/"/g, '\\"')}"
    ]
  }`;
  if (i < 49) generatedStr += ',\n';
}

const fileContent = fs.readFileSync('src/data/speakingBank.ts', 'utf8');

const targetStr = `
  {
    id: 's1p1_11',
    topic: 'People and Culture',
    questions: [
      "What do you usually have for breakfast before school?",
      "Who is the person you talk to the most in your family?",
      "What is your favorite local food to eat on weekends?",
      "How do you usually spend your time after dinner?"
    ]
  }
];`;

if (fileContent.includes(targetStr)) {
  const newContent = fileContent.replace(targetStr, `
  {
    id: 's1p1_11',
    topic: 'People and Culture',
    questions: [
      "What do you usually have for breakfast before school?",
      "Who is the person you talk to the most in your family?",
      "What is your favorite local food to eat on weekends?",
      "How do you usually spend your time after dinner?"
    ]
  },
${generatedStr}
];`);
  fs.writeFileSync('src/data/speakingBank.ts', newContent);
  console.log("Successfully added 50 new items!");
} else {
  console.log("Could not find the target string insertion point.");
}

