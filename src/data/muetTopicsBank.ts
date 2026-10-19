import { MUETTopic } from '../types/muet';

export const MUET_TOPICS: MUETTopic[] = [
  {
    id: 'muet_topic_social_media',
    spmReferenceId: 'spm_tech_soc_1',
    title: 'Social Media',
    theme: 'Technology & Society',
    part1: {
      situation: 'Social media platforms have transformed communication, education, and daily habits among Malaysians.',
      tasks: {
        A: 'Talk about how social media helps individuals keep in touch with friends and distant family members.',
        B: 'Talk about how social media serves as an effective learning platform for discovering new skills and information.',
        C: 'Talk about how social media allows young creators to showcase their talents and explore small business ideas.',
        D: 'Talk about how social media raises public awareness for important ways to help people in need and community movements.'
      },
      hints: {
        A: { point: 'Instant cross-border connection', example: 'Group video calls during festivals', reason: 'Strengthens close relationships despite physical distance' },
        B: { point: 'Short learning videos', example: 'Bite-sized educational videos on coding or language', reason: 'Makes learning accessible without expensive courses' },
        C: { point: 'Showing your work online', example: 'Baking or photography pages gaining customers', reason: 'Helps young people become more independent' },
        D: { point: 'Sharing help requests widely', example: 'Crowdfunding flood relief aid online', reason: 'Helps people act quickly in emergencies' }
      }
    },
    part2: {
      situation: 'A national youth committee is organizing a campaign to encourage young people to use social media responsibly and productively.',
      centralQuestion: 'What are the most effective ways for youths to use social media productively?',
      points: [
        'Joining educational and academic discussion groups',
        'Building a collection of your work online',
        'Meeting people who work in your chosen field',
        'Volunteering and supporting causes that help people',
        'Following trusted science and news channels'
      ],
      decisionPrompt: 'At the end of the discussion, decide which is the most effective way for youths to use social media productively.'
    }
  },
  {
    id: 'muet_topic_healthy_lifestyle',
    spmReferenceId: 'spm_health_1',
    title: 'Healthy Lifestyle',
    theme: 'Health & Wellness',
    part1: {
      situation: 'Long-term illnesses and spending too much time sitting are on the rise among working adults and students.',
      tasks: {
        A: 'Talk about the role of a balanced diet with proper portions in staying healthy and active.',
        B: 'Talk about the importance of consistent physical exercise in reducing long-term health risks.',
        C: 'Talk about the need for enough, quality sleep for clear thinking and emotional health.',
        D: 'Talk about managing mental stress through hobbies, meditation, and healthy social connections.'
      },
      hints: {
        A: { point: 'Healthy balanced meals', example: 'Following the Malaysian Healthy Plate "Suku-Suku Separuh"', reason: 'Prevents obesity and helps keep your energy steady' },
        B: { point: 'Exercise for your heart', example: '30 minutes of brisk walking or badminton daily', reason: 'Boosts stamina and releases chemicals that help you feel happier' },
        C: { point: 'Enough restful sleep', example: 'Maintaining a consistent 7-8 hour sleep schedule', reason: 'Enables your body to recover and your brain to remember what you learned' },
        D: { point: 'Ways to manage stress', example: 'Limiting time online and journaling', reason: 'Prevents feeling worn out and long-term stress' }
      }
    },
    part2: {
      situation: 'The Ministry of Health and school boards want to foster long-term healthy living habits among teenagers.',
      centralQuestion: 'What is the most influential factor in encouraging teenagers to adopt a healthy lifestyle?',
      points: [
        'Parental role modelling and wholesome home-cooked meals',
        'School curriculum with active sports competitions',
        'Peer encouragement and active friendship circles',
        'Public health awareness campaigns on social media',
        'Accessible, well-maintained community parks and gyms'
      ],
      decisionPrompt: 'At the end of the discussion, decide which is the most influential factor in encouraging teenagers to adopt a healthy lifestyle.'
    }
  },
  {
    id: 'muet_topic_environment',
    spmReferenceId: 'spm_env_1',
    title: 'Environment',
    theme: 'Environment',
    part1: {
      situation: 'Climate change, urban waste, and loss of plants and animals demand immediate care for the environment.',
      tasks: {
        A: 'Talk about reducing single-use plastics and opting for reusable containers in daily routines.',
        B: 'Talk about conserving energy and water at home to lower the national pollution from daily activities.',
        C: 'Talk about the benefits of participating in local tree-planting and beach clean-up activities.',
        D: 'Talk about utilizing public transportation and active commuting to cut vehicular emissions.'
      },
      hints: {
        A: { point: 'Minimizing non-biodegradable waste', example: 'Carrying reusable tumblers and shopping tote bags', reason: 'Prevents plastic clogging marine ecosystems and landfills' },
        B: { point: 'Resource conservation habits', example: 'Turning off idling air conditioners and harvesting rainwater', reason: 'Lowers utility costs and conserves natural reserves' },
        C: { point: 'Civic environmental action', example: 'Mangrove replanting with university volunteer clubs', reason: 'Restores coastal habitats and creates personal connection to nature' },
        D: { point: 'Decarbonizing daily travel', example: 'Riding the LRT or carpooling to campus', reason: 'Reduces urban traffic smog and greenhouse gases' }
      }
    },
    part2: {
      situation: 'A municipal council is drafting an action plan to create a cleaner, more sustainable eco-town.',
      centralQuestion: 'Which initiative will contribute most effectively to creating an environmentally sustainable town?',
      points: [
        'Enforcing strict penalties for illegal dumping and pollution',
        'Expanding renewable solar energy subsidies for residential homes',
        'Developing extensive walking and cycling corridors',
        'Organizing continuous community recycling and composting drives',
        'Mandating green building standards for all commercial projects'
      ],
      decisionPrompt: 'At the end of the discussion, decide which initiative will contribute most effectively to creating an environmentally sustainable town.'
    }
  },
  {
    id: 'muet_topic_online_learning',
    spmReferenceId: 'spm_edu_tech_1',
    title: 'Online Learning',
    theme: 'Education',
    part1: {
      situation: 'Digital classrooms, virtual lectures, and interactive e-learning apps have reshaped higher education.',
      tasks: {
        A: 'Talk about the flexibility of studying at one’s own pace through recorded online lectures.',
        B: 'Talk about access to vast international learning resources and open online courseware.',
        C: 'Talk about how online learning cuts transportation and accommodation expenses for students.',
        D: 'Talk about developing essential digital literacy and modern workplace collaboration skills.'
      },
      hints: {
        A: { point: 'Self-paced flexible schedule', example: 'Reviewing difficult lecture segments late at night', reason: 'Accommodates diverse learning speeds and personal schedules' },
        B: { point: 'Global educational access', example: 'Enrolling in specialized courses from top global universities', reason: 'Democratizes quality education regardless of geographical borders' },
        C: { point: 'Financial efficiency', example: 'Saving on daily campus fuel, tolls, and rented rooms', reason: 'Alleviates financial strain on lower-income families' },
        D: { point: 'Digital collaboration competency', example: 'Mastering shared cloud documents and virtual boards', reason: 'Prepares graduates for modern hybrid workplaces' }
      }
    },
    part2: {
      situation: 'A university senate is debating how best to optimize blended learning for tertiary students.',
      centralQuestion: 'What is the most critical challenge universities must resolve to ensure effective online education?',
      points: [
        'Bridging the digital divide and providing reliable high-speed internet',
        'Maintaining high student motivation and preventing screen fatigue',
        'Ensuring academic integrity and secure examination protocols',
        'Providing hands-on laboratory and practical workshop training',
        'Training educators in engaging interactive pedagogical methods'
      ],
      decisionPrompt: 'At the end of the discussion, decide which challenge is the most critical for universities to resolve.'
    }
  },
  {
    id: 'muet_topic_technology',
    spmReferenceId: 'spm_tech_gen_1',
    title: 'Technology',
    theme: 'Science & Technology',
    part1: {
      situation: 'Emerging technologies like Artificial Intelligence, automation, and smart devices are altering daily routines.',
      tasks: {
        A: 'Talk about how AI tools assist students and professionals in researching and organizing data quickly.',
        B: 'Talk about how smart medical devices assist doctors in early diagnostics and health tracking.',
        C: 'Talk about how automation streamlines repetitive industrial tasks and enhances workplace safety.',
        D: 'Talk about how smart home automation and voice assistants improve everyday household convenience.'
      },
      hints: {
        A: { point: 'Accelerated information synthesis', example: 'Using AI to summarize extensive research papers', reason: 'Frees time for critical thinking and creative problem-solving' },
        B: { point: 'Predictive health monitoring', example: 'Smartwatches detecting cardiac anomalies early', reason: 'Enables preventive medicine and timely interventions' },
        C: { point: 'Safer manufacturing operations', example: 'Robotic arms handling hazardous chemical assembly', reason: 'Protects human workers from preventable accidents' },
        D: { point: 'Seamless home management', example: 'Automated energy regulation and security monitoring', reason: 'Increases safety and home energy efficiency' }
      }
    },
    part2: {
      situation: 'A national innovation forum is discussing how society can harness modern technology ethically and constructively.',
      centralQuestion: 'What should be the highest priority for governments when integrating emerging technologies?',
      points: [
        'Reskilling and upskilling workers displaced by automation',
        'Establishing strict data privacy and cybersecurity regulations',
        'Investing heavily in local research and tech startups',
        'Teaching ethical AI and media literacy in schools',
        'Ensuring affordable tech access in rural communities'
      ],
      decisionPrompt: 'At the end of the discussion, decide which priority governments should focus on first when integrating emerging technologies.'
    }
  },
  {
    id: 'muet_topic_tourism',
    spmReferenceId: 'spm_tour_1',
    title: 'Tourism',
    theme: 'Culture & Economy',
    part1: {
      situation: 'Tourism plays a key role in economic growth and mutual cultural understanding in Malaysia.',
      tasks: {
        A: 'Talk about the appeal of eco-tourism destinations like rainforests and marine parks to nature lovers.',
        B: 'Talk about how culinary tourism showcasing authentic Malaysian street food attracts global visitors.',
        C: 'Talk about the significance of preserving historic heritage cities like Melaka and George Town.',
        D: 'Talk about how homestay programs in rural villages provide authentic cultural immersion.'
      },
      hints: {
        A: { point: 'Pristine biodiversity immersion', example: 'Visiting Taman Negara or Sipadan Island', reason: 'Promotes conservation while boosting eco-tourism revenues' },
        B: { point: 'Unique gastronomic diversity', example: 'Food trails featuring laksa, roti canai, and rendang', reason: 'Celebrates cultural heritage through distinct culinary traditions' },
        C: { point: 'Living architectural heritage', example: 'Preserving colonial pre-war shophouses', reason: 'Educates future generations on historical roots' },
        D: { point: 'Empowering rural grassroots economy', example: 'Staying in a traditional Malay kampung homestay', reason: 'Directly channels tourism revenue to local artisans and families' }
      }
    },
    part2: {
      situation: 'The Ministry of Tourism is planning an international campaign to promote sustainable tourism in Malaysia.',
      centralQuestion: 'What is the best strategy to attract international tourists while protecting local culture and nature?',
      points: [
        'Upgrading public transport connectivity to eco-tourism spots',
        'Promoting community-based indigenous homestays and handicrafts',
        'Enforcing strict daily visitor caps at fragile natural heritage sites',
        'Hosting international culinary and cultural festivals',
        'Conducting creative digital storytelling campaigns on social media'
      ],
      decisionPrompt: 'At the end of the discussion, decide which is the best strategy to promote sustainable tourism.'
    }
  },
  {
    id: 'muet_topic_public_transport',
    spmReferenceId: 'spm_infra_1',
    title: 'Public Transport',
    theme: 'Infrastructure & Society',
    part1: {
      situation: 'Traffic congestion in major metropolitan areas poses economic, environmental, and mental challenges.',
      tasks: {
        A: 'Talk about the financial benefits of commuting via rail and bus compared to private car ownership.',
        B: 'Talk about how public transport lowers carbon emissions and mitigates urban air pollution.',
        C: 'Talk about the convenience of using commute time for reading, working, or resting peacefully.',
        D: 'Talk about how reliable public transport creates accessible mobility for seniors and students.'
      },
      hints: {
        A: { point: 'Major financial savings', example: 'Saving on monthly petrol, parking fees, and expressway tolls', reason: 'Frees household disposable income for essential investments' },
        B: { point: 'Substantial emission reductions', example: 'One electric commuter train carrying hundreds of passengers', reason: 'Takes dozens of single-occupancy vehicles off congested roads' },
        C: { point: 'Productive and relaxing travel time', example: 'Reading books or listening to educational podcasts on the LRT', reason: 'Eliminates stressful driving in bumper-to-bumper traffic' },
        D: { point: 'Universal accessible mobility', example: 'Affordable student concession passes and wheelchair-friendly stations', reason: 'Ensures equitable access to schools, hospitals, and jobs' }
      }
    },
    part2: {
      situation: 'A city hall transport committee wants to persuade more private car owners to switch to public transit.',
      centralQuestion: 'What improvement would most effectively convince commuters to use public transport daily?',
      points: [
        'Ensuring strict punctuality and frequent train and bus intervals',
        'Solving first-mile and last-mile connectivity with feeder buses and pedestrian walkways',
        'Offering heavily subsidized affordable monthly travel passes',
        'Enhancing cleanliness, passenger security, and CCTV monitoring',
        'Implementing dedicated bus rapid transit (BRT) lanes that bypass traffic'
      ],
      decisionPrompt: 'At the end of the discussion, decide which improvement would most effectively convince commuters to switch to public transport.'
    }
  },
  {
    id: 'muet_topic_volunteering',
    spmReferenceId: 'spm_vol_1',
    title: 'Volunteering',
    theme: 'Community & Ethics',
    part1: {
      situation: 'Voluntary work enriches both the community and the personal development of volunteers.',
      tasks: {
        A: 'Talk about how volunteering builds empathy, social awareness, and deep gratitude for one’s privileges.',
        B: 'Talk about how community service allows volunteers to gain practical leadership and teamwork skills.',
        C: 'Talk about how participating in volunteer programs expands one’s social circle and networking connections.',
        D: 'Talk about how volunteering improves mental well-being and provides a strong sense of purpose.'
      },
      hints: {
        A: { point: 'Fostering profound empathy', example: 'Distributing food at soup kitchens for the homeless', reason: 'Breaks social barriers and deepens appreciation for different life struggles' },
        B: { point: 'Cultivating leadership capabilities', example: 'Coordinating logistics for an animal shelter adoption drive', reason: 'Provides real-world problem-solving experience beyond textbooks' },
        C: { point: 'Broadening meaningful networks', example: 'Collaborating alongside professionals from diverse industries in charity drives', reason: 'Builds lifelong friendships and opens career mentorship doors' },
        D: { point: 'Enhancing psychological fulfillment', example: 'Tutoring underprivileged children at community centers', reason: 'Instills deep satisfaction and alleviates loneliness' }
      }
    },
    part2: {
      situation: 'A national youth agency wants to cultivate a widespread culture of active volunteerism among college students.',
      centralQuestion: 'What is the most effective way to encourage more tertiary students to volunteer regularly?',
      points: [
        'Awarding formal co-curricular credits and graduation recognition',
        'Partnering with popular NGOs to offer flexible short-term volunteering gigs',
        'Providing complimentary meals, travel allowances, and certifications',
        'Creating engaging campus volunteer showcases and social media storytelling',
        'Allowing students to apply their specialized degree skills (e.g. medical screening, coding)'
      ],
      decisionPrompt: 'At the end of the discussion, decide which method is the most effective in encouraging college students to volunteer regularly.'
    }
  },
  {
    id: 'muet_topic_digital_payment',
    spmReferenceId: 'spm_fin_tech_1',
    title: 'Digital Payment',
    theme: 'Finance & Technology',
    part1: {
      situation: 'E-wallets, QR pay, and online banking are rapidly replacing physical paper currency and coins.',
      tasks: {
        A: 'Talk about the speed and convenience of completing cashless transactions without carrying bulky cash.',
        B: 'Talk about the benefit of automated digital transaction records for tracking personal expenditures.',
        C: 'Talk about how cashless systems reduce the risk of physical cash theft and robbery in retail shops.',
        D: 'Talk about how digital payments enable seamless e-commerce shopping and cross-border remittances.'
      },
      hints: {
        A: { point: 'Frictionless daily transactions', example: 'Scanning DuitNow QR codes at hawker stalls', reason: 'Eliminates the hassle of searching for small change and queueing at ATMs' },
        B: { point: 'Automatic financial record-keeping', example: 'Reviewing monthly categorised spending summaries in banking apps', reason: 'Helps users maintain budget discipline and identify unnecessary expenses' },
        C: { point: 'Enhanced physical security', example: 'Shop owners not storing large cash registers overnight', reason: 'Deters petty theft and simplifies end-of-day accounting' },
        D: { point: 'Global market access', example: 'Purchasing educational books from international webstores instantly', reason: 'Connects local buyers and sellers to the worldwide digital economy' }
      }
    },
    part2: {
      situation: 'The Central Bank and consumer rights associations are addressing concerns regarding a fully cashless economy.',
      centralQuestion: 'What is the most significant concern that must be resolved to protect consumers in a cashless society?',
      points: [
        'Strengthening cybersecurity against sophisticated financial scams and phishing',
        'Ensuring older adults and rural communities are not financially excluded',
        'Protecting consumer privacy and preventing misuse of personal spending data',
        'Maintaining offline emergency backup systems during internet or server outages',
        'Preventing compulsive impulsive spending due to the lack of tangible cash'
      ],
      decisionPrompt: 'At the end of the discussion, decide which concern is the most significant to resolve to protect consumers.'
    }
  },
  {
    id: 'muet_topic_sports',
    spmReferenceId: 'spm_sport_1',
    title: 'Sports',
    theme: 'Sports & Society',
    part1: {
      situation: 'Sporting activities foster physical vigor, personal discipline, and patriotic unity across diverse communities.',
      tasks: {
        A: 'Talk about how playing team sports teaches communication, mutual trust, and cooperation.',
        B: 'Talk about how sports build resilience, emotional control, and the ability to accept defeat gracefully.',
        C: 'Talk about how major sporting events unite Malaysians across different ethnic and cultural backgrounds.',
        D: 'Talk about how regular sports participation combats chronic lifestyle diseases and obesity.'
      },
      hints: {
        A: { point: 'Teamwork and cooperative spirit', example: 'Formulating passing strategies in futsal or basketball', reason: 'Teaches that collective success requires individual sacrifices' },
        B: { point: 'Grit and sportsmanship', example: 'Dusting oneself off after losing a tournament final and congratulating opponents', reason: 'Builds mental fortitude vital for overcoming life challenges' },
        C: { point: 'Unifying national identity', example: 'Citizens of all races cheering together for national badminton heroes', reason: 'Fosters national pride and dissolves societal divisions' },
        D: { point: 'Physical vigor and wellness', example: 'Jogging or swimming thrice weekly', reason: 'Improves cardiovascular endurance and maintains healthy body weight' }
      }
    },
    part2: {
      situation: 'The Ministry of Youth and Sports is formulating a strategy to boost youth sports participation at the grassroots level.',
      centralQuestion: 'What is the best way to encourage more children and youths to actively participate in sports?',
      points: [
        'Upgrading and maintaining free community sports complexes and futsal courts',
        'Integrating comprehensive sports leagues into regular school schedules',
        'Offering sports scholarships and national athlete mentorship programs',
        'Lowering the cost of sports equipment and coaching for lower-income families',
        'Organizing enjoyable non-competitive sports festivals and fun runs for families'
      ],
      decisionPrompt: 'At the end of the discussion, decide which is the best way to encourage youth sports participation at the grassroots level.'
    }
  },
  {
    id: 'muet_topic_community_safety',
    spmReferenceId: 'spm_safe_1',
    title: 'Community Safety',
    theme: 'Community & Security',
    part1: {
      situation: 'Safe neighbourhoods enable families, children, and businesses to flourish without fear.',
      tasks: {
        A: 'Talk about the role of neighbourhood watch programs (Rukun Tetangga) in deterring residential crime.',
        B: 'Talk about installing modern smart home security systems and surveillance cameras.',
        C: 'Talk about the importance of educating children and teens on personal safety and situational awareness.',
        D: 'Talk about maintaining well-lit public streets, clear pathways, and tidy public spaces.'
      },
      hints: {
        A: { point: 'Community vigilance and unity', example: 'Rukun Tetangga volunteers conducting nightly patrols', reason: 'Creates strong neighbourly bonds and deters opportunistic burglars' },
        B: { point: 'Technological surveillance', example: 'Smart video doorbells alerting homeowners to suspicious activity', reason: 'Provides real-time deterrence and crucial visual evidence for police' },
        C: { point: 'Personal safety education', example: 'Teaching teenagers never to walk alone in dark alleys wearing headphones', reason: 'Instills proactive caution and reduces vulnerability to crime' },
        D: { point: 'Environmental crime prevention', example: 'Replacing burnt streetlights and trimming overgrown bushes', reason: 'Eliminates hiding spots and increases natural street visibility' }
      }
    },
    part2: {
      situation: 'A residents’ association is convening to decide the most effective long-term initiative to keep their neighbourhood safe.',
      centralQuestion: 'What is the most effective measure to ensure safety and security in a residential neighbourhood?',
      points: [
        'Establishing an active community patrol and WhatsApp alert group',
        'Upgrading smart street lighting and CCTV cameras in crime hotspots',
        'Fostering strong cooperation and regular dialogue with local police patrols',
        'Creating gated access with professional security guards',
        'Organizing youth recreation programs to keep teens away from antisocial behavior'
      ],
      decisionPrompt: 'At the end of the discussion, decide which is the most effective measure to ensure neighbourhood safety.'
    }
  },
  {
    id: 'muet_topic_saving_money',
    spmReferenceId: 'spm_fin_save_1',
    title: 'Saving Money',
    theme: 'Finance & Consumerism',
    part1: {
      situation: 'Sound financial habits established during youth lay the groundwork for long-term financial freedom.',
      tasks: {
        A: 'Talk about the importance of creating a realistic monthly budget and tracking everyday expenses.',
        B: 'Talk about the necessity of building an emergency savings fund for unforeseen crises.',
        C: 'Talk about avoiding high-interest consumer debt, such as unnecessary credit card balances and Buy Now Pay Later schemes.',
        D: 'Talk about learning basic long-term investing principles to protect wealth against inflation.'
      },
      hints: {
        A: { point: 'Disciplined budgeting', example: 'Applying the 50/30/20 rule (Needs, Wants, Savings)', reason: 'Ensures spending never exceeds income' },
        B: { point: 'Financial cushion for emergencies', example: 'Maintaining 3 to 6 months of living expenses in a high-yield account', reason: 'Protects individuals against job loss or medical crises without resorting to loans' },
        C: { point: 'Prudent debt avoidance', example: 'Purchasing gadgets only when cash is available rather than using instalment schemes', reason: 'Prevents compound interest from trapping young earners in debt cycles' },
        D: { point: 'Inflation-beating investments', example: 'Starting low-cost index funds or unit trusts early in life', reason: 'Harnesses the powerful mathematical advantage of compound interest over decades' }
      }
    },
    part2: {
      situation: 'Consumer associations report that many young Malaysian graduates face financial distress within three years of employment.',
      centralQuestion: 'What is the most effective approach to instil sound financial management habits in young adults?',
      points: [
        'Making personal money skills a mandatory subject in secondary schools',
        'Parental training and modelling prudent money management at home',
        'Employers conducting financial wellness and retirement planning workshops',
        'Social media campaigns by credible financial educators debunking get-rich-quick scams',
        'Strict government regulations on easy credit schemes and digital lending apps'
      ],
      decisionPrompt: 'At the end of the discussion, decide which approach is the most effective to instil sound financial habits in young adults.'
    }
  },
  {
    id: 'muet_topic_reading',
    spmReferenceId: 'spm_read_1',
    title: 'Reading',
    theme: 'Education & Culture',
    part1: {
      situation: 'Despite endless digital distractions, deep reading remains the cornerstone of critical intellect.',
      tasks: {
        A: 'Talk about how reading books expands vocabulary, linguistic elegance, and expressive writing ability.',
        B: 'Talk about how reading non-fiction and biographies provides diverse perspectives and life wisdom.',
        C: 'Talk about how reading lengthy novels trains deep focus and counteracts short attention spans.',
        D: 'Talk about how reading provides wholesome relaxation and mental escape from digital screen fatigue.'
      },
      hints: {
        A: { point: 'Vocabulary enrichment', example: 'Encountering sophisticated idioms and sentence structures in classic literature', reason: 'Naturally enhances spoken eloquence and academic essay performance' },
        B: { point: 'Acquiring mature worldly wisdom', example: 'Reading biographies of visionary leaders and historical innovators', reason: 'Helps young minds navigate ethical decisions through other people’s experiences' },
        C: { point: 'Rebuilding sustained attention', example: 'Immersing oneself in an engaging 300-page historical novel', reason: 'Strengthens cognitive endurance against the addictive pull of short videos' },
        D: { point: 'Screen-free decompression', example: 'Reading an engaging paperback before bedtime', reason: 'Lowers stress hormones and improves peaceful sleep quality' }
      }
    },
    part2: {
      situation: 'The National Library and educators are strategizing how to revive a passionate reading culture among teenagers.',
      centralQuestion: 'What is the best way to inspire modern teenagers to read books regularly?',
      points: [
        'Allowing students to choose contemporary books they genuinely enjoy (e.g. graphic novels, thrillers)',
        'Establishing cozy, modern cafe-style reading corners in school libraries',
        'Organizing interactive book clubs where students discuss relatable themes with friends',
        'Leveraging popular digital platforms (e.g. "BookTok" and e-reader apps) for book recommendations',
        'Parents setting a reading hour at home where all digital devices are turned off'
      ],
      decisionPrompt: 'At the end of the discussion, decide which is the best way to inspire modern teenagers to read books regularly.'
    }
  },
  {
    id: 'muet_topic_road_safety',
    spmReferenceId: 'spm_road_1',
    title: 'Road Safety',
    theme: 'Public Safety',
    part1: {
      situation: 'Road accidents remain one of the leading causes of injury and mortality among young Malaysians.',
      tasks: {
        A: 'Talk about the grave dangers of mobile phone distraction and texting while operating a vehicle.',
        B: 'Talk about the vital importance of wearing certified safety helmets and fastened seatbelts at all times.',
        C: 'Talk about adhering strictly to speed limits and exercising defensive driving during adverse weather.',
        D: 'Talk about the absolute refusal to drive under the influence of alcohol, drugs, or extreme exhaustion.'
      },
      hints: {
        A: { point: 'Eliminating mobile distractions', example: 'Placing phones on "Do Not Disturb" driving mode while on the road', reason: 'A split-second glance at a screen causes irreversible collisions' },
        B: { point: 'Utilizing vital safety gear', example: 'Fastening helmet chin straps securely on motorcycles', reason: 'Dramatically reduces traumatic head injuries in unexpected falls' },
        C: { point: 'Defensive speed management', example: 'Slowing down substantially on rain-soaked slippery highways', reason: 'Prevents aquaplaning and ensures sufficient braking distance' },
        D: { point: 'Zero tolerance for impaired driving', example: 'Booking e-hailing rides when feeling drowsy or after events', reason: 'Safeguards innocent pedestrians and fellow motorists' }
      }
    },
    part2: {
      situation: 'The Road Transport Department is designing an aggressive national campaign to reduce youth road accidents.',
      centralQuestion: 'Which measure will have the greatest impact in reducing road accidents among young motorists?',
      points: [
        'Imposing heavier fines, license suspensions, and mandatory community service for reckless driving',
        'Revamping driving school curricula to include realistic defensive driving and hazard simulations',
        'Deploying advanced automated speed enforcement cameras along high-risk accident stretches',
        'Launching graphic, emotionally impactful safety campaigns featuring real crash survivors',
        'Improving road design, street lighting, and dedicated motorcycle lanes'
      ],
      decisionPrompt: 'At the end of the discussion, decide which measure will have the greatest impact in reducing road accidents.'
    }
  },
  {
    id: 'muet_topic_school_facilities',
    spmReferenceId: 'spm_school_1',
    title: 'School Facilities',
    theme: 'Education & Environment',
    part1: {
      situation: 'Well-equipped educational environments foster active learning, creativity, and student well-being.',
      tasks: {
        A: 'Talk about modern science laboratories and STEM workshops that enable hands-on experimentation.',
        B: 'Talk about comprehensive multimedia libraries with collaborative study pods and digital archives.',
        C: 'Talk about high-quality sports grounds, indoor stadiums, and recreational gym equipment.',
        D: 'Talk about hygienic, modern canteen spaces offering nutritious, affordable food choices.'
      },
      hints: {
        A: { point: 'Experiential STEM discovery', example: 'Working with robotics kits and digital microscopes in modern labs', reason: 'Translates abstract textbook equations into concrete understanding' },
        B: { point: 'Collaborative knowledge hubs', example: 'Booking group study cubicles equipped with smart displays', reason: 'Cultivates teamwork and peer-to-peer revision' },
        C: { point: 'Promoting athletic well-being', example: 'Having well-maintained tracks and covered basketball courts', reason: 'Encourages year-round physical fitness regardless of harsh weather' },
        D: { point: 'Wholesome student nutrition', example: 'Sanitary dining areas serving fresh fruits and balanced hot meals', reason: 'Fuel students’ concentration throughout long academic days' }
      }
    },
    part2: {
      situation: 'A Parent-Teacher Association (PTA) has received a development grant to upgrade one primary facility in the school.',
      centralQuestion: 'Which school facility should be given highest priority for a major upgrade?',
      points: [
        'Science, computer, and digital maker-space laboratories',
        'The main library transformed into a 21st-century digital resource center',
        'Outdoor and indoor sports facilities and sports fields',
        'Canteen and student dining commons with clean water and healthy menus',
        'Classrooms equipped with interactive smartboards and ergonomic desks'
      ],
      decisionPrompt: 'At the end of the discussion, decide which school facility should be given highest priority for the upgrade.'
    }
  },
  {
    id: 'muet_topic_time_management',
    spmReferenceId: 'spm_time_1',
    title: 'Time Management',
    theme: 'Personal Development',
    part1: {
      situation: 'Managing heavy academic demands alongside family, social, and personal life requires structured time discipline.',
      tasks: {
        A: 'Talk about utilizing daily planners and prioritized task lists (e.g. Eisenhower Matrix) to stay organized.',
        B: 'Talk about overcoming chronic procrastination by breaking large tasks into manageable small steps.',
        C: 'Talk about setting strict boundaries on recreational screen time and social media scrolling.',
        D: 'Talk about scheduling intentional rest, exercise, and sleep to prevent academic burnout.'
      },
      hints: {
        A: { point: 'Strategic task prioritization', example: 'Classifying assignments into urgent versus important categories', reason: 'Prevents last-minute panic and ensures critical deadlines are met' },
        B: { point: 'Dismantling procrastination', example: 'Applying the "Pomodoro technique" (25 minutes of focus, 5 minutes rest)', reason: 'Lowers psychological friction to begin daunting revision' },
        C: { point: 'Minimizing digital time sinks', example: 'Setting app usage timers that lock social feeds after 45 minutes', reason: 'Reclaims wasted productive daylight hours' },
        D: { point: 'Protected recovery intervals', example: 'Reserving Sunday evenings exclusively for relaxation and recharging', reason: 'Sustains mental vitality and prevents chronic exhaustion' }
      }
    },
    part2: {
      situation: 'A university student counselling center wants to help undergraduates who feel overwhelmed by academic stress.',
      centralQuestion: 'What is the most effective skill or habit students must develop to balance their studies and life?',
      points: [
        'Learning how to say "no" to non-essential commitments and peer pressure',
        'Mastering daily prioritization using digital calendars and task trackers',
        'Establishing consistent daily sleep, exercise, and study routines',
        'Forming focused study groups where members hold each other accountable',
        'Seeking timely guidance from academic advisors before deadlines pile up'
      ],
      decisionPrompt: 'At the end of the discussion, decide which skill or habit is the most effective for students to balance their studies and life.'
    }
  },
  {
    id: 'muet_topic_employment',
    spmReferenceId: 'spm_career_1',
    title: 'Jobs',
    theme: 'Career & Economy',
    part1: {
      situation: 'Rapid industry changes require fresh university graduates to possess skills beyond academic degrees.',
      tasks: {
        A: 'Talk about the critical importance of effective communication and interpersonal skills in hiring.',
        B: 'Talk about the value of completing hands-on industrial internships and acquiring practical experience.',
        C: 'Talk about proficiency in data analysis, digital tools, and adaptability to new software.',
        D: 'Talk about demonstrating leadership, proactive initiative, and creative problem-solving.'
      },
      hints: {
        A: { point: 'Persuasive communicative capability', example: 'Delivering clear project presentations and active listening in meetings', reason: 'Distinguishes competent leaders from purely technical workers' },
        B: { point: 'Real-world industrial exposure', example: 'Undergoing a 6-month internship in an established corporate firm', reason: 'Builds professional etiquette and validates academic theory in practice' },
        C: { point: 'Technological adaptability', example: 'Mastering data visualization dashboards and collaborative tools', reason: 'Enables quick integration into automated modern work environments' },
        D: { point: 'Independent problem-solving initiative', example: 'Spearheading a solution for an inefficient departmental workflow', reason: 'Proves high value to employers seeking self-driven innovators' }
      }
    },
    part2: {
      situation: 'A national human resources council is discussing how universities can boost fresh graduate employment rates.',
      centralQuestion: 'What is the most impactful step universities should take to prepare graduates for the job market?',
      points: [
        'Making longer industrial internships and industry apprenticeships compulsory',
        'Embedding soft skills, professional pitch presentations, and interview prep in every course',
        'Co-designing degree syllabi directly with multinational employers and tech firms',
        'Fostering entrepreneurial skills so graduates can create their own startups',
        'Providing lifelong career mentorship and alumni networking platforms'
      ],
      decisionPrompt: 'At the end of the discussion, decide which is the most impactful step universities should take to prepare graduates for the job market.'
    }
  },
  {
    id: 'muet_topic_education',
    spmReferenceId: 'spm_edu_reform_1',
    title: 'Education',
    theme: 'Education & Philosophy',
    part1: {
      situation: 'Education in the 21st century extends far beyond memorising facts for standardized examinations.',
      tasks: {
        A: 'Talk about fostering critical thinking and teaching students to evaluate information objectively.',
        B: 'Talk about teaching emotional intelligence, empathy, and social cooperation in classrooms.',
        C: 'Talk about encouraging creativity, artistic expression, and out-of-the-box innovation.',
        D: 'Talk about cultivating a curious lifelong learning mindset that embraces continuous self-improvement.'
      },
      hints: {
        A: { point: 'Analytical reasoning skills', example: 'Analyzing conflicting news articles to identify factual credibility', reason: 'Protects youths from falling prey to fake news and manipulated rhetoric' },
        B: { point: 'Socio-emotional intelligence', example: 'Participating in restorative peer mediation circles after disputes', reason: 'Develops compassionate citizens who resolve conflict constructively' },
        C: { point: 'Unlocking creative inventiveness', example: 'Designing original science fair exhibits or producing short films', reason: 'Drives future cultural and scientific breakthroughs' },
        D: { point: 'Perpetual self-directed growth', example: 'Learning a foreign language or coding independently via online courses', reason: 'Keeps individuals relevant and adaptable in an evolving world' }
      }
    },
    part2: {
      situation: 'An education reform panel is drafting guidelines for a future-ready national curriculum.',
      centralQuestion: 'What should be the ultimate goal of the national education system?',
      points: [
        'Producing ethical citizens with strong integrity and civic responsibility',
        'Equipping students with practical skills tailored for competitive global careers',
        'Nurturing creative, critical thinkers capable of solving complex societal problems',
        'Fostering national unity and harmonious multicultural coexistence',
        'Instilling a love for lifelong learning and personal self-actualization'
      ],
      decisionPrompt: 'At the end of the discussion, decide what should be the ultimate goal of the national education system.'
    }
  },
  {
    id: 'muet_topic_finance',
    spmReferenceId: 'spm_fin_econ_1',
    title: 'Money',
    theme: 'Finance & Economics',
    part1: {
      situation: 'Rising living costs and inflation make financial discipline essential for every household.',
      tasks: {
        A: 'Talk about tracking daily expenses and cutting non-essential lifestyle luxuries.',
        B: 'Talk about comparing prices, buying in bulk, and seeking value-for-money discounts.',
        C: 'Talk about generating supplementary income through legitimate freelancing or part-time work.',
        D: 'Talk about prioritizing essential needs over prestige-driven brand-name purchases.'
      },
      hints: {
        A: { point: 'Eliminating wasteful leakages', example: 'Cancelling unused subscriptions and packing lunch to work', reason: 'Saves substantial sums over a twelve-month period' },
        B: { point: 'Smart consumer comparison', example: 'Reviewing grocery price apps before major household shopping', reason: 'Maximizes purchasing power for essential nutritional needs' },
        C: { point: 'Diversifying income streams', example: 'Offering weekend graphic design or tutoring services', reason: 'Creates a financial buffer against inflation and unexpected price spikes' },
        D: { point: 'Rejecting status spending', example: 'Choosing reliable durable clothing rather than expensive designer labels', reason: 'Protects mental peace and financial security from peer comparison' }
      }
    },
    part2: {
      situation: 'A community center wants to run a program assisting families in coping with rising urban living expenses.',
      centralQuestion: 'What is the most sustainable way for families to cope with the rising cost of living?',
      points: [
        'Adopting disciplined household budgeting and cooking wholesome meals at home',
        'Exploring community carpooling, walking, or public transport to reduce fuel costs',
        'Developing supplemental home-based side businesses or freelance skills',
        'Creating community urban farming and barter exchange networks',
        'Accessing government financial aid and targeted subsidy programs'
      ],
      decisionPrompt: 'At the end of the discussion, decide which is the most sustainable way for families to cope with rising living costs.'
    }
  },
  {
    id: 'muet_topic_family',
    spmReferenceId: 'spm_fam_1',
    title: 'Family',
    theme: 'Family & Relationships',
    part1: {
      situation: 'In a fast-paced digital world, maintaining strong family unity requires intentional effort.',
      tasks: {
        A: 'Talk about the tradition of eating meals together without the distraction of mobile phones.',
        B: 'Talk about having open, compassionate communication where members listen without judgment.',
        C: 'Talk about sharing household chores cooperatively to build mutual appreciation.',
        D: 'Talk about planning regular weekend outings and celebrating family milestones together.'
      },
      hints: {
        A: { point: 'Sacred screen-free dining', example: 'Gathering at the dinner table every evening with phones left in another room', reason: 'Fosters meaningful face-to-face dialogue and deep emotional check-ins' },
        B: { point: 'Empathetic listening', example: 'Parents listening patiently to their teenager’s academic anxieties', reason: 'Builds lasting trust and emotional security within the home' },
        C: { point: 'Equitable domestic teamwork', example: 'Siblings dividing dishwashing, laundry, and gardening tasks fairly', reason: 'Teaches mutual responsibility and lightens parents’ burdens' },
        D: { point: 'Shared joyful memories', example: 'Taking annual camping trips or celebrating grandparents’ birthdays', reason: 'Creates cherished family traditions that anchor future generations' }
      }
    },
    part2: {
      situation: 'Family counsellors and social workers are discussing how to prevent the erosion of family bonds in modern society.',
      centralQuestion: 'What is the most essential factor in building a harmonious and resilient family?',
      points: [
        'Consistent open communication and sincere active listening among family members',
        'Parents dedicating quality, undivided time to their children despite busy careers',
        'Practicing forgiveness and resolving conflicts without harsh emotional outbursts',
        'Instilling sound moral values and mutual respect across generations',
        'Financial stability and collaborative management of household resources'
      ],
      decisionPrompt: 'At the end of the discussion, decide which is the most essential factor in building a harmonious and resilient family.'
    }
  },
  {
    id: 'muet_topic_community',
    spmReferenceId: 'spm_comm_1',
    title: 'Community',
    theme: 'Community & Society',
    part1: {
      situation: 'A strong community looks after its vulnerable members and celebrates diversity.',
      tasks: {
        A: 'Talk about organizing communal gotong-royong cleanups to care for shared public spaces.',
        B: 'Talk about supporting vulnerable elderly neighbours who live alone with groceries and check-ins.',
        C: 'Talk about ensuring public buildings and recreational areas are fully accessible for persons with disabilities.',
        D: 'Talk about celebrating multicultural festivals together to promote intercultural harmony.'
      },
      hints: {
        A: { point: 'Gotong-royong spirit', example: 'Neighbours sweeping drainage channels together to prevent dengue outbreaks', reason: 'Unites diverse residents in collective ownership of their neighbourhood' },
        B: { point: 'Compassionate senior care', example: 'Delivering home-cooked soup to an elderly widow down the street', reason: 'Combats geriatric social isolation and creates a warm safety net' },
        C: { point: 'Universal inclusive accessibility', example: 'Installing wheelchair ramps and tactile paving at community halls', reason: 'Ensures dignity and equal participation for differently-abled citizens' },
        D: { point: 'Intercultural celebration', example: 'Hosting open-house gatherings during Hari Raya, Chinese New Year, and Deepavali', reason: 'Deepens mutual appreciation of Malaysian cultural heritage' }
      }
    },
    part2: {
      situation: 'A residents’ council is selecting a flagship project to transform their township into a model caring community.',
      centralQuestion: 'Which community project would create the most lasting positive impact on residents?',
      points: [
        'Establishing a community food pantry and soup kitchen for low-income families',
        'Building an inclusive community park with facilities for children, seniors, and disabled citizens',
        'Creating a youth mentorship and free after-school tutoring center',
        'Organizing monthly intercultural arts, food, and gotong-royong festivals',
        'Setting up a volunteer elderly care network providing medical transport and companionship'
      ],
      decisionPrompt: 'At the end of the discussion, decide which community project would create the most lasting positive impact.'
    }
  }
];

export function getMUETTopicById(id: string): MUETTopic | undefined {
  return MUET_TOPICS.find(t => t.id === id);
}

export function getRandomMUETTopic(excludeId?: string): MUETTopic {
  const filtered = excludeId ? MUET_TOPICS.filter(t => t.id !== excludeId) : MUET_TOPICS;
  const index = Math.floor(Math.random() * filtered.length);
  return filtered[index] || MUET_TOPICS[0];
}
