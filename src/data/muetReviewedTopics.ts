import {MUET_TOPICS} from './muetTopicsBank';
import type {MUETTopic} from '../types/muet';
// Existing IDs retained so saved completion records remain valid.
const prompts:[string[],string,string[]][]=[
 [['staying connected with family','learning new skills online','sharing creative work','supporting community causes'],'How can young people use social media productively?',['Learning groups','Creative projects','Career networks','Community campaigns','Reliable news']],
 [['eating balanced meals','exercising regularly','getting enough sleep','managing daily stress'],'How can society encourage healthier lifestyles?',['Family habits','School programmes','Community facilities','Health education','Affordable food']],
 [['reducing plastic use','saving water','recycling household waste','buying reusable products'],'What should communities prioritise to protect the environment?',['Waste reduction','Public transport','Green spaces','Clean energy','Environmental education']],
 [['planning online study time','asking questions during lessons','finding reliable learning resources','working with online study partners'],'How can colleges improve online learning?',['Teacher training','Internet access','Learning resources','Student support','Fair assessment']],
 [['using digital tools for study','keeping personal data safe','learning basic computer skills','using technology to stay organised'],'How can technology best improve people’s lives?',['Healthcare access','Education services','Safer transport','Business support','Public communication']],
 [['trying local food','visiting cultural sites','using local guides','buying local products'],'How can tourism benefit local communities sustainably?',['Local businesses','Cultural protection','Environmental care','Tourism training','Transport planning']],
 [['planning your travel route','checking service information','travelling outside peak hours','keeping safe at stations'],'How can public transport better serve communities?',['Service frequency','Affordable fares','Accessible stations','Route coverage','Passenger information']],
 [['helping at community events','supporting local charities','sharing useful skills','caring for public spaces'],'How can volunteering create lasting community benefits?',['Volunteer training','Local partnerships','Long-term projects','Youth involvement','Reliable funding']],
 [['keeping payment details private','checking transactions carefully','setting spending limits','using trusted payment services'],'How can society build trust in digital payments?',['Consumer protection','Digital education','Secure systems','Clear fees','Accessible services']],
 [['joining a sports club','training with friends','setting personal fitness goals','trying different sports'],'How can communities encourage sports participation?',['Affordable facilities','School activities','Local events','Inclusive programmes','Qualified coaches']],
 [['getting to know neighbours','reporting safety concerns','securing your home','sharing verified safety information'],'How can neighbourhoods become safer for everyone?',['Neighbour networks','Street lighting','Youth activities','Emergency services','Public education']],
 [['tracking daily spending','setting a savings goal','comparing prices','avoiding unnecessary purchases'],'How can young adults develop lasting saving habits?',['Financial education','Family guidance','Savings tools','Affordable services','Income opportunities']],
 [['reading for pleasure','reading to learn skills','sharing books with friends','exploring different authors'],'How can schools make reading more appealing?',['Student choice','Library access','Reading clubs','Author visits','Digital books']],
 [['wearing suitable safety equipment','following traffic rules','avoiding distractions while travelling','checking vehicle condition'],'What should authorities prioritise to improve road safety?',['Safer roads','Driver education','Law enforcement','Public transport','Vehicle standards']],
 [['caring for classroom equipment','using library resources','keeping toilets clean','reporting damaged facilities'],'Which investment would most improve student learning?',['Modern libraries','Science laboratories','Sports facilities','Internet access','Comfortable classrooms']],
 [['setting daily priorities','using a simple planner','limiting distractions','taking planned breaks'],'How can colleges help students manage their time?',['Study workshops','Clear deadlines','Personal guidance','Balanced timetables','Digital tools']],
 [['building communication skills','gaining practical experience','preparing a clear application','learning about employers'],'How can young people prepare for changing job markets?',['Work placements','Career advice','Transferable skills','Lifelong learning','Employer partnerships']],
 [['asking questions in class','learning beyond textbooks','discussing ideas with classmates','reflecting on your progress'],'What should education prioritise for the future?',['Critical thinking','Practical skills','Equal access','Digital literacy','Personal wellbeing']],
 [['planning essential expenses','using credit responsibly','building emergency savings','understanding financial risks'],'How can society improve financial security?',['Financial education','Fair wages','Affordable housing','Consumer protection','Savings support']],
 [['sharing family responsibilities','spending quality time together','listening to family members','supporting younger relatives'],'How can communities support stronger family relationships?',['Flexible work','Family services','Shared activities','Parenting education','Childcare support']],
 [['welcoming new neighbours','joining local activities','helping vulnerable residents','respecting shared spaces'],'Which community project would have the greatest lasting benefit?',['Food support','Inclusive parks','Youth mentoring','Cultural events','Elderly care']]
];
const situations=[
 'Social media offers many opportunities for young people.',
 'Students need healthy habits to manage study and daily life.',
 'Households can help protect the environment through everyday choices.',
 'Students need to take an active role in online learning.',
 'Digital technology is part of students’ everyday lives.',
 'Visitors can support the communities they visit.',
 'Students can make public transport journeys easier and safer.',
 'Young people can contribute to their communities through volunteering.',
 'More young people are using digital payments.',
 'Students can stay active by taking part in sports.',
 'Residents can work together to make neighbourhoods safer.',
 'Students often need to make careful choices about spending.',
 'Reading can be an enjoyable part of everyday life.',
 'Everyone has a role in making roads safer.',
 'Students share responsibility for looking after school facilities.',
 'Students need to balance study with other activities.',
 'Young people need to prepare before applying for jobs.',
 'Students can make their learning more meaningful.',
 'Young adults need to make responsible financial decisions.',
 'Family relationships need time and effort.',
 'Residents can help create a welcoming community.'
];
export const MUET_REVIEWED_TOPICS:MUETTopic[]=MUET_TOPICS.map((t,i)=>{
 const [tasks,centralQuestion,points]=prompts[i];
 return {...t,part1:{situation:`${situations[i]} You are giving a presentation to your classmates about practical actions people can take.`,tasks:Object.fromEntries(['A','B','C','D'].map((c,j)=>[c,`Talk about ${tasks[j]}.`])) as any},part2:{situation:`Your community is considering improvements related to ${t.title.toLowerCase()}. Your group is discussing which approach would be most effective.`,centralQuestion,points,decisionPrompt:'At the end of the discussion, try to agree on the best suggestion.'}};
});
