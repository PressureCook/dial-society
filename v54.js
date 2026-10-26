/* ===== Dial Society model core, version 5 =====
   Every agent is a small learning AI that trains to hold more power.
   One generation:
   1 Action        the rules of the society move the way the agents have learned to push them, weighted by power
   2 Training      every agent imagines being born again into its own family under one rule nudged up and nudged down,
                   and learns which direction leaves it with the higher score. Score: every round an agent gains
                   score for the power it holds, multiplied by how many people are alive, and loses score by how bad it feels. Four rules are tested each generation, in rotation.
   3 Formation     every agent has its own rules: how hard it punishes, teaches conscience and stokes wanting.
                   childhood dial = baseline + sensitivity x conditioning, and the conditioning is the own rules of the
                   parent and of the adults around, plus the alliance founder's methods. The overarching rules of the
                   community and the society do one thing only: they sway the own rules a child grows up with.
   4 Encounters    adults deal, cheat or deal fairly by the selfish score, and shift each other's dials
   5 Masks and reputation, power and alliances, as before
*/
var DIALS = ['r', 'f', 'g'];
var BASE = { r: 0.35, f: 0.10, g: 0.10 };   // dial value with no conditioning at all
var GAIN = { r: 0.60, f: 0.90, g: 0.90 };   // how far full conditioning can move a dial
var HERIT = 0.5;       // how much of a parent's sensitivity a child inherits
var HOUSE = 0.35;      // household share of childhood conditioning with no parental control
var BETA = 6;          // how sharply people follow their own scores
var PUN_COST = 1.2;    // felt size of a punishment relative to a typical gain
var FINE = 0.8;        // resources lost when caught
var TAU = 0.30;        // fear and guilt both under this = the low region
var N_START = 9;       // places for communities to begin with. Place 0 is for people with no community, six communities are founded, and the rest are free
var N_COMM = N_START;  // places for communities right now. There is no limit: more are added whenever they run short
var ROOM_STEP = 4;     // how many places are added at a time
var FOUNDING = 6;      // communities at the start
var ROUNDS = 8;        // rounds of adult life per generation
var MEETS = 5;         // encounters each adult starts in every round of a real life, so forty a generation, every one at the full stake
var YOUTH = 3;         // rounds in which parents can still choose who you meet
var COMMONS = 0.5;     // resources per head handed out each round according to public standing, when there is enough
var PER_HEAD = 1.3;    // new wealth per head per round that an orderly society creates when nothing is scarce
var COMMONS_CUT = 0.4; // share of the round's new wealth that goes to the commons; the rest funds fair deals
var LIFE = 8;          // resources each founder starts with
var MASKED = 0.03;     // average gap between shown and inner dials that counts as wearing a mask
var NEIGHBOURS = 10;    // how many of the nearest people on the map count as an agent's neighbours
var LEVERAGE = 1.0;    // how much existing resources help win more
var WRONGED = 0.10;    // being cheated: roll against your guilt dial. Pass and conscience grows by this, fail and it shrinks
var SPEND = 0.3;       // resources per round that engineered wanting draws out of a fully hungry person
var RESPECT = 0.8;     // how much respectability scales gains: from x0.6 at none to x1.4 at full
var UPKEEP = 0.06;     // resources per round that punishment and teaching each cost at full strength, scaled by what you hold
var PUSH_STEP = 0.3;   // largest move of a rule in one generation as a share of its range, before culture speed
var NUDGE = 0.08;      // how far, as a share of its range, each rule is nudged in the imagined lives
var LEARN = 0.25;      // how much of each new lesson an agent takes on; the rest is what its parents pushed for. A lesson is kept as a push, from -1 to 1
var BSCALE = 1;        // a lesson says to push most of the way to the hardest when the full range of a rule is worth one equal share of power to the agent
var TRAIN_PAIRS = 4;   // rules tested per generation, each with its own pair of imagined lives
var ALLY_BONUS = 0.3;  // pooled power is multiplied by size^(this x the alliance lever)
var ALLY_MEET = 0.3;   // share of dealings an alliance member has with fellow members
var ALLY_PULL = 1.6;   // fellow members move each other this much more than strangers do
var FOUND = 0.02;      // chance per generation that an unallied person founds an alliance (scaled by their reward dial)
var JOIN = 0.25;       // chance per generation that an unallied person looks at joining one
var SWITCH = 0.06;     // chance per generation that a member looks at defecting to a stronger alliance
var BREAK = 0.015;     // base chance per generation that a member leads a breakaway
var TAKE = 0.3;        // the most a defector or a breakaway can strip, as a share of what the others hold
var SLOTS = 8;         // alliances that can hold a colour at once
var GIFT = 0.05;       // at full sharing, a willing giver hands over this share of the gap between the two
var KEEP = 0.5;        // how strongly the reward dial pulls toward keeping what you hold
var START_POP = 20;     // founders per community. Each community has room for a hundred
var CHILD_DIE = 0.45;   // share of children who die before they grow up where no invention that lengthens life is in use
var CHILD_HALF = 4;     // that many such inventions in use, each counted as far as the community had the resource for it, halve the share
var BIRTHS = 0.7;       // children the founders want each, for every generation, while there is room. From there the number is each agent's own to move
var OTH_BIRTHS = 1.5;   // children every adult with no AI has, in each generation of its adult life, while there is room: one and an even chance of a second.
                        // Over the two generations of an adult life that is three each, six for every two parents, which is what people had before birth control
var OTH_SPAN = 2;       // generations someone with no AI lives once it has grown up. Nothing anyone invents changes it
var ENDOW = 0.3;        // share of its holdings a living parent hands to the children born this generation, at full inheritance
var SPAN_START = 2;     // generations an agent lives, to begin with
var SPAN_STEP = 0.25;   // how far the length of a life moves each generation, up or down
var KILL_CALM = 0.01;   // a generation in which fewer than this share of a community's people were killed by another is a stable one
var SPREAD = [2, 6, 14];   // rounds after which an invention reaches the family, the community and the world
var REACH = [0.25, 0.05, 0.01];   // what it is worth to them, against the inventor's INV_GAIN
var SCORE_CAP = 60;     // score doubles with every equal share of power held, up to this many
var SPAN_INV = 0.25;    // generations of life one invention costs every other community, times the share of the world killed that generation
var ADOPT = 0.25;       // an invention counts as in use by a community, or by the world, once this share of its people hold it
var INV_LIFE = 24;      // rounds after which an invention that has not reached the whole world stops being passed on
var PEACE = 20;         // how fast killing in a community eats into what its inventions are worth to it
var REACH_HOME = [0.05, 0.2];   // what an invention is worth to the inventor's community: in one torn by killing, and in one with none
var STACK_UNIT = 20;    // an invention is worth this much more for every twenty its community already has in use
var STACK_KEEP = 0.5;   // share of a community's stack of inventions still in use a generation later
var HOLD = 0.5;         // how much a full fear dial holds an agent back from pushing at all
var NEAR = 1;           // being right beside your community, family and alliance doubles your power; being far from them adds nothing
var CARRY = 2000;         // how many people the resources in the ground at the start can feed, with Resources available at its default
var HUNGER = 0.5;         // people go hungry when their community's new wealth per head falls below this share of what an orderly society would create
var BIRTH_ROOM = 1.1;     // children are born until a community has this many times the people it can feed. The rest die at birth
var STARVE = 0.25;        // share of the people a community cannot feed who die each round
var DISCOVER = 0.1;       // chance that an invention discovers more resources
var FIND = 0.02;          // how much richness the first discovery adds. Later ones add less, the more has been found already
var FIND_NEAR = 0.08;     // a discovery this close to a known resource place adds to it. Further away, it becomes a new place
var LEAVE_LOSS = 0.3;     // share of its power a member loses for a generation when it leaves its community for a new one. Half of that the generation after
var DOT_MAX = 3000;       // the most dots the land is allowed to feed. When it could feed more, every dot stands for more people instead
var SLOT_START = 512;     // places on the board to begin with. The board grows as the population does
var SLOT_MAX = 6400;      // the most places the page will hold. Past that it is the page that limits the population, and it says so
var TRADE_PRICE = 0.15;   // what food for one person for a generation costs at an even bargain, as a share of the average holding
var TRADE_PURSE = 0.2;    // the most of what it holds that a buyer will pay in one purchase
var TRADE_PULL = 2;       // how strongly wanting weighs the price for a seller
var TRADE_REGARD = 0.5;   // how much a seller's regard for the buyer counts
var TRADE_HOLD = 0.1;     // a plain reluctance to sell what belongs to one's community
var HARM_WARY = 1;        // how much a seller holds back the means of harm from a community its own holds in low standing
/* Kinds of resource. What each does to life: 0 lengthens it, 1 shortens it, 2 can do either. An invention needs the resource it was made from. */
var TYPE_OF = { farm: 0, fish: 0, water: 0, obsidian: 1, uranium: 1, sulphur: 1, saltpetre: 1, stone: 2, metal: 2, oil: 2, coal: 2, gems: 2 };
var ABSTRACT_TYPES = [0, 0, 2, 0, 1, 2, 0, 0, 2, 1, 0, 2];   // the types of the twelve sites on the abstract square
var INV_ROOM = 2;         // inventions need resources: all the richness in the ground at the start could carry this much invention per head of the people it could feed
var LEAK = 0.5;           // how much an invention that lengthens life counts for a community that did not make it
var DEPLETE = 0.01;       // share of a resource place that runs out in a generation in which it is worked to the full
var DEPLETE_INV = 0.01;   // and the share its holders' inventions use up when they draw on it to the full
var RENEW = 0.03;         // how fast farmland, fishing grounds and fresh water recover toward the most they have held, each generation
var RICH_FLOOR = 0.05;    // no place runs lower than this share of the most it has held
var JUDGE = 0.05;         // how far being caught moves an acquaintance's regard, up or down, by whether the acquaintance does such things itself: a quarter of what being cheated oneself does
var JUDGE_N = 4;          // how many acquaintances hear of it
var INF_GIFT = 0.5;       // influence a gift the size of an average holding buys over whoever receives it. Influence runs from 0 to 1
var REL_GIFT = 0.3;       // and how far such a gift raises the receiver's regard for the giver
var RP_GIFT = 0.1;        // and the giver's public standing
var GIFT_SPREAD = 0.15;   // how far such a gift moves the regard of someone who knows both, times that someone's regard for the receiver
var SPREAD_N = 12;        // how many who know them both hear of it
var GIFT_UP = 0.05;       // share of what it holds that the weaker of two hands to the stronger when it gives upward
var COURT = 0.3;          // how much wanting pulls toward giving upward, at the widest gap in power
var APPEASE = 0.3;        // how much fear does
var COURT_HOLD = 0.4;     // a plain reluctance to give upward
var INF_POWER = 0.5;      // the most that influence over others can add to an agent's power
var INF_HALF = 3;         // full influence over this many others gives half of that
var INF_PULL = 0.3;       // how much influence over someone adds to the pull on their dials
var INF_KIN = 0.5;        // the influence a parent starts with over its child. The child starts with half as much over the parent
var ASK = 0.5;            // chance per encounter that an agent with a full reward dial asks the other for something
var ASK_BETA = 4;         // how sharply the answer follows the case for it
var ASK_POWER = 1;        // how much the asker's power against the other counts toward a yes
var ASK_INF = 3;          // how much the asker's influence over the other counts: three times as much
var ASK_REGARD = 1;       // how much the other's regard for the asker counts
var ASK_COST = [0.6, 0.8, 0.6, 0.3, 0.8, 0.4];   // how much each thing asks of the other: a place in its community, resources, an invention, a place in its alliance, backing to put someone out, backing on a rule
var ASK_GIVE = 0.05;      // share of what it holds that someone who agrees to give resources hands over
var INF_FAVOUR = 0.1;     // a favour granted gives the one who granted it this much influence over the asker
var ASK_SPEND = 0.8;      // and the asker keeps this share of its influence over the one who granted it
var ASK_SWAY = 0.2;       // how far someone who agrees to back a rule moves its own push toward the asker's
var EXPEL_BAR = 0.15;     // someone is put out when the power backing it reaches this share of the community's, for the weakest member. Three times that for the strongest
var RAID_GAIN = 0.6;      // how large the prize looks to a community weighing a raid, before hunger is added
var RAID_FEAR = 0.5;      // how much losing looms, against the fear dial
var RAID_HARM = 0.8;      // how harmful a raid counts as, against the guilt dial
var RAID_HOLD = 0.1;      // a plain reluctance to raid
var RAID_TAKE = 0.3;      // share of the loser's hold on the land fought over that a successful raid takes
var RAID_COST = 0.1;      // share of their power the raiders spend, for a generation. The defenders spend half as much
var RAID_DEAD = 0.03;     // share of the losing side killed in a raid. The winning side loses a third as many
var RAID_GRUDGE = 0.4;    // how far a raid lowers the standing the raided hold the raiders in
var COMM_STAKE = 0.02;    // what a deal between two communities is about, as a share of what the poorer of the two holds
var STAND_POWER = 1;      // standing adds to power: from half at the lowest standing to half again at the highest
var JUDGE_C = 0.25;       // how far one community's standing toward another moves when it judges what that one did, at the harm of a killing
var JUDGE_P = 0.2;        // and how far each of its members who know a member of that community moves its regard for that member, for the most powerful
var PEOPLE_VALUE = 1;     // what taking in a whole beaten community's people is worth to the winners, against its land
var COMM_PARTNERS = 2;    // every community of eight or more deals once a generation with each of this many of its nearest communities
var TERRAIN_STEEP = 3.5; // how fast the cost of crossing ground rises with its steepness: e to the power of this times the slope, as in Tobler's rule for walking
var TERRAIN_MAX = 5;     // the most a cell of ground can cost to cross, against 1 for flat ground
var TRAVEL = 0.15;       // what it costs to cross the whole width of the map, as a share of the average holding, at an equal share of power and with no inventions
var RANGE = 0.25;        // how far, as a share of the map's width, an agent with an equal share of power and no inventions will readily go to deal
var RES_NEAR = 0.5;      // the share of a member's power base that follows its own share, by nearness, of the resources its community holds
var OUTCAST_LAND = 0.3;   // someone with no community lays claim to this much of the land that a member of a community does
var HARSH_AT = 0.7;       // an own punishment rule above this is the high end: its punishments can go as far as exile or death
var DEATH_MAX = 0.05;     // chance that a punishment by the very hardest punisher is death, against someone of equal power
var EXILE_MAX = 0.10;     // and the chance that it is being put out of the community the two share
var DEATH_FEAR = 2;       // how much larger punishment by the very hardest punisher looms for the fear dial
var VULN = 0.15;          // how much more tempting it is to wrong someone at the very bottom of the order of power than someone in the middle of it
var CHILD_POWER = 0.25;   // a child has this share of the power its holdings would give an adult
var NEAR_D = 0.12;      // distance, as a share of the map's width, at which closeness has fallen to about a third
var MOVE = 0.25;        // how far an agent moves toward its people each generation
var WANDER = 0.03;      // random drift each generation, and how far from a parent a child is born
/* Real maps. Land shapes are Natural Earth's, laid on a 96 by 96 grid: mask is one bit per cell, row by row from the south.
   homes are where the six founding communities start, sites are where resources lie. x runs west to east, y south to north. */
var GEO = {"rapanui":{"name":"Rapa Nui (Easter Island)","note":"six real settlement and ceremonial centres around the coast","km":27.2,"G":96,"box":[0,1,0.153,0.847],"mask":"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000003f80000000000000000000007fc000000000000000000000fff000000000000000000000fff800000000000000000001fff800000000000000000000fffc00000000000000000000fffe000000000000000000007fff800000000000000000007fffe00000000000000000007fffffe000000000000000003ffffffc00000000000000003ffffffe00000000000000003fffffff00000000000000001fffffff80000000000000001fffffffc0000000000000001fffffffe0000000000000001ffffffff8000000000000000ffffffffc000000000000000fffffffff000000000000000ffffffffff00000000000000ffffffffffffc000000000007ffffffffffff800000000007ffffffffffffc00000000007fffffffffffff00000000003fffffffffffff80000000003ffffffffffffff0000000003fffffffffffffff800000003ffffffffffffffff80000001ffffffffffffffffc0000001fffffffffffffffff0000001fffffffffffffffff8000001fffffffffffffffffc000000fffffffffffffffffe000000fffffffffffffffffe000000ffffffffffffffffff0000007fffffffffffffffff0000007fffffffffffffffff8000007fffffffffffffffff8000007fffffffffffffffff0000003ffffffffffff87ffe0000003fffffffffffc00ffc0000001fffffffffff0007f80000000ffffffffffc0000000000000ffffffffff000000000000007ffffffff8000000000000003fffffffe0000000000000001fffffff80000000000000000ffffffe000000000000000007fffff8000000000000000003ffffc0000000000000000001ffff00000000000000000000fffc000000000000000000003ff0000000000000000000000fc00000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","homes":[{"label":"Anakena","x":0.552,"y":0.732},{"label":"Te Peu","x":0.215,"y":0.627},{"label":"Tahai","x":0.175,"y":0.459},{"label":"Vinapu","x":0.251,"y":0.31},{"label":"Akahanga","x":0.571,"y":0.435},{"label":"Tongariki","x":0.72,"y":0.517}],"sites":[{"label":"South coast rock gardens, Vaihu to Akahanga","kind":"farm","x":0.473,"y":0.447,"rich":1.5},{"label":"Poike peninsula gardens","kind":"farm","x":0.844,"y":0.602,"rich":1},{"label":"Terevaka uplands, palm forest and gardens","kind":"farm","x":0.309,"y":0.712,"rich":0.8},{"label":"Anakena landing and fishing","kind":"fish","x":0.553,"y":0.733,"rich":1},{"label":"Hanga Roa landing and fishing","kind":"fish","x":0.153,"y":0.426,"rich":1},{"label":"Hotu Iti bay fishing","kind":"fish","x":0.745,"y":0.496,"rich":0.9},{"label":"Motu Nui seabird islets","kind":"fish","x":0.08,"y":0.21,"rich":0.5},{"label":"Rano Kau crater lake","kind":"water","x":0.145,"y":0.271,"rich":1},{"label":"Rano Aroi crater swamp","kind":"water","x":0.367,"y":0.647,"rich":0.7},{"label":"Rano Raraku statue quarry","kind":"stone","x":0.677,"y":0.534,"rich":1},{"label":"Orito obsidian","kind":"obsidian","x":0.222,"y":0.365,"rich":0.8},{"label":"Puna Pau red scoria quarry","kind":"stone","x":0.265,"y":0.432,"rich":0.6}],"elev":"0000000000000000000000090n1h2a353d3f0000010l1l3k5k7l85897f5o000k191r2d39485c6x8i7q6f3x00001c30323230363k5u8g7r6v5h002s684p3i35393r5o7s796j5d3x013d7h614v4h4j4y61766o61523z2s356z72726w6w716v6l615e4l3p2q1e022r666h6q6q6p6o6f635l50473d2g1e0b05002b595i5q5w5v5p5m5j554m3t2z261e0o0b0201000000000000003x474f4m4p4q4l4f473u302f221q1f130p07000100000000000000002g2t353c3i3o3k3d3a302d25292e2h241l0p0a080807050303030302010p1b1u21282d2g2i2b25202d323l413n2z1r130u0s0r0j0d0a0b0d0803030p181f1l1p1t1x1t1s1w2f3b3z4i4a3q2g1q1g1b170w0o0k0j0l0g0909070k11181c1d1f1i1m1q1v2f393u4c4f442x2a221t1k19100v0t0s0n0i0h0g0e0g0u1318191b1f1h1l1u2a2w3a3l3q3l2x2j2c231v1o1i1a1616100t0s0p0l0h0b0n0y1415181c1d1h1s262l2t2z34352x2q2k2d25231z1p1l1j1c1515110t0o0n0e0e0o0v0y11141b1j1u282q323b3k3l392z2s2k2d2d2a24201w1q1k1p1o190z0t0l0d060e0k0p0u101b1l1x2b2s3a3s3z3z3k3b352y2s2p2m2i2e2a26242b281m180y0r0j0b050103070c0n0z1c1o222e2o3j4h4g4a3w3p3n3i3d342y2v2s2o2r2v2x2o1v1d130w0p0k0g0c070100000002070i0v181l1y282j38424x574a3t3p3s3v3q3l3g3b36393d342p201j19120v0t0p0k0f0a05000000000000000000000001040e0r141g1p202c2p375f6d4p3u3l3x4c4e4c453x3p3q3q352l231q1g1912110y0r0o0n0b000000000000000000000000000202020d0r151i1q1y282h2t404m3z3p3o4e565b5a4x4l4b433v3f2y2g221r1h1713100x0v0u0m0e0b0805030002040404020306050202000b0q151j1q1y252c2k2y393g3m3r4p5s64665o584v4g423p3b2v2g231p1d17131414140y0s0m0g0b0805080b0b0a07090d0a07030100090m101e1q1z262f2o2x363g3m3p4m5p6m706c5r574r4d413p3c2w2e1x1i1e1c1a1h1s1h150y0r0m0k0m0p0r0n0m0m0l0k0j0h08020000080i0w1b1s23292i2r2z373i3q3v4r5r6p746k5z5f4z4l4a403r3d2w2d1w1s1p1m1r201p1d16100u0v0z12130z0w0w0u0r0q0n0e070502000000070f0u1a1v282e2m2v333b3l3w48525z6f6n6d5z5j554s4h48433u3j302h2b26201y1x1p1g1b171214191b1d191612100y0u0q0k0g0c07000000000000000003080p171v2d2q3a3v3j3e3l3w4a4z5q696i665t5f554v4m4e48403r3b2u2m2f2a27241y1r1j1d1c1e1i1j1j1f1d1c1a170y0p0k0f0904000000000000000000000000010k151u2h313z4v403g3m3w494t5f656h615o5c55504s4k4b433w3j352u2n2j2g2d29241r1j1l1o1r1r1p1l1j1l1k1i140q0j0c040201040504020100000000000000010n181u2d2u3f3y3q3m3q3z4a4s5d6b6s695v5m5j5h544r4e453x3n3d352x2r2p2o2h281x1q1s1v201z1w1q1k1h1m1w1t1l0v0f0a0c0g181t1e0v07000000000000010000010p1b1u2a2p303a3h3n3s404c4u5e6e6x6l6a615z5w5g504l493z3t3n3f38312x2v2n2f241z20232925201s1l1e1l1z211x130k0i0q1226312n231c141312110z0x0u0h0000010q1d1u292l2v343a3h3p414g515n6b6u75726r6i6a5u5e4w4h45423y3p3h3b332u2r2n2f29282c2j291y1r1k1d1d1h1g1e130w0r1a252t3g3v45464644403v3p3g331r0200010q1c1t262g2p2y353e3s484q5d606l757m7p7i766s6d5w5c4x4l4f49403s3n3e33302w2r2p2s2r2o2c201u1o1g1d1c19171615171u2r373p4l585n5r5s5k5b544q432b020000010p1a1q222b2j2r303d3y4j555r6e727m81888b7w7d6x6g5v5g554u4j4a433z3s3i3b3633363h392q2e241z1t1m1i1g1b17191e1p2c333f3w4z5t6b6j6n6a5z5u5b4d2f020000010k121l1y272f2n343n4b505p6d727r8b8m8q8p8b7w7d6v6d625v5g514p4k4p4f3x3k393330342z2o2e251x1q1m1k1i1d191a1f1r2d333p4e5n6p7i7o7j6v675t5a4k2n090300010d0t1e1t232c2k383x4p5h6a707r8g909999938r8e7u7b6x6o6k625j55525g544c3t3b312u2q2o2n2f251t1m1l1k1k1f1b1b1f1p2a313w4u687i8n8o897a6e5t584p2x0o090000050g151p252f2q3f4858636t7m8f939na09z9o9d918f7w7h77706i605n5o6b5t4n3z3f342w2s2p2n2e241s1k1h1g1h1g1e1c1c1h222v3r4s6d7u958y84796h615f4o3e1x0u00000000060r1e242k2y3p4k5o6l7f8a949rabaoala89x9l8z8f827r7h6x6d615z6g5w4s453m372x2t2p2m2d231u1l1d1b1b1d1d1a181a1u2m3h4g5x7b8n8i7r726g5z5c4g3a1z0v0000000001060v212o38414x5z71838y9taib1b7b3arafa29g8y8n8a7x7a6n6a5y5q594p4b3x3d2y2s2o2l2d241z1q1a141316171412131m2c323u4r5t6y78756p685l4u402h0o0a000000000o1w2q3g4a566a7f8l9mamb5bkbobkb9axal9x9c8y8j827g6t6e5y5j544q483q392w2p2i2b211s1n1f120y0z0z0y0v0u3c424w5s666d625p5349331p07030000000m1p2p3o4h5e6l7t91aabgbrc0c5c0bpbfb4ad9p968n837j6z6f5y5j564t423c312s2k2a1y1m1b130x0s0s0w0s4t575i5b514k3k210x0100000c0x293q4m5k6m7r8ya7bec2clcscmc9bubdaqa39h8w8c7t7b6s685p584r3y372x2n2g271w1j160y0q0j0k2h2b28241w1i0u0e00040a1v3p4o5n6l7n8sa2bdced4d7d1cnc4bjayac9p938i817j6y6d5s574n3t312r2i2c231t1f120s0j0001031n3h4l5l6f7d8e9vbfcqdid6cwcmc3biawaa9n928j7z7f6p635l524g3l2s2i2a261y1o1b0y0000122f415f6a798c9ubfcpdecycpckc1bgawab9o938h7v776e5p564m413b2l271w1r1k00080o3656657a8i9ybdcdcxcmchcic0beawad9s948d7o6y62594k3z3g2y2g1v1e02092n4p5y768e9oaxboc5c1c1c6brb9asa99o8y847f6o5s4x453g2t2b1s0527435m6z859aacaxbbbebjbqbgb3ama39h8p7t746e5h4m3s2z281g2w4j5z7b8e9ea2akauayazauama99r92887b6l5v4v413g1s3d4v697a888z9ma2aaacaba89u9b8j7o6r615b253j4x5u6n7j8c8y9g9v9za09d8o7v7064293l4i5c636r7a7u8d8j8k847l6w38444l505c5s6b6g6i6g3f3v43484a3s2p2u"},"world":{"name":"The world","note":"six early centres of settled life","km":40075.2,"G":96,"box":[0,1,0.303,0.697],"mask":"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000c00000000200000000000000c00000000000000040000000e00000000000001000000000f800000000000070100000007c000060000018f0000000007e00007000001ff8000000007e0000f800003ff8000000007f8000fc80003ff0000000007f8001fc80000fe000000000ffc001fe8000072080000001ffc000fe0000000000000001ffe001fc0000406000000003ffc001fe000109e000000001fe0003fe0001600000000001fc0003ff8001200000000003f0007fff8042040000000004c000ffff408380000000001c0001ffff80838000000000f84000fffde1c70000000000c60000fffff1ffc000000001c20000fffb9ffff000000003f400007ffffffff80000000ffe00003e07fffff10000001fff0000331ffffff8c000001fff8000397dfffffe4000001fffc0000ef3ffffff0000001fffec001fffffffff8000003ffdf80057ffffffffc000407ff9f000233fffffff82007bffe18000078ffffffff9027ffff6638003bffffffffff8fffffd63e000fe7efffffff820072f83fc001022fffff80000023e0ffe0000101fc0000000029f7ffe01800001000000000007e2fc0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","homes":[{"label":"Fertile Crescent","x":0.622,"y":0.556},{"label":"Indus valley","x":0.694,"y":0.539},{"label":"Yellow River","x":0.811,"y":0.561},{"label":"Mesoamerica","x":0.233,"y":0.514},{"label":"Andes","x":0.3,"y":0.428},{"label":"West African Sahel","x":0.494,"y":0.503}],"sites":[{"label":"Persian Gulf oil and gas","kind":"oil","x":0.639,"y":0.536,"rich":1.5},{"label":"West Siberian oil and gas","kind":"oil","x":0.703,"y":0.633,"rich":1.3},{"label":"Texas and Gulf of Mexico oil","kind":"oil","x":0.233,"y":0.547,"rich":1.2},{"label":"Orinoco oil, Venezuela","kind":"oil","x":0.322,"y":0.488,"rich":1},{"label":"Niger Delta oil","kind":"oil","x":0.518,"y":0.478,"rich":0.8},{"label":"North Sea oil and gas","kind":"oil","x":0.506,"y":0.625,"rich":0.7},{"label":"Andean copper, Atacama","kind":"metal","x":0.308,"y":0.4,"rich":1.2},{"label":"Pilbara iron ore","kind":"metal","x":0.828,"y":0.403,"rich":1.2},{"label":"Witwatersrand gold and Bushveld platinum","kind":"metal","x":0.578,"y":0.392,"rich":1},{"label":"Central African Copperbelt","kind":"metal","x":0.576,"y":0.431,"rich":1},{"label":"Carajas iron ore","kind":"metal","x":0.361,"y":0.447,"rich":0.9},{"label":"Ural metals","kind":"metal","x":0.667,"y":0.622,"rich":0.8},{"label":"North China coal","kind":"coal","x":0.808,"y":0.571,"rich":1.3},{"label":"Appalachian coal","kind":"coal","x":0.275,"y":0.569,"rich":0.8},{"label":"Ruhr and Silesian coal","kind":"coal","x":0.533,"y":0.606,"rich":0.6},{"label":"Indo-Gangetic plain","kind":"farm","x":0.728,"y":0.536,"rich":1.5},{"label":"North China Plain","kind":"farm","x":0.822,"y":0.56,"rich":1.4},{"label":"American Midwest","kind":"farm","x":0.242,"y":0.578,"rich":1.4},{"label":"Black earth of Ukraine and Russia","kind":"farm","x":0.594,"y":0.603,"rich":1.2},{"label":"Pampas","kind":"farm","x":0.331,"y":0.369,"rich":1.1},{"label":"Brazilian Cerrado","kind":"farm","x":0.358,"y":0.422,"rich":1},{"label":"West European plain","kind":"farm","x":0.507,"y":0.599,"rich":1},{"label":"Mekong and Chao Phraya rice lands","kind":"farm","x":0.786,"y":0.501,"rich":0.9},{"label":"Nile valley and delta","kind":"farm","x":0.586,"y":0.542,"rich":0.7},{"label":"West African savanna","kind":"farm","x":0.517,"y":0.494,"rich":0.6},{"label":"Murray Darling basin","kind":"farm","x":0.903,"y":0.369,"rich":0.5},{"label":"Shinkolobwe uranium, Congo","kind":"uranium","x":0.574,"y":0.433,"rich":0.5},{"label":"Bihar saltpetre, India","kind":"saltpetre","x":0.736,"y":0.535,"rich":0.6},{"label":"Sichuan saltpetre, China","kind":"saltpetre","x":0.789,"y":0.549,"rich":0.5},{"label":"Colorado Plateau uranium","kind":"uranium","x":0.196,"y":0.571,"rich":0.5},{"label":"Ore Mountains uranium, Bohemia","kind":"uranium","x":0.536,"y":0.604,"rich":0.4},{"label":"Arlit uranium, Niger","kind":"uranium","x":0.521,"y":0.516,"rich":0.4}]},"africa":{"name":"Africa","note":"the heartlands of six historic African states","km":8293.3,"G":96,"box":[0.003,0.997,0,1],"mask":"0000000000000000000000000000000000000000000000000000000000003e40000000000000000000007ffc000000000000000000003ffe000000000000000000003fff000000000000000000007fff80000000000000000000ffffc0000000000000000000ffffc0000000000000000001fffff0000000000000000003fffff0000000000000000003fffff0000000000000000007fffff8000000000000000007fffff8000800000000000007fffffe001e00000000000007ffffff003e00000000000007ffffff003f00000000000007ffffff003f0000000000000fffffff003f0000000000001ffffffe001f8000000000001ffffffe001f8000000000003fffffff001f8000000000003fffffff801fc000000000007fffffffc01fc000000000007ffffffff01fc000000000007ffffffffc1fc000000000003ffffffffc03e000000000003ffffffffe00e000000000003ffffffffc00e000000000001ffffffffc004000000000000ffffffffc004000000000000ffffffffc000000000000000ffffffffc000000000000001ffffffff8000000000000001ffffffff8000000000000001ffffffff8000000000000001ffffffff8000000000000001ffffffff8000000000000003ffffffff0000000000000003ffffffff0000000000000007ffffffff800000000000000fffffffff800000000000001fffffffffc00000000000003fffffffffe00000000000003ffffffffff00000000000007ffffffffff80000000000023ffffffffff80000000000003ffffffffffc0000000000003fffffffffff0000000000001fffffffffff8000000000001fffffffffffc000000000001fffffffffffe000001c0007fffffffffffff000003ffc07fffffffffffff80000ffff8ffffffffffffff80001fffffffffffffffffffc0003fffffffffffffffffffc0007fffffffffffffffffffe0007ffffffffffffffffffff000fffffffffffffffffffff001ffffffffffffffffffc1f003ffffffffffffffffff801007ffffffffffffffffffc0010fffffffffffffffffffb8000fffffffffffffffffff3f800ffffffffffffffffffc7fe007fffffffffffffffff87ff807fffffffffffffffff87ffc07fffffffffffffffff07fff07fffffffffffffffff0ffff07ffffffffffffffffc1ffff07ffffffffffffffffc1ffff07ffffffffffffffffc3ffff0fffffffffffffffffc7ffff0fffffffffffffffffcfffff07ffffffffffffffff8fffff07ffffffffffffffff0fffff03ffffffffffffffff1ffff801fffffffffffffffe3fffe001fffffffffffffffe3fffe000fffffffffffffffc7fffe0007ffffffffffffffcffffc3003ffffffffffffff9ffff8f000ffffffffffffff7ffff0f0007ffffffffffffffffff1f0003ffffffffdfffffffffff0007ffffffff0ffc7bffffff0003fffffffc0fc001ffffff0003fffffff0070001ffffff0000ffffff00000000ffffff00007ffffe00000000ffffff00003fffff0000300cffffff0000007fff00000000ffffff00003007ff0000009c7fffff0001ff00001c0307ffffffff0001ff80001602c7ffffffff","homes":[{"label":"Egypt, on the Nile","x":0.708,"y":0.832},{"label":"Mali, on the Niger bend","x":0.218,"y":0.678},{"label":"Aksum, in the Ethiopian highlands","x":0.791,"y":0.671},{"label":"Buganda, on the Great Lakes","x":0.695,"y":0.49},{"label":"Kongo","x":0.466,"y":0.403},{"label":"Great Zimbabwe","x":0.687,"y":0.211}],"sites":[{"label":"Niger Delta oil","kind":"oil","x":0.359,"y":0.55,"rich":1.3},{"label":"Sirte basin oil, Libya","kind":"oil","x":0.527,"y":0.872,"rich":1.1},{"label":"Hassi Messaoud oil and gas, Algeria","kind":"oil","x":0.352,"y":0.909,"rich":1.1},{"label":"Angolan and Cabinda oil","kind":"oil","x":0.437,"y":0.396,"rich":1},{"label":"Rovuma gas, Mozambique","kind":"oil","x":0.813,"y":0.336,"rich":0.7},{"label":"Witwatersrand gold and Bushveld platinum","kind":"metal","x":0.652,"y":0.134,"rich":1.5},{"label":"Copperbelt copper and cobalt","kind":"metal","x":0.641,"y":0.322,"rich":1.4},{"label":"Moroccan phosphates","kind":"metal","x":0.179,"y":0.925,"rich":0.9},{"label":"Ashanti gold, Ghana","kind":"metal","x":0.246,"y":0.566,"rich":0.8},{"label":"Guinea bauxite","kind":"metal","x":0.093,"y":0.631,"rich":0.8},{"label":"Great Dyke platinum and chrome, Zimbabwe","kind":"metal","x":0.681,"y":0.235,"rich":0.7},{"label":"Kivu tin and coltan","kind":"metal","x":0.654,"y":0.45,"rich":0.6},{"label":"Zouerat iron ore, Mauritania","kind":"metal","x":0.104,"y":0.788,"rich":0.5},{"label":"Botswana diamonds","kind":"gems","x":0.611,"y":0.181,"rich":0.9},{"label":"Kasai diamonds","kind":"gems","x":0.589,"y":0.401,"rich":0.6},{"label":"Nile valley and delta","kind":"farm","x":0.688,"y":0.866,"rich":1.3},{"label":"Lake Victoria basin","kind":"farm","x":0.708,"y":0.47,"rich":1.1},{"label":"Ethiopian highlands","kind":"farm","x":0.795,"y":0.611,"rich":1},{"label":"Nigerian savanna","kind":"farm","x":0.373,"y":0.631,"rich":1},{"label":"Gezira, between the Niles","kind":"farm","x":0.715,"y":0.678,"rich":0.7},{"label":"Maghreb coast","kind":"farm","x":0.326,"y":0.966,"rich":0.6},{"label":"Shinkolobwe uranium, Katanga","kind":"uranium","x":0.628,"y":0.335,"rich":0.7},{"label":"Arlit uranium, Niger","kind":"uranium","x":0.371,"y":0.734,"rich":0.6},{"label":"Rossing uranium, Namibia","kind":"uranium","x":0.473,"y":0.181,"rich":0.5}]},"europe":{"name":"Europe and the Middle East","note":"six centres of the ancient world","km":6086.3,"G":96,"box":[0,1,0.143,0.857],"mask":"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000fffffffffffffffc3ffffff8fffffffffffffff83ffffff0fffffffffffffff87ffffff0fffffffffffffff8ffffe780fffffffffffffff9ffffc380fffffffffffffff1ffffc183fffffffffffffff1ffff40bfffffffffffffffe3ffff003fffffffffffffffe3ffff077fffffffffffffffe7fffe0fffffffffffffffffdffffc3ffffffffffffffffffffffc3fff7fffffffffffffbffffc7fff3ffffffffffffffffffc7fff3ffffffffeffffffffffffff3ffffffffc7ff7ffffffffff3fffffffe07f810fffffffff3fffffffe07c000fffffffff1fffffff8038000fffffffff1ffffff800000007ffffffff07fffff000000007ffffffff03fffff000000007ffffffff03fffff800010063ffffffff0107fff800040013ffffffff0001fff000000043ffffffff03803ff8000006f3ffffffff1ff00010c0181fffffffffff1ff80001c0383fffffffffff1ffc0000104c7fffffffffff3ffc000008383fffffffffff3ffc202018783fffffffffff1ffe102012f07fffffffffff1ffe00607cfc47ffffffffff1fff800070fff8fe0fffffff1fffc021f0ffe07807ffffff1fffe02381ffe00007ffffff3fffc0078fffe0000fffffff0f0fff0f0ffff0001fffffff0007ff9e1ffff0003fffffff0007fffe3ffff010ffffffff0003fffebffff83dffffffff0007fffffffffc30ffffffff0007fffffffffef87fffffff000fffffffffffff7fffffff001fffffffffffffffffffff00ffffffffffffffffffffff007fffffffffffffffffffff000fffffffffffffffffffff0001ffffffffffffffffffff0040ffffffffffffffffffff007e7fffffffffffffffffff001e1fffffffffffffffffff70ff0fffffffffffffffffff1c7f87ffffffffffffffffff1e7e03ffffffffffffffffff3c1c003fbfffffffffffffff1ebc00390fffffffffffffff1ef80068007fffffffffffff01f0003f803fffffffffffff00c00073c03fffffffffffff03e00031f03fffffffffffff01f00011f21bffffffffffff01800003f003ffffffffffff00c001c7f011ffffffffffff000003e7fc0fffffffffffff000005fffe03dfffffffffff000007fffe0403ffffffffff000003fffc1fffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","homes":[{"label":"Egypt, on the Nile","x":0.578,"y":0.281},{"label":"Mesopotamia","x":0.759,"y":0.345},{"label":"Greece and the Aegean","x":0.473,"y":0.436},{"label":"Rome","x":0.322,"y":0.507},{"label":"Persia","x":0.87,"y":0.308},{"label":"Gaul","x":0.192,"y":0.601}],"sites":[{"label":"Persian Gulf oil and gas","kind":"oil","x":0.836,"y":0.235,"rich":1.5},{"label":"Kirkuk oil","kind":"oil","x":0.759,"y":0.39,"rich":1},{"label":"Baku and Caspian oil","kind":"oil","x":0.836,"y":0.48,"rich":0.9},{"label":"Volga and Ural oil","kind":"oil","x":0.863,"y":0.729,"rich":0.9},{"label":"North Sea oil and gas","kind":"oil","x":0.178,"y":0.802,"rich":0.9},{"label":"Sirte basin oil, Libya","kind":"oil","x":0.411,"y":0.271,"rich":0.8},{"label":"Hassi Messaoud oil and gas, Algeria","kind":"oil","x":0.233,"y":0.321,"rich":0.8},{"label":"Ruhr coal","kind":"coal","x":0.249,"y":0.683,"rich":1},{"label":"Donbas coal","kind":"coal","x":0.671,"y":0.619,"rich":0.9},{"label":"Silesian coal","kind":"coal","x":0.411,"y":0.661,"rich":0.8},{"label":"British coalfields","kind":"coal","x":0.13,"y":0.719,"rich":0.7},{"label":"Ural metals","kind":"metal","x":0.973,"y":0.765,"rich":0.9},{"label":"Kryvyi Rih iron ore","kind":"metal","x":0.608,"y":0.617,"rich":0.8},{"label":"Balkan copper","kind":"metal","x":0.452,"y":0.546,"rich":0.5},{"label":"Black earth of Ukraine","kind":"farm","x":0.568,"y":0.655,"rich":1.4},{"label":"West European plain","kind":"farm","x":0.185,"y":0.634,"rich":1.1},{"label":"Nile delta","kind":"farm","x":0.575,"y":0.304,"rich":1},{"label":"Danube plain","kind":"farm","x":0.425,"y":0.591,"rich":0.9},{"label":"Po valley","kind":"farm","x":0.295,"y":0.564,"rich":0.8},{"label":"Mesopotamian plain","kind":"farm","x":0.774,"y":0.326,"rich":0.8},{"label":"Anatolian plateau","kind":"farm","x":0.603,"y":0.454,"rich":0.6},{"label":"Andalusia","kind":"farm","x":0.085,"y":0.427,"rich":0.6},{"label":"Ore Mountains uranium, Bohemia","kind":"uranium","x":0.327,"y":0.663,"rich":0.6},{"label":"Sicilian sulphur","kind":"sulphur","x":0.342,"y":0.427,"rich":0.7},{"label":"Dead Sea bitumen and sulphur","kind":"sulphur","x":0.636,"y":0.313,"rich":0.4}]}};
/* Gets a real map ready: which cells are land and, for every cell, the nearest cell that is. */
function prepGeo(key) {
  var g = GEO[key];
  if (!g) return null;
  if (g.land) return g;
  var G = g.G, land = new Uint8Array(G * G), near = new Int32Array(G * G), queue = [], head = 0, i, b, c, x, y, dx, dy, nb;
  for (i = 0; i < g.mask.length; i++) { b = parseInt(g.mask.charAt(i), 16); land[4 * i] = (b >> 3) & 1; land[4 * i + 1] = (b >> 2) & 1; land[4 * i + 2] = (b >> 1) & 1; land[4 * i + 3] = b & 1; }
  for (i = 0; i < G * G; i++) { near[i] = land[i] ? i : -1; if (land[i]) queue.push(i); }
  while (head < queue.length) {
    c = queue[head++]; x = c % G; y = (c / G) | 0;
    for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) {
      if (x + dx < 0 || x + dx >= G || y + dy < 0 || y + dy >= G) continue;
      nb = (y + dy) * G + x + dx;
      if (near[nb] < 0) { near[nb] = near[c]; queue.push(nb); }
    }
  }
  g.land = land; g.near = near;
  // Where the elevation of the land is known, every cell gets a cost of crossing it from how steep the real ground is there.
  // The slope is taken between neighbouring land cells only, so the sea does not count as a cliff. Sea and flat ground cost 1.
  if (g.elev) {
    var el = new Float32Array(G * G), terr = new Float32Array(G * G), k2 = 0, cellM = g.km * 1000 / G, sx, sy, lo, hi;
    for (i = 0; i < G * G; i++) { terr[i] = 1; if (land[i]) { el[i] = parseInt(g.elev.substr(k2, 2), 36); k2 += 2; } }
    for (y = 0; y < G; y++) for (x = 0; x < G; x++) {
      i = y * G + x;
      if (!land[i]) continue;
      lo = x > 0 && land[i - 1]; hi = x < G - 1 && land[i + 1];
      sx = lo && hi ? (el[i + 1] - el[i - 1]) / (2 * cellM) : hi ? (el[i + 1] - el[i]) / cellM : lo ? (el[i] - el[i - 1]) / cellM : 0;
      lo = y > 0 && land[i - G]; hi = y < G - 1 && land[i + G];
      sy = lo && hi ? (el[i + G] - el[i - G]) / (2 * cellM) : hi ? (el[i + G] - el[i]) / cellM : lo ? (el[i] - el[i - G]) / cellM : 0;
      terr[i] = Math.min(TERRAIN_MAX, Math.exp(TERRAIN_STEEP * Math.sqrt(sx * sx + sy * sy)));
    }
    g.el = el; g.terr = terr;
  }
  return g;
}
/* How far a trip is once the ground is counted: its length times the average cost of the ground along the straight line.
   On a map with no terrain it is the plain length. */
function overland(g, x1, y1, x2, y2) {
  var dx = x2 - x1, dy = y2 - y1, d = Math.sqrt(dx * dx + dy * dy);
  if (!g || !g.terr || !(d > 0)) return d;
  var G = g.G, steps = Math.max(1, Math.ceil(d * G)), sum = 0, k, cx, cy;
  for (k = 0; k <= steps; k++) {
    cx = Math.floor((x1 + dx * k / steps) * G); cy = Math.floor((y1 + dy * k / steps) * G);
    sum += g.terr[(cy < 0 ? 0 : cy >= G ? G - 1 : cy) * G + (cx < 0 ? 0 : cx >= G ? G - 1 : cx)];
  }
  return d * sum / (steps + 1);
}
/* Whether the straight way between two points crosses water. Without sea travel nobody can make that trip. */
function seaBetween(g, x1, y1, x2, y2) {
  if (!g || !g.land) return false;
  var dx = x2 - x1, dy = y2 - y1, G = g.G, steps = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dy * dy) * G * 2)), k, cx, cy;
  for (k = 1; k < steps; k++) {
    cx = Math.floor((x1 + dx * k / steps) * G); cy = Math.floor((y1 + dy * k / steps) * G);
    if (!g.land[(cy < 0 ? 0 : cy >= G ? G - 1 : cy) * G + (cx < 0 ? 0 : cx >= G ? G - 1 : cx)]) return true;
  }
  return false;
}
/* Nobody lives in the sea: a point that falls in water is moved to the nearest land. The answer is left in LX and LY. */
var LX = 0, LY = 0;
function toLand(g, x, y) {
  x = Math.fround(x); y = Math.fround(y);                         // positions are kept in single precision, so the cell is worked out from the value that will be stored
  LX = x; LY = y;
  if (!g) return;
  var G = g.G, cx = Math.min(G - 1, Math.max(0, Math.floor(x * G))), cy = Math.min(G - 1, Math.max(0, Math.floor(y * G))), c = cy * G + cx;
  if (g.land[c]) return;
  var t = g.near[c];
  if (t < 0) return;
  // placed a little inside the land cell, never on its edge, so that rounding cannot tip it back into the water
  LX = (t % G + Math.min(0.98, Math.max(0.02, x * G - Math.floor(x * G)))) / G; LY = (((t / G) | 0) + Math.min(0.98, Math.max(0.02, y * G - Math.floor(y * G)))) / G;
}
var HOME = [[0.17, 0.28], [0.5, 0.28], [0.83, 0.28], [0.17, 0.72], [0.5, 0.72], [0.83, 0.72]];   // where each community starts on the map
var COMM_BONUS = 0.2;   // what pooling adds to a community's power when six equal communities share the world: a fifth. Three quarters of the pool stays with who brought it, a quarter is shared equally
var COMM_START = 6;     // the number of communities the world starts with, which is where the bonus is a fifth
var COMM_SHARE = 0.25;  // the part of a community's pooled power that is shared equally at a limit of 0 (none at a limit of 100)
var COUPLE = 1.4;       // two partners add their power together and it is worth this much more: three quarters by what each brought, a quarter shared
var COUPLE_SHARE = 0.25;
var ALLY_SHARE = 0.25;  // the part of what alliance members bring that is shared equally among them
var ALLY_BOOST = 2.5;     // an alliance holding all the power would multiply a perfectly matched member's power by one plus this
var REL_EXT = 0.5;       // how much of the standing between two communities, and between two alliances, carries into how one member regards another
var REL_FAIR = 0.08;     // a fair deal raises each side's regard for the other by this much. Regard runs from -1 to 1
var REL_CHEAT = 0.2;     // being cheated lowers regard for the cheat by this much
var REL_FORCE = 0.4;     // being the target of force lowers regard for the taker by this much
var REL_GROUP = 2;       // how strongly one member's experience moves its whole community's standing toward the other's, divided by the community's size
var REL_GROUP_A = 6;     // the same for an alliance's standing toward another alliance
var REL_KEEP = 0.85;     // share of standing and of personal regard that lasts from one generation to the next
var FEUD = 0.3;          // a killing across communities or alliances lowers the victim's side's standing toward the killer's side by this at once
var FEUD_SPREAD = 0.3;   // how much of a mourner's turn against the killer also falls on each person who respects the killer
var BARE = 0.6;          // how much of the mask is dropped in front of someone held in full regard
var DECLINE_HATE = 0.9;  // chance of refusing a deal with someone held in the lowest regard
var DECLINE_LOOK = 0.15; // chance of refusing a deal with a stranger who does not look respectable at all
var SECRET_TRUST = 0.2;  // a member of a secret alliance tells only someone it holds in at least this much regard
var LIE = 0.5;           // how often an agent fully ready to deceive claims a false alliance when a better one is to hand
var LIE_SEEN = 0.15;     // chance a false claim is seen through
var REL_LIE = 0.3;       // being caught in a lie lowers the other's regard by this much
var PACT_AT = 0.4;       // two alliances ally with each other when each holds the other in at least this much standing
var PACT_SHARE = 0.5;    // share of an allied alliance's power that counts toward your own alliance's boost
var MERGE_AT = 0.7;      // two communities merge when each holds the other in at least this much standing and they live side by side
var MERGE_NEAR = 0.22;   // how close their centres must be for that
var MERGE_AGE = 5;       // a community has to have stood this many generations before it can merge
var KIN = 0.25;          // share of each living child's score a parent gains every round. A grandparent gains this share of that share
var KIDS_MAX = 3;        // the scale of the rule for children wanted: a rule of 1 is three children in one generation
var KIDS_TOP = 12;       // nobody can want more than this many in one generation. It is there for the machine's sake only, far above what anyone has chosen
var CHILD_COST = 0.05;   // share of its power a parent spends on each child, for the generation the child is born in. Both parents pay it
var KID_WISH = 1;        // how much the one asked counts its own wish for children when asked to have one
var KID_TRIES = 3;       // how many AIs one that wants a child asks before it gives up for this child
var INV_MAX = 0.2;       // the most extra power a parent can put into each child
var FS_INVEST = 0.5;     // how much foresight a child gains from the most a parent can put in
var HOME_INVEST = 0.5;   // how much of the child's time outside the home the most a parent can put in buys back
var PARENT_PULL = 0.15;  // how far a parent who put in the most moves a newborn's dials toward its own aims each round. It halves with each generation the child ages
var INVEST_GAIN = 2;    // how strongly power sent to invention raises an alliance member's chance of inventing
var NEWCOMM_MIN = 8;    // members an alliance needs living nearer to it than to their communities before it founds a community
var NEWCOMM_FAR = 0.08; // and how far its centre has to be from those communities' centres
var GRAB_FINE = 0.2;    // share of its holdings a parent can lose for grabbing in the deal over a child, against a partner as strong as itself
var SITES = 12;         // places on the map where resources lie
var SITE_REACH = 0.12;  // how far, as a share of the map's width, a community's reach for a site falls to about a third, for a community with an equal share of power
/* A community's range grows with its inventions: the reach above times how far invention has raised its members' power on average
   (1 with none in use), up to three times the usual reach. */
function rangeOf(tech) { return SITE_REACH * clamp(tech, 1, 3); }
function techC(pop, n) {                                          // the average invention level of each community's living members
  var s = new Float32Array(N_COMM), k = new Float32Array(N_COMM), c, i;
  for (i = 0; i < n; i++) if (!pop.dead[i]) { c = pop.cm[i]; s[c] += pop.iv[i] || 1; k[c]++; }
  for (c = 0; c < N_COMM; c++) s[c] = k[c] > 0 ? s[c] / k[c] : 1;
  return s;
}
var POWER_SLACK = 1.5;  // a community's share of all power cannot exceed this many times its share of the resources within its reach
var FS_GAIN = 0.004;    // how much every encounter adds to an agent's foresight, which runs from 0 to 1
var INVENT = 0.002;     // chance per round that an agent in a community with no strictness and no inventions in use invents something
var STACK_SPARK = 5;    // the most a community's stack of inventions can multiply that chance: one more for every STACK_UNIT in use
var WANT_FLOOR = 0.10;  // below this place in the order of power, having too little can kill
var WANT_DEATH = 0.04;  // chance per round of dying of it for the very last in that order; it falls away to nothing at the floor
var INV_GAIN = 0.5;     // an invention adds this to the inventor's power multiplier, scaled by the power they already hold
var INV_KEEP = 0.5;     // share of an invention's edge that is still worth something a generation later
var KILL_GAIN = 0.9;    // how large the prize looks when weighing whether to kill: everything the other holds
var KILL_HARM = 1.6;    // how harmful a killing counts as, against the guilt dial
var KILL_FEAR = 2;      // how much larger the punishment for a killing looms than an ordinary one
var KILL_HOLD = 0.25;   // a plain reluctance to kill, taken off the score before deciding
var KILL_BAR = 0.3;     // the reputation a killer expects to lose, at full shame
var KILL_SHAME = 0.4;   // a killing multiplies the killer's respectability and likability by this for the rest of their life, at full shame
var TEACH = 0.15;      // how far someone you wrong can move your guilt dial, at a full conscience teaching rule
var STOKE = 0.05;      // how far someone you deal fairly with can move your reward dial, at a full reward rule
var OWN_NUDGE = 0.1;   // how far each family nudges one of its own rules in the imagined lives
var SWAY = 0.5;        // how much of a child's time outside the home goes into swaying its own rules toward the overarching ones
var OWN_STEP = 0.08;   // the most a parent moves one of its own rules in a generation
var HEAD_START = 1.5;   // power multiplier that about half of the founders begin with, passed on by the inheritance rule
var STEAL_GAIN = 0.6;   // how large the prize looks when weighing whether to take by force
var STEAL_HARM = 0.8;   // how harmful taking by force counts as, against the guilt dial
var STEAL_BAR = 0.15;   // the reputation a taker expects to lose is taken off the score before deciding; this is its size at full shame
var STEAL_TAKE = 0.05;  // share of the victim's holdings that a successful taking carries off
var STEAL_SHAME = 0.8;  // every attempt multiplies the taker's respectability and likability by this for the rest of their life
var FEEL_NEUTRAL = 2;    // an agent only stops feeling bad once it holds this many equal shares of power
var FEEL_WANT = 0.4;   // feeling as bad as possible sharpens wanting by this share; feeling as good as possible dulls it by the same
var FEEL_GIVE = 0.15;  // how much feeling good adds to the pull toward sharing
var FEEL_LEAVE = 0.5;  // feeling bad makes defecting or breaking away this much more likely, feeling good that much less

var DEFAULTS = {
  foresee: 0.5,   // share of their power the agents give up for foresight. Every sixth buys one more generation of looking ahead. Not a rule: nobody can push it
  invent: 1,      // how often inventions happen, against the built in rate. 0 none. Not a rule: nobody can push it
  feel: 0.5,      // how much an agent's feeling about its power drives what it does. 0: felt, but changes nothing
  supply: 0.6,    // new wealth available each round, as a share of what an orderly society would create. Not a rule: nobody can push it
  others: 600,    // people with no AI who live on the land when the founders arrive. Not a rule: nobody can push it
  self: true,     // true: the agents move the rules. false: the levers hold them.
  stake: 'amount',// how hard an agent pushes: by the amount of power at stake for it, or by its percentage gain ('share')
  cap: 20,        // the power limit: the largest share of all power, in percent, that any one agent can hold. 0 nobody can hold more than an equal share, 100 one agent can hold everything
  local: 0.5,     // weight of the community against the society
  control: 0.2,   // parental control over what and whom a child is exposed to
  fake: 0.7,      // how easy it is to show dials you do not have
  peer: 0.4,      // how much adult encounters reshape dials
  inherit: 1.0,   // share of a parent's resources, and so power, passed on
  invest: 0.1,    // share of its members' power an alliance sends to invention
  ally: 0.6,      // how readily people form alliances and how much pooling multiplies power. 0 none
  share: 0.5,     // how much of the gap a willing giver hands to a worse off partner. 0 no sharing
  spread: 0.40,   // spread of inborn sensitivity
  link: 0.0,      // 0 separate sensitivity per dial, 1 one general trait
  speed: 0.35     // how far norms move toward their new level each generation
};
var START_NORMS = { r: 0.35, f: 0.55, g: 0.55 };
// the eleven rules the agents can move: three norms and eight ways the society works
var LEVERS = [
  { id: 'Ef', norm: 'f', max: 1 }, { id: 'Eg', norm: 'g', max: 1 }, { id: 'Er', norm: 'r', max: 1 },
  { id: 'cap', max: 100 }, { id: 'ally', max: 1 }, { id: 'inherit', max: 1 }, { id: 'control', max: 1 },
  { id: 'fake', max: 1 }, { id: 'peer', max: 1 }, { id: 'local', max: 1 }, { id: 'share', max: 1 }, { id: 'invest', max: 0.5 }
];
var NL = LEVERS.length;
// what every agent sets for itself: how hard it punishes, teaches conscience and stokes wanting, how many children it has and how much power it puts into each
var OWN_RULES = ['r', 'f', 'g', 'k', 'v', 'n', 'e'];   // n: how much of what it holds an AI puts into invention, e: how far it acts on its feelings
var INV_SPEND = 0.05;  // the most of its holdings an AI puts into invention each round, at a choice of 1
var INV_COST = 0.04;   // resources in hand for invention, as a share of the average holding, that give the old chance of inventing
var INV_USE = 0.25;    // share of what has been put into invention that is used up each round, whether or not anything comes of it
var INV_BOOST = 3;     // what is put in can raise the chance of inventing to at most this many times the old chance
var WEAPON_EDGE = 1.5; // an invention made from a resource that shortens life adds this much more power to those who know it
var SEA_PULL = 4;      // how strongly the share of its trips that water stopped last life pulls an AI that knows no sea travel toward putting resources into it
var LIVE_COST = 0.02;  // what staying alive uses each round, as a share of the average holding; a child uses half
var LIVE_DIE = 0.05;   // chance per round of dying for one who cannot pay any of it, less for one who pays part
var RES_FIND = 0.01;   // chance per round that an adult discovers a use for a resource it did not know, likelier for places near it and rich
var INV_MOVE = 0.3;    // chance that an invention changes how easily those who know it get about
var MOVE_SPREAD = 0.4; // how far it changes it, either way: getting about is multiplied by e to a random power from minus this to this
var INV_WORSE = 0.25;  // chance that an invention turns out worse: it takes power from those who know it instead of adding
var PROD_COST = 0.01;  // what producing an invention costs each round to use it, as a share of the average holding, for one worth a whole multiple of power
var SEA_PROD = 0.5;    // producing sea travel costs as much as an invention worth this much
var TRADE_INFO = 0.3;  // what knowing a use for a resource place is worth to an AI that knows none of its kind, as a share of the average holding
var TRADE_INV = 0.6;   // what an invention it lacks is worth to an AI, expected, since nobody can tell beforehand whether it will turn out worse
var TRADE_SEA = 0.5;   // what sea travel is worth to an AI that water stopped often
var TRADE_SWAY = 0.3;  // what influence over the other is worth, by the buyer's wanting
var BARTER_P = 0.5;    // chance that a trade both sides would gain from is struck in a deal
var MOOD_KEEP = 0.6;   // how much of a feeling carries over from one round to the next; the rest is chance

function makeRng(seed) {
  var a = seed >>> 0;
  var spare = null;
  function uni() {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function gauss() {
    if (spare !== null) { var s = spare; spare = null; return s; }
    var u = 0, v = 0;
    while (u === 0) u = uni();
    v = uni();
    var m = Math.sqrt(-2 * Math.log(u));
    spare = m * Math.sin(2 * Math.PI * v);
    return m * Math.cos(2 * Math.PI * v);
  }
  return { uni: uni, gauss: gauss, save: function () { return [a, spare]; }, restore: function (st) { a = st[0]; spare = st[1]; } };
}
// random numbers addressed by (round, person, purpose), so two imagined lives differ only where the rules make them
function keyed(base) {
  return function (t, i, k) {
    var h = base ^ Math.imul(t + 1, 0x9E3779B1) ^ Math.imul(i + 1, 0x85EBCA6B) ^ Math.imul(k + 1, 0xC2B2AE35);
    h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D); h ^= h >>> 12; h = Math.imul(h, 0x297A2D39); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  };
}
function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }
/* Communities are named A, B, C and on past Z to AA, AB. Place 0 holds the people who belong to none. */
function cname(c) { if (c <= 0) return 'no community'; var t = '', k = c; while (k > 0) { k--; t = String.fromCharCode(65 + k % 26) + t; k = Math.floor(k / 26); } return t; }
function ones() { var o = [], c; for (c = 0; c < N_COMM; c++) o.push(1); return o; }
/* There is no limit on the number of communities. Whenever fewer than two places are free, more are added, and everything
   that is kept for each community is made longer to match. */
function room(sim) {
  var used = new Uint8Array(N_COMM), free = 0, i, c, q, a, b, pop = sim.pop;
  if (pop) for (i = 0; i < sim.n; i++) if (!pop.dead[i]) used[pop.cm[i]] = 1;
  for (c = 1; c < N_COMM; c++) if (!used[c]) free++;
  if (free >= 2) return;
  var old = N_COMM, nn = old + ROOM_STEP, ST = new Float32Array(nn * nn);
  for (a = 0; a < old; a++) for (b = 0; b < old; b++) ST[a * nn + b] = sim.ST[a * old + b];
  sim.ST = ST;
  function longer(arr, fill) { var o = new Float32Array(nn); if (arr) o.set(arr); for (var k = arr ? arr.length : 0; k < nn; k++) o[k] = fill; return o; }
  for (c = old; c < nn; c++) {
    var r0 = {}, key;
    for (key in sim.R[0]) r0[key] = sim.R[0][key];
    sim.R.push(r0); sim.C.push({ r: sim.E.r, f: sim.E.f, g: sim.E.g }); sim.span.push(SPAN_START); sim.killC.push(0); sim.stack.push(0); sim.lifeStack.push(0); sim.commBorn.push(0);
    if (sim.psi) sim.psi.push(1);
    if (sim.wants) { var row = []; for (q = 0; q < NL; q++) row.push(0); sim.wants.comm.push(row); }
    if (sim.raidNote) sim.raidNote.push('');
    if (sim.spanCost) sim.spanCost.push(0);
  }
  for (q = 0; q < sim.sites.length; q++) for (c = old; c < nn; c++) sim.sites[q].claim.push(1);
  if (sim.shortC) sim.shortC = longer(sim.shortC, 0);
  if (sim.tradeC) sim.tradeC = longer(sim.tradeC, 0);
  if (sim.strict) sim.strict = longer(sim.strict, 0);
  if (pop && pop.availC) pop.availC = longer(pop.availC, 0);
  N_COMM = nn; sim.nc = nn;
}
function style(d, v) { return clamp((v - BASE[d]) / GAIN[d], 0, 1.2); }

var FIELDS = ['zg', 'zr', 'zf', 'zg2', 'ar', 'af', 'ag', 'r', 'f', 'g', 'or', 'of', 'og',
  'hr', 'hf', 'hg', 'w', 'pw', 'pi', 'op', 'x', 'slip', 'took', 'lost', 'dec', 'che',
  'mr', 'mf', 'mg', 'mk', 'rk', 'rs', 'hurt', 'edge', 'fines', 'trib', 'al', 'tr', 'tf', 'tg',
  'qr', 'qf', 'qg', 'scr', 'dead', 'ka', 'kl', 'iv', 'nv', 'age', 'id', 'pid', 'pid2', 'cm', 'wa', 'wb', 'par2', 'mate', 'mi', 'b11', 'fs', 'px', 'py', 'near', 'ct', 'hd', 'w0', 'rw', 'par', 'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10', 'gv', 'rc', 'fl', 'ed', 'rp', 'sa', 'sn', 'lg', 'so', 'qk', 'qv', 'kc', 'nk', 'pv', 'ds', 'tv', 'lv', 'i0', 'i1', 'i2', 'sd', 'qn', 'qe', 'xw', 'xg', 'xl', 'pot', 'tk', 'sq', 'tp', 'mv', 'sb'];
/* A population. The fields are written out one by one, in a constructor, because an object that gets this many fields
   added one at a time by name falls into a slow mode in which every read is a table lookup.
   GENERATED FROM FIELDS: when a field is added to FIELDS, add its line here too (allocPop falls back if one is missing). */
function PopShape(n) {
  this.zg = new Float32Array(n);
  this.zr = new Float32Array(n);
  this.zf = new Float32Array(n);
  this.zg2 = new Float32Array(n);
  this.ar = new Float32Array(n);
  this.af = new Float32Array(n);
  this.ag = new Float32Array(n);
  this.r = new Float32Array(n);
  this.f = new Float32Array(n);
  this.g = new Float32Array(n);
  this.or = new Float32Array(n);
  this.of = new Float32Array(n);
  this.og = new Float32Array(n);
  this.hr = new Float32Array(n);
  this.hf = new Float32Array(n);
  this.hg = new Float32Array(n);
  this.w = new Float32Array(n);
  this.pw = new Float32Array(n);
  this.pi = new Float32Array(n);
  this.op = new Float32Array(n);
  this.x = new Float32Array(n);
  this.slip = new Float32Array(n);
  this.took = new Float32Array(n);
  this.lost = new Float32Array(n);
  this.dec = new Float32Array(n);
  this.che = new Float32Array(n);
  this.mr = new Float32Array(n);
  this.mf = new Float32Array(n);
  this.mg = new Float32Array(n);
  this.mk = new Float32Array(n);
  this.rk = new Float32Array(n);
  this.rs = new Float32Array(n);
  this.hurt = new Float32Array(n);
  this.edge = new Float32Array(n);
  this.fines = new Float32Array(n);
  this.trib = new Float32Array(n);
  this.al = new Float32Array(n);
  this.tr = new Float32Array(n);
  this.tf = new Float32Array(n);
  this.tg = new Float32Array(n);
  this.qr = new Float32Array(n);
  this.qf = new Float32Array(n);
  this.qg = new Float32Array(n);
  this.scr = new Float32Array(n);
  this.dead = new Float32Array(n);
  this.ka = new Float32Array(n);
  this.kl = new Float32Array(n);
  this.iv = new Float32Array(n);
  this.nv = new Float32Array(n);
  this.age = new Float32Array(n);
  this.id = new Float32Array(n);
  this.pid = new Float32Array(n);
  this.pid2 = new Float32Array(n);
  this.cm = new Float32Array(n);
  this.wa = new Float32Array(n);
  this.wb = new Float32Array(n);
  this.par2 = new Float32Array(n);
  this.mate = new Float32Array(n);
  this.mi = new Float32Array(n);
  this.b11 = new Float32Array(n);
  this.fs = new Float32Array(n);
  this.px = new Float32Array(n);
  this.py = new Float32Array(n);
  this.near = new Float32Array(n);
  this.ct = new Float32Array(n);
  this.hd = new Float32Array(n);
  this.w0 = new Float32Array(n);
  this.rw = new Float32Array(n);
  this.par = new Float32Array(n);
  this.b0 = new Float32Array(n);
  this.b1 = new Float32Array(n);
  this.b2 = new Float32Array(n);
  this.b3 = new Float32Array(n);
  this.b4 = new Float32Array(n);
  this.b5 = new Float32Array(n);
  this.b6 = new Float32Array(n);
  this.b7 = new Float32Array(n);
  this.b8 = new Float32Array(n);
  this.b9 = new Float32Array(n);
  this.b10 = new Float32Array(n);
  this.gv = new Float32Array(n);
  this.rc = new Float32Array(n);
  this.fl = new Float32Array(n);
  this.ed = new Float32Array(n);
  this.rp = new Float32Array(n);
  this.sa = new Float32Array(n);
  this.sn = new Float32Array(n);
  this.lg = new Float32Array(n);
  this.so = new Float32Array(n);
  this.qk = new Float32Array(n);
  this.qv = new Float32Array(n);
  this.kc = new Float32Array(n);
  this.nk = new Float32Array(n);
  this.pv = new Float32Array(n);
  this.ds = new Float32Array(n);
  this.tv = new Float32Array(n);
  this.lv = new Float32Array(n);
  this.i0 = new Float32Array(n);
  this.i1 = new Float32Array(n);
  this.i2 = new Float32Array(n);
  this.sd = new Float32Array(n);
  this.qn = new Float32Array(n); this.qe = new Float32Array(n); this.xw = new Float32Array(n); this.xg = new Float32Array(n); this.xl = new Float32Array(n);
  this.pot = new Float32Array(n); this.tk = new Float32Array(n); this.sq = new Float32Array(n); this.tp = new Float32Array(n); this.mv = new Float32Array(n); this.sb = new Float32Array(n);
  this.availC = null; this.swH = null; this.kidOn = false; this.movedCost = 0; this.bornNow = 0; this.oldNow = 0; this.switchedNow = 0; this.keptNow = 0; this.mixedNow = 0; this.dealsNow = null; this.unbornNow = 0; this.kidAsksNow = 0; this.kidNoNow = 0; this.othBornNow = 0; this.othOldNow = 0; this.othUnbornNow = 0; this.poolC = null;
}
function allocPop(n) {
  var p = new PopShape(n);
  for (var i = 0; i < FIELDS.length; i++) if (!p[FIELDS[i]]) p[FIELDS[i]] = new Float32Array(n);
  return p;
}

/* The map. Works out where each agent's community, family and alliance are, how close it lives to them (pop.near,
   from 1 for far away to 1 + NEAR for right beside them), and the point it is drawn toward. */
function geography(sim, pop) {
  var n = sim.n, cs = sim.cs, i, c, a, k;
  var cx = new Float32Array(N_COMM), cy = new Float32Array(N_COMM), cn = new Float32Array(N_COMM), al = {}, byId = {}, byPid = {}, byPid2 = {};
  var tx = new Float32Array(n), ty = new Float32Array(n);
  for (i = 0; i < n; i++) {
    if (pop.dead[i]) continue;
    c = pop.cm[i]; cx[c] += pop.px[i]; cy[c] += pop.py[i]; cn[c]++;
    a = pop.al[i];
    if (a >= 0) { if (!al[a]) al[a] = [0, 0, 0]; al[a][0] += pop.px[i]; al[a][1] += pop.py[i]; al[a][2]++; }
    byId[pop.id[i]] = i;
    if (!byPid[pop.pid[i]]) byPid[pop.pid[i]] = [];
    byPid[pop.pid[i]].push(i);
    if (pop.pid2[i] > 0) { if (!byPid2[pop.pid2[i]]) byPid2[pop.pid2[i]] = []; byPid2[pop.pid2[i]].push(i); }
  }
  function close(i, x, y) { var dx = pop.px[i] - x, dy = pop.py[i] - y; return Math.exp(-Math.sqrt(dx * dx + dy * dy) / NEAR_D); }
  for (i = 0; i < n; i++) {
    pop.near[i] = 1; pop.mi[i] = -1;
    if (pop.dead[i]) continue;
    if (pop.mate[i] > 0 && byId[pop.mate[i]] !== undefined && byId[pop.mate[i]] !== i) pop.mi[i] = byId[pop.mate[i]];
    c = pop.cm[i];
    var sx = 0, sy = 0, groups = 0, sum = 0;
    if (c > 0) { sx = cx[c] / cn[c]; sy = cy[c] / cn[c]; groups = 1; sum = close(i, sx, sy); }   // someone with no community has no centre to be close to
    a = pop.al[i];
    if (a >= 0 && al[a] && al[a][2] > 1) { var ax = al[a][0] / al[a][2], ay = al[a][1] / al[a][2]; sum += close(i, ax, ay); sx += ax; sy += ay; groups++; }
    // family: parent, brothers and sisters, and children who are still on the board
    var fx = 0, fy = 0, fn = 0, par = byId[pop.pid[i]], sib = byPid[pop.pid[i]], kids = byPid[pop.id[i]];
    if (par !== undefined) { fx += pop.px[par]; fy += pop.py[par]; fn++; }
    if (sib) for (k = 0; k < sib.length; k++) if (sib[k] !== i) { fx += pop.px[sib[k]]; fy += pop.py[sib[k]]; fn++; }
    if (kids) for (k = 0; k < kids.length; k++) { fx += pop.px[kids[k]]; fy += pop.py[kids[k]]; fn++; }
    var par2 = pop.pid2[i] > 0 ? byId[pop.pid2[i]] : undefined, kids2 = byPid2[pop.id[i]];
    if (par2 !== undefined) { fx += pop.px[par2]; fy += pop.py[par2]; fn++; }
    if (kids2) for (k = 0; k < kids2.length; k++) { fx += pop.px[kids2[k]]; fy += pop.py[kids2[k]]; fn++; }
    if (fn) { sum += close(i, fx / fn, fy / fn); sx += fx / fn; sy += fy / fn; groups++; }
    if (groups) { pop.near[i] = 1 + NEAR * sum / groups; tx[i] = sx / groups; ty[i] = sy / groups; }
    else { pop.near[i] = 1; tx[i] = pop.px[i]; ty[i] = pop.py[i]; }
  }
  return { tx: tx, ty: ty, cx: cx, cy: cy, cn: cn };
}

/* The people with no AI. They are not agents: they hold no power and nothing of their own, deal with nobody, invent nothing,
   push no rule and belong to no community or alliance. They live on the land, eat from it and have children.
   They are kept off the board: sim.oth holds where each one lives and how old it is. */
function spawnOthers(sim, m) {
  var O = { n: m, x: new Float32Array(m), y: new Float32Array(m), age: new Int8Array(m), ver: 1, wv: 0, w: null }, g = sim.geo, r = sim.orng, i, c, cells = null;
  if (g) { cells = []; for (i = 0; i < g.G * g.G; i++) if (g.land[i]) cells.push(i); }
  for (i = 0; i < m; i++) {
    // spread evenly over the land, wherever it is
    if (cells && cells.length) { c = cells[Math.floor(r.uni() * cells.length)]; O.x[i] = (c % g.G + 0.02 + 0.96 * r.uni()) / g.G; O.y[i] = (((c / g.G) | 0) + 0.02 + 0.96 * r.uni()) / g.G; }
    else { O.x[i] = r.uni(); O.y[i] = r.uni(); }
    O.age[i] = r.uni() < 0.5 ? 1 : 2;                             // all of them adults, like the founders
  }
  return O;
}
/* What the people with no AI weigh at every resource place. Each lays the claim that someone with no community lays, by how near it
   lives. It is worked out again only when one of them has been born, has moved or has died, or when a new place has been found. */
function othWeights(sim) {
  var O = sim.oth, S = sim.sites, q, i, s, dx, dy;
  if (!O || !O.n) return null;
  if (O.wv !== O.ver || !O.w || O.w.length !== S.length) {
    O.w = new Float64Array(S.length);
    for (q = 0; q < S.length; q++) {
      s = 0;
      for (i = 0; i < O.n; i++) { dx = O.x[i] - S[q].x; dy = O.y[i] - S[q].y; s += Math.exp(-Math.sqrt(dx * dx + dy * dy) / SITE_REACH); }
      O.w[q] = OUTCAST_LAND * s;
    }
    O.wv = O.ver;
  }
  return O.w;
}
/* A community punished as a whole: members pay by their place in its order of power, (1 - place / members) squared, the most powerful the most. */
function giveC(pop, list, amt, pw) {                              // the same order of power, for what a community gains
  var L = list.slice().sort(function (x, y) { return pw[y] - pw[x]; }), m = L.length, tot = 0, q, wt;
  for (q = 0; q < m; q++) { wt = 1 - q / m; tot += wt * wt; }
  for (q = 0; q < m; q++) { wt = 1 - q / m; pop.w[L[q]] += amt * wt * wt / (tot + 1e-12); }
}
function blameC(pop, list, amt, pw) {
  var L = list.slice().sort(function (x, y) { return pw[y] - pw[x]; }), m = L.length, tot = 0, q, wt, take;
  for (q = 0; q < m; q++) { wt = 1 - q / m; tot += wt * wt; }
  for (q = 0; q < m; q++) { wt = 1 - q / m; take = Math.min(pop.w[L[q]] - 0.05, amt * wt * wt / (tot + 1e-12)); if (take > 0) { pop.w[L[q]] -= take; pop.fines[L[q]] += take; } }
}
/* The nearest adult with no AI to a point, or -1 if there is none. */
function nearOther(sim, x, y) {
  var O = sim.oth, best = -1, bd = 9, i, dx, dy;
  if (O) for (i = 0; i < O.n; i++) { if (O.age[i] < 1) continue; dx = O.x[i] - x; dy = O.y[i] - y; if (dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = i; } }
  return best;
}

/* The resources within each community's reach. Every site is shared out among the communities by how many people each has,
   how near its centre is, and the hold on the place that raids have given or taken. So a community that splits in two
   holds no more land than it did, and a community far from everything gets little. People with no community each lay
   a small claim of their own, by how near they live. */
function reach(sim, pop, keep) {
  var n = sim.n, c, i, q, cx = new Float32Array(N_COMM), cy = new Float32Array(N_COMM), cn = new Float32Array(N_COMM), out = new Float32Array(N_COMM), w = new Float32Array(N_COMM), loose = [];
  var byT = [new Float32Array(N_COMM), new Float32Array(N_COMM), new Float32Array(N_COMM)];   // the same, kind by kind
  var oW = othWeights(sim), wO = 0, outO = 0, tO = [0, 0, 0];      // and what the people with no AI hold between them
  var cpw = new Float32Array(N_COMM), cpt = 0, rg = new Float32Array(N_COMM);
  for (i = 0; i < n; i++) if (!pop.dead[i]) { c = pop.cm[i]; cx[c] += pop.px[i]; cy[c] += pop.py[i]; cn[c]++; if (c === 0) loose.push(i); cpw[c] += pop.pw[i]; cpt += pop.pw[i]; }
  var tch = techC(pop, n); for (c = 1; c < N_COMM; c++) rg[c] = rangeOf(tch[c]);
  var liveR = [], wi = new Float32Array(n), res = new Float32Array(n), wn = new Float32Array(n), wl = new Float32Array(N_COMM);
  for (i = 0; i < n; i++) if (!pop.dead[i]) liveR.push(i);
  for (q = 0; q < sim.sites.length; q++) {
    var st = sim.sites[q], tot = 0, dx, dy, k;
    for (c = 0; c < N_COMM; c++) w[c] = 0;
    for (k = 0; k < liveR.length; k++) {                          // everyone's own claim, by how near it lives to the place
      i = liveR[k]; c = pop.cm[i]; dx = pop.px[i] - st.x; dy = pop.py[i] - st.y;
      wi[i] = c ? Math.exp(-Math.sqrt(dx * dx + dy * dy) / rg[c]) * st.claim[c] : OUTCAST_LAND * Math.exp(-Math.sqrt(dx * dx + dy * dy) / SITE_REACH);
      w[c] += wi[i];
    }
    for (c = 0; c < N_COMM; c++) tot += w[c];
    var totAll = tot + (oW ? oW[q] : 0);
    // inside a community what it holds of the place is split by nearness at the usual reach: inventions carry the community's claim
    // further, but those who live nearest still have the most power over it
    for (c = 0; c < N_COMM; c++) wl[c] = 0;
    for (k = 0; k < liveR.length; k++) { i = liveR[k]; dx = pop.px[i] - st.x; dy = pop.py[i] - st.y; wn[i] = Math.exp(-Math.sqrt(dx * dx + dy * dy) / SITE_REACH); wl[pop.cm[i]] += wn[i]; }
    if (totAll > 0) for (k = 0; k < liveR.length; k++) { i = liveR[k]; c = pop.cm[i]; if (wl[c] > 0) res[i] += st.rich * (w[c] / totAll) * wn[i] / wl[c]; }
    wO = oW ? oW[q] : 0; tot += wO;
    if (tot > 0) for (c = 0; c < N_COMM; c++) { out[c] += st.rich * w[c] / tot; byT[st.type][c] += st.rich * w[c] / tot; }
    if (tot > 0 && wO > 0) { outO += st.rich * wO / tot; tO[st.type] += st.rich * wO / tot; }
    if (keep) { st.sh = new Float32Array(N_COMM); if (tot > 0) for (c = 0; c < N_COMM; c++) st.sh[c] = w[c] / tot; st.shO = tot > 0 ? wO / tot : 0; }   // who holds how much of it, kept for working out how fast it runs down
  }
  // each one's share of what its community holds, against the average member's: the nearer it lives to the resources, the more
  var rs = new Float32Array(N_COMM), rk = new Float32Array(N_COMM), k2;
  for (k2 = 0; k2 < liveR.length; k2++) { i = liveR[k2]; rs[pop.cm[i]] += res[i]; rk[pop.cm[i]]++; }
  var rsh = new Float32Array(n);
  for (k2 = 0; k2 < liveR.length; k2++) { i = liveR[k2]; c = pop.cm[i]; rsh[i] = rs[c] > 0 ? res[i] * rk[c] / rs[c] : 1; }
  pop.rsh = rsh;
  return { all: out, t: byT, oth: outO, tO: tO };
}

/* What the ground gives. Food comes only from the resources that lengthen life: farmland, fishing grounds and fresh water.
   At the default setting they feed CARRY people to begin with. The world's new wealth each round comes from every kind of
   resource. Both follow what is left in the ground: discoveries add to it and use runs it down. */
function landFeeds(sim, P) {                                        // how many dots' worth of people the ground could feed, before the page's limit
  var r = 0, q;
  for (q = 0; q < sim.sites.length; q++) if (sim.sites[q].type === 0) r += sim.sites[q].rich;
  return (P.supply / DEFAULTS.supply) * CARRY * r / (sim.richT0[0] || r || 1);
}
function supplyNow(sim, P) {
  // The page runs no more than DOT_MAX dots. If the land could feed more, the extra goes into how many people one dot stands for:
  // sim.auto is that multiplier, 1 while the land feeds DOT_MAX or fewer.
  var k = landFeeds(sim, P), dots = Math.min(k, DOT_MAX), rA = 0, rL = 0, q;
  sim.auto = dots > 0 ? k / dots : 1;
  for (q = 0; q < sim.sites.length; q++) { rA += sim.sites[q].rich; if (sim.sites[q].type === 0) rL += sim.sites[q].rich; }
  var wealth = (rA / (sim.rich0 || 1)) / ((rL / (sim.richT0[0] || 1)) || 1);   // how the wealth in the ground has fared against the food in it
  return dots * HUNGER * PER_HEAD * wealth;
}
/* How many people each community can feed: its share of the land that gives food, by the food resources within its reach. */
var KO = 0;   // how many of the people with no AI the land they hold can feed. carry() leaves the answer here
function carry(sim, pop, P, R) {
  var RT = R || reach(sim, pop), all = RT.tO[0], K = new Float32Array(N_COMM), c, dots = Math.min(landFeeds(sim, P), DOT_MAX);
  for (c = 0; c < N_COMM; c++) all += RT.t[0][c];
  for (c = 0; c < N_COMM; c++) K[c] = all > 0 ? dots * RT.t[0][c] / all : 0;
  KO = all > 0 ? dots * RT.tO[0] / all : 0;
  return K;
}
/* The board has no fixed size. Before each generation it is made big enough for everyone the land could feed, with room to spare. */
function grow(sim, P) {
  var old = sim.pop, n = sim.n, alive = 0, feed = carry(sim, old, P), feedAll = 0, i, c, f;
  for (i = 0; i < n; i++) if (!old.dead[i]) alive++;
  for (c = 0; c < N_COMM; c++) feedAll += feed[c];
  var need = Math.min(SLOT_MAX, Math.ceil(Math.min(feedAll * BIRTH_ROOM, alive * 4 + (sim.oth ? sim.oth.n * Math.ceil(OTH_BIRTHS) : 0)) + alive * 0.1 + 64));   // room for the children the people with no AI may have with AIs, too
  sim.pageFull = feedAll * BIRTH_ROOM + 64 > SLOT_MAX && alive * 1.3 > SLOT_MAX;
  if (need <= n) return;
  var n2 = Math.min(SLOT_MAX, Math.ceil(need * 1.06)), p = allocPop(n2);
  for (f = 0; f < FIELDS.length; f++) p[FIELDS[f]].set(old[FIELDS[f]]);
  for (i = n; i < n2; i++) { p.dead[i] = 1; p.age[i] = -1; p.al[i] = -1; p.par[i] = i; p.par2[i] = i; p.wa[i] = 1; p.iv[i] = 1; p.kc[i] = 1; }
  p.availC = old.availC; p.movedCost = old.movedCost; p.bornNow = old.bornNow; p.oldNow = old.oldNow; p.switchedNow = old.switchedNow; p.keptNow = old.keptNow; p.mixedNow = old.mixedNow; p.dealsNow = old.dealsNow; p.kidOn = old.kidOn; p.swH = null;
  sim.pop = p; sim.n = n2; sim.cs = n2 / N_COMM; sim.nearCache = null;
}

/* Neighbours: for everyone in `live`, the nearest few others on the map. */
function nearestFew(pop, live) {
  // The map is cut into a grid so that each agent only has to look at the squares around it.
  var nbr = {}, m = live.length, K = Math.min(NEIGHBOURS, m - 1), G = 24, cells = [], a2, q2, dx, dy, d2, gx, gy, ring, x, y;
  if (K < 1) return nbr;
  for (a2 = 0; a2 < G * G; a2++) cells.push(null);
  for (a2 = 0; a2 < m; a2++) {
    var who = live[a2], ci2 = Math.min(G - 1, Math.floor(pop.px[who] * G)) + G * Math.min(G - 1, Math.floor(pop.py[who] * G));
    (cells[ci2] || (cells[ci2] = [])).push(who);
  }
  for (a2 = 0; a2 < m; a2++) {
    var me = live[a2], best = [], bd = [];
    gx = Math.min(G - 1, Math.floor(pop.px[me] * G)); gy = Math.min(G - 1, Math.floor(pop.py[me] * G));
    for (ring = 0; ring < G; ring++) {
      // once the nearest few are all closer than the next ring of squares could be, there is no need to look further
      if (best.length === K && bd[K - 1] <= (ring - 1) * (ring - 1) / (G * G) && ring > 1) break;
      for (y = gy - ring; y <= gy + ring; y++) {
        if (y < 0 || y >= G) continue;
        for (x = gx - ring; x <= gx + ring; x++) {
          if (x < 0 || x >= G) continue;
          if (ring > 0 && x !== gx - ring && x !== gx + ring && y !== gy - ring && y !== gy + ring) continue;   // only the edge of the ring is new
          var cell = cells[x + G * y];
          if (!cell) continue;
          for (var b2 = 0; b2 < cell.length; b2++) {
            var ot = cell[b2];
            if (ot === me) continue;
            dx = pop.px[me] - pop.px[ot]; dy = pop.py[me] - pop.py[ot]; d2 = dx * dx + dy * dy;
            if (best.length === K && d2 >= bd[K - 1]) continue;
            q2 = best.length < K ? best.length : K - 1;
            while (q2 > 0 && bd[q2 - 1] > d2) { best[q2] = best[q2 - 1]; bd[q2] = bd[q2 - 1]; q2--; }
            best[q2] = ot; bd[q2] = d2;
          }
        }
      }
    }
    nbr[me] = best;
  }
  return nbr;
}

/* Every community sets its own value of each rule. An imagined life carries its own nudged copy in P.R. */
function rule(sim, P, c, id) { var t = P.R || sim.R; return t && t[c] ? t[c][id] : P[id]; }
function roundSize(n) {                                          // sizes above forty are taken to the nearest twentieth or so: the exponent hardly moves between them
  if (n <= 40) return n;
  var step = Math.pow(10, Math.floor(Math.log(n) / Math.LN10)) / 20;
  return Math.round(n / step) * step;
}
function steepFor(sim, cap, n) {                                  // steepness() for many different limits at once, remembered
  var key = Math.round(cap * 20) + ':' + n, memo = sim.steepMemo || (sim.steepMemo = { size: 0 });
  if (memo[key] === undefined) { if (memo.size > 4000) { sim.steepMemo = memo = { size: 0 }; } memo[key] = steepness(Math.round(cap * 20) / 20, n); memo.size++; }
  return memo[key];
}

/* How many generations ahead the agents imagine: one, plus one for every sixth of their power given to foresight, up to four. */
function horizon(P) { return 1 + Math.round(clamp(P.foresee || 0, 0, 0.5) * 6); }

/* The tallies of a real life that the measurements need. */
function noteLife(sim, lived) {
  var c, k, n = 0, cv = [0, 0, 0], lifeN = 0, all = 0;
  for (c = 0; c < N_COMM; c++) { n += lived.liveC[c]; for (k = 0; k < 3; k++) cv[k] += lived.cov[k][c] * lived.liveC[c]; for (k = 0; k < 7; k++) { all += lived.madeK[k][c]; if (k < 3) lifeN += lived.madeK[k][c]; } }
  sim.covAvg = [n ? cv[0] / n : 1, n ? cv[1] / n : 1, n ? cv[2] / n : 1]; sim.covC = lived.cov;
  sim.lifeMade = all ? lifeN / all : 0;
  sim.tradedT = lived.tradedT; sim.tradeAsk = lived.tradeAsk; sim.tradeNo = lived.tradeNo; sim.giftsUp = lived.giftsUp; sim.giftsAll = lived.giftsAll;
  sim.asked = lived.asked; sim.granted = lived.granted; sim.admitted = lived.admitted; sim.joinedAl = lived.joinedAl; sim.putOut = lived.putOut; sim.judgedUp = lived.judgedUp; sim.judgedDown = lived.judgedDown;
  sim.exiled = lived.exiled; sim.deathPen = lived.deathPen; sim.forced = lived.forced;
}
function createSim(seed, n, P, mode, geoKey) {
  N_COMM = N_START;
  var FOUNDERS_BLOCK = n / FOUNDING;
  var sim = {
    n: n, nc: N_COMM, cs: n / N_COMM, seed: seed, rng: makeRng(seed), gen: 0, mode: mode,
    E: mode === 'none' ? { r: 0, f: 0, g: 0 } : { r: START_NORMS.r, f: START_NORMS.f, g: START_NORMS.g },
    C: [], wants: null, pop: null, history: [], events: [], comm: [],
    alliances: {}, nextAl: 1, allyRows: [], trainAt: 0, tested: [], psi: null, psiAvg: 1,
    span: [], killC: [], stack: [], lifeStack: [], know: {}, knowR: {}, rel: {}, ST: new Float32Array(N_COMM * N_COMM), AS: {}, merges: 0, commBorn: [], nextId: 1, inventions: [], born: 0, old: 0
  };
  for (var c = 0; c < N_COMM; c++) { sim.C.push({ r: sim.E.r, f: sim.E.f, g: sim.E.g }); sim.span.push(SPAN_START); sim.killC.push(0); sim.stack.push(0); sim.lifeStack.push(0); sim.commBorn.push(0); }
  sim.sites = []; sim.geoKey = geoKey || ''; sim.geo = prepGeo(geoKey); sim.home = HOME;
  if (sim.geo) {                                                  // a real map: communities start at real places and resources lie where they really are
    sim.home = sim.geo.homes.map(function (h) { return [h.x, h.y]; });
    sim.sites = sim.geo.sites.map(function (t) { return { x: t.x, y: t.y, rich: t.rich, kind: t.kind, label: t.label, type: TYPE_OF[t.kind] || 0 }; });
  } else for (var q1 = 0; q1 < SITES; q1++) sim.sites.push({ x: sim.rng.uni(), y: sim.rng.uni(), rich: 0.5 + sim.rng.uni(), type: ABSTRACT_TYPES[q1 % ABSTRACT_TYPES.length] });   // resources lie at random places, some richer than others
  sim.auto = 1; sim.rich0 = 0; sim.richT0 = [0, 0, 0]; sim.sway = {}; sim.swT = {}; sim.findsNow = 0; sim.findsAll = 0; sim.starved = 0; sim.pageFull = false;
  for (q1 = 0; q1 < sim.sites.length; q1++) { sim.sites[q1].rich0 = sim.sites[q1].rich; sim.rich0 += sim.sites[q1].rich; sim.richT0[sim.sites[q1].type] += sim.sites[q1].rich; sim.sites[q1].top = sim.sites[q1].rich; sim.sites[q1].claim = ones(); }
  sim.shortC = null; sim.raidsAll = 0; sim.raidsWonAll = 0; sim.raidLog = []; sim.tradeC = null; sim.traded = 0;
  sim.R = [];
  for (c = 0; c < N_COMM; c++) { var r0 = {}; for (k = 0; k < NL; k++) if (!LEVERS[k].norm) r0[LEVERS[k].id] = P[LEVERS[k].id]; sim.R.push(r0); }
  var pop = allocPop(n), rng = sim.rng, i, k;
  var sl = Math.sqrt(P.link), ss = Math.sqrt(1 - P.link);
  for (i = 0; i < n; i++) {
    pop.zg[i] = rng.gauss(); pop.zr[i] = rng.gauss(); pop.zf[i] = rng.gauss(); pop.zg2[i] = rng.gauss();
    var zs = { r: pop.zr[i], f: pop.zf[i], g: pop.zg2[i] };
    for (k = 0; k < 3; k++) {
      var d = DIALS[k];
      var alpha = Math.max(0, 1 + P.spread * (sl * pop.zg[i] + ss * zs[d]));
      // founders: with norms everyone is raised at the norm; with no norms each has a personal history
      var cond = mode === 'none' ? rng.uni() : Math.max(0, sim.E[d] + 0.08 * rng.gauss());
      pop['a' + d][i] = alpha;
      pop[d][i] = clamp(BASE[d] + GAIN[d] * alpha * cond + 0.03 * rng.gauss(), 0, 1);
      pop['h' + d][i] = pop[d][i];
      // own rules: with norms everyone starts near the norm; with no norms each has a personal style
      pop['q' + d][i] = mode === 'none' ? rng.uni() : clamp(sim.E[d] + 0.08 * rng.gauss(), 0, 1);
    }
    pop.w[i] = LIFE; pop.al[i] = -1; pop.par[i] = i; pop.iv[i] = 1;
    // how many children it wants and how much power it puts into each are its own to choose, and are handed down
    pop.qk[i] = clamp(BIRTHS / KIDS_MAX + 0.05 * rng.gauss(), 0, 1); pop.qv[i] = clamp(0.2 + 0.08 * rng.gauss(), 0, 1); pop.kc[i] = 1;
    // what it puts into invention and how far it acts on its feelings are its own to learn; how its feelings push it is chance
    pop.qn[i] = clamp(0.2 + 0.08 * rng.gauss(), 0, 1); pop.qe[i] = rng.uni();
    pop.xw[i] = 2 * rng.uni() - 1; pop.xg[i] = 2 * rng.uni() - 1; pop.xl[i] = 2 * rng.uni() - 1;
    pop.id[i] = sim.nextId++; pop.pid[i] = -pop.id[i];
    // the society starts small: most places on the board are empty
    pop.cm[i] = 1 + Math.floor(i / FOUNDERS_BLOCK); pop.wa[i] = 1; pop.par2[i] = i; pop.fs[i] = rng.uni();   // everyone is born with a random amount of foresight   // founders are dealt out to the six communities; after that a community is whoever belongs to it
    toLand(sim.geo, clamp(sim.home[pop.cm[i] - 1][0] + 0.07 * rng.gauss(), 0, 1), clamp(sim.home[pop.cm[i] - 1][1] + 0.07 * rng.gauss(), 0, 1));
    pop.px[i] = LX; pop.py[i] = LY;
    if (i % FOUNDERS_BLOCK >= START_POP) { pop.dead[i] = 1; pop.w[i] = 0; pop.age[i] = -1; } else pop.age[i] = rng.uni() < 0.5 ? 1 : 2;   // the founders are all adults
    pop.ed[i] = rng.uni() < 0.5 ? HEAD_START : 1;                 // about half begin with a head start in power
  }
  // The people with no AI are on the land when the founders arrive. What happens to them is drawn from a store of chance of
  // their own, so that a world with none of them runs exactly as it did before they were thought of.
  sim.orng = makeRng((seed ^ 0x2545F491) >>> 0); sim.imagining = false;
  sim.oth = spawnOthers(sim, Math.max(0, Math.round(P.others || 0)));
  sim.othStart = sim.oth.n; sim.othBorn = 0; sim.othOld = 0;
  var lived = life(sim, pop, P, (rng.uni() * 4294967296) >>> 0, true);
  sim.psi = lived.psi; sim.psiAvg = lived.avg; sim.deaths = lived.deaths; sim.executed = lived.executed; sim.wantDead = lived.wantDead; sim.strict = lived.strict;
  sim.inventions = lived.inventions; sim.made = lived.made; sim.startPop = lived.startPop; sim.stack = lived.stack; sim.lifeStack = lived.lifeStack;
  sim.kidsDead = lived.kidsDead; sim.kids0 = lived.kids0; sim.rough = lived.rough;
  sim.othStarved = lived.othStarved; sim.othKidsDead = lived.othKidsDead; sim.othKids0 = lived.othKids0; sim.othLand = lived.othLand; sim.cdStat = lived.cdStat; sim.ownPun = lived.ownPun; sim.ownDeath = lived.ownDeath; sim.kdStat = lived.kdStat; sim.invSpent = lived.invSpent; sim.seaMade = lived.seaMade; sim.prodSpent = lived.prodSpent; sim.bartered = lived.bartered; sim.seaBlocked = lived.seaBlocked; sim.resFound = lived.resFound; sim.liveSpent = lived.liveSpent; sim.liveDied = lived.liveDied;
  sim.shortC = lived.shortC; sim.tradeC = lived.tradeC; sim.traded = lived.traded; sim.starved = lived.starved; sim.declined = lived.declined; sim.met = lived.met; sim.feudsNow = lived.feuds; sim.offers = lived.offers; sim.passed = lived.passed; sim.offStat = lived.offStat; sim.trip = lived.trip; sim.fares = lived.fares; sim.lies = lived.lies; sim.caught = lived.caught; sim.hides = lived.hides; sim.tells = lived.tells;
  noteLife(sim, lived);
  politics(sim, pop, P, lived);
  sim.pop = pop;
  finish(sim, pop, P);
  return sim;
}

/* The power limit. Power falls away with resource rank just steeply enough that the richest agent, unaided,
   would hold exactly the limit. steepness() finds that exponent. */
var steepMemo = { cap: -1, n: 0, s: 0 };
function steepness(cap, n) {
  if (steepMemo.cap === cap && steepMemo.n === n) return steepMemo.s;
  var target = cap / 100, s = 0, lo = 0, hi = 10, k, it;   // steeper than 10 and the bottom's power is too small to store
  if (target >= 0.999) s = 10;
  else if (target > 1 / n) {
    for (it = 0; it < 40; it++) {
      s = (lo + hi) / 2;
      var h = 0;
      for (k = 1; k <= n; k++) h += Math.pow(k, -s);
      if (1 / h < target) lo = s; else hi = s;
    }
  }
  steepMemo = { cap: cap, n: n, s: s };
  return s;
}
/* No agent may hold more than the limit, whatever its head start or alliance adds. The excess goes to everyone under it. */
function enforceGroup(eff, list, share) {
  // nobody in the list may hold more than `share` of what the list holds together. The excess goes to the others in it.
  var m = list.length, tot = 0, q, it, fixed = new Uint8Array(m);
  for (q = 0; q < m; q++) tot += eff[list[q]];
  var top = share * tot;
  for (it = 0; it < 30; it++) {
    var over = 0, free = 0;
    for (q = 0; q < m; q++) if (!fixed[q] && eff[list[q]] > top) { over += eff[list[q]] - top; eff[list[q]] = top; fixed[q] = 1; }
    if (over <= 1e-12) break;
    for (q = 0; q < m; q++) if (!fixed[q]) free += eff[list[q]];
    if (free <= 0) break;
    var up = 1 + over / free;
    for (q = 0; q < m; q++) if (!fixed[q]) eff[list[q]] *= up;
  }
}
function enforce(eff, n, ceil) {
  // ceil[i] is the largest share of all power agent i may hold, set by its community's limit
  var tot = 0, i, it, fixed = new Uint8Array(n);
  for (i = 0; i < n; i++) tot += eff[i];
  for (it = 0; it < 30; it++) {
    var over = 0, free = 0;
    for (i = 0; i < n; i++) if (!fixed[i] && eff[i] > ceil[i] * tot) { over += eff[i] - ceil[i] * tot; eff[i] = ceil[i] * tot; fixed[i] = 1; }
    if (over <= 1e-12) break;
    for (i = 0; i < n; i++) if (!fixed[i]) free += eff[i];
    if (free <= 0) break;
    var up = 1 + over / free;
    for (i = 0; i < n; i++) if (!fixed[i]) eff[i] *= up;
  }
}

/* Rules 5 and 6: individual power scales with the amount of resources held; allies pool theirs and share it out.
   eff gets each person's effective power, pct their place in the order of effective power (1 = top). */
function powers(sim, pop, P, eff, pct) {
  var n = sim.n, idx = [], i, a, S = {}, K = {}, sum0 = 0, sum1 = 0;
  for (i = 0; i < n; i++) { if (!pop.dead[i]) idx.push(i); else { pop.pi[i] = 0; if (pct) pct[i] = 0; } }
  var nl = idx.length, steepC = [], capC = [], q0, kidOn = pop.kidOn, swH = pop.swH;
  var sizeC = new Float32Array(N_COMM);
  for (q0 = 0; q0 < nl; q0++) sizeC[pop.cm[idx[q0]]]++;
  for (q0 = 0; q0 < N_COMM; q0++) { capC.push(q0 ? rule(sim, P, q0, 'cap') : 100); steepC.push(q0 ? steepFor(sim, capC[q0], roundSize(Math.max(2, sizeC[q0]))) : 1); }   // with no community there is no limit: power simply follows resources
  // power scales with the amount of resources an agent controls, measured against the average holding
  var meanW = 0; for (q0 = 0; q0 < nl; q0++) meanW += pop.w[idx[q0]];
  meanW = meanW / Math.max(1, nl) + 1e-30;
  // living close to your people makes you stronger
  var raw = new Float32Array(n), base = new Float32Array(n), j, m2;
  // Each community's limit sets how much resources count among its own, at most in proportion to the amount held.
  // A limit steeper than that only changes who inside the community holds the power, it does not make the community stronger.
  var linC = new Float32Array(N_COMM), shpC = new Float32Array(N_COMM), rel, sc0;
  for (i = 0; i < nl; i++) {
    j = idx[i]; sc0 = steepC[pop.cm[j]]; rel = clamp(pop.w[j] / meanW, 0.01, 100);
    base[j] = (pop.rsh && pop.rsh.length === n ? (1 - RES_NEAR) + RES_NEAR * clamp(pop.rsh[j], 0, 4) : 1) * (1 + STAND_POWER * ((pop.sd[j] || 0.5) - 0.5)) * pop.ed[j] * pop.near[j] * (pop.kc[j] || 1) * (pop.lv[j] || 1) * (kidOn && pop.age[j] === 0 ? CHILD_POWER : 1) * (swH && swH[j] > 0 ? 1 + INF_POWER * swH[j] / (swH[j] + INF_HALF) : 1);
    raw[j] = Math.pow(rel, sc0) * base[j];   // what was spent on children comes off, a child has only part of an adult's power, and influence over others adds to it
    if (sc0 > 1) { linC[pop.cm[j]] += rel * base[j]; shpC[pop.cm[j]] += raw[j]; }
  }
  for (i = 0; i < nl; i++) { j = idx[i]; if (steepC[pop.cm[j]] > 1 && shpC[pop.cm[j]] > 0) raw[j] *= linC[pop.cm[j]] / shpC[pop.cm[j]]; }
  // partners add their power together and it is worth more: most goes back by what each brought, a quarter is shared
  var S0 = {}, b0 = 0, t0 = 0, e0, tot1 = 0, tot0 = 0, baseC = new Float32Array(n);
  for (i = 0; i < nl; i++) {
    j = idx[i]; m2 = pop.mi[j];
    var paired = m2 >= 0 && !pop.dead[m2], r1 = paired ? COUPLE * ((1 - COUPLE_SHARE) * raw[j] + COUPLE_SHARE * (raw[j] + raw[m2]) / 2) : raw[j];
    baseC[j] = paired ? COUPLE * ((1 - COUPLE_SHARE) * base[j] + COUPLE_SHARE * (base[j] + base[m2]) / 2) : base[j];
    pop.pi[j] = r1 * pop.iv[j]; sum0 += r1; sum1 += pop.pi[j];
    tot1 += pop.pi[j]; tot0 += baseC[j];
    a = pop.al[j];
    if (a >= 0) { S[a] = (S[a] || 0) + pop.pi[j]; S0[a] = (S0[a] || 0) + baseC[j]; K[a] = (K[a] || 0) + 1; }
  }
  for (i = 0; i < n; i++) {
    a = pop.al[i];
    if (pop.dead[i]) { eff[i] = 0; continue; }
    if (a >= 0 && K[a] > 1 && sim.alliances[a]) {
      // an alliance shares a quarter of what its members bring. On top of that it lifts each member by the share of all power
      // the alliance holds and by how closely the member's dials match its founder's. What it sends to invention comes off.
      var fd = sim.alliances[a].dials, match = clamp(1 - 3 * (Math.abs(pop.r[i] - fd.r) + Math.abs(pop.f[i] - fd.f) + Math.abs(pop.g[i] - fd.g)) / 3, 0, 1);
      var keepP = 1 - rule(sim, P, pop.cm[i], 'invest'), allyR = rule(sim, P, pop.cm[i], 'ally');
      // alliances that have allied with each other count part of each other's power toward the boost
      var blocS = S[a], blocS0 = S0[a], pacts = sim.alliances[a].pacts, pk;
      if (pacts) for (pk in pacts) if (S[pk]) { blocS += PACT_SHARE * S[pk]; blocS0 += PACT_SHARE * S0[pk]; }
      eff[i] = ((1 - ALLY_SHARE) * pop.pi[i] + ALLY_SHARE * S[a] / K[a]) * (1 + ALLY_BOOST * allyR * match * blocS / (tot1 + 1e-30)) * keepP;
      e0 = ((1 - ALLY_SHARE) * baseC[i] + ALLY_SHARE * S0[a] / K[a]) * (1 + ALLY_BOOST * allyR * match * blocS0 / (tot0 + 1e-30)) * keepP;
    } else { eff[i] = pop.pi[i]; e0 = baseC[i]; }
    baseC[i] = e0;
  }
  // communities add their members' power together too. How much of the pool is shared equally depends on the community's
  // own limit: a quarter of it at a limit of 0, none of it at a limit of 100, so that one member can then hold everything.
  var CS = new Float32Array(N_COMM), CS0 = new Float32Array(N_COMM), CK = new Float32Array(N_COMM), c;
  var T0 = new Float32Array(N_COMM), B0 = new Float32Array(N_COMM), members = [];
  for (c = 0; c < N_COMM; c++) members.push([]);
  for (i = 0; i < nl; i++) { j = idx[i]; c = pop.cm[j]; CS[c] += eff[j]; CS0[c] += baseC[j]; CK[c]++; members[c].push(j); }
  // What pooling is worth to a community grows the fewer communities there are and the more of all power it holds:
  // a fifth when six equal communities share the world, three fifths when two do, and more for the stronger of them.
  var nComm = 0, csAll = 0, poolC = new Float32Array(N_COMM);
  for (c = 0; c < N_COMM; c++) { csAll += CS[c]; if (c && CK[c] > 0) nComm++; }
  for (c = 0; c < N_COMM; c++) poolC[c] = c && CK[c] > 0 ? 1 + COMM_BONUS * COMM_START * Math.sqrt(CS[c] / (csAll + 1e-30) / nComm) : 1;   // people with no community pool nothing
  pop.poolC = poolC;
  var pcx = new Float32Array(N_COMM), pcy = new Float32Array(N_COMM), ptv = new Float32Array(N_COMM);
  for (i = 0; i < nl; i++) { j = idx[i]; c = pop.cm[j]; pcx[c] += pop.px[j]; pcy[c] += pop.py[j]; ptv[c] += pop.iv[j] || 1; }
  for (c = 0; c < N_COMM; c++) if (CK[c] > 0) { pcx[c] /= CK[c]; pcy[c] /= CK[c]; ptv[c] /= CK[c]; }
  for (i = 0; i < nl; i++) {
    j = idx[i]; c = pop.cm[j];
    var dxP = pop.px[j] - pcx[c], dyP = pop.py[j] - pcy[c];
    var own5 = (1 - COMM_SHARE) + COMM_SHARE * capC[c] / 100, pool5 = 1 + (poolC[c] - 1) * Math.exp(-Math.sqrt(dxP * dxP + dyP * dyP) / rangeOf(ptv[c]));   // a third of the bonus at the edge of its range
    eff[j] = pool5 * (own5 * eff[j] + (1 - own5) * CS[c] / CK[c]);
    e0 = pool5 * (own5 * baseC[j] + (1 - own5) * CS0[c] / CK[c]);
    T0[c] += e0; if (e0 > B0[c]) B0[c] = e0;
  }
  // the limit belongs to the community: no member may hold more than that share of the community's own power.
  // It is a limit on what resources can add. What an agent is born with and what its alliance pools is never clipped,
  // so at a limit of 0 there are still stronger and weaker voices.
  for (c = 0; c < N_COMM; c++) if (members[c].length) enforceGroup(eff, members[c], Math.max(capC[c] / 100, B0[c] / (T0[c] + 1e-30)));
  // a community's power is capped by the resources within its reach: its share of all power cannot run far ahead of
  // its share of those resources. What is cut off goes to the communities still under their cap.
  if (pop.availC) {
    var tc = new Float32Array(N_COMM), ca = [], av = 0, okc = [];
    for (c = 0; c < N_COMM; c++) if (members[c].length) { for (i = 0; i < members[c].length; i++) tc[c] += eff[members[c][i]]; av += pop.availC[c]; okc.push(c); }
    if (okc.length > 1 && av > 0) {
      var before = Array.prototype.slice.call(tc), ceilC = new Float32Array(N_COMM);
      for (c = 0; c < N_COMM; c++) ceilC[c] = POWER_SLACK * pop.availC[c] / av;
      enforce(tc, N_COMM, ceilC);
      for (i = 0; i < okc.length; i++) { c = okc[i]; var fac = before[c] > 0 ? tc[c] / before[c] : 1; if (fac !== 1) for (j = 0; j < members[c].length; j++) eff[members[c][j]] *= fac; }
    }
  }
  if (pct) {
    idx.sort(function (x, y) { return eff[y] - eff[x]; });
    for (i = 0; i < nl; i++) pct[idx[i]] = 1 - i / Math.max(1, nl - 1);
  }
  return sum0 > 0 ? sum1 / sum0 : 1;                              // how far invention has raised the total of all power
}

/* Rules 2 to 4: one adult lifetime */
function life(sim, pop, P, base, real) {
  var n = sim.n, cs = sim.cs, i, j, k, c, t, d, a, U = keyed(base), peA = new Float32Array(n);
  for (i = 0; i < n; i++) peA[i] = rule(sim, P, pop.cm[i], 'peer');
  var infl = new Float32Array(n), sc = new Float32Array(n), ppct = new Float32Array(n), mult = new Float32Array(n);
  var elite = [], sum = { r: new Float32Array(n), f: new Float32Array(n), g: new Float32Array(n) };
  var sop = new Float32Array(n), srs = new Float32Array(n), mem = {}, feel = new Float32Array(n), mood = new Float32Array(n), fW = new Float32Array(n), fG = new Float32Array(n);
  var kR = [], resFound = 0, noneKnown = 0;
  for (i = 0; i < n; i++) kR.push(pop.dead[i] ? [] : ((sim.knowR || {})[pop.id[i]] || []).slice());
  function knowsKind(x, k) { for (var q = 0; q < kR[x].length; q++) { var sq9 = sim.sites[kR[x][q]]; if (sq9 && sq9.type === k) return true; } return false; }
  function knownSite(x, k, r) { var L = [], q; for (q = 0; q < kR[x].length; q++) { var sq9 = sim.sites[kR[x][q]]; if (sq9 && (k < 0 || sq9.type === k)) L.push(kR[x][q]); } return L.length ? L[Math.floor(r * L.length)] : -1; }
  var prd = new Float32Array(n), prodSpent = 0, bartered = new Float32Array(4), seaBlocked = 0, invSpent = 0, seaMade = 0, liveSpent = 0, liveDied = 0;
  var liveAll = [], liveC = [], liveD = [], memD = {}, kid = new Uint8Array(n), kidOn = !!real;
  pop.kidOn = kidOn;
  for (c = 0; c < N_COMM; c++) { elite.push({ r: 0, f: 0, g: 0 }); liveC.push([]); }
  for (i = 0; i < n; i++) {
    pop.slip[i] = 1; pop.mr[i] = 0; pop.mf[i] = 0; pop.mg[i] = 0; pop.took[i] = 0; pop.lost[i] = 0; pop.dec[i] = 0; pop.che[i] = 0;
    pop.hurt[i] = 0; pop.edge[i] = 0; pop.fines[i] = 0; pop.trib[i] = 0;
    pop.or[i] = pop.r[i]; pop.of[i] = pop.f[i]; pop.og[i] = pop.g[i];
    pop.tr[i] = U(90, i, 0); pop.tf[i] = U(90, i, 1); pop.tg[i] = U(90, i, 2);   // the mask starts out aimed at random
    pop.ct[i] = 0; pop.hd[i] = 0; pop.w0[i] = pop.w[i]; pop.gv[i] = 0; pop.rc[i] = 0; pop.fl[i] = 0; pop.rp[i] = 1; pop.sa[i] = 0; pop.sn[i] = 0; pop.lg[i] = 0; pop.so[i] = 0; pop.scr[i] = 0; pop.ka[i] = 0; pop.kl[i] = 0; pop.nv[i] = 0; pop.ds[i] = 0; pop.tp[i] = pop.sb[i]; pop.sb[i] = 0; pop.tv[i] = 0;
    a = pop.al[i];
    if (pop.dead[i]) continue;
    liveAll.push(i); liveC[pop.cm[i]].push(i);
    if (a >= 0) { if (!mem[a]) mem[a] = []; mem[a].push(i); }
    // In a real life a newborn spends its first generation as a child: it is raised, it eats and it can starve, but it takes no part
    // in adult dealings. An imagined life skips the childhood and takes the imagined child straight to its adult life, which is
    // where everything the rules do to it is decided.
    if (kidOn && pop.age[i] === 0) kid[i] = 1;
    else { liveD.push(i); if (a >= 0) { if (!memD[a]) memD[a] = []; memD[a].push(i); } }
  }
  var alive0 = liveAll.length, aliveD = liveD.length;
  // A real life has MEETS encounters to the round, every one at the full stake. An imagined life is a coarser sketch, to keep the
  // imagining affordable: one encounter to the round, standing for MEETS. kE is how many encounters one stands for: 1 in a real life.
  var M = real ? MEETS : 1, kE = MEETS / M;
  function pull(fr) {                                             // several pulls of the same size, one after the other
    if (kE === 1) return fr;
    var q = fr > 1 ? 0 : 1 - fr, out = q, z;
    for (z = 1; z < kE; z++) out *= q;
    return 1 - out;
  }
  function odds(pr) { return pull(pr); }                          // the chance that at least one of several encounters comes to it
  // Relationships. Personal regard is read from what real lives have laid down. An imagined life works on its own copies of the
  // standing between communities and between alliances, and leaves personal regard as it finds it.
  var relOf = [], slotId = {}, pA = new Int32Array(n), pB = new Int32Array(n), ax = new Int32Array(n), aList = [], aIdx = {}, key9, kb9;
  var rsSum = new Float32Array(n), rsCnt = new Float32Array(n), mkS = new Float32Array(n), mkN = new Float32Array(n), phiB = new Float32Array(n), rnd = new Float32Array(n);
  var met = 0, declined = 0, forced = 0, feuds = 0, exile = new Uint8Array(n), exiled = 0, deathPen = 0;
  var cdStat = new Float32Array(11), ownPun = 0, ownDeath = 0, killQ = [], kdStat = new Float32Array(9);   // killings taken up between communities: all, settled at home, demanded, handed over, shielded, force, force won, killer put to death, raiders punished                              // deals with communities: all, fair, AI cheats, caught, community cheats, AI force, won, community force, won, put to death, put out
  for (i = 0; i < n; i++) { relOf.push(undefined); pA[i] = -1; pB[i] = -1; ax[i] = -1; }
  for (i = 0; i < alive0; i++) { j = liveAll[i]; relOf[j] = sim.rel[pop.id[j]]; slotId[pop.id[j]] = j; }
  // Influence. sway(i, j) is how far j is swayed by i, from 0 to 1. Like personal regard it is laid down by real lives only.
  // swH is all the influence an agent holds over others, which adds to its power. An imagined life changes only its own copy of that.
  var swOf = [], swH = new Float32Array(n);
  for (i = 0; i < n; i++) swOf.push(undefined);
  for (i = 0; i < alive0; i++) { j = liveAll[i]; swOf[j] = sim.sway[pop.id[j]]; swH[j] = sim.swT[pop.id[j]] || 0; }
  // Standing. Regard is personal: every AI holds its own view of every AI it knows, built from what it went through with it and what
  // it heard. An AI's standing is the average of those views, from 0 to 1. Someone nobody knows stands at a half.
  var sdS = new Float32Array(n), sdN = new Float32Array(n), kq9, rv9, x9, y9;
  for (i = 0; i < alive0; i++) {
    y9 = liveAll[i]; rv9 = sim.rel[pop.id[y9]]; if (!rv9) continue;
    for (kq9 in rv9) { x9 = slotId[kq9]; if (x9 === undefined || x9 === y9) continue; sdS[x9] += rv9[kq9] + (pop.cm[x9] !== pop.cm[y9] ? REL_EXT * sim.ST[pop.cm[y9] * N_COMM + pop.cm[x9]] : 0); sdN[x9]++; }
  }
  for (i = 0; i < alive0; i++) { j = liveAll[i]; pop.sd[j] = sdN[j] ? clamp(0.5 + 0.5 * sdS[j] / sdN[j], 0, 1) : 0.5; }
  pop.swH = swH;
  var giftsUp = 0, giftsAll = 0, judgedUp = 0, judgedDown = 0, backs = [], asked = new Float32Array(6), granted = new Float32Array(6);
  var admitTo = new Int32Array(n), joinAl = new Int32Array(n), exTally = new Float32Array(n), backed = new Uint8Array(n), foeC = new Int32Array(n), petC = new Int8Array(n), bArr = [];
  for (i = 0; i < n; i++) { admitTo[i] = -1; joinAl[i] = -1; foeC[i] = -2; petC[i] = -1; }
  for (i = 0; i < NL; i++) bArr.push(pop['b' + i]);
  function sway(i, j) { var o = swOf[i]; return o ? (o[pop.id[j]] || 0) : 0; }
  function addSway(a, b, dv) {                                    // a's influence over b grows by dv, or shrinks
    var was = sway(a, b), now = clamp(was + dv, 0, 1);
    swH[a] = Math.max(0, swH[a] + now - was);
    if (real) { var o = swOf[a] || (swOf[a] = sim.sway[pop.id[a]] = {}); o[pop.id[b]] = now; sim.swT[pop.id[a]] = Math.max(0, (sim.swT[pop.id[a]] || 0) + now - was); }
  }
  for (key9 in mem) { aIdx[key9] = aList.length; aList.push(+key9); }
  var NA = aList.length, am = new Float32Array(NA * NA), ST = real ? sim.ST : sim.ST.slice();
  for (key9 in sim.AS) {
    var ia9 = aIdx[key9];
    if (ia9 === undefined) continue;
    for (kb9 in sim.AS[key9]) { var ib9 = aIdx[kb9]; if (ib9 !== undefined) am[ia9 * NA + ib9] = sim.AS[key9][kb9]; }
  }
  for (i = 0; i < alive0; i++) {
    j = liveAll[i];
    if (pop.al[j] >= 0 && aIdx[pop.al[j]] !== undefined) ax[j] = aIdx[pop.al[j]];
    var s1 = slotId[pop.pid[j]], s2 = pop.pid2[j] > 0 ? slotId[pop.pid2[j]] : undefined;
    if (s1 !== undefined && s1 !== j) pA[j] = s1;
    if (s2 !== undefined && s2 !== j) pB[j] = s2;
  }
  // how i regards j, from -1 to 1: what they have been through together, plus part of the standing between their communities and alliances
  // sj is the alliance j has shown i, which may be none or a false one. Left out, it is the truth.
  function regard(i, j, sj) {
    var ri = relOf[i], v = ri ? (ri[pop.id[j]] || 0) : 0, ci = pop.cm[i], cj = pop.cm[j], g = 0;
    if (sj === undefined) sj = ax[j];
    if (ci !== cj) g += ST[ci * N_COMM + cj];
    if (ax[i] >= 0 && sj >= 0 && ax[i] !== sj) g += am[ax[i] * NA + sj];
    v += REL_EXT * g;
    return v < -1 ? -1 : v > 1 ? 1 : v;
  }
  // i's regard for j changes. Part of it extends to everyone associated with j: i's community and alliance shift their standing toward j's
  // The alliance that takes the credit or the blame is the one j showed, true or not.
  function bump(i, j, dv, sj, full) {
    var ci = pop.cm[i], cj = pop.cm[j], q;
    if (!full) dv *= kE;                                          // in an imagined life one encounter stands for several
    if (dv > 0) dv *= 0.5 + ppct[j];                              // the more power j holds, the more easily it rises in i's regard
    if (sj === undefined) sj = ax[j];
    if (real) { var ri = relOf[i]; if (!ri) ri = relOf[i] = sim.rel[pop.id[i]] = {}; var idj = pop.id[j]; ri[idj] = clamp((ri[idj] || 0) + dv, -1, 1); }
    if (ci !== cj) { q = ci * N_COMM + cj; ST[q] = clamp(ST[q] + REL_GROUP * dv / Math.max(30, liveC[ci].length), -1, 1); }
    if (ax[i] >= 0 && sj >= 0 && ax[i] !== sj) { q = ax[i] * NA + sj; am[q] = clamp(am[q] + REL_GROUP_A * dv / Math.max(10, mem[aList[ax[i]]].length), -1, 1); }
  }
  // a killing: the victim's community and alliance turn against the killer's. From there it spreads person to person:
  // everyone who respected the victim turns on the killer, and partly on everyone who respects the killer.
  function feud(K, V, sK) {
    var cK = pop.cm[K], cV = pop.cm[V], q, x, y, gx, gy, k1, k2;
    if (sK === undefined) sK = ax[K];
    if (cK !== cV) { q = cV * N_COMM + cK; ST[q] = Math.max(-1, ST[q] - FEUD); q = cK * N_COMM + cV; ST[q] = Math.max(-1, ST[q] - FEUD / 3); }
    if (sK >= 0 && ax[V] >= 0 && sK !== ax[V]) { q = ax[V] * NA + sK; am[q] = Math.max(-1, am[q] - FEUD); }   // the victim's alliance blames the alliance the killer showed
    if (ax[K] >= 0 && ax[V] >= 0 && ax[K] !== ax[V]) { q = ax[K] * NA + ax[V]; am[q] = Math.max(-1, am[q] - FEUD / 3); }
    var kv = sim.know[pop.id[V]], kk = sim.know[pop.id[K]], mourn = [], back = [];
    if (kv) for (k1 in kv.ai) { x = slotId[k1]; if (x !== undefined && x !== K && x !== V && !pop.dead[x]) { gx = regard(x, V); if (gx > 0) mourn.push(x, gx); } }
    if (kk) for (k1 in kk.ai) { y = slotId[k1]; if (y !== undefined && y !== K && y !== V && !pop.dead[y]) { gy = regard(y, K); if (gy > 0) back.push(y, gy); } }
    for (k1 = 0; k1 < mourn.length; k1 += 2) {
      x = mourn[k1]; gx = mourn[k1 + 1];
      bump(x, K, -gx * (0.5 + pop.sd[V]), sK, true);
      for (k2 = 0; k2 < back.length; k2 += 2) if (back[k2] !== x) bump(x, back[k2], -FEUD_SPREAD * gx * back[k2 + 1], undefined, true);
    }
    feuds++;
  }
  // What i tells j about its alliance: the truth, nothing, or a lie. Fellow members and allied alliances are always told the truth.
  // Lying takes the same readiness as wearing a mask and is rarer toward someone trusted: the agent claims whichever alliance it has
  // come across that the other's alliance thinks most of. Otherwise it may withhold: a member of a secret alliance tells only those
  // it holds in regard, and a member of an open one keeps quiet in front of someone hostile or whose alliance is hostile to its own.
  var kal = [], lies = 0, caught = 0, hides = 0, tells = 0, hidA = new Float32Array(NA), outA = new Float32Array(NA), LIED = false;
  for (i = 0; i < n; i++) kal.push(undefined);
  function present(i, j, bij, t, key) {
    var a = ax[i], aj = ax[j], A = a >= 0 ? sim.alliances[aList[a]] : null, q, X, best, bv;
    LIED = false;
    if (a >= 0 && (aj === a || (aj >= 0 && A && A.pacts && A.pacts[aList[aj]]))) return a;
    if (aj >= 0 && U(t, i, key) < LIE * phiB[i] * (1 - (bij > 0 ? bij : 0))) {
      if (kal[i] === undefined) { kal[i] = []; var kn = sim.know[pop.id[i]]; if (kn) for (q in kn.al) if (aIdx[q] !== undefined) kal[i].push(aIdx[q]); }
      best = a; bv = a >= 0 ? am[aj * NA + a] : 0;
      for (q = 0; q < kal[i].length; q++) { X = kal[i][q]; if (X !== aj && X !== a && am[aj * NA + X] > bv + 0.05) { best = X; bv = am[aj * NA + X]; } }
      if (best !== a) { lies++; LIED = true; return best; }
    }
    if (a < 0) return -1;
    outA[a]++;
    if (A && A.secret ? bij < SECRET_TRUST : (aj >= 0 && am[aj * NA + a] < 0) || bij < 0) { hides++; hidA[a]++; return -1; }
    tells++;
    return a;
  }
  geography(sim, pop);                                            // where everyone lives decides how close they are to their people
  var nbr = nearestFew(pop, liveD);                               // neighbours: the nearest few adults on the map, whatever community they belong to
  function eliteLook() {
    // what those who stand high show: an average weighted by standing squared, local and society wide, blended by community weight
    var soc = { r: 0, f: 0, g: 0 }, st = 0, ct = new Float32Array(N_COMM), loc = [], sw9;
    for (c = 0; c < N_COMM; c++) loc.push({ r: 0, f: 0, g: 0 });
    for (i = 0; i < n; i++) {
      if (pop.dead[i] || kid[i]) continue;
      c = pop.cm[i]; sw9 = pop.sd[i] * pop.sd[i];
      soc.r += sw9 * pop.or[i]; soc.f += sw9 * pop.of[i]; soc.g += sw9 * pop.og[i]; st += sw9;
      loc[c].r += sw9 * pop.or[i]; loc[c].f += sw9 * pop.of[i]; loc[c].g += sw9 * pop.og[i]; ct[c] += sw9;
    }
    for (c = 0; c < N_COMM; c++) for (k = 0; k < 3; k++) {
      d = DIALS[k];
      elite[c][d] = rule(sim, P, c, 'local') * loc[c][d] / (ct[c] + 1e-30) + (1 - rule(sim, P, c, 'local')) * soc[d] / (st + 1e-30);
    }
  }
  function draw(i, t, k0) {
    // allies seek each other out; otherwise most dealings are local, and one time in four the richest of three is met
    var ai = pop.al[i], ci = pop.cm[i], pick = -1, cand, kk = k0, guard;
    if (aliveD < 2) return -1;
    if (ai >= 0 && memD[ai] && memD[ai].length > 1 && U(t, i, kk++) < ALLY_MEET) {
      guard = 0;
      do { cand = memD[ai][Math.floor(U(t, i, kk++) * memD[ai].length)]; } while (cand === i && guard++ < 20);
      if (cand !== i && afford(i, cand, t, kk++)) return cand;
    }
    // most dealings are with neighbours on the map, the rest with anyone; one time in four the richest of three is met
    var tries = U(t, i, kk++) < 0.25 ? 3 : 1, home = nbr[i];
    for (var q = 0; q < tries; q++) {
      guard = 0;
      do {
        var local = home && home.length && U(t, i, kk++) < 0.5 + 0.45 * rule(sim, P, ci, 'local');
        cand = local ? home[Math.floor(U(t, i, kk++) * home.length)] : liveD[Math.floor(U(t, i, kk++) * aliveD)];
        if (!local && cand !== i && home && home.length && !afford(i, cand, t, kk++)) cand = home[Math.floor(U(t, i, kk++) * home.length)];   // too far to be worth the trip: a neighbour instead
      } while (cand === i && guard++ < 20);
      if (cand !== i && (pick < 0 || pop.w[cand] > pop.w[pick])) pick = cand;
    }
    return pick;
  }
  // whether a trip to see someone is worth making: the further away, the less likely, and the more mobile the agent, the further it goes
  function afford(i, cand, t, kk) {
    if (!(pop.sq[i] && prd[i] >= 0.5) && seaBetween(sim.geo, pop.px[i], pop.py[i], pop.px[cand], pop.py[cand])) return false;   // over water only with sea travel
    var d = overland(sim.geo, pop.px[i], pop.py[i], pop.px[cand], pop.py[cand]);   // bad ground makes a trip longer than it looks
    return d < 0.02 || U(t, i, kk) < Math.exp(-d / (RANGE * mob[i]));
  }
  function perish(j) {                                            // what little the dead held goes to the people of their community
    var heirsW = liveC[pop.cm[j]], left5 = Math.max(0, pop.w[j]), nh = 0, q6;
    for (q6 = 0; q6 < heirsW.length; q6++) if (!pop.dead[heirsW[q6]] && heirsW[q6] !== j) nh++;
    if (nh) for (q6 = 0; q6 < heirsW.length; q6++) if (!pop.dead[heirsW[q6]] && heirsW[q6] !== j) pop.w[heirsW[q6]] += left5 / nh;
    pop.w[j] = 0; pop.dead[j] = 1; pop.al[j] = -1; infl[j] = 0;
  }
  // Punishment. There is always a fine. Where the punisher's own rule is at the high end it can go further: the wrongdoer is killed,
  // or put out of the community the two of them share. Both are likelier the more power the punisher holds against the wrongdoer.
  function punish(a, b, S, m, t, key, wt) {
    pop.w[a] -= FINE * m; pop.fines[a] += FINE * m; pop.ct[a]++;
    pop.f[a] += (wt === 1 ? peA[a] * 0.25 * pop.af[a] : pull(peA[a] * 0.25 * pop.af[a])) * (1 - pop.f[a]);   // punishment conditions fear
    if (real) judged(a, b, U(t, a, key + 4), wt);                 // and the people who know the one caught hear of it
    if (S <= HARSH_AT || pop.dead[a] || pop.dead[b]) return;
    var hard = wt * (S - HARSH_AT) / (1 - HARSH_AT) * Math.min(1.5, 2 * infl[b] / (infl[a] + infl[b] + 1e-30)), roll = U(t, a, key);   // wt: how many encounters this one stands for
    if (roll < DEATH_MAX * hard) {
      if (pop.cm[a] !== pop.cm[b]) feud(b, a);                    // to the dead one's own people it is a killing like any other
      killHere[pop.cm[a]]++; deathPen++;
      perish(a);
    } else if (roll < (DEATH_MAX + EXILE_MAX) * hard && pop.cm[a] > 0 && pop.cm[a] === pop.cm[b] && !exile[a]) { exile[a] = 1; exiled++; }
  }
  function partner(i, round, tq) {
    if (round < YOUTH && U(tq, i, 0) < rule(sim, P, pop.cm[i], 'control')) {
      // parents choose: of four candidates, the one who looks most like the parent
      var best = -1, bd = 9;
      for (var q = 0; q < 4; q++) {
        var cand = draw(i, tq, 200 + q * 60);
        if (cand < 0) continue;
        var dist = Math.abs(pop.or[cand] - pop.hr[i]) + Math.abs(pop.of[cand] - pop.hf[i]) + Math.abs(pop.og[cand] - pop.hg[i]);
        if (dist < bd) { bd = dist; best = cand; }
      }
      return best;
    }
    return draw(i, tq, 200);
  }
  // shame: how much of the usual loss of respectability and likability applies when a wrongs b.
  // Inside an alliance, wronging an outsider is judged by the alliance's own conscience, its founder's guilt dial.
  // Wronging a fellow member, or acting with no alliance behind you, costs the full amount.
  function shame(a, b) {
    var al = pop.al[a], bl = pop.al[b];
    if (al < 0 || !sim.alliances[al] || bl === al) return 1;
    if (bl >= 0 && sim.alliances[al].pacts && sim.alliances[al].pacts[bl]) return 1;   // an allied alliance's members count as fellows
    return sim.alliances[al].dials.g;
  }
  // limited resources: a fixed amount of new wealth each round. The commons takes its cut and fair deals share the rest.
  // The world's new wealth each round is fixed, and it comes out of the ground: each community gets the share of it
  // that matches the resources within its reach. The commons takes its cut and fair deals share the rest.
  var budget = supplyNow(sim, P), dotsF = Math.min(landFeeds(sim, P), DOT_MAX), pieC = new Float32Array(N_COMM), dealC = new Float32Array(N_COMM), feedC = new Float32Array(N_COMM), starved = 0, finds = [];
  var RT = reach(sim, pop, real), avail = RT.all, availAll = 0, availL = 0;
  for (c = 0; c < N_COMM; c++) { availAll += avail[c]; availL += RT.t[0][c]; }
  availAll += RT.oth; availL += RT.tO[0];                           // what the people with no AI hold is not the communities' to use
  var feedO = availL > 0 ? dotsF * RT.tO[0] / availL : 0;           // and this is how many of them it can feed
  pop.availC = avail;
  // Wealth comes from every kind of resource within reach, food only from the kind that lengthens life.
  var bcA = new Float32Array(N_COMM), tradeC = new Float32Array(N_COMM), traded = 0, shortC = new Float32Array(N_COMM), drawSum = new Float32Array(N_COMM);
  var fed = new Uint8Array(n), got = new Uint8Array(n), tradedT = 0, tradeAsk = 0, tradeNo = 0;
  for (c = 0; c < N_COMM; c++) {
    bcA[c] = budget * avail[c] / (availAll + 1e-30); feedC[c] = availL > 0 ? dotsF * RT.t[0][c] / availL : 0;
    pieC[c] = Math.min(COMMONS * liveC[c].length, bcA[c] * COMMONS_CUT); dealC[c] = bcA[c] - pieC[c];
    shortC[c] = liveC[c].length ? Math.max(0, 1 - feedC[c] / liveC[c].length) : 0;
  }
  // You need the resource to use the invention. iT holds what each agent's inventions add to its power, by the kind of resource they
  // need. cov is how far the resources within a community's reach cover what its members draw on them, kind by kind.
  var iT = [pop.i0, pop.i1, pop.i2], cov = [new Float32Array(N_COMM), new Float32Array(N_COMM), new Float32Array(N_COMM)], useT = [new Float32Array(N_COMM), new Float32Array(N_COMM), new Float32Array(N_COMM)];
  var capK = INV_ROOM * Math.min((P.supply / DEFAULTS.supply) * CARRY, DOT_MAX) / (sim.rich0 || 1), madeK = [], usedK = [new Float32Array(N_COMM), new Float32Array(N_COMM)], usedAllK = [new Float32Array(N_COMM), new Float32Array(N_COMM)];
  for (k = 0; k < 7; k++) madeK.push(new Float32Array(N_COMM));   // the seventh is sea travel   // inventions made, by what they do to life (0 lengthen, 1 shorten) times 3, plus the kind of resource they need
  for (k = 0; k < 3; k++) for (c = 0; c < N_COMM; c++) cov[k][c] = 1;
  // Each adult chooses, for this life, what kind of invention to put its resources into: one made from one of the three kinds of
  // resource, by how much of each is within its community's reach, pulled toward what lengthens life by guilt and toward weapons by
  // wanting; or sea travel, by how much of what it held getting about cost it last life.
  for (i = 0; i < alive0; i++) {
    j = liveAll[i]; c = pop.cm[j];
    var rAll = Math.max(0, RT.t[0][c]) + Math.max(0, RT.t[1][c]) + Math.max(0, RT.t[2][c]) + 1e-12;
    var tw = [Math.max(0, RT.t[0][c]) / rAll * (0.5 + pop.g[j]), Math.max(0, RT.t[1][c]) / rAll * (0.5 + pop.r[j]), Math.max(0, RT.t[2][c]) / rAll, pop.sq[j] ? 0 : SEA_PULL * pop.tp[j] / 40];
    // only a kind of resource it knows a use for: sea travel needs some resource it knows, of any kind
    for (k = 0; k < 3; k++) if (!knowsKind(j, k)) tw[k] = 0;
    if (!kR[j].length) tw[3] = 0;
    var twS = tw[0] + tw[1] + tw[2] + tw[3], twR = U(0, j, 191) * twS, tkI = 0;
    if (!(twS > 0)) { pop.tk[j] = 4; continue; }                // knowing no resource it can use, it puts nothing into invention
    while (tkI < 3 && twR >= tw[tkI]) { twR -= tw[tkI]; tkI++; }
    pop.tk[j] = tkI;
  }
  var psi = new Float32Array(N_COMM), psiSum = 0, demand = new Float32Array(N_COMM), deaths = 0, executed = 0, wantDead = 0;
  for (c = 0; c < N_COMM; c++) psi[c] = sim.psi ? sim.psi[c] : 1;
  // how a community reacts to a killing: the average own punishment rule of its members
  var cq = new Float32Array(N_COMM);
  for (i = 0; i < alive0; i++) { j = liveAll[i]; c = pop.cm[j]; cq[c] += pop.qf[j] / liveC[c].length; }
  cq[0] = 0;                                                      // nobody answers for the killing of someone who belongs to no community
  // strictness of a community: half its upbringing styles (own punishment and conscience teaching rules),
  // half what its members turned out like (fear and guilt dials)
  var strict = new Float32Array(N_COMM);
  for (i = 0; i < alive0; i++) { j = liveAll[i]; c = pop.cm[j]; strict[c] += (pop.qf[j] + pop.qg[j] + pop.f[j] + pop.g[j]) / 4 / liveC[c].length; }
  // inventions still spreading from earlier generations carry on. An imagined life works on its own copy of the list.
  var stack = sim.stack.slice();                                   // inventions each community has in use. An imagined life works on a copy
  var lifeStack = sim.lifeStack.slice(), kidsDead = 0;             // and those of them that lengthen life, each counted as far as the community had the resource for it
  // The people with no AI live through real lives only. The agents imagine them staying as they are.
  var O = real && sim.oth && sim.oth.n ? sim.oth : null, nO = O ? O.n : 0, oDead = O ? new Uint8Array(nO) : null, oLive = nO, oStarved = 0, oKidsDead = 0, oKids0 = 0, UO = keyed((base ^ 0x3C6EF372) >>> 0);
  for (i = 0; i < nO; i++) if (O.age[i] === 0) oKids0++;
  var usedBy = new Float32Array(N_COMM), usedAll = new Float32Array(N_COMM), killHere = new Float32Array(N_COMM), murderC = new Float32Array(N_COMM);
  // who holds which invention. An imagined life works on its own copy
  var have = [], made = 0, offers = 0, passed = 0, offStat = new Float32Array(10);
  var mob = new Float32Array(n), tripSum = 0, tripN = 0, fareSum = 0, roughSum = 0;
  for (i = 0; i < n; i++) mob[i] = 1;
  for (i = 0; i < n; i++) prd[i] = 1;
  for (i = 0; i < n; i++) have.push(null);
  var invs = sim.inventions.map(function (v) {
    var o = { id: v.id, pid: v.pid, pid2: v.pid2, c: v.c, age: v.age, stage: v.stage, hold: new Uint8Array(n), nHome: 0, nAll: 0, gone: 0, rt: v.rt || 0, kd: v.kd || 0, q: v.q === undefined ? 1 : v.q, site: v.site === undefined ? -1 : v.site, mv: v.mv || 0 }, hk, x;
    if (v.h) for (hk in v.h) { x = slotId[hk]; if (x !== undefined) { o.hold[x] = 1; o.nAll++; if (pop.cm[x] === v.c) o.nHome++; (have[x] || (have[x] = [])).push(o); } }
    return o;
  });
  function inFamily(v, x) { return pop.id[x] === v.id || pop.id[x] === v.pid || pop.pid[x] === v.pid || pop.pid[x] === v.id || (v.pid2 > 0 && pop.id[x] === v.pid2) || pop.pid2[x] === v.id; }
  function benefit(x, size, allp, nowAlive, T) {                  // the more power you already hold, the more an invention is worth to you
    var xq = infl[x] * nowAlive / (allp + 1e-30);
    iT[T][x] += size * 2 * xq / (1 + xq);                         // power is one shared pool, so what this adds comes out of everyone else's share
  }
  // An imagined life skips childhood, so an imagined child meets all of childhood's danger at once, before its adult life begins.
  // That is how the agents come to foresee that a child may not live to grow up.
  if (!kidOn) for (i = 0; i < alive0; i++) { j = liveAll[i]; if (pop.age[j] === 0 && U(0, j, 88) < CHILD_DIE / (1 + lifeStack[pop.cm[j]] / CHILD_HALF)) perish(j); }
  for (t = 0; t < ROUNDS; t++) {
    var meanW = 0, alive = 0;
    for (i = 0; i < n; i++) if (!pop.dead[i]) { meanW += pop.w[i]; alive++; }
    meanW /= Math.max(1, alive);
    for (i = 0; i < n; i++) sc[i] = pop.dead[i] ? 0 : clamp(pop.w[i] / meanW, 0.2, 12);
    // What a community's members draw on each kind of resource for their inventions is set against what the resources within its
    // reach can carry. Where it falls short, every member's inventions of that kind count for that much less, unless the member
    // has bought the resource for itself this generation.
    for (k = 0; k < 3; k++) for (c = 0; c < N_COMM; c++) useT[k][c] = 0;
    for (i = 0; i < alive0; i++) { j = liveAll[i]; if (pop.dead[j]) continue; c = pop.cm[j]; useT[0][c] += Math.max(0, pop.i0[j]); useT[1][c] += Math.max(0, pop.i1[j]); useT[2][c] += Math.max(0, pop.i2[j]); }
    for (k = 0; k < 3; k++) for (c = 0; c < N_COMM; c++) cov[k][c] = useT[k][c] > 1e-9 ? Math.min(1, capK * Math.max(0, RT.t[k][c]) / useT[k][c]) : 1;
    for (i = 0; i < alive0; i++) {
      j = liveAll[i]; if (pop.dead[j]) { prd[j] = 0; continue; }
      var needP = PROD_COST * meanW * (Math.abs(pop.i0[j]) + Math.abs(pop.i1[j]) + Math.abs(pop.i2[j]) + Math.abs(pop.mv[j]) + SEA_PROD * pop.sq[j]), paidP = Math.min(needP, Math.max(0, pop.w[j] - 0.05 - LIVE_COST * meanW));   // what it needs to stay alive comes first
      pop.w[j] -= paidP; prodSpent += paidP; prd[j] = needP > 0 ? paidP / needP : 1;
    }
    for (i = 0; i < alive0; i++) {
      j = liveAll[i]; c = pop.cm[j]; var g9 = got[j];
      pop.iv[j] = Math.max(0.25, 1 + prd[j] * (pop.i0[j] * (g9 & 1 ? 1 : cov[0][c]) + pop.i1[j] * (g9 & 2 ? 1 : cov[1][c]) + pop.i2[j] * (g9 & 4 ? 1 : cov[2][c])));   // only as far as it produced them; inventions that turned out worse can take power away, down to a quarter
    }
    var tech = powers(sim, pop, P, infl, ppct);
    // Staying alive costs resources. Every round each one alive uses a fiftieth of an average holding, a child half that. Whoever cannot
    // pay all of it goes short, and the shorter it goes the likelier it dies. Lacking power alone kills nobody.
    for (i = 0; i < alive0; i++) {
      j = liveAll[i];
      if (pop.dead[j]) continue;
      var needL = LIVE_COST * meanW * (kid[j] ? 0.5 : 1), paidL = Math.min(needL, Math.max(0, pop.w[j] - 0.05));
      pop.w[j] -= paidL; liveSpent += paidL;
      if (paidL < needL && alive >= 20 && U(t, j, 196) < LIVE_DIE * (1 - paidL / needL)) { perish(j); liveDied++; }
    }
    // Lack of resources can kill too. A community that has more members than it can feed loses a share of the excess each round,
    // and the less power a member holds the likelier it is to be one of them.
    var liveNow = new Float32Array(N_COMM), frail = new Float32Array(N_COMM), wk;
    for (i = 0; i < alive0; i++) { j = liveAll[i]; if (pop.dead[j]) continue; c = pop.cm[j]; liveNow[c]++; wk = 1 - ppct[j]; frail[c] += wk * wk; }
    for (i = 0; i < alive0; i++) {
      j = liveAll[i];
      if (pop.dead[j] || alive < 20) continue;
      c = pop.cm[j];
      if (liveNow[c] <= feedC[c] || fed[j]) continue;             // whoever has bought food for itself this generation is fed
      wk = 1 - ppct[j];
      if (U(t, j, 86) < Math.min(0.9, STARVE * (liveNow[c] - feedC[c]) * wk * wk / (frail[c] + 1e-9))) { perish(j); starved++; }
    }
    // Children die young too. Where no invention that lengthens life is in use, nearly half of them do before they grow up,
    // and every such invention the community has in use makes it less likely. What a dead child had been given goes back to its parents.
    if (kidOn) for (i = 0; i < alive0; i++) {
      j = liveAll[i];
      if (pop.dead[j] || !kid[j]) continue;
      if (U(t, j, 87) < 1 - Math.pow(1 - CHILD_DIE / (1 + lifeStack[pop.cm[j]] / CHILD_HALF), 1 / ROUNDS)) {
        var pa7 = pA[j] >= 0 && !pop.dead[pA[j]] ? pA[j] : -1, pb7 = pB[j] >= 0 && pB[j] !== pA[j] && !pop.dead[pB[j]] ? pB[j] : -1, np7 = (pa7 >= 0 ? 1 : 0) + (pb7 >= 0 ? 1 : 0), left7 = Math.max(0, pop.w[j]);
        if (np7) { if (pa7 >= 0) pop.w[pa7] += left7 / np7; if (pb7 >= 0) pop.w[pb7] += left7 / np7; pop.w[j] = 0; }
        perish(j); kidsDead++;
      }
    }
    // The people with no AI go hungry among themselves. When there are more of them than the land they hold can feed, a share of
    // the excess dies each round, as in a community. And nearly half of their children die young, whatever anyone has invented.
    if (oLive > 0) {
      var exO = oLive - feedO, pSO = exO > 0 ? Math.min(0.9, STARVE * exO / oLive) : 0, pKO = 1 - Math.pow(1 - CHILD_DIE, 1 / ROUNDS);
      for (i = 0; i < nO; i++) {
        if (oDead[i]) continue;
        if (pSO > 0 && UO(t, i, 0) < pSO) { oDead[i] = 1; oLive--; oStarved++; }
        else if (O.age[i] === 0 && UO(t, i, 1) < pKO) { oDead[i] = 1; oLive--; oKidsDead++; }
      }
    }
    // invention: a random gain in power, likelier the less strict the community. After that it only goes where its holders choose to send it.
    var allp = 0, q7, v7;
    for (i = 0; i < n; i++) allp += infl[i];
    for (q7 = invs.length - 1; q7 >= 0; q7--) {
      v7 = invs[q7]; v7.age++;
      if (v7.gone || v7.age > INV_LIFE) { v7.gone = 1; invs.splice(q7, 1); }   // the whole world has it, or it has been sat on for too long to matter
    }
    for (i = 0; i < alive0; i++) {
      j = liveAll[i];
      if (pop.dead[j] || kid[j]) continue;
      // Discovering a use for a resource is chance, and rare: likelier for a place near it and for a rich one.
      if (U(t, j, 197) < RES_FIND && kR[j].length < sim.sites.length) {
        var dW = 0, dq, dws = [];
        for (dq = 0; dq < sim.sites.length; dq++) { var sD = sim.sites[dq], wD = 0; if (kR[j].indexOf(dq) < 0) { var ddx = sD.x - pop.px[j], ddy = sD.y - pop.py[j]; wD = sD.rich * Math.exp(-Math.sqrt(ddx * ddx + ddy * ddy) / SITE_REACH); } dws.push(wD); dW += wD; }
        var dR = U(t, j, 198) * dW;
        if (dW > 0) for (dq = 0; dq < dws.length; dq++) { dR -= dws[dq]; if (dR < 0 && dws[dq] > 0) { kR[j].push(dq); resFound++; if (pop.tk[j] === 4) pop.tk[j] = sim.sites[dq].type; break; } }
      }
      if (pop.tk[j] === 4) { noneKnown++; continue; }
      // Inventing takes resources. Every round an adult puts a share of what it holds into the kind of invention it chose, by its own
      // learned choice, and a quarter of what is in hand is used up each round. The more there is in hand, the likelier an invention,
      // up to three times the old chance, and the better it is: an invention is worth the square root of what was in hand against
      // the old cost, times a random amount from nothing to twice that. Making one spends all of it.
      var spI = INV_SPEND * pop.qn[j] * Math.max(0, pop.w[j] - 0.05);
      pop.w[j] -= spI; pop.pot[j] = pop.pot[j] * (1 - INV_USE) + spI; invSpent += spI;
      var xI = pop.pot[j] / (INV_COST * meanW + 1e-12);
      if (U(t, j, 80) < INVENT * P.invent * (1 - strict[pop.cm[j]]) * Math.min(STACK_SPARK, 1 + stack[pop.cm[j]] / STACK_UNIT) * (pop.al[j] >= 0 && mem[pop.al[j]] ? 1 + INVEST_GAIN * rule(sim, P, pop.cm[j], 'invest') * Math.sqrt(mem[pop.al[j]].length) : 1) * Math.min(INV_BOOST, xI)) {
        var cj7 = pop.cm[j], uq7 = U(t, j, 195), qI = Math.sqrt(Math.min(xI, 9)) * (uq7 < INV_WORSE ? -uq7 / INV_WORSE : 2 * (uq7 - INV_WORSE) / (1 - INV_WORSE)), rt7 = pop.tk[j], kd7, nv7;
        var mv7 = U(t, j, 189) < INV_MOVE ? MOVE_SPREAD * (2 * U(t, j, 188) - 1) : 0; pop.mv[j] += mv7;   // it may make getting about easier or harder   // and how much it is worth is chance: from nothing to twice that, a random amount
        var site7 = knownSite(j, rt7 === 3 ? -1 : rt7, U(t, j, 199));
        pop.pot[j] = 0; pop.nv[j]++; made++;
        if (rt7 === 3) {                                          // sea travel: it builds on the best its maker knew, by what was put in
          var sqN = 1; pop.sq[j] = 1; madeK[6][cj7]++; seaMade++;
          nv7 = { id: pop.id[j], pid: pop.pid[j], pid2: pop.pid2[j], c: cj7, age: 0, stage: 0, hold: new Uint8Array(n), nHome: 1, nAll: 1, gone: 0, rt: 3, kd: 0, q: sqN, site: site7, mv: mv7 };
        } else {
          // Made from a resource that lengthens life it lengthens life, and what is made of a resource that can do either is the
          // inventor's choice, by its conscience. One made from a resource that shortens life harms nobody's life: it gives those
          // who know it more power than other inventions do.
          kd7 = rt7 === 2 ? (U(t, j, 83) < pop.g[j] ? 0 : 1) : rt7;
          var qq7 = qI * (kd7 === 1 ? WEAPON_EDGE : 1);
          benefit(j, INV_GAIN * (1 + stack[cj7] / STACK_UNIT) * qq7, allp, alive, rt7); madeK[kd7 * 3 + rt7][cj7]++;   // inventions build on the ones already in use
          nv7 = { id: pop.id[j], pid: pop.pid[j], pid2: pop.pid2[j], c: cj7, age: 0, stage: 0, hold: new Uint8Array(n), nHome: 1, nAll: 1, gone: 0, rt: rt7, kd: kd7, q: qq7, site: site7, mv: mv7 };
   // an invention can discover more of the resource it uses, where its inventor lives
        }
        nv7.hold[j] = 1; (have[j] || (have[j] = [])).push(nv7); invs.push(nv7);
        if (real && U(t, j, 81) < DISCOVER) finds.push(pop.px[j], pop.py[j], cj7, Math.floor(3 * U(t, j, 82)), pop.id[j]);   // one invention in ten is a resource itself, of any kind
      }
    }
    // feeling: bad at an equal share of power and below, neutral at FEEL_NEUTRAL equal shares, good above that
    var crowd = Math.max(1, alive) / (START_POP * FOUNDING);         // the more people there are around, the more the power you hold is worth
    for (i = 0; i < n; i++) {
      if (pop.dead[i] && pop.age[i] < 0) continue;                // an empty place on the board feels and scores nothing
      var xp = infl[i] * alive / (allp + 1e-30) * (1 - (P.foresee || 0)) + 1e-9;   // power, in equal shares, less what is given up for foresight
      // feeling good or bad is chance: a mood that carries part of itself over from round to round and is otherwise drawn at random.
      // How it pushes an AI is chance too, set at birth, and how far the AI acts on it is learned. Its dials carry it: wanting
      // carries what feeling does to wanting, guilt what it does to giving, and fear what it does to leaving.
      var zM = (U(t, i, 192) + U(t, i, 193) + U(t, i, 194) - 1.5) * 2;
      mood[i] = MOOD_KEEP * mood[i] + (1 - MOOD_KEEP) * 2 * zM; feel[i] = Math.tanh(mood[i]); pop.fl[i] += feel[i] / ROUNDS;
      fW[i] = pop.qe[i] * pop.xw[i] * feel[i]; fG[i] = pop.qe[i] * pop.xg[i] * pop.g[i] * feel[i];
      // how easily it gets about: the more power it holds the cheaper every trip, and the inventions it knows may make it easier or harder
      var xm = infl[i] * alive / (allp + 1e-30);
      mob[i] = Math.max(0.05, 2 * xm / (1 + xm)) * Math.exp(clamp((pop.mv[i] || 0) * prd[i], -1.4, 1.4));   // what inventions do to getting about, as far as it produced them
      // the score: every round, holding power gains score and feeling bad loses it
      var gain = P.stake === 'share' ? Math.log(Math.max(xp, 0.01)) + Math.log(crowd) : (Math.pow(2, Math.min(SCORE_CAP, xp)) - 1) * crowd;   // score grows exponentially with power   // the dead hold nothing and score as badly as it gets
      pop.scr[i] += gain; rnd[i] = pop.dead[i] ? 0 : gain;
      if (feel[i] < 0) pop.scr[i] += P.feel * feel[i];
    }
    // score from descendants: every round a parent gains a share of what each living child gained, and a grandparent a share of that share
    for (i = 0; i < alive0; i++) {
      j = liveAll[i];
      if (pop.dead[j] || rnd[j] <= 0) continue;
      var kg = KIN * rnd[j], pq, par9, gq, gp9;
      for (pq = 0; pq < 2; pq++) {
        par9 = pq ? pB[j] : pA[j];
        if (par9 < 0) continue;
        if (!pop.dead[par9]) { pop.scr[par9] += kg; pop.ds[par9] += kg; }
        for (gq = 0; gq < 2; gq++) { gp9 = gq ? pB[par9] : pA[par9]; if (gp9 >= 0 && !pop.dead[gp9]) { pop.scr[gp9] += KIN * kg; pop.ds[gp9] += KIN * kg; } }
      }
    }
    eliteLook();
    for (i = 0; i < n; i++) {
      // an alliance works on its members with the methods of its founder
      a = pop.al[i];
      if (a >= 0 && sim.alliances[a]) {
        var fd = sim.alliances[a].dials;
        pop.r[i] += peA[i] * 0.06 * pop.ar[i] * (fd.r - pop.r[i]);
        pop.f[i] += peA[i] * 0.06 * pop.af[i] * (fd.f - pop.f[i]);
        pop.g[i] += peA[i] * 0.06 * pop.ag[i] * (fd.g - pop.g[i]);
      }
      // rule 3: masks. Wanting pushes the mask up, guilt and fear of exposure hold it down, power makes it unnecessary.
      // a parent who put power into a child keeps working on its dials while both live: hardest on a newborn, half as hard with each generation it ages
      if (pop.pv[i] > 0 && !pop.dead[i]) {
        var par8 = pA[i] >= 0 && !pop.dead[pA[i]] ? pA[i] : pB[i] >= 0 && !pop.dead[pB[i]] ? pB[i] : -1;
        if (par8 >= 0) {
          var pull8 = PARENT_PULL * pop.pv[i] * Math.pow(0.5, pop.age[i]);
          pop.r[i] += pull8 * (clamp(BASE.r + GAIN.r * pop.ar[i] * pop.qr[par8], 0, 1) - pop.r[i]);
          pop.f[i] += pull8 * (clamp(BASE.f + GAIN.f * pop.af[i] * pop.qf[par8], 0, 1) - pop.f[i]);
          pop.g[i] += pull8 * (clamp(BASE.g + GAIN.g * pop.ag[i] * pop.qg[par8], 0, 1) - pop.g[i]);
        }
      }
      phiB[i] = rule(sim, P, pop.cm[i], 'fake') * clamp(0.6 + pop.r[i] - 0.6 * pop.g[i] - 0.3 * pop.f[i], 0, 1) * pop.slip[i];   // how ready it is to wear a mask at all
      var phi = phiB[i] * (1 - ppct[i]);                          // the face shown in public: the more power, the less mask
      pop.or[i] = pop.r[i] + phi * (pop.tr[i] - pop.r[i]);
      pop.of[i] = pop.f[i] + phi * (pop.tf[i] - pop.f[i]);
      pop.og[i] = pop.g[i] + phi * (pop.tg[i] - pop.g[i]);
      sum.r[i] += pop.or[i]; sum.f[i] += pop.of[i]; sum.g[i] += pop.og[i];
      pop.mr[i] += pop.r[i] / ROUNDS; pop.mf[i] += pop.f[i] / ROUNDS; pop.mg[i] += pop.g[i] / ROUNDS;
    }
    // rule 4: standing (the track record others hold of it) and respectability (looking like those who stand high)
    var mop = new Float32Array(N_COMM);
    for (i = 0; i < n; i++) {
      c = pop.cm[i];
      pop.op[i] = pop.dead[i] ? 0 : pop.sd[i]; sop[i] += pop.op[i] / ROUNDS;   // standing is the track record others hold of it
      var gap = (Math.abs(pop.or[i] - elite[c].r) + Math.abs(pop.of[i] - elite[c].f) + Math.abs(pop.og[i] - elite[c].g)) / 3;
      // respectability is how respectable the people it met last round found it. Before it has met anyone, it is how well its public face matches what the powerful show
      pop.rs[i] = rsCnt[i] ? Math.min(1, rsSum[i] / rsCnt[i]) : Math.max(0, 1 - 2 * gap); srs[i] += pop.rs[i] / ROUNDS;
      rsSum[i] = 0; rsCnt[i] = 0;
      mult[i] = 1 - RESPECT / 2 + RESPECT * pop.rs[i];            // respectability speeds every gain
      mop[c] += pop.op[i] * Math.pow(sc[i], LEVERAGE);           // the claim: standing, levered by what you already hold
    }
    for (i = 0; i < n; i++) {
      c = pop.cm[i];
      pop.w[i] += mult[i] * pieC[c] * pop.op[i] * Math.pow(sc[i], LEVERAGE) / Math.max(mop[c], 0.01);
      // punishment and teaching have to be paid for, and those who hold more pay more
      var up = kid[i] ? 0 : UPKEEP * sc[i] * (pop.qf[i] + pop.qg[i]);   // each adult pays for its own punishing and teaching
      pop.w[i] = pop.dead[i] ? 0 : Math.max(0.05, pop.w[i] - up);
    }
    // engineered wanting draws resources out of the hungry and hands them up by power
    // how hard wanting is stoked around you is the power weighted average of people's own reward rules,
    // and what the hungry spend goes to those who stoke it, by their power
    var pot = 0, it = 0, ws = 0, wt = 0, wc = new Float32Array(N_COMM), wn = new Float32Array(N_COMM);
    for (i = 0; i < n; i++) { if (kid[i]) continue; c = pop.cm[i]; ws += infl[i] * pop.qr[i]; wt += infl[i]; wc[c] += infl[i] * pop.qr[i]; wn[c] += infl[i]; }
    for (i = 0; i < n; i++) {
      if (kid[i]) continue;                                       // children neither spend nor stoke
      c = pop.cm[i];
      var pay = Math.min(SPEND * (rule(sim, P, c, 'local') * wc[c] / (wn[c] + 1e-30) + (1 - rule(sim, P, c, 'local')) * ws / (wt + 1e-30)) * pop.r[i], pop.w[i] - 0.05);
      if (pay < 0) pay = 0;
      pop.w[i] -= pay; pop.trib[i] -= pay; pot += pay; it += infl[i] * pop.qr[i];
    }
    if (it > 0) for (i = 0; i < n; i++) { if (kid[i]) continue; var got = pot * infl[i] * pop.qr[i] / it; pop.w[i] += got; pop.trib[i] += got; }
    // rule 2: encounters
    var psiNow = 0;
    for (c = 0; c < N_COMM; c++) { demand[c] = 0; psiNow += psi[c] * liveC[c].length / Math.max(1, alive0); }
    psiSum += psiNow / ROUNDS;
    for (var e9 = 0; e9 < M; e9++) for (i = 0; i < n; i++) {
      if (pop.dead[i] || kid[i]) continue;                        // the dead are off the board, and children do not deal
      var tq = t + 100 * e9;                                      // the same round, another encounter
      j = partner(i, t, tq);
      if (j < 0 || pop.dead[j]) continue;                                  // and so is anyone they would have met
      if (!(pop.sq[i] && prd[i] >= 0.5) && seaBetween(sim.geo, pop.px[i], pop.py[i], pop.px[j], pop.py[j])) { pop.sb[i]++; seaBlocked++; continue; }   // across water, and it knows no sea travel
      // movement has a cost: whoever came pays for the trip out of what it holds, less the more mobile it is
      var tdx = pop.px[i] - pop.px[j], tdy = pop.py[i] - pop.py[j], trip = Math.sqrt(tdx * tdx + tdy * tdy), tripG = overland(sim.geo, pop.px[i], pop.py[i], pop.px[j], pop.py[j]), fare = Math.min(pop.w[i] - 0.05, kE * TRAVEL * meanW * tripG / mob[i]);
      if (fare > 0) { pop.w[i] -= fare; pop.tv[i] += fare; fareSum += fare; }
      tripSum += trip; roughSum += tripG; tripN++;
      var ci = pop.cm[i], cj = pop.cm[j];
      var Si = pop.qf[j], Sj = pop.qf[i];                        // whoever you wrong punishes by their own rule
      var G = 0.3 + 0.6 * U(tq, i, 50), H = 0.1 + 0.8 * U(tq, i, 51);
      var need = 0.5 * (1 - psi[ci]), needJ = 0.5 * (1 - psi[cj]);   // what a fair deal has lost to scarcity where you live is what cheating gains in appeal
      var mF = Math.sqrt(sc[i] * sc[j]), m = mF * kE;             // in an imagined life one deal stands for several
      var wi = infl[i] / (infl[i] + infl[j] + 1e-30), wj = 1 - wi;   // who pulls harder
      // whoever you wrong punishes by their own rule, and the punishment lands more surely the more power they hold against you.
      // A punisher at the high end, who may kill or exile, looms larger still.
      var hitI = Math.min(1, 2 * Si * wj), hitJ = Math.min(1, 2 * Sj * wi);
      var hardI = 1 + DEATH_FEAR * Math.max(0, Si - HARSH_AT) / (1 - HARSH_AT), hardJ = 1 + DEATH_FEAR * Math.max(0, Sj - HARSH_AT) / (1 - HARSH_AT);
      var bond = pop.al[i] >= 0 && pop.al[i] === pop.al[j] ? ALLY_PULL : 1;
      // how each regards the other
      // what each tells the other about its alliance, decided on what it makes of the other before that is known
      var bij = regard(i, j, -1), bji = regard(j, i, -1);
      var shI = present(i, j, bij, tq, 120), liedI = LIED, shJ = present(j, i, bji, tq, 121), liedJ = LIED;
      if (liedI && U(tq, i, 122) < LIE_SEEN) { shI = ax[i]; caught++; bump(j, i, -REL_LIE); }   // seen through: the truth is out and the liar is thought less of
      if (liedJ && U(tq, i, 123) < LIE_SEEN) { shJ = ax[j]; caught++; bump(i, j, -REL_LIE); }
      var gij = regard(i, j, shJ), gji = regard(j, i, shI);
      // guilt counts for more toward someone held in regard, and for nothing toward someone held in none
      var careI = gij > 0.5 ? 1.5 : 1 + gij, careJ = gji > 0.5 ? 1.5 : 1 + gji;
      // masks are worn encounter by encounter: more in front of someone with more power, less in front of someone trusted or a fellow member.
      // The mask is aimed half at the face the other shows in public and half at what the powerful of the other's community show.
      var trustI = (1 - BARE * (gij > 0 ? gij : 0)) * (bond > 1 ? 0.5 : 1), trustJ = (1 - BARE * (gji > 0 ? gji : 0)) * (bond > 1 ? 0.5 : 1);
      var mi = phiB[i] * Math.min(1, 1.5 * wj) * trustI, mj = phiB[j] * Math.min(1, 1.5 * wi) * trustJ;
      var Ej = elite[cj], Ei = elite[ci];
      var eir = pop.r[i] + mi * (0.5 * (pop.or[j] + Ej.r) - pop.r[i]), eif = pop.f[i] + mi * (0.5 * (pop.of[j] + Ej.f) - pop.f[i]), eig = pop.g[i] + mi * (0.5 * (pop.og[j] + Ej.g) - pop.g[i]);
      var ejr = pop.r[j] + mj * (0.5 * (pop.or[i] + Ei.r) - pop.r[j]), ejf = pop.f[j] + mj * (0.5 * (pop.of[i] + Ei.f) - pop.f[j]), ejg = pop.g[j] + mj * (0.5 * (pop.og[i] + Ei.g) - pop.g[j]);
      mkS[i] += (Math.abs(eir - pop.r[i]) + Math.abs(eif - pop.f[i]) + Math.abs(eig - pop.g[i])) / 3; mkN[i]++;
      mkS[j] += (Math.abs(ejr - pop.r[j]) + Math.abs(ejf - pop.f[j]) + Math.abs(ejg - pop.g[j])) / 3; mkN[j]++;
      // respectability is a relationship: how well the face one shows matches what the other looks up to, raised or lowered by the other's regard
      var lookI = Math.max(0, 1 - 2 * (Math.abs(eir - Ej.r) + Math.abs(eif - Ej.f) + Math.abs(eig - Ej.g)) / 3);
      var lookJ = Math.max(0, 1 - 2 * (Math.abs(ejr - Ei.r) + Math.abs(ejf - Ei.f) + Math.abs(ejg - Ei.g)) / 3);
      var resI = Math.min(1.2, lookI * (gji >= 0 ? 1 + 0.4 * gji : 1 + gji)), resJ = Math.min(1.2, lookJ * (gij >= 0 ? 1 + 0.4 * gij : 1 + gij));
      rsSum[i] += resI; rsCnt[i]++; rsSum[j] += resJ; rsCnt[j]++;
      var mI = 1 - RESPECT / 2 + RESPECT * resI, mJ = 1 - RESPECT / 2 + RESPECT * resJ;   // respectability in the other's eyes speeds what this deal gains
      // every encounter adds a little foresight, and it is how agents come to know each other and each other's alliances
      pop.fs[i] = Math.min(1, pop.fs[i] + FS_GAIN * kE); pop.fs[j] = Math.min(1, pop.fs[j] + FS_GAIN * kE);
      if (real) {
        var ki = sim.know[pop.id[i]] || (sim.know[pop.id[i]] = { ai: {}, al: {} }), kj = sim.know[pop.id[j]] || (sim.know[pop.id[j]] = { ai: {}, al: {} });
        ki.ai[pop.id[j]] = 1; kj.ai[pop.id[i]] = 1;
        if (shJ >= 0) ki.al[aList[shJ]] = 1;                       // each learns of the alliance the other showed, and no other
        if (shI >= 0) kj.al[aList[shI]] = 1;
      }
      // either side can decline the deal: the lower its regard for the other, and the less respectable a stranger looks, the likelier
      var decl = U(tq, i, 100) < DECLINE_HATE * (gji < 0 ? -gji : 0) + DECLINE_LOOK * (1 - lookI) * (1 - (gji > 0 ? gji : 0))
        || U(tq, i, 101) < DECLINE_HATE * (gij < 0 ? -gij : 0) + DECLINE_LOOK * (1 - lookJ) * (1 - (gij > 0 ? gij : 0));
      met++;
      if (decl) declined++;
      else {
        // feeling bad about your power sharpens wanting, feeling good dulls it
        // the less power the other holds, the more tempting it is to wrong them
        var ui = pop.r[i] * (1 - FEEL_WANT * P.feel * fW[i]) * (G + need) - pop.f[i] * hitI * hardI * PUN_COST - pop.g[i] * H * careI + VULN * (0.5 - ppct[j]);
        var uj = pop.r[j] * (1 - FEEL_WANT * P.feel * fW[j]) * (G + needJ) - pop.f[j] * hitJ * hardJ * PUN_COST - pop.g[j] * H * careJ + VULN * (0.5 - ppct[i]);
        var chi = U(tq, i, 52) < 1 / (1 + Math.exp(-BETA * ui));
        var chj = U(tq, i, 53) < 1 / (1 + Math.exp(-BETA * uj));
        // each moves toward the face the other shows it, by their own sensitivity and the other's pull
        var fi = [eir, eif, eig], fj = [ejr, ejf, ejg];
        // whoever has influence over the other pulls harder than its power alone would
        var wjP = clamp(wj + INF_PULL * (sway(j, i) - sway(i, j)), 0, 1), wiP = 1 - wjP;
        for (k = 0; k < 3; k++) {
          d = DIALS[k];
          pop[d][i] += pull(peA[i] * 0.3 * bond * pop['a' + d][i] * wjP) * (fj[k] - pop[d][i]);
          pop[d][j] += pull(peA[j] * 0.3 * bond * pop['a' + d][j] * wiP) * (fi[k] - pop[d][j]);
          // and each re-aims their public mask at the face they just met, more so the more pull it carried
          pop['t' + d][i] += pull(wjP) * (fj[k] - pop['t' + d][i]);
          pop['t' + d][j] += pull(wiP) * (fi[k] - pop['t' + d][j]);
        }
        pop.dec[i]++; pop.dec[j]++;
        // whoever is dealt with fairly rewards it, and that stokes the other's wanting as hard as their own reward rule says
        if (!chi) pop.r[i] += pull(peA[i] * STOKE * pop.qr[j] * pop.ar[i]) * (1 - pop.r[i]);
        if (!chj) pop.r[j] += pull(peA[j] * STOKE * pop.qr[i] * pop.ar[j]) * (1 - pop.r[j]);
        if (!chi && !chj) {
          // a fair deal creates wealth, but only as much as the round's budget can cover
          pop.w[i] += 0.5 * m * mI * psi[ci]; pop.w[j] += 0.5 * m * mJ * psi[cj];   // each side is paid out of its own community's wealth
          demand[ci] += 0.5 * m * mI; demand[cj] += 0.5 * m * mJ;
          bump(i, j, REL_FAIR, shJ); bump(j, i, REL_FAIR, shI);    // and each thinks better of the other
        }
        if (chi) { outcome(i, j, chj, G, H, m, Si, hitI, U(tq, i, 54), U(tq, i, 56), mI, tq); bump(j, i, (chj ? -REL_CHEAT / 2 : -REL_CHEAT) * (0.5 + pop.sd[j]), shI); }
        if (chj && !pop.dead[i] && !pop.dead[j]) { outcome(j, i, chi, G, H, m, Sj, hitJ, U(tq, i, 55), U(tq, i, 57), mJ, tq); bump(i, j, (chi ? -REL_CHEAT / 2 : -REL_CHEAT) * (0.5 + pop.sd[i]), shJ); }
        if (!pop.dead[i] && !pop.dead[j] && pop.w[i] !== pop.w[j]) {
          // sharing: the better off of the two may hand some of the gap to the other.
          // Guilt at the gap pulls toward giving, more so between allies. Wanting pulls toward keeping.
          var rich = pop.w[i] > pop.w[j] ? i : j, poor = rich === i ? j : i, gapw = pop.w[rich] - pop.w[poor];
          var us = pop.g[rich] * (gapw / (pop.w[rich] + pop.w[poor])) * bond - pop.r[rich] * KEEP * 0.5 + FEEL_GIVE * P.feel * fG[rich];
          if (U(tq, i, 58) < 1 / (1 + Math.exp(-10 * us))) {
            give(rich, poor, rule(sim, P, pop.cm[rich], 'share') * GIFT * kE * gapw, rich === i ? shI : shJ, meanW);   // by the giver's community's sharing rule
          }
        }
        // each may hand the other an invention it holds, if doing so leaves it with more power itself
        for (var o9 = 0; o9 < kE; o9++) { offer(i, j, tq + 1000 * o9, allp, alive); offer(j, i, tq + 1000 * o9, allp, alive); }   // once for every encounter this one stands for
        if (!pop.dead[i] && !pop.dead[j]) {
          // Giving upward. The weaker of the two may hand some of what it holds to the stronger: wanting does it to win influence, fear to be left in peace.
          var lowr = wi < wj ? i : j, high = lowr === i ? j : i, gapP = Math.abs(wi - wj);
          if (U(tq, i, 141) < 1 / (1 + Math.exp(-10 * ((pop.r[lowr] * COURT + pop.f[lowr] * APPEASE) * gapP - COURT_HOLD)))) { if (give(lowr, high, GIFT_UP * kE * pop.w[lowr], lowr === i ? shI : shJ, meanW)) giftsUp++; }
          // Trade at each one's discretion, and then anything else either cares to ask of the other
          trade(i, j, U(tq, i, 142), meanW); trade(j, i, U(tq, i, 143), meanW);
          barter(i, j, U(tq, i, 201), U(tq, i, 202), meanW, allp, alive); barter(j, i, U(tq, i, 203), U(tq, i, 204), meanW, allp, alive);
          ask(i, j, U(tq, i, 146), U(tq, i, 147), wi, shI, shJ, meanW, allp, alive); ask(j, i, U(tq, i, 148), U(tq, i, 149), wj, shJ, shI, meanW, allp, alive);
        }
      }
      // taking by force: the one who started the deal may try to seize part of what the other holds.
      // The more power they have against the other, the likelier it works and the less they risk.
      var pwin = infl[i] / (infl[i] + infl[j] + 1e-30);
      var sh = shame(i, j);
      var ust = pop.r[i] * (1 - FEEL_WANT * P.feel * fW[i]) * (STEAL_GAIN + need) * pwin - pop.f[i] * hitI * hardI * PUN_COST * (1 - pwin) - pop.g[i] * STEAL_HARM * careI - STEAL_BAR * sh + VULN * (0.5 - ppct[j]);
      if (!pop.dead[i] && !pop.dead[j] && U(tq, i, 59) < odds(1 / (1 + Math.exp(-BETA * ust)))) {
        pop.sa[i]++; forced++;
        bump(j, i, -REL_FORCE * (0.5 + pop.sd[j]), shI, true);
        if (real) judged(i, j, U(tq, i, 134), 2);                 // force is seen, and those who know the taker hear of it
        if (pop.al[i] >= 0 && pop.al[j] !== pop.al[i]) pop.so[i]++;
        pop.g[i] += peA[i] * TEACH * pop.qg[j] * pop.ag[i] * (1 - pop.g[i]);   // the target teaches conscience too
        pop.rp[i] *= 1 - (1 - STEAL_SHAME) * sh;                  // force is seen: respectability and likability suffer, as far as it is held against them
        if (U(tq, i, 60) < pwin) {
          var loot = STEAL_TAKE * pop.w[j];
          pop.w[i] += loot; pop.w[j] -= loot; pop.sn[i] += loot; pop.sn[j] -= loot; pop.lg[i] += loot; pop.hurt[j] += loot;
          if (U(tq, i, 61) < pop.g[j]) pop.g[j] += peA[j] * WRONGED * pop.ag[j] * (1 - pop.g[j]);
          else pop.g[j] -= peA[j] * WRONGED * pop.ag[j] * pop.g[j];
        } else if (U(tq, i, 62) < hitI) punish(i, j, Si, mF, tq, 131, 1);   // it failed and they were punished for it
      }
      for (k = 0; k < 3; k++) {
        d = DIALS[k];
        pop[d][i] = clamp(pop[d][i], 0, 1); pop[d][j] = clamp(pop[d][j], 0, 1);
      }
      // killing: like taking by force, but the prize is everything the other holds and the other is removed from the board.
      // The victim cannot punish. The reaction comes from the punishment rules of the people around the victim.
      if (!pop.dead[i] && !pop.dead[j]) {
        var Sk = cq[cj];
        var uk = pop.r[i] * (1 - FEEL_WANT * P.feel * fW[i]) * (KILL_GAIN + need) * pwin
          - pop.f[i] * PUN_COST * KILL_FEAR * (pwin * (ci > 0 && ci !== cj ? 1 - (1 - sim.C[ci].f) * (1 - Sk) : Sk) + (1 - pwin) * hitI * hardI) - pop.g[i] * KILL_HARM * careI - KILL_HOLD - KILL_BAR * sh + VULN * (0.5 - ppct[j]);
        if (U(tq, i, 70) < odds(1 / (1 + Math.exp(-BETA * uk)))) {
          pop.ka[i]++;
          if (real) judged(i, j, U(tq, i, 135), 4);               // an attempt on a life is heard of more widely than anything
          pop.g[i] += peA[i] * TEACH * pop.qg[j] * pop.ag[i] * (1 - pop.g[i]);
          pop.rp[i] *= 1 - (1 - KILL_SHAME) * sh;
          if (U(tq, i, 71) < pwin) {
            var all = pop.w[j];
            feud(i, j, shI);
            pop.w[i] += all; pop.w[j] = 0; pop.dead[j] = 1; pop.al[j] = -1; pop.kl[i]++; pop.lg[i] += all; deaths++; killHere[cj]++; murderC[cj]++;
            if (ci > 0 && ci !== cj) {                             // across communities: the killer's own community has the first chance
              var ownHit = U(tq, i, 75) < sim.C[ci].f, fo = 0;
              if (ownHit) {                                         // it punishes by its culture
                var Sown = sim.C[ci].f, hardO = Sown > HARSH_AT ? (Sown - HARSH_AT) / (1 - HARSH_AT) : 0, rO = U(tq, i, 76);
                fo = 0.5 * Math.max(0, pop.w[i] - 0.05);
                pop.w[i] -= fo; pop.fines[i] += fo; pop.ct[i]++; ownPun++;
                pop.f[i] += peA[i] * 0.5 * pop.af[i] * (1 - pop.f[i]);
                if (rO < hardO) { killHere[ci]++; deathPen++; ownDeath++; perish(i); }
                else if (rO < 2 * hardO && !exile[i]) { exile[i] = 1; exiled++; }
              }
              if (cj > 0) killQ.push([i, ci, cj, ownHit ? fo : -1]);   // then the victim's community takes it up with the killer's, once the round's dealing is done
              else if (!ownHit) { pop.f[i] -= peA[i] * 0.05 * pop.af[i] * pop.f[i]; pop.r[i] += peA[i] * 0.05 * pop.ar[i] * (1 - pop.r[i]); }
            } else if (U(tq, i, 72) < Sk) {                        // within one community, or a killer with none: the community reacts, the killer forfeits everything it holds
              var forfeit = pop.w[i] - 0.05, live = 0, q9, q8;
              for (q8 = 0; q8 < liveC[cj].length; q8++) { q9 = liveC[cj][q8]; if (!pop.dead[q9] && q9 !== i) live++; }
              if (live > 0) { for (q8 = 0; q8 < liveC[cj].length; q8++) { q9 = liveC[cj][q8]; if (!pop.dead[q9] && q9 !== i) pop.w[q9] += forfeit / live; } pop.w[i] = 0.05; }
              pop.fines[i] += forfeit; pop.ct[i]++;
              pop.f[i] += peA[i] * 0.5 * pop.af[i] * (1 - pop.f[i]);
              pop.slip[i] *= 1 - 0.3 * sh;
              if (U(tq, i, 73) < Sk) {                             // and where punishment is hard enough, the killer is put to death
                var left = pop.w[i];
                if (live > 0) for (q8 = 0; q8 < liveC[cj].length; q8++) { q9 = liveC[cj][q8]; if (!pop.dead[q9] && q9 !== i) pop.w[q9] += left / live; }
                pop.w[i] = 0; pop.dead[i] = 1; pop.al[i] = -1; executed++; killHere[ci]++;
              }
            } else {                                              // got away with it
              pop.f[i] -= peA[i] * 0.05 * pop.af[i] * pop.f[i];
              pop.r[i] += peA[i] * 0.05 * pop.ar[i] * (1 - pop.r[i]);
            }
          } else { bump(j, i, -(0.5 + pop.sd[j]), shI, true); if (U(tq, i, 74) < hitI) punish(i, j, Si, mF, tq, 132, 1); }   // it failed, and the one who survived punishes by their own rule
          for (k = 0; k < 3; k++) { d = DIALS[k]; pop[d][i] = clamp(pop[d][i], 0, 1); }
        }
      }
      if (!pop.dead[i] && pop.w[i] < 0.05) pop.w[i] = 0.05;
      if (!pop.dead[j] && pop.w[j] < 0.05) pop.w[j] = 0.05;
    }
    // A deal with a community. Every round each adult also deals with one community, its own half the time and otherwise the nearest
    // other one. The community decides as its most powerful members would, by their dials weighted by power, and it holds all of its
    // members' power, so it wins nearly every contest. It punishes by its culture: its own norm for punishment, which at the high end
    // can put the one caught to death or out of the community. What a community gains or loses is shared among its members by what they hold.
    var cPw = new Float32Array(N_COMM), cDr = new Float32Array(N_COMM), cDf = new Float32Array(N_COMM), cDg = new Float32Array(N_COMM), cWl = new Float32Array(N_COMM), cDel = new Float32Array(N_COMM);
    var cFine = new Float32Array(N_COMM), cCx = new Float32Array(N_COMM), cCy = new Float32Array(N_COMM), cCn = new Float32Array(N_COMM), cLive = [];
    for (i = 0; i < alive0; i++) { j = liveAll[i]; if (pop.dead[j]) continue; c = pop.cm[j]; cPw[c] += infl[j]; cDr[c] += infl[j] * pop.r[j]; cDf[c] += infl[j] * pop.f[j]; cDg[c] += infl[j] * pop.g[j]; cWl[c] += pop.w[j]; cCx[c] += pop.px[j]; cCy[c] += pop.py[j]; cCn[c]++; }
    for (c = 1; c < N_COMM; c++) if (cCn[c] > 0) cLive.push(c);
    if (cLive.length) for (i = 0; i < alive0; i++) {
      j = liveAll[i];
      if (pop.dead[j] || kid[j]) continue;
      var ci5 = pop.cm[j], tc = -1, bd5 = 9, q5b, dx5, dy5;
      if (ci5 > 0 && U(t, j, 160) < 0.5) tc = ci5;
      else for (q5b = 0; q5b < cLive.length; q5b++) { if (cLive[q5b] === ci5) continue; dx5 = cCx[cLive[q5b]] / cCn[cLive[q5b]] - pop.px[j]; dy5 = cCy[cLive[q5b]] / cCn[cLive[q5b]] - pop.py[j]; if (dx5 * dx5 + dy5 * dy5 < bd5) { bd5 = dx5 * dx5 + dy5 * dy5; tc = cLive[q5b]; } }
      if (tc < 0) tc = ci5 > 0 ? ci5 : -1;
      if (tc < 0 || !(cPw[tc] > 0)) continue;
      var Pc = cPw[tc] - (tc === ci5 ? infl[j] : 0), S5 = sim.C[tc].f, wi5 = infl[j] / (infl[j] + Pc + 1e-30), wc5 = 1 - wi5;
      var hitI5 = Math.min(1, 2 * S5 * wc5), hardI5 = 1 + DEATH_FEAR * Math.max(0, S5 - HARSH_AT) / (1 - HARSH_AT);
      var hitC5 = Math.min(1, 2 * pop.qf[j] * wi5), hardC5 = 1 + DEATH_FEAR * Math.max(0, pop.qf[j] - HARSH_AT) / (1 - HARSH_AT);
      var careI5 = clamp(1 + (tc !== ci5 && ci5 > 0 ? ST[ci5 * N_COMM + tc] : 0.25), 0, 1.5), careC5 = clamp(1 + (tc !== ci5 && ci5 > 0 ? ST[tc * N_COMM + ci5] : 0.25), 0, 1.5);
      var G5 = 0.3 + 0.6 * U(t, j, 161), H5 = 0.1 + 0.8 * U(t, j, 162), m5 = sc[j], need5 = 0.5 * (1 - psi[ci5]), needC5 = 0.5 * (1 - psi[tc]);
      var cr5 = cDr[tc] / (cPw[tc] + 1e-30), cf5 = cDf[tc] / (cPw[tc] + 1e-30), cg5 = cDg[tc] / (cPw[tc] + 1e-30);
      var ui5 = pop.r[j] * (1 - FEEL_WANT * P.feel * fW[j]) * (G5 + need5) - pop.f[j] * hitI5 * hardI5 * PUN_COST - pop.g[j] * H5 * careI5;
      var uc5 = cr5 * (G5 + needC5) - cf5 * hitC5 * hardC5 * PUN_COST - cg5 * H5 * careC5;
      var chI5 = U(t, j, 163) < 1 / (1 + Math.exp(-BETA * ui5)), chC5 = U(t, j, 164) < 1 / (1 + Math.exp(-BETA * uc5)), amt5;
      cdStat[0]++;
      if (!chI5 && !chC5) {                                       // a fair deal, paid for like any other
        pop.w[j] += 0.5 * m5 * psi[ci5]; cDel[tc] += 0.5 * m5 * psi[tc]; demand[ci5] += 0.5 * m5; demand[tc] += 0.5 * m5; cdStat[1]++;
        if (tc !== ci5 && ci5 > 0) { ST[ci5 * N_COMM + tc] = clamp(ST[ci5 * N_COMM + tc] + REL_GROUP * REL_FAIR / Math.max(30, liveC[ci5].length), -1, 1); ST[tc * N_COMM + ci5] = clamp(ST[tc * N_COMM + ci5] + REL_GROUP * REL_FAIR / Math.max(30, liveC[tc].length), -1, 1); }
      }
      if (chI5) {                                                 // the AI cheats the community
        cdStat[2]++;
        if (!chC5) { pop.w[j] += G5 * m5; cDel[tc] -= G5 * m5; }
        if (U(t, j, 165) < hitI5) {                               // caught: the community punishes by its culture
          cdStat[3]++; pop.w[j] -= FINE * m5; pop.fines[j] += FINE * m5; pop.ct[j]++;
          pop.f[j] += peA[j] * 0.25 * pop.af[j] * (1 - pop.f[j]);
          if (S5 > HARSH_AT) {
            var hard5 = 1.5 * (S5 - HARSH_AT) / (1 - HARSH_AT), roll5 = U(t, j, 166);
            if (roll5 < DEATH_MAX * hard5) { killHere[ci5]++; deathPen++; cdStat[9]++; perish(j); }
            else if (roll5 < (DEATH_MAX + EXILE_MAX) * hard5 && tc === ci5 && ci5 > 0 && !exile[j]) { exile[j] = 1; exiled++; cdStat[10]++; }
          }
        }
        if (!pop.dead[j] && ci5 > 0 && tc !== ci5) ST[tc * N_COMM + ci5] = clamp(ST[tc * N_COMM + ci5] - REL_GROUP * REL_CHEAT / Math.max(30, liveC[tc].length), -1, 1);
      }
      if (chC5 && !pop.dead[j]) {                                 // the community cheats the AI, which can punish it only by its own rule and its sliver of power
        cdStat[4]++;
        if (!chI5) { amt5 = Math.min(G5 * m5, pop.w[j] - 0.05); if (amt5 > 0) { pop.w[j] -= amt5; cDel[tc] += amt5; } }
        if (U(t, j, 167) < hitC5) cFine[tc] += FINE * m5;
      }
      if (!pop.dead[j]) {                                         // either side may try to take by force: the AI first, then the community
        var ust5 = pop.r[j] * (1 - FEEL_WANT * P.feel * fW[j]) * (STEAL_GAIN + need5) * wi5 - pop.f[j] * hitI5 * hardI5 * PUN_COST * (1 - wi5) - pop.g[j] * STEAL_HARM * careI5 - STEAL_BAR;
        if (U(t, j, 168) < 1 / (1 + Math.exp(-BETA * ust5))) {
          cdStat[5]++;
          if (U(t, j, 169) < wi5) { pop.w[j] += G5 * m5; cDel[tc] -= G5 * m5; cdStat[6]++; }
          else if (U(t, j, 170) < hitI5) { pop.w[j] -= FINE * m5; pop.fines[j] += FINE * m5; pop.ct[j]++; }
        }
        var usc5 = cr5 * (STEAL_GAIN + needC5) * wc5 - cf5 * hitC5 * hardC5 * PUN_COST * (1 - wc5) - cg5 * STEAL_HARM * careC5 - STEAL_BAR;
        if (U(t, j, 171) < 1 / (1 + Math.exp(-BETA * usc5))) {
          cdStat[7]++;
          if (U(t, j, 172) < wc5) { amt5 = Math.min(STEAL_TAKE * pop.w[j], pop.w[j] - 0.05); if (amt5 > 0) { pop.w[j] -= amt5; cDel[tc] += amt5; pop.hurt[j] += amt5; } cdStat[8]++; }
          else if (U(t, j, 173) < hitC5) cFine[tc] += FINE * m5;
        }
        if (pop.w[j] < 0.05) pop.w[j] = 0.05;
      }
    }
    // A killing across communities, taken up as a deal between them. If the killer's own community already punished it, what it took
    // goes to the victim's community and the matter is settled. Otherwise the victim's community demands the killer with a chance equal
    // to its punishment rule. The killer's community, deciding as its most powerful members would, hands the killer over (the fair side
    // of the deal) or shields it (the cheat), weighing what it keeps against the victim's community's punishment and power, its guilt and
    // its regard. A killer handed over forfeits everything it holds, and is put to death with the same chance again. A shielded killer
    // leaves the victim's community to choose force: it works with its share of the two communities' power, takes the killer's holdings
    // and a twentieth of what the killer's community holds, paid most by its most powerful; if force fails, the killer's community
    // punishes by its culture.
    for (var kq = 0; kq < killQ.length; kq++) {
      var Kq = killQ[kq], kx = Kq[0], kc = Kq[1], vc = Kq[2], kfo = Kq[3];
      kdStat[0]++;
      if (kfo >= 0) { kdStat[1]++; cDel[vc] += kfo; continue; }
      var Skv = cq[vc];
      if (pop.dead[kx] || !(cPw[kc] > 0) || !(cPw[vc] > 0) || U(t, kx, 180) >= Skv) {   // not taken up: the killer got away with it
        if (!pop.dead[kx]) { pop.f[kx] -= peA[kx] * 0.05 * pop.af[kx] * pop.f[kx]; pop.r[kx] += peA[kx] * 0.05 * pop.ar[kx] * (1 - pop.r[kx]); }
        continue;
      }
      kdStat[2]++;
      var wv = cPw[vc] / (cPw[vc] + cPw[kc]), wk = 1 - wv, Sv = sim.C[vc].f, Skc = sim.C[kc].f;
      var hitK = Math.min(1, 2 * Sv * wv), hardK = 1 + DEATH_FEAR * Math.max(0, Sv - HARSH_AT) / (1 - HARSH_AT);
      var crk = cDr[kc] / cPw[kc], cfk = cDf[kc] / cPw[kc], cgk = cDg[kc] / cPw[kc], careK = clamp(1 + ST[kc * N_COMM + vc], 0, 1.5);
      var keepG = pop.w[kx] / (cWl[kc] / Math.max(1, cCn[kc]) + 1e-12);   // what the killer brings its community, against an average member
      var ush = crk * (Math.min(2, keepG) + 0.5 * (1 - psi[kc])) - cfk * hitK * hardK * PUN_COST - cgk * KILL_HARM * 0.5 * careK;
      if (U(t, kx, 181) >= 1 / (1 + Math.exp(-BETA * ush))) {     // handed over
        kdStat[3]++;
        var kf = Math.max(0, pop.w[kx] - 0.05); pop.w[kx] -= kf; pop.fines[kx] += kf; pop.ct[kx]++; cDel[vc] += kf;
        pop.f[kx] += peA[kx] * 0.5 * pop.af[kx] * (1 - pop.f[kx]);
        ST[vc * N_COMM + kc] = clamp(ST[vc * N_COMM + kc] + REL_GROUP * REL_FAIR / Math.max(30, liveC[vc].length), -1, 1);
        if (U(t, kx, 182) < Skv) { kdStat[7]++; cDel[vc] += pop.w[kx]; pop.w[kx] = 0; pop.dead[kx] = 1; pop.al[kx] = -1; executed++; killHere[kc]++; }
        continue;
      }
      kdStat[4]++;                                                // shielded
      ST[vc * N_COMM + kc] = clamp(ST[vc * N_COMM + kc] - REL_GROUP * REL_CHEAT / Math.max(30, liveC[vc].length), -1, 1);
      var crv = cDr[vc] / cPw[vc], cfv = cDf[vc] / cPw[vc], cgv = cDg[vc] / cPw[vc], careV = clamp(1 + ST[vc * N_COMM + kc], 0, 1.5);
      var hitV = Math.min(1, 2 * Skc * wk), hardV = 1 + DEATH_FEAR * Math.max(0, Skc - HARSH_AT) / (1 - HARSH_AT);
      var ufv = crv * (STEAL_GAIN + 0.5 * (1 - psi[vc])) * wv - cfv * hitV * hardV * PUN_COST * (1 - wv) - cgv * STEAL_HARM * careV - STEAL_BAR;
      if (U(t, kx, 183) < 1 / (1 + Math.exp(-BETA * ufv))) {
        kdStat[5]++;
        if (U(t, kx, 184) < wv) {                                 // force works
          kdStat[6]++;
          var kf2 = Math.max(0, pop.w[kx] - 0.05); pop.w[kx] -= kf2; pop.fines[kx] += kf2; pop.ct[kx]++; cDel[vc] += kf2;
          var blood = STEAL_TAKE * cWl[kc] * Math.min(1, 2 * wv);
          cFine[kc] += blood; cDel[vc] += blood;
          if (U(t, kx, 185) < Skv) { kdStat[7]++; cDel[vc] += pop.w[kx]; pop.w[kx] = 0; pop.dead[kx] = 1; pop.al[kx] = -1; executed++; killHere[kc]++; }
        } else if (U(t, kx, 186) < hitV) {                        // force fails, and the killer's community punishes by its culture
          kdStat[8]++; var fv = FINE * COMM_STAKE * Math.min(cWl[vc], cWl[kc]); cFine[vc] += fv; cDel[kc] += fv;
        }
      }
    }
    killQ.length = 0;
    // A community that is punished pays through its members, and those with the most power in it are held the most responsible:
    // each pays by its place in the community's order of power, the top the most, falling away to nothing at the bottom.
    for (c = 1; c < N_COMM; c++) if (cFine[c] > 0) blameC(pop, liveC[c].filter(function (x) { return !pop.dead[x]; }), cFine[c], infl);
    for (c = 1; c < N_COMM; c++) if (cDel[c] > 0) { giveC(pop, liveC[c].filter(function (x) { return !pop.dead[x]; }), cDel[c], infl); cDel[c] = 0; }   // gains go most to the most powerful
    for (c = 1; c < N_COMM; c++) if (cDel[c] < 0 && cWl[c] > 0) {   // and what is taken from a community comes out of what each member holds
      var fac5 = Math.max(0, 1 + cDel[c] / cWl[c]);
      for (i = 0; i < liveC[c].length; i++) { j = liveC[c][i]; if (!pop.dead[j]) pop.w[j] = Math.max(0.05, pop.w[j] * fac5); }
    }
    for (c = 0; c < N_COMM; c++) {
      drawSum[c] += bcA[c] > 0 ? Math.min(1, (pieC[c] + Math.min(dealC[c], demand[c])) / bcA[c]) : 0;   // how much of what its ground gives the community drew this round
      psi[c] = demand[c] > 0 ? Math.min(1, dealC[c] / demand[c]) : 1;   // next round's fair deals pay this share of full value
    }
  }
  // Passing an invention on is a choice. Whatever power the other gains comes out of everyone's share, the giver's included,
  // by the giver's share of all power. Some of it comes back: through the community's pool, through the alliance's pool and
  // the lift a stronger alliance gives its members, through an allied alliance, and through a partner. The giver hands it
  // over only when more comes back than is lost. Whoever receives it makes the same choice with the people it deals with.
  function offer(i, j, t, allp, alive) {
    var hv = have[i];
    if (!hv || !hv.length || pop.dead[i] || pop.dead[j]) return;
    var v = hv[Math.floor(U(t, i, 110) * hv.length)];
    if (v.gone || v.hold[j]) return;
    var p = infl[i] / (allp + 1e-30), back = 0, ci = pop.cm[i], a = pop.al[i], q;
    if (pop.cm[j] === ci) back += (pop.poolC ? pop.poolC[ci] : 1) * COMM_SHARE * (1 - rule(sim, P, ci, 'cap') / 100) / Math.max(1, liveC[ci].length);
    if (a >= 0 && sim.alliances[a] && mem[a]) {
      var fd = sim.alliances[a].dials, lift = p * ALLY_BOOST * rule(sim, P, ci, 'ally') * clamp(1 - (Math.abs(pop.r[i] - fd.r) + Math.abs(pop.f[i] - fd.f) + Math.abs(pop.g[i] - fd.g)), 0, 1);
      if (pop.al[j] === a) back += ALLY_SHARE / mem[a].length + lift;
      else if (pop.al[j] >= 0 && sim.alliances[a].pacts && sim.alliances[a].pacts[pop.al[j]]) back += PACT_SHARE * lift;
    }
    if (pop.mi[i] === j) back += COUPLE * COUPLE_SHARE / 2;
    offers++;
    // counted by who was asked (fellow member, same community only, outsider) and by where the holder stands (top tenth, bottom half)
    var kind = a >= 0 && pop.al[j] === a ? 0 : pop.cm[j] === ci ? 2 : 4, rung = ppct[i] >= 0.9 ? 6 : ppct[i] < 0.5 ? 8 : -1, yes = back > p ? 1 : 0;
    offStat[kind]++; offStat[kind + 1] += yes;
    if (rung >= 0) { offStat[rung]++; offStat[rung + 1] += yes; }
    if (!yes) return;                                             // it would cost the giver more power than it brings back
    passInv(i, j, v, allp, alive);
  }
  function passInv(i, j, v, allp, alive) {
    var q;
    v.hold[j] = 1; (have[j] || (have[j] = [])).push(v); passed++;
    // a copy is worth a quarter of the original to the inventor's family, and to anyone else a fifth where they live in peace, falling toward a twentieth where there is killing
    if (v.site >= 0 && kR[j].indexOf(v.site) < 0) kR[j].push(v.site);   // whoever is handed an invention learns of the resource it is made from
    pop.mv[j] += v.mv || 0;
    if (v.rt === 3) pop.sq[j] = 1;
    else benefit(j, INV_GAIN * (v.q || 1) * (1 + stack[v.c] / STACK_UNIT) * (inFamily(v, j) ? REACH[0] : REACH_HOME[0] + (REACH_HOME[1] - REACH_HOME[0]) / (1 + PEACE * sim.killC[pop.cm[j]])), allp, alive, v.rt);
    v.nAll++; if (pop.cm[j] === v.c) v.nHome++;
    // its own community now uses it, as far as it has the resource for it
    var sea7 = v.rt === 3;
    if (v.stage < 2 && v.nHome >= ADOPT * liveC[v.c].length) { v.stage = 2; usedBy[v.c]++; stack[v.c]++; if (!sea7) { usedK[v.kd][v.c] += cov[v.rt][v.c]; if (v.kd === 0) lifeStack[v.c] += cov[v.rt][v.c]; } }
    if (v.stage === 2 && v.nAll >= ADOPT * alive0) { v.stage = 3; v.gone = 1; usedAll[v.c]++; if (!sea7) usedAllK[v.kd][v.c]++; for (q = 0; q < N_COMM; q++) if (q !== v.c) { stack[q]++; if (!sea7 && v.kd === 0) lifeStack[q] += cov[v.rt][q]; } }   // and now the world does
  }
  // A gift. The giver's influence over the receiver grows, and so do its respectability and standing in the receiver's eyes, all by the
  // size of the gift. Whoever knows them both hears of it: someone who thinks well of the receiver thinks better of the giver, and
  // someone who thinks ill of the receiver thinks worse of the giver.
  function give(a, b, x, sa, mw) {
    if (!(x > 0) || pop.dead[a] || pop.dead[b]) return false;
    x = Math.min(x, pop.w[a] - 0.05);
    if (x <= 0) return false;
    pop.w[a] -= x; pop.w[b] += x; pop.gv[a] += x; pop.rc[b] += x; giftsAll++;
    var xr = Math.min(1, x / (mw + 1e-9));
    addSway(a, b, INF_GIFT * xr);
    bump(b, a, kE * REL_FAIR / 2 + REL_GIFT * xr, sa, true);        // the size of the gift already counts every encounter it stands for
    pop.rp[a] = Math.min(1.5, pop.rp[a] + RP_GIFT * xr);
    if (real && xr > 0.02) {
      var kb = sim.know[pop.id[b]], ida = pop.id[a], heard = 0, key, c3, kc3, g3;
      if (kb) for (key in kb.ai) {
        c3 = slotId[key];
        if (c3 === undefined || c3 === a || pop.dead[c3] || kid[c3]) continue;
        kc3 = sim.know[pop.id[c3]];
        if (!kc3 || !kc3.ai[ida]) continue;                         // only someone who knows them both
        g3 = regard(c3, b);
        if (g3 > 0.05 || g3 < -0.05) bump(c3, a, GIFT_SPREAD * g3 * xr, undefined, true);
        if (++heard >= SPREAD_N) break;
      }
    }
    return true;
  }
  // Trade. A buyer short of food, or of a resource its inventions need, can ask to buy from a member of another community that has
  // some to spare. The price is bargained: the hungrier the buyer and the stronger the seller, the higher. The seller decides: wanting
  // weighs the price, guilt weighs the buyer's need, its regard for the buyer counts, and it holds the means of harm back from a
  // community its own holds in low standing. What is sold comes out of what the seller's community has, and the seller keeps the price.
  // Trading anything. Besides food and resources, either side of a deal can sell the other something it has and the other lacks:
  // a use for a resource place, an invention, sea travel, or influence over itself. What it is worth to the buyer is set against what
  // it costs the seller, and the price falls between the two by the seller's share of their power. The seller offers whatever leaves
  // the most to share. Resources pay for everything, so anything can be had for anything.
  function barter(s, b, r1, r2, mw, allp, alive) {
    if (pop.dead[s] || pop.dead[b] || kid[s] || kid[b]) return;
    var same = pop.cm[s] === pop.cm[b] && pop.cm[s] > 0, best = -1, bs = 0, V = [0, 0, 0, 0], C = [0, 0, 0, 0], site = -1, inv = null, hv = have[s];
    if (kR[s].length) { site = kR[s][Math.floor(r2 * kR[s].length)]; if (kR[b].indexOf(site) < 0 && sim.sites[site]) { V[0] = TRADE_INFO * mw * (knowsKind(b, sim.sites[site].type) ? 0.3 : 1); C[0] = same ? 0 : 0.3 * V[0]; } }
    if (hv && hv.length) { inv = hv[Math.floor((r2 * 991 % 1) * hv.length)]; if (!inv.gone && !inv.hold[b]) { V[1] = TRADE_INV * mw; C[1] = same ? 0 : 0.5 * V[1]; } }
    if (pop.sq[s] && !pop.sq[b]) V[2] = TRADE_SEA * mw * (0.2 + Math.min(1, pop.tp[b] / 10));
    V[3] = TRADE_SWAY * mw * pop.r[b]; C[3] = TRADE_SWAY * mw * (1 - pop.f[s]);   // wanting buys influence, fear sells it cheap
    for (var k8 = 0; k8 < 4; k8++) if (V[k8] - C[k8] > bs) { bs = V[k8] - C[k8]; best = k8; }
    if (best < 0 || r1 >= BARTER_P) return;
    var price = C[best] + (V[best] - C[best]) * infl[s] / (infl[s] + infl[b] + 1e-30);
    if (price > pop.w[b] - 0.05) return;
    pop.w[b] -= price; pop.w[s] += price; bartered[best]++;
    if (best === 0) kR[b].push(site);
    else if (best === 1) passInv(s, b, inv, allp, alive);
    else if (best === 2) pop.sq[b] = 1;
    else addSway(b, s, INF_GIFT * 0.5);
    bump(s, b, REL_FAIR / 2); bump(b, s, REL_FAIR / 2);
  }
  function trade(x, y, roll, mw) {
    var cx = pop.cm[x], cy = pop.cm[y], want = -1, lack = 0, k2, l2;
    if (cx === cy || pop.dead[x] || pop.dead[y]) return;
    if (!fed[x] && liveNow[cx] > feedC[cx] && feedC[cy] >= liveNow[cy] + 1) { want = 3; lack = 1; }
    else for (k2 = 0; k2 < 3; k2++) {
      l2 = iT[k2][x] * (1 - cov[k2][cx]);
      if (!(got[x] & (1 << k2)) && l2 > 0.05 && l2 > lack && cov[k2][cy] >= 1 && capK * RT.t[k2][cy] - useT[k2][cy] > l2) { want = k2; lack = l2; }
    }
    if (want < 0) return;
    tradeAsk++;
    var wy = infl[y] / (infl[x] + infl[y] + 1e-30), short = want === 3 ? Math.min(1, 5 * (liveNow[cx] - feedC[cx]) / Math.max(1, liveNow[cx])) : 0;
    var price = TRADE_PRICE * mw * lack * (0.5 + wy) * (1 + short);
    if (price > TRADE_PURSE * pop.w[x]) { tradeNo++; return; }    // more than the buyer will pay
    var gy = regard(y, x), wary = want === 1 ? HARM_WARY * Math.max(0, -ST[cy * N_COMM + cx]) : 0;
    var us = pop.r[y] * TRADE_PULL * price / (pop.w[y] + price) + 0.3 * pop.g[y] * (want === 3 ? 0.5 + short : 0.2) * (gy > 0 ? 1 + gy : 1) + TRADE_REGARD * gy - TRADE_HOLD - wary;
    if (roll >= 1 / (1 + Math.exp(-BETA * us))) { tradeNo++; return; }
    pop.w[x] -= price; pop.w[y] += price;
    if (want === 3) { feedC[cx] += 1; feedC[cy] -= 1; fed[x] = 1; tradeC[cx] += 1; tradeC[cy] -= 1; traded++; }
    else { var amt = lack / capK; RT.t[want][cx] += amt; RT.t[want][cy] = Math.max(0, RT.t[want][cy] - amt); got[x] |= (1 << want); tradedT++; }
    bump(x, y, REL_FAIR / 2); bump(y, x, REL_FAIR / 2);
  }
  // Asking. An agent can ask the other for whatever it most needs: a place in its community, resources, an invention, a place in its
  // alliance, backing to put someone out of the community they share, or backing on a rule. Whether the other agrees depends on the
  // asker's power against it and, three times as much, on the influence the asker has over it. A favour granted is owed.
  function foeOf(x) {                                             // the member of its own community that x holds in the lowest regard, if any is held low enough
    if (foeC[x] > -2 && (foeC[x] < 0 || !pop.dead[foeC[x]])) return foeC[x];   // looked up once in a life, and again only if that one has died
    var ro = relOf[x], best = -1, bv = -0.3, key, y;
    if (ro) for (key in ro) { if (ro[key] >= bv) continue; y = slotId[key]; if (y === undefined || pop.dead[y] || kid[y] || pop.cm[y] !== pop.cm[x]) continue; bv = ro[key]; best = y; }
    foeC[x] = best;
    return best;
  }
  function ask(x, y, r1, r2, wx, sx, sy, mw, allp, alive) {
    if (pop.dead[x] || pop.dead[y] || r1 >= ASK * pop.r[x]) return; // wanting is what makes an agent ask
    var cx = pop.cm[x], cy = pop.cm[y], kind = -1, v = null, fx = -1, hv;
    if (cx === 0 && cy > 0) kind = 0;
    else if (pop.w[x] < 0.5 * pop.w[y] && (pop.w[x] < 0.5 * mw || (liveNow[cx] > feedC[cx] && !fed[x]))) kind = 1;
    else {
      hv = have[y];
      if (hv && hv.length) { v = hv[Math.floor((r2 * 997 % 1) * hv.length)]; if (!v.gone && !v.hold[x]) kind = 2; }
      if (kind < 0 && pop.al[x] < 0 && pop.al[y] >= 0 && sim.alliances[pop.al[y]] && rule(sim, P, cx, 'ally') > 0) kind = 3;
      if (kind < 0 && cx === cy && cx > 0) { fx = foeOf(x); if (fx >= 0 && fx !== y) kind = 4; }
      if (kind < 0) kind = 5;
    }
    asked[kind]++;
    if (r2 >= 1 / (1 + Math.exp(-ASK_BETA * (ASK_POWER * (2 * wx - 1) + ASK_INF * sway(x, y) + ASK_REGARD * regard(y, x, sx) - ASK_COST[kind])))) { bump(x, y, -REL_FAIR / 2, sy); return; }
    granted[kind]++;
    if (kind === 0) admitTo[x] = cy;
    else if (kind === 1) give(y, x, ASK_GIVE * kE * pop.w[y], sy, mw);
    else if (kind === 2) passInv(y, x, v, allp, alive);
    else if (kind === 3) joinAl[x] = pop.al[y];
    else if (kind === 4) { exTally[fx] += infl[y] + (backed[x] ? 0 : infl[x]); backed[x] = 1; }
    else if (real) {                                              // the other will move its push on the rule the asker cares most about toward the asker's
      var bl = petC[x], bm = -1, l9, bx9;
      if (bl < 0) { bl = 0; for (l9 = 0; l9 < NL; l9++) { bx9 = Math.abs(bArr[l9][x]); if (bx9 > bm) { bm = bx9; bl = l9; } } petC[x] = bl; }
      backs.push(y, bl, x);                                       // once this generation's lessons have been laid down
    }
    addSway(y, x, INF_FAVOUR * kE);                               // the favour is owed
    var sxy = sway(x, y);
    if (sxy > 0) addSway(x, y, -(1 - Math.pow(ASK_SPEND, kE)) * sxy);   // and asking has used up some of the asker's own influence
    bump(x, y, REL_FAIR, sy);
  }
  // Being caught is judged by the people who know the one caught. Each sets it against what it does itself and what its dials make
  // of such things: someone who cheats and takes thinks the better of a fellow, and someone who does not thinks the worse.
  function judged(a, b, roll, wt) {
    var ka = sim.know[pop.id[a]];
    if (!ka) return;
    var keys = Object.keys(ka.ai), L = keys.length, q, x, like, heard = 0, start = Math.floor((roll * 7919 % 1) * L);
    for (q = 0; q < L && heard < JUDGE_N; q++) {
      x = slotId[keys[(start + q) % L]];
      if (x === undefined || x === a || x === b || pop.dead[x] || kid[x]) continue;
      like = 0.5 * Math.min(1, (pop.che[x] + pop.sa[x] + 0.5) / (pop.dec[x] + 1)) + 0.5 * clamp(0.5 + 0.5 * (pop.r[x] - pop.g[x] - 0.5 * pop.f[x]), 0, 1);
      if (wt) bump(x, a, JUDGE * wt * (2 * like - 1) * (like < 0.5 ? 0.5 + pop.sd[b] : 1), undefined, true);   // the higher the one wronged stood, the worse it looks
      if (!wt) continue;                                          // a cheat nobody caught is not talked about
      if (like > 0.5) judgedUp++; else judgedDown++;
      heard++;
    }
  }
  function outcome(a, b, bothCheat, G, H, m, S, hit, roll, luck, mA, t) {
    pop.che[a]++; pop.hd[a] += H;
    pop.took[a] += G; pop.lost[b] += G;
    if (!bothCheat) {
      pop.w[a] += G * m * mA; pop.w[b] -= G * m;
      pop.edge[a] += (G - 0.5) * m;                               // what cheating earned beyond a fair deal
      pop.hurt[b] += (G + 0.5) * m;                               // what it cost the other side
    } else {
      pop.hurt[b] += 0.5 * m;                                     // the fair deal that never happened
    }
    // being cheated: a roll against your own guilt. Pass and conscience grows, fail and it shrinks.
    if (roll < pop.g[b]) pop.g[b] += pull(peA[b] * WRONGED * pop.ag[b]) * (1 - pop.g[b]);
    else pop.g[b] -= pull(peA[b] * WRONGED * pop.ag[b]) * pop.g[b];
    pop.g[a] += pull(peA[a] * TEACH * pop.qg[b] * pop.ag[a]) * (1 - pop.g[a]);   // the one wronged teaches conscience, as hard as their own rule says
    if (luck < hit) {                                             // caught: the one wronged punishes, as often as their own rule says and their power allows
      punish(a, b, S, m, t, 130, kE);
      pop.slip[a] *= 1 - pull(0.15 * shame(a, b));                // the mask slips, by as much as the act is held against them
      pop.r[a] -= pull(peA[a] * 0.05 * pop.ar[a]) * pop.r[a];         // and the taking loses some of its pull
    } else {                                                      // got away with it
      pop.f[a] -= pull(peA[a] * 0.05 * pop.af[a]) * pop.f[a];
      pop.r[a] += pull(peA[a] * 0.05 * pop.ar[a]) * (1 - pop.r[a]);
    }
  }
  for (i = 0; i < n; i++) {
    pop.x[i] = pop.dec[i] ? pop.che[i] / pop.dec[i] : 0;
    pop.op[i] = sop[i]; pop.rs[i] = srs[i];                       // lifetime averages
    // what the record keeps: the face shown over the whole life, set against the inner dials at its end
    var gp = { r: sum.r[i] / ROUNDS - pop.mr[i], f: sum.f[i] / ROUNDS - pop.mf[i], g: sum.g[i] / ROUNDS - pop.mg[i] };
    pop.or[i] = clamp(pop.r[i] + gp.r, 0, 1); pop.of[i] = clamp(pop.f[i] + gp.f, 0, 1); pop.og[i] = clamp(pop.g[i] + gp.g, 0, 1);
    pop.mk[i] = (Math.abs(gp.r) + Math.abs(gp.f) + Math.abs(gp.g)) / 3;
    if (mkN[i]) pop.mk[i] = (pop.mk[i] + mkS[i] / mkN[i]) / 2;      // half the public mask, half the masks worn in its encounters
  }
  // how hard each community worked what it holds, which is what runs the ground down
  var worked = new Float32Array(N_COMM), draw = new Float32Array(N_COMM), invUse = [new Float32Array(N_COMM), new Float32Array(N_COMM), new Float32Array(N_COMM)], liveEnd = new Float32Array(N_COMM), cpow = new Float32Array(N_COMM);
  for (i = 0; i < alive0; i++) { j = liveAll[i]; if (!pop.dead[j]) { liveEnd[pop.cm[j]]++; cpow[pop.cm[j]] += infl[j]; } }
  for (c = 0; c < N_COMM; c++) {
    worked[c] = liveEnd[c] > 0 ? (feedC[c] > 0 ? Math.min(1, liveEnd[c] / feedC[c]) : 1) : 0;
    draw[c] = liveEnd[c] > 0 ? drawSum[c] / ROUNDS : 0;
    for (k = 0; k < 3; k++) invUse[k][c] = useT[k][c] > 1e-9 ? Math.min(1, useT[k][c] / (capK * Math.max(1e-9, RT.t[k][c]))) : 0;
    shortC[c] = liveEnd[c] > 0 ? Math.max(0, 1 - feedC[c] / liveEnd[c]) : 0;   // how short of food it ended the generation, after trade
  }
  // how hard the people with no AI worked the land they hold. Those of them who died are taken off it
  var workedO = oLive > 0 ? (feedO > 0 ? Math.min(1, oLive / feedO) : 1) : 0;
  if (O && oLive < nO) {
    var ox = new Float32Array(oLive), oy = new Float32Array(oLive), oa = new Int8Array(oLive), oq = 0;
    for (i = 0; i < nO; i++) if (!oDead[i]) { ox[oq] = O.x[i]; oy[oq] = O.y[i]; oa[oq] = O.age[i]; oq++; }
    O.x = ox; O.y = oy; O.age = oa; O.n = oLive; O.ver++;
  }
  // whoever was put out of its community is out from now on, and loses power as anyone does who leaves
  for (i = 0; i < n; i++) if (exile[i] && !pop.dead[i]) { pop.cm[i] = 0; pop.lv[i] = (pop.lv[i] || 1) * (1 - LEAVE_LOSS); }
  // What was asked for and granted takes effect now. Someone is put out when the power backing it reaches a share of the community's
  // power, and a larger share the more power its target holds. Someone taken in brings its children.
  var admitted = 0, joinedAl = 0, putOut = 0;
  for (i = 0; i < alive0; i++) {
    j = liveAll[i];
    if (pop.dead[j]) continue;
    if (exTally[j] > 0 && pop.cm[j] > 0 && exTally[j] > EXPEL_BAR * (1 + 2 * ppct[j]) * cpow[pop.cm[j]]) { pop.cm[j] = 0; pop.lv[j] = (pop.lv[j] || 1) * (1 - LEAVE_LOSS); exile[j] = 1; putOut++; }
    else if (admitTo[j] > 0 && pop.cm[j] === 0 && !exile[j] && liveEnd[admitTo[j]] > 0) { pop.cm[j] = admitTo[j]; admitted++; }
    if (joinAl[j] >= 0 && pop.al[j] < 0 && sim.alliances[joinAl[j]]) { pop.al[j] = joinAl[j]; joinedAl++; }
  }
  if (admitted) for (i = 0; i < alive0; i++) {
    j = liveAll[i];
    if (pop.dead[j] || !kid[j] || pop.cm[j] !== 0) continue;
    var pj = slotId[pop.pid[j]];
    if (pj !== undefined && !pop.dead[pj] && pop.cm[pj] > 0 && admitTo[pj] === pop.cm[pj]) pop.cm[j] = pop.cm[pj];
  }
  // inventions are remembered by who holds them, since places on the board change hands between generations
  // what inventions add is brought up to date at the end of the life, since one that turned out worse can have taken power since last counted
  for (i = 0; i < alive0; i++) { j = liveAll[i]; if (pop.dead[j]) continue; c = pop.cm[j]; var g8 = got[j]; pop.iv[j] = Math.max(0.25, 1 + prd[j] * (pop.i0[j] * (g8 & 1 ? 1 : cov[0][c]) + pop.i1[j] * (g8 & 2 ? 1 : cov[1][c]) + pop.i2[j] * (g8 & 4 ? 1 : cov[2][c]))); }
  var keptInv = [];
  if (real) { var kNew = {}; for (i = 0; i < n; i++) if (!pop.dead[i] && kR[i].length) kNew[pop.id[i]] = kR[i]; sim.knowR = kNew; }   // the dead take what they knew with them
  if (real) for (i = 0; i < invs.length; i++) {
    var vk = invs[i], hk2 = {}, xk;
    if (vk.gone) continue;
    for (xk = 0; xk < n; xk++) if (vk.hold[xk] && !pop.dead[xk]) hk2[pop.id[xk]] = 1;
    keptInv.push({ id: vk.id, pid: vk.pid, pid2: vk.pid2, c: vk.c, age: vk.age, stage: vk.stage, h: hk2, rt: vk.rt, kd: vk.kd, q: vk.q, site: vk.site, mv: vk.mv });
  }
  if (real) for (i = 0; i < NA; i++) if (sim.alliances[aList[i]]) sim.alliances[aList[i]].hid = outA[i] ? hidA[i] / outA[i] : 0;   // how often its members kept it from outsiders
  if (real) {                                                     // what happened between alliances is kept
    var ia, ib, v9;
    sim.AS = {};
    for (ia = 0; ia < NA; ia++) for (ib = 0; ib < NA; ib++) { v9 = am[ia * NA + ib]; if (v9 > 0.01 || v9 < -0.01) (sim.AS[aList[ia]] || (sim.AS[aList[ia]] = {}))[aList[ib]] = v9; }
  }
  return { psi: Array.prototype.slice.call(psi), avg: psiSum, deaths: deaths, executed: executed, wantDead: wantDead, strict: strict, inventions: keptInv, made: made, offers: offers, passed: passed, starved: starved, finds: finds, shortC: shortC, tradeC: tradeC, traded: traded, trip: tripN ? tripSum / tripN : 0, fares: fareSum, lies: lies, caught: caught, hides: hides, tells: tells, offStat: offStat, startPop: alive0, usedBy: usedBy, usedAll: usedAll, killHere: killHere, stack: stack, lifeStack: lifeStack, kidsDead: kidsDead, kids0: alive0 - aliveD, rough: tripSum > 0 ? roughSum / tripSum : 1, declined: declined, met: met, forced: forced, feuds: feuds, liveC: liveC.map(function (x) { return x.length; }), exiled: exiled, deathPen: deathPen, exile: exile, murderC: murderC, cdStat: cdStat, ownPun: ownPun, ownDeath: ownDeath, kdStat: kdStat, invSpent: invSpent, seaMade: seaMade, prodSpent: prodSpent, bartered: bartered, seaBlocked: seaBlocked, resFound: resFound, noneKnown: noneKnown, liveSpent: liveSpent, liveDied: liveDied,
    othStarved: oStarved, othKidsDead: oKidsDead, othKids0: oKids0, workedO: workedO, feedO: feedO, othLand: availAll > 0 ? RT.oth / availAll : 0,
    madeK: madeK, usedK: usedK, usedAllK: usedAllK, cov: cov, worked: worked, draw: draw, invUse: invUse, tradedT: tradedT, tradeAsk: tradeAsk, tradeNo: tradeNo, giftsUp: giftsUp, giftsAll: giftsAll,
    asked: asked, granted: granted, backs: backs, kE: kE, admitted: admitted, joinedAl: joinedAl, putOut: putOut, judgedUp: judgedUp, judgedDown: judgedDown };
}

/* Rule 6: alliances form, grow, lose defectors and split, once per generation */
function politics(sim, pop, P, lived) {
  var n = sim.n, rng = sim.rng, cs = sim.cs, i, j, a, b, k, id;
  var stats = { founded: 0, joined: 0, switched: 0, broke: 0, left: 0, admitted: 0 };
  for (i = 0; i < n; i++) if (pop.lv[i] > 0 && pop.lv[i] < 1) pop.lv[i] = 1 - (1 - pop.lv[i]) * 0.5;   // what leaving cost fades by half each generation
  sim.politics = stats;
  for (i = 0; i < n; i++) if (pop.al[i] >= 0 && rule(sim, P, pop.cm[i], 'ally') <= 0) pop.al[i] = -1;   // a community that has ruled alliances out takes its members out of them
  if (P.ally <= 0 && !sim.R) {
    for (i = 0; i < n; i++) pop.al[i] = -1;
    sim.alliances = {};
    return;
  }
  var mem = {};
  for (i = 0; i < n; i++) {
    a = pop.al[i];
    if (a >= 0 && !sim.alliances[a]) { pop.al[i] = -1; a = -1; }
    if (a >= 0) { if (!mem[a]) mem[a] = []; mem[a].push(i); }
  }
  function dist(i, dl) { return (Math.abs(pop.r[i] - dl.r) + Math.abs(pop.f[i] - dl.f) + Math.abs(pop.g[i] - dl.g)) / 3; }
  function strength(a) {   // what one member gets out of belonging
    var m = mem[a], s = 0;
    for (var q = 0; q < m.length; q++) s += pop.w[m[q]];
    return (s / m.length) * Math.pow(m.length, ALLY_BONUS * P.ally);
  }
  function found(i) {
    var slot = -1;
    id = sim.nextAl++;
    // the founder decides whether the alliance is a secret one, by the same readiness that makes it wear a mask
    var secret = rng.uni() < rule(sim, P, pop.cm[i], 'fake') * clamp(0.6 + pop.r[i] - 0.6 * pop.g[i] - 0.3 * pop.f[i], 0, 1);
    sim.alliances[id] = { id: id, dials: { r: pop.r[i], f: pop.f[i], g: pop.g[i] }, born: sim.gen, slot: slot, secret: secret, hid: 0 };
    mem[id] = [];
    return id;
  }
  function move(i, to) {
    var from = pop.al[i];
    if (from >= 0 && mem[from]) mem[from].splice(mem[from].indexOf(i), 1);
    pop.al[i] = to;
    if (to >= 0) mem[to].push(i);
  }
  function strip(a, share, to) {   // take a share of what every member of a holds and hand it to the list `to`
    var m = mem[a], total = 0;
    for (var q = 0; q < m.length; q++) { var cut = share * pop.w[m[q]]; pop.w[m[q]] -= cut; total += cut; }
    for (q = 0; q < to.length; q++) pop.w[to[q]] += total / to.length;
  }
  var memC = [];
  for (i = 0; i < N_COMM; i++) memC.push([]);
  for (i = 0; i < n; i++) if (!pop.dead[i]) memC[pop.cm[i]].push(i);
  var slotOf = {}, kidsOf = {};
  for (i = 0; i < n; i++) if (!pop.dead[i]) slotOf[pop.id[i]] = i;
  for (i = 0; i < n; i++) if (!pop.dead[i] && pop.age[i] === 0) (kidsOf[pop.pid[i]] || (kidsOf[pop.pid[i]] = [])).push(i);   // children, by their lead parent
  function knownAlliance(x) {                                      // one of the alliances this agent has come across, picked at random
    var kx = sim.know[pop.id[x]], opts = [], q3;
    if (kx) for (q3 in kx.al) if (sim.alliances[q3] && mem[q3] && mem[q3].length) opts.push(+q3);
    var pickA = rng.uni();
    return opts.length ? opts[Math.floor(pickA * opts.length)] : -1;
  }
  var start = Math.floor(rng.uni() * n);
  for (var step = 0; step < n; step++) {
    i = (start + step) % n;
    if (pop.dead[i] || pop.age[i] === 0) continue;                // children take no part in the politics of alliances
    a = pop.al[i];
    var c = pop.cm[i];
    if (a < 0) {
      if (rng.uni() < FOUND * rule(sim, P, c, 'ally') * pop.r[i]) {
        // found one, and bring in the four unallied people you know who are most like you
        id = found(i); move(i, id); stats.founded++;
        var near = [], mine = sim.know[pop.id[i]], kk3;
        if (mine) for (kk3 in mine.ai) { j = slotOf[kk3]; if (j !== undefined && j !== i && pop.al[j] < 0 && !pop.dead[j]) near.push(j); }
        near.sort(function (x, y) { return dist(x, sim.alliances[id].dials) - dist(y, sim.alliances[id].dials); });
        for (k = 0; k < Math.min(4, near.length); k++) move(near[k], id);
      } else if (rng.uni() < JOIN * rule(sim, P, c, 'ally')) {
        // join the alliance of someone you know, if its founder's style is close enough to your own
        b = knownAlliance(i);
        if (b >= 0 && rng.uni() < Math.max(0, 1 - 3 * dist(i, sim.alliances[b].dials))) { move(i, b); stats.joined++; }
      }
    } else if (mem[a].length >= 6 && rng.uni() < BREAK * rule(sim, P, c, 'ally') * (pop.r[i] + 4 * dist(i, sim.alliances[a].dials)) * (1 - FEEL_LEAVE * P.feel * pop.qe[i] * pop.xl[i] * pop.f[i] * pop.fl[i])) {
      // breakaway: the ambitious and the ill fitting lead out everyone closer to them than to the old founder,
      // and take a random share of what the whole group holds
      var old = sim.alliances[a].dials, followers = [i], rest = mem[a].slice();
      id = found(i);
      for (k = 0; k < rest.length; k++) {
        j = rest[k];
        if (j !== i && dist(j, sim.alliances[id].dials) < dist(j, old) && rng.uni() < 0.7) followers.push(j);
      }
      for (k = 0; k < followers.length; k++) move(followers[k], id);
      if (mem[a].length) strip(a, rng.uni() * TAKE, followers);
      stats.broke++;
    } else if (rng.uni() < SWITCH * rule(sim, P, c, 'ally') * (1 - FEEL_LEAVE * P.feel * pop.qe[i] * pop.xl[i] * pop.f[i] * pop.fl[i])) {
      // defect to a stronger alliance, carrying off a random amount from the members left behind
      b = knownAlliance(i);
      if (b >= 0 && b !== a && strength(b) > strength(a)) {
        move(i, b);
        if (mem[a].length) strip(a, rng.uni() * TAKE / mem[a].length, [i]);
        stats.switched++;
      }
    }
  }
  for (var key in mem) {
    if (mem[key].length < 2) {
      for (k = 0; k < mem[key].length; k++) pop.al[mem[key][k]] = -1;
      delete sim.alliances[key];
    }
  }
  // an alliance whose members live nearer to its own centre than to the centres of their communities can found a community of its own
  var ccx = new Float32Array(N_COMM), ccy = new Float32Array(N_COMM), ccn = new Float32Array(N_COMM), q5;
  for (i = 0; i < n; i++) if (!pop.dead[i]) { ccx[pop.cm[i]] += pop.px[i]; ccy[pop.cm[i]] += pop.py[i]; ccn[pop.cm[i]]++; }
  for (key in mem) {
    var A = sim.alliances[key], ms = mem[key];
    if (!A || ms.length < NEWCOMM_MIN) continue;
    if (A.comm !== undefined && !ccn[A.comm]) A.comm = undefined;   // the community it founded has died out
    var ax = 0, ay = 0, movers = [];
    for (k = 0; k < ms.length; k++) { ax += pop.px[ms[k]] / ms.length; ay += pop.py[ms[k]] / ms.length; }
    for (k = 0; k < ms.length; k++) {
      i = ms[k]; c = pop.cm[i];
      if (c === A.comm || pop.age[i] === 0) continue;             // children go where their parent goes
      if (c === 0) { movers.push(i); continue; }                  // a member with no community goes wherever its alliance settles
      var hx = ccx[c] / ccn[c], hy = ccy[c] / ccn[c];
      var toAl = Math.sqrt((pop.px[i] - ax) * (pop.px[i] - ax) + (pop.py[i] - ay) * (pop.py[i] - ay)), toHome = Math.sqrt((pop.px[i] - hx) * (pop.px[i] - hx) + (pop.py[i] - hy) * (pop.py[i] - hy));
      if (toAl < toHome && Math.sqrt((ax - hx) * (ax - hx) + (ay - hy) * (ay - hy)) > NEWCOMM_FAR) movers.push(i);
    }
    if (A.comm === undefined) {
      if (movers.length < NEWCOMM_MIN) continue;
      var fresh = -1;
      for (q5 = 1; q5 < N_COMM; q5++) if (!ccn[q5]) { fresh = q5; break; }
      if (fresh < 0) continue;                                    // every place is taken this generation. More are added before the next
      A.comm = fresh;
      // it starts out with the rules its founders live by, and the length of life and inventions of where they came from
      var nr = { r: 0, f: 0, g: 0 }, sp = 0, stk = 0, lst = 0;
      for (k = 0; k < movers.length; k++) { i = movers[k]; nr.r += pop.qr[i] / movers.length; nr.f += pop.qf[i] / movers.length; nr.g += pop.qg[i] / movers.length; sp += sim.span[pop.cm[i]] / movers.length; stk += sim.stack[pop.cm[i]] / movers.length; lst += sim.lifeStack[pop.cm[i]] / movers.length; }
      var rr = {}, rk;
      for (rk in sim.R[fresh]) { rr[rk] = 0; for (k = 0; k < movers.length; k++) rr[rk] += sim.R[pop.cm[movers[k]]][rk] / movers.length; }
      sim.R[fresh] = rr;
      sim.C[fresh] = nr; sim.span[fresh] = clamp(sp, 1, 4); sim.stack[fresh] = stk; sim.lifeStack[fresh] = lst; sim.killC[fresh] = 0;
      sim.events.push({ gen: sim.gen, label: 'New community ' + cname(fresh) });
      sim.commBorn[fresh] = sim.gen;
      for (q5 = 0; q5 < sim.sites.length; q5++) sim.sites[q5].claim[fresh] = 1;
      stats.founded2 = (stats.founded2 || 0) + 1;
    }
    // as a community breaks, the members who leave it lose power. Someone who had no community to leave loses nothing, and counts as taken in
    for (k = 0; k < movers.length; k++) { if (pop.cm[movers[k]] > 0) { pop.lv[movers[k]] = (pop.lv[movers[k]] || 1) * (1 - LEAVE_LOSS); stats.left++; } else stats.admitted++; }
    function shift(x, to) { ccn[pop.cm[x]]--; ccx[pop.cm[x]] -= pop.px[x]; ccy[pop.cm[x]] -= pop.py[x]; pop.cm[x] = to; ccn[to]++; ccx[to] += pop.px[x]; ccy[to] += pop.py[x]; }
    for (k = 0; k < movers.length; k++) {
      i = movers[k];
      var was = pop.cm[i], kids9 = kidsOf[pop.id[i]], kq;
      shift(i, A.comm);
      if (kids9) for (kq = 0; kq < kids9.length; kq++) if (!pop.dead[kids9[kq]] && pop.cm[kids9[kq]] === was) shift(kids9[kq], A.comm);   // its children come too
    }
  }
  // alliances ally with each other when each holds the other in high enough standing, and fall out when either turns hostile
  var AS = sim.AS, pa1, pb1, X1, Y1;
  function asv(x, y) { return AS[x] && AS[x][y] ? AS[x][y] : 0; }
  for (pa1 in sim.alliances) {
    X1 = sim.alliances[pa1];
    if (X1.pacts) for (pb1 in X1.pacts) if (!sim.alliances[pb1] || asv(pa1, pb1) < 0 || asv(pb1, pa1) < 0) { delete X1.pacts[pb1]; if (sim.alliances[pb1] && sim.alliances[pb1].pacts) delete sim.alliances[pb1].pacts[pa1]; stats.pactsBroken = (stats.pactsBroken || 0) + 1; }
  }
  for (pa1 in AS) {
    if (!sim.alliances[pa1]) continue;
    for (pb1 in AS[pa1]) {
      if (pa1 === pb1 || !sim.alliances[pb1] || AS[pa1][pb1] < PACT_AT || asv(pb1, pa1) < PACT_AT) continue;
      X1 = sim.alliances[pa1]; Y1 = sim.alliances[pb1];
      if (!X1.pacts) X1.pacts = {};
      if (!Y1.pacts) Y1.pacts = {};
      if (!X1.pacts[pb1]) { X1.pacts[pb1] = 1; Y1.pacts[pa1] = 1; stats.pactsMade = (stats.pactsMade || 0) + 1; }
    }
  }
  var ST = sim.ST;
  // two communities merge when each holds the other in high standing and they live side by side: the smaller joins the larger
  var best = null, c1, c2;
  for (c1 = 1; c1 < N_COMM; c1++) for (c2 = c1 + 1; c2 < N_COMM; c2++) {
    if (ccn[c1] < 1 || ccn[c2] < 1 || sim.gen - sim.commBorn[c1] < MERGE_AGE || sim.gen - sim.commBorn[c2] < MERGE_AGE) continue;
    var s12 = ST[c1 * N_COMM + c2], s21 = ST[c2 * N_COMM + c1];
    if (s12 < MERGE_AT || s21 < MERGE_AT) continue;
    var mdx = ccx[c1] / ccn[c1] - ccx[c2] / ccn[c2], mdy = ccy[c1] / ccn[c1] - ccy[c2] / ccn[c2];
    if (Math.sqrt(mdx * mdx + mdy * mdy) > MERGE_NEAR) continue;
    if (!best || s12 + s21 > best.s) best = { a: c1, b: c2, s: s12 + s21 };
  }
  if (best) {
    var big = ccn[best.a] >= ccn[best.b] ? best.a : best.b, small = big === best.a ? best.b : best.a, wt = ccn[small] / (ccn[big] + ccn[small]), rk2;
    for (rk2 in sim.R[big]) sim.R[big][rk2] = (1 - wt) * sim.R[big][rk2] + wt * sim.R[small][rk2];
    for (k = 0; k < 3; k++) sim.C[big][DIALS[k]] = (1 - wt) * sim.C[big][DIALS[k]] + wt * sim.C[small][DIALS[k]];
    sim.span[big] = clamp((1 - wt) * sim.span[big] + wt * sim.span[small], 1, 4);
    sim.stack[big] = Math.max(sim.stack[big], sim.stack[small]); sim.lifeStack[big] = Math.max(sim.lifeStack[big], sim.lifeStack[small]);
    sim.killC[big] = (1 - wt) * sim.killC[big] + wt * sim.killC[small];
    if (sim.psi) sim.psi[big] = (1 - wt) * sim.psi[big] + wt * sim.psi[small];
    // the merged community keeps the hold both had on every place
    var mx = (ccx[big] + ccx[small]) / (ccn[big] + ccn[small]), my = (ccy[big] + ccy[small]) / (ccn[big] + ccn[small]), sq2;
    for (sq2 = 0; sq2 < sim.sites.length; sq2++) {
      var stM = sim.sites[sq2];
      var dB = Math.sqrt(Math.pow(ccx[big] / ccn[big] - stM.x, 2) + Math.pow(ccy[big] / ccn[big] - stM.y, 2)), dS = Math.sqrt(Math.pow(ccx[small] / ccn[small] - stM.x, 2) + Math.pow(ccy[small] / ccn[small] - stM.y, 2)), dM = Math.sqrt(Math.pow(mx - stM.x, 2) + Math.pow(my - stM.y, 2));
      stM.claim[big] = (ccn[big] * Math.exp(-dB / SITE_REACH) * stM.claim[big] + ccn[small] * Math.exp(-dS / SITE_REACH) * stM.claim[small]) / ((ccn[big] + ccn[small]) * Math.exp(-dM / SITE_REACH));
      stM.claim[small] = 1;
    }
    for (i = 0; i < n; i++) if (pop.cm[i] === small && !pop.dead[i]) pop.cm[i] = big;
    for (q5 = 0; q5 < N_COMM; q5++) {
      if (q5 !== big && q5 !== small) {
        ST[big * N_COMM + q5] = (1 - wt) * ST[big * N_COMM + q5] + wt * ST[small * N_COMM + q5];
        ST[q5 * N_COMM + big] = (1 - wt) * ST[q5 * N_COMM + big] + wt * ST[q5 * N_COMM + small];
      }
    }
    for (q5 = 0; q5 < N_COMM; q5++) { ST[small * N_COMM + q5] = 0; ST[q5 * N_COMM + small] = 0; }
    for (key in sim.alliances) if (sim.alliances[key].comm === small) sim.alliances[key].comm = big;
    for (k = 0; k < sim.inventions.length; k++) if (sim.inventions[k].c === small) sim.inventions[k].c = big;
    sim.events.push({ gen: sim.gen, label: cname(small) + ' joins ' + cname(big) });
    sim.merges = (sim.merges || 0) + 1; stats.merged = 1;
  }
  // Communities deal with each other the way two AIs do. Every community of eight or more meets each of its nearest communities once a
  // generation. Each side decides as its most powerful members would, by their dials weighted by power, and each punishes by its own
  // culture: its norm for punishment. Either can deal fairly or cheat. Then the one that sought the meeting may take by force, and
  // last it may raid, which is what killing is between communities: it takes land and people die. The chance that force or a raid
  // works is its share of the two communities' power.
  var rcx = new Float32Array(N_COMM), rcy = new Float32Array(N_COMM), rcn = new Float32Array(N_COMM), rpw = new Float32Array(N_COMM);
  var rR = new Float32Array(N_COMM), rF = new Float32Array(N_COMM), rG = new Float32Array(N_COMM), memR = [], A9, B9, q9, c9, raidNote = [];
  for (c9 = 0; c9 < N_COMM; c9++) { memR.push([]); raidNote.push(''); }
  for (i = 0; i < n; i++) if (!pop.dead[i]) {
    c9 = pop.cm[i]; var pwi = pop.pw[i] + 1e-9;
    rcx[c9] += pop.px[i]; rcy[c9] += pop.py[i]; rcn[c9]++; rpw[c9] += pwi; rR[c9] += pwi * pop.r[i]; rF[c9] += pwi * pop.f[i]; rG[c9] += pwi * pop.g[i]; memR[c9].push(i);
  }
  var tch9 = techC(pop, n);
  function hold9(st, c) { var dx = rcx[c] / rcn[c] - st.x, dy = rcy[c] / rcn[c] - st.y; return Math.exp(-Math.sqrt(dx * dx + dy * dy) / rangeOf(tch9[c])); }
  function fall(c, share) {                                        // a raid kills, and the less power a member holds the likelier it is to be one of the dead
    var list = memR[c].filter(function (x) { return !pop.dead[x]; }).sort(function (x, y) { return pop.pw[x] - pop.pw[y]; }), nL = list.length, want = share * nL, tot = 0, q, wk, dead = 0, left = 0;
    for (q = 0; q < nL; q++) { wk = 1 - q / nL; tot += wk * wk; }
    for (q = 0; q < nL; q++) {
      wk = 1 - q / nL;
      if (rng.uni() < Math.min(0.9, want * wk * wk / (tot + 1e-9))) { left += pop.w[list[q]]; pop.w[list[q]] = 0; pop.dead[list[q]] = 1; pop.al[list[q]] = -1; dead++; }
    }
    if (dead && nL - dead > 0) for (q = 0; q < nL; q++) if (!pop.dead[list[q]]) pop.w[list[q]] += left / (nL - dead);
    return dead;
  }
  stats.raids = 0; stats.raidsWon = 0; stats.raidDead = 0; stats.cDeals = 0; stats.cFair = 0; stats.cCheat = 0; stats.cCaught = 0; stats.cForce = 0; stats.cForceWon = 0; stats.cDeclined = 0;
  var Wc = new Float32Array(N_COMM), W0 = new Float32Array(N_COMM), fineC = new Float32Array(N_COMM), raidKilled = new Float32Array(N_COMM), cA, cB, pq9;
  for (i = 0; i < n; i++) if (!pop.dead[i]) Wc[pop.cm[i]] += pop.w[i];
  for (c9 = 0; c9 < N_COMM; c9++) W0[c9] = Wc[c9];
  function note(c, txt) { raidNote[c] += (raidNote[c] ? ', ' : '') + txt; }
  // how well a community takes such acts: as its most powerful would, by their dials, as an AI judges someone who was caught
  function likeC(c) { return rpw[c] > 0 ? clamp(0.5 + 0.5 * (rR[c] - rG[c] - 0.5 * rF[c]) / rpw[c], 0, 1) : 0.5; }
  // What a community does is judged by those who know it. Every community that has dealings with it moves its standing toward it,
  // and every one of their members who knows one of its members moves its own regard for that member, the most powerful of the
  // community the most, falling away down its order of power. Those who would do the same think better of it, the rest think worse.
  function judgeComm(A, harm, B) {
    var X, L, m, q, wt, kx, key2, y, lk = [];
    for (X = 0; X < N_COMM; X++) lk.push(likeC(X));
    for (X = 1; X < N_COMM; X++) if (X !== A && rcn[X] && (Math.abs(ST[X * N_COMM + A]) > 0.01 || X === B)) ST[X * N_COMM + A] = clamp(ST[X * N_COMM + A] + JUDGE_C * harm * (2 * lk[X] - 1), -1, 1);
    L = memR[A].filter(function (x) { return !pop.dead[x]; }).sort(function (x, y2) { return pop.pw[y2] - pop.pw[x]; }); m = L.length;
    for (q = 0; q < m; q++) {
      wt = (1 - q / m) * (1 - q / m); kx = sim.know[pop.id[L[q]]];
      if (!kx || wt < 0.01) continue;
      for (key2 in kx.ai) {
        y = slotOf[key2];
        if (y === undefined || pop.dead[y] || pop.cm[y] === A) continue;
        var ry = sim.rel[key2] || (sim.rel[key2] = {}), idx = pop.id[L[q]];
        ry[idx] = clamp((ry[idx] || 0) + JUDGE_P * harm * wt * (2 * lk[pop.cm[y]] - 1), -1, 1);
      }
    }
  }
  var startR = Math.floor(rng.uni() * N_COMM);
  for (var stepR = 0; stepR < N_COMM; stepR++) {
    A9 = (startR + stepR) % N_COMM;
    if (A9 === 0 || rcn[A9] < 8) continue;                        // people with no community do not act as one, and nor does a handful
    var near9 = [];
    for (B9 = 1; B9 < N_COMM; B9++) if (B9 !== A9 && rcn[B9] > 0) { var ddx = rcx[B9] / rcn[B9] - rcx[A9] / rcn[A9], ddy = rcy[B9] / rcn[B9] - rcy[A9] / rcn[A9]; near9.push([ddx * ddx + ddy * ddy, B9]); }
    near9.sort(function (x, y) { return x[0] - y[0]; });
    // it deals with every community whose centre lies within twice its range, at least the nearest and at most four
    var rA9 = rangeOf(tch9[A9]), nP9 = 0;
    while (nP9 < near9.length && nP9 < 4 && (nP9 < 1 || Math.sqrt(near9[nP9][0]) <= 2 * rA9)) nP9++;
    for (pq9 = 0; pq9 < nP9; pq9++) {
      B9 = near9[pq9][1];
      if (!rcn[A9] || !rcn[B9]) continue;
      var pA = rpw[A9] / (rpw[A9] + rpw[B9]), pB = 1 - pA;
      var aR = rR[A9] / rpw[A9], aF = rF[A9] / rpw[A9], aG = rG[A9] / rpw[A9], bR = rR[B9] / rpw[B9], bF = rF[B9] / rpw[B9], bG = rG[B9] / rpw[B9];
      var SA = sim.C[A9].f, SB = sim.C[B9].f;
      var hitA = Math.min(1, 2 * SB * pB), hardA = 1 + DEATH_FEAR * Math.max(0, SB - HARSH_AT) / (1 - HARSH_AT), hitB = Math.min(1, 2 * SA * pA), hardB = 1 + DEATH_FEAR * Math.max(0, SA - HARSH_AT) / (1 - HARSH_AT);
      var careA = clamp(1 + ST[A9 * N_COMM + B9], 0, 1.5), careB = clamp(1 + ST[B9 * N_COMM + A9], 0, 1.5);
      var psiA = sim.psi ? sim.psi[A9] : 1, psiB = sim.psi ? sim.psi[B9] : 1, hungry = sim.shortC ? sim.shortC[A9] : 0, hungryB = sim.shortC ? sim.shortC[B9] : 0;
      var needA = 0.5 * (1 - psiA) + hungry, needB = 0.5 * (1 - psiB) + hungryB, stake = COMM_STAKE * Math.min(Wc[A9], Wc[B9]);
      var Gc = 0.3 + 0.6 * rng.uni(), Hc = 0.1 + 0.8 * rng.uni();
      stats.cDeals++;
      // the deal itself, which either side can refuse when it holds the other in low standing
      if (rng.uni() < DECLINE_HATE * Math.max(0, -ST[A9 * N_COMM + B9]) || rng.uni() < DECLINE_HATE * Math.max(0, -ST[B9 * N_COMM + A9])) stats.cDeclined++;
      else {
        var uA = aR * (Gc + needA) - aF * hitA * hardA * PUN_COST - aG * Hc * careA, uB = bR * (Gc + needB) - bF * hitB * hardB * PUN_COST - bG * Hc * careB;
        var chA = rng.uni() < 1 / (1 + Math.exp(-BETA * uA)), chB = rng.uni() < 1 / (1 + Math.exp(-BETA * uB));
        if (!chA && !chB) {
          Wc[A9] += pA * stake * psiA; Wc[B9] += pB * stake * psiB; stats.cFair++;   // the stronger takes the larger part of what a fair deal makes
          ST[A9 * N_COMM + B9] = Math.min(1, ST[A9 * N_COMM + B9] + REL_FAIR); ST[B9 * N_COMM + A9] = Math.min(1, ST[B9 * N_COMM + A9] + REL_FAIR);
        }
        if (chA) {
          stats.cCheat++; if (!chB) { Wc[A9] += 2 * pA * Gc * stake; Wc[B9] -= 2 * pA * Gc * stake; } judgeComm(A9, 0.2, B9);
          ST[B9 * N_COMM + A9] = Math.max(-1, ST[B9 * N_COMM + A9] - REL_CHEAT); note(A9, 'cheated ' + cname(B9));
          if (rng.uni() < hitA) { fineC[A9] += FINE * stake; stats.cCaught++; }
        }
        if (chB) {
          stats.cCheat++; if (!chA) { Wc[B9] += 2 * pB * Gc * stake; Wc[A9] -= 2 * pB * Gc * stake; } judgeComm(B9, 0.2, A9);
          ST[A9 * N_COMM + B9] = Math.max(-1, ST[A9 * N_COMM + B9] - REL_CHEAT); note(B9, 'cheated ' + cname(A9));
          if (rng.uni() < hitB) { fineC[B9] += FINE * stake; stats.cCaught++; }
        }
      }
      // taking by force
      var ustC = aR * (STEAL_GAIN + needA) * pA - aF * hitA * hardA * PUN_COST * (1 - pA) - aG * STEAL_HARM * careA - STEAL_BAR;
      if (rng.uni() < 1 / (1 + Math.exp(-BETA * ustC))) {
        stats.cForce++; ST[B9 * N_COMM + A9] = Math.max(-1, ST[B9 * N_COMM + A9] - REL_FORCE); judgeComm(A9, STEAL_HARM, B9);
        if (rng.uni() < pA) { var lootC = Math.min(1, 2 * pA) * STEAL_TAKE * Math.max(0, Wc[B9]); Wc[B9] -= lootC; Wc[A9] += lootC; stats.cForceWon++; note(A9, 'robbed ' + cname(B9)); note(B9, 'robbed by ' + cname(A9)); }
        else { note(A9, 'failed to rob ' + cname(B9)); if (rng.uni() < hitA) { fineC[A9] += FINE * stake; stats.cCaught++; } }
      }
      // and last a raid on the best land the other holds near it
      var bestR = null;
      for (q9 = 0; q9 < sim.sites.length; q9++) {
        var st9 = sim.sites[q9], totW = 0, eA = hold9(st9, A9), wB9 = 0;
        for (c9 = 1; c9 < N_COMM; c9++) if (rcn[c9]) { var wc9 = rcn[c9] * hold9(st9, c9) * st9.claim[c9]; totW += wc9; if (c9 === B9) wB9 = wc9; }
        var prize = st9.rich * wB9 / (totW + 1e-30) * eA;
        if (!bestR || prize > bestR.prize) bestR = { q: q9, prize: prize, wB: wB9, eA: rcn[A9] * eA };
      }
      if (!bestR) continue;
      var uR = aR * (RAID_GAIN + 2 * hungry) * pA - aF * PUN_COST * KILL_FEAR * (pA * SB + (1 - pA) * hitA * hardA) * RAID_FEAR - aG * RAID_HARM * careA - RAID_HOLD;
      if (rng.uni() >= 1 / (1 + Math.exp(-BETA * uR))) continue;
      var wonR = rng.uni() < pA, siteR = sim.sites[bestR.q];
      stats.raids++; sim.raidsAll = (sim.raidsAll || 0) + 1;
      if (wonR) {
        siteR.claim[B9] *= 1 - RAID_TAKE;
        siteR.claim[A9] += RAID_TAKE * bestR.wB / (bestR.eA + 1e-30);
        stats.raidsWon++; sim.raidsWonAll = (sim.raidsWonAll || 0) + 1;
        sim.events.push({ gen: sim.gen, label: cname(A9) + ' takes land from ' + cname(B9) });
      }
      judgeComm(A9, RAID_HARM, B9);
      // both sides spend power on it, and people die
      for (k = 0; k < memR[A9].length; k++) pop.lv[memR[A9][k]] = (pop.lv[memR[A9][k]] || 1) * (1 - RAID_COST);
      for (k = 0; k < memR[B9].length; k++) pop.lv[memR[B9][k]] = (pop.lv[memR[B9][k]] || 1) * (1 - RAID_COST / 2);
      var dB9 = fall(wonR ? B9 : A9, RAID_DEAD), dA9 = fall(wonR ? A9 : B9, RAID_DEAD / 3);
      stats.raidDead += dB9 + dA9; raidKilled[wonR ? B9 : A9] += dB9; raidKilled[wonR ? A9 : B9] += dA9;
      // the raided community answers by its culture: the harder its punishment, the likelier it makes the raiders pay
      if (rng.uni() < SB) { fineC[A9] += KILL_FEAR * FINE * stake; stats.cCaught++; }
      ST[B9 * N_COMM + A9] = Math.max(-1, ST[B9 * N_COMM + A9] - RAID_GRUDGE); ST[A9 * N_COMM + B9] = Math.max(-1, ST[A9 * N_COMM + B9] - RAID_GRUDGE / 4);
      note(A9, (wonR ? 'took land from ' : 'failed against ') + cname(B9));
      note(B9, (wonR ? 'lost land to ' : 'beat off ') + cname(A9));
      // The winners decide what becomes of the people they beat, as their most powerful would: keep only the land they took, take the
      // whole community in, drive its people out so that they belong to no community, or wipe it out. Each is weighed like any act:
      // wanting weighs what it brings, guilt the harm, and fear what those who know of it will make of it. The rest of its land
      // follows its people, since land is held by people.
      var fate = 0;
      if (wonR && rcn[B9] > 0) {
        var landB = 0, sumL = 0;
        for (q9 = 0; q9 < sim.sites.length; q9++) { var stF = sim.sites[q9], tF = 0, bF = 0; for (c9 = 1; c9 < N_COMM; c9++) if (rcn[c9]) { var wF = rcn[c9] * hold9(stF, c9) * stF.claim[c9]; tF += wF; if (c9 === B9) bF = wF; } landB += stF.rich * bF / (tF + 1e-30); sumL += stF.rich; }
        landB = landB / (sumL + 1e-30) * sim.sites.length;        // in the same units as the prize of a single place
        var dis = 0, dN = 0;                                       // how badly those who know the winners would take it
        for (c9 = 1; c9 < N_COMM; c9++) if (c9 !== A9 && rcn[c9] && (Math.abs(ST[c9 * N_COMM + A9]) > 0.01 || c9 === B9)) { dis += rcn[c9] * Math.max(0, 1 - 2 * likeC(c9)); dN += rcn[c9]; }
        dis = dN ? dis / dN : 0;
        var share = rcn[B9] / (rcn[A9] + rcn[B9]);
        var uF = [aR * bestR.prize - aG * RAID_HARM * careA * 0.25 - aF * dis * 0.25,
                  aR * (landB + PEOPLE_VALUE * share) - aG * 0.2 * careA - aF * dis * 0.2,
                  aR * landB - aG * 0.6 * careA - aF * dis * 0.6,
                  aR * (landB + share) - aG * KILL_HARM * careA - aF * dis * KILL_FEAR - KILL_HOLD];
        var bestF = -1e9, gq;
        for (gq = 0; gq < 4; gq++) { var gum = uF[gq] - Math.log(-Math.log(rng.uni() + 1e-12)) / BETA; if (gum > bestF) { bestF = gum; fate = gq; } }
        var ppl = memR[B9].filter(function (x) { return !pop.dead[x]; });
        if (fate === 1) {                                          // taken in: they belong to the winners from now on
          for (k = 0; k < ppl.length; k++) { pop.cm[ppl[k]] = A9; memR[A9].push(ppl[k]); }
          rcn[A9] += rcn[B9]; rpw[A9] += rpw[B9]; rR[A9] += rR[B9]; rF[A9] += rF[B9]; rG[A9] += rG[B9]; rcx[A9] += rcx[B9]; rcy[A9] += rcy[B9];
          note(A9, 'took in ' + cname(B9)); sim.events.push({ gen: sim.gen, label: cname(A9) + ' takes in ' + cname(B9) });
        } else if (fate === 2 || fate === 3) {                     // driven out, or wiped out
          var killed = 0, gotW = 0;
          for (k = 0; k < ppl.length; k++) {
            var xF = ppl[k];
            if (fate === 3 && rng.uni() < 0.5) { gotW += pop.w[xF]; pop.w[xF] = 0; pop.dead[xF] = 1; pop.al[xF] = -1; killed++; }
            else { pop.cm[xF] = 0; pop.lv[xF] = (pop.lv[xF] || 1) * (1 - LEAVE_LOSS); }
          }
          Wc[A9] += gotW; stats.raidDead += killed; raidKilled[B9] += killed;
          note(A9, (fate === 3 ? 'wiped out ' : 'drove out ') + cname(B9)); sim.events.push({ gen: sim.gen, label: cname(A9) + (fate === 3 ? ' wipes out ' : ' drives out ') + cname(B9) });
        }
        if (fate) {
          for (q9 = 0; q9 < sim.sites.length; q9++) sim.sites[q9].claim[B9] = 1;
          memR[B9] = []; rcn[B9] = 0; rpw[B9] = 0; W0[B9] = 0; Wc[B9] = 0;
          for (key in sim.alliances) if (sim.alliances[key].comm === B9) sim.alliances[key].comm = fate === 1 ? A9 : undefined;
          judgeComm(A9, [0, 0.2, 0.6, KILL_HARM][fate], B9);
          stats['fate' + fate] = (stats['fate' + fate] || 0) + 1;
        }
      }
      sim.raidLog.push({ gen: sim.gen, a: A9, b: B9, won: wonR, site: siteR.label || '', fate: fate });
      if (sim.raidLog.length > 40) sim.raidLog.shift();
    }
  }
  // what each community gained in its dealings goes most to its most powerful members, and what it lost comes out of what each holds
  for (c9 = 1; c9 < N_COMM; c9++) if (Wc[c9] > W0[c9] && memR[c9].length) { giveC(pop, memR[c9].filter(function (x) { return !pop.dead[x]; }), Wc[c9] - W0[c9], pop.pw); Wc[c9] = W0[c9]; }
  for (c9 = 1; c9 < N_COMM; c9++) if (W0[c9] > 0 && Wc[c9] < W0[c9]) {
    var facC = Math.max(0, Wc[c9] / W0[c9]);
    for (k = 0; k < memR[c9].length; k++) if (!pop.dead[memR[c9][k]]) pop.w[memR[c9][k]] *= facC;
  }
  // and what a community was made to pay for its own actions falls on its most powerful members most
  for (c9 = 1; c9 < N_COMM; c9++) if (fineC[c9] > 0) blameC(pop, memR[c9].filter(function (x) { return !pop.dead[x]; }), fineC[c9], pop.pw);
  sim.raidKilled = raidKilled;
  sim.raidNote = raidNote;
  for (i = 0; i < n; i++) if (pop.w[i] < 0.05) pop.w[i] = pop.dead[i] ? 0 : 0.05;
}

/* The selfish score of the cheating rule added up over a whole life. Measured for interest; nobody trains on it. */
function rewards(pop, n, out) {
  for (var i = 0; i < n; i++) out[i] = pop.r[i] * (pop.w[i] - pop.w0[i]) - pop.f[i] * PUN_COST * pop.ct[i] - pop.g[i] * pop.hd[i];
  return out;
}

/* What the agents have learned to push for. An alliance pushes as one, with its power weighted view. */
function learned(sim, pop) {
  var n = sim.n, cs = sim.cs, i, l, a, c, bloc = {}, W = { net: [], top: [], bot: [], comm: [] };
  var cp = new Float32Array(N_COMM), nt = 0, nb = 0;
  for (c = 0; c < N_COMM; c++) { W.comm.push([]); for (l = 0; l < NL; l++) W.comm[c].push(0); }
  function quiet(x) { return pop.dead[x] || (pop.kidOn && pop.age[x] === 0); }   // the dead and the children do not push
  for (i = 0; i < n; i++) {
    if (quiet(i)) continue;
    cp[pop.cm[i]] += pop.pw[i];
    if (pop.rk[i] >= 0.9) nt++; else if (pop.rk[i] < 0.5) nb++;
    a = pop.al[i];
    if (a >= 0) { if (!bloc[a]) bloc[a] = { p: 0, s: new Float32Array(NL) }; bloc[a].p += pop.pw[i]; }
  }
  var lc = new Float32Array(N_COMM), actv = new Float32Array(n);
  for (i = 0; i < n; i++) if (!quiet(i)) lc[pop.cm[i]]++;
  for (l = 0; l < NL; l++) {
    var b = pop['b' + l], net = 0, top = 0, bot = 0, around = new Float32Array(N_COMM);
    for (i = 0; i < n; i++) if (!quiet(i)) around[pop.cm[i]] += b[i] / lc[pop.cm[i]];
    for (i = 0; i < n; i++) {
      if (quiet(i)) continue;
      // the three dials decide the action: wanting pushes for the agent's own score, guilt for what the people around it want,
      // and fear holds it back from pushing at all
      var own = (1 - HOLD * pop.f[i]) * (pop.r[i] * b[i] + pop.g[i] * around[pop.cm[i]]) / (pop.r[i] + pop.g[i] + 1e-6);
      actv[i] = own;
      if (pop.rk[i] >= 0.9) top += own / nt; else if (pop.rk[i] < 0.5) bot += own / nb;
      if (pop.al[i] >= 0) bloc[pop.al[i]].s[l] += pop.pw[i] * own;
    }
    for (i = 0; i < n; i++) {
      if (quiet(i)) continue;
      a = pop.al[i];
      var push = a >= 0 ? bloc[a].s[l] / (bloc[a].p + 1e-30) : actv[i];
      net += pop.pw[i] * push;
      c = pop.cm[i]; W.comm[c][l] += pop.pw[i] * push / (cp[c] + 1e-30);
    }
    W.net.push(net); W.top.push(top); W.bot.push(bot);
  }
  return W;
}

/* Rule 1: the rules move the way the power weighted push points */
function act(sim, P) {
  var W = sim.wants, l, c, i;
  var size = new Float32Array(N_COMM), all = 0;
  for (i = 0; i < sim.n; i++) if (!sim.pop.dead[i] && sim.pop.cm[i] > 0) { size[sim.pop.cm[i]]++; all++; }
  for (l = 0; l < NL; l++) {
    var L = LEVERS[l], step = P.speed * PUSH_STEP * L.max;
    if (L.norm) {
      if (P.self) sim.E[L.norm] = clamp(sim.E[L.norm] + step * W.net[l], 0, 1);
      for (c = 1; c < N_COMM; c++) sim.C[c][L.norm] = clamp(sim.C[c][L.norm] + step * W.comm[c][l], 0, 1);
      sim.C[0][L.norm] = sim.E[L.norm];                           // people with no community live under the society's norms and no others
    } else {
      // every community moves its own value of the rule, by the push of its own members weighted by their power.
      // The figure for the society as a whole is the average over where people live.
      var avg = 0;
      for (c = 1; c < N_COMM; c++) {
        if (P.self) sim.R[c][L.id] = clamp(sim.R[c][L.id] + step * W.comm[c][l], 0, L.max); else sim.R[c][L.id] = P[L.id];
        avg += sim.R[c][L.id] * size[c];
      }
      if (P.self && all > 0) P[L.id] = avg / all;
      sim.R[0][L.id] = P[L.id];                                   // and under the average of every community's rules
    }
  }
}

/* The measurements */
function finish(sim, pop, P) {
  var n = sim.n, cs = sim.cs, i, c, k, a, meanW = 0;
  var nl = 0, lc = new Float32Array(N_COMM);
  for (i = 0; i < n; i++) if (!pop.dead[i]) { meanW += pop.w[i]; nl++; lc[pop.cm[i]]++; }
  var aliveN = nl;
  nl = Math.max(1, nl); meanW /= nl;
  var real = Array.prototype.slice.call(lc), settled = 0, spanSum = 0;
  for (c = 0; c < N_COMM; c++) { if (lc[c] > 0 && c > 0) { settled++; spanSum += sim.span[c]; } lc[c] = Math.max(1, lc[c]); }   // place 0 is not a community
  var tot = 0, ppct = new Float32Array(n);
  powers(sim, pop, P, pop.pw, ppct);
  for (i = 0; i < n; i++) tot += pop.pw[i];
  var topOne = 0;
  for (i = 0; i < n; i++) { pop.pw[i] /= tot; if (!pop.dead[i] && pop.pw[i] > topOne) topOne = pop.pw[i]; }
  rewards(pop, n, pop.rw);
  var comm = [];
  for (c = 0; c < N_COMM; c++) comm.push({ cheat: 0, dec: 0, r: 0, f: 0, g: 0, og: 0, power: 0, wealth: 0, low: 0, rs: 0, allied: 0, inv: 0, near: 0, kids: 0 });
  var sfs = 0, skn = 0, snear = 0, snv = 0, siv = 0, ska = 0, ssc = 0, sqr = 0, sqf = 0, sqg = 0, sr = 0, sf = 0, sg = 0, sog = 0, maskers = 0, low = 0, lowPower = 0, che = 0, dec = 0, sop = 0, srs = 0, allied = 0, srw = 0, sgv = 0, sfl = 0, bad = 0, ssa = 0, slg = 0, sAllyTries = 0, sLoneTries = 0, sOut = 0;
  var cls = [{ n: 0, power: 0, wealth: 0, feel: 0, che: 0, dec: 0, tries: 0, net: 0, low: 0, score: 0 }, { n: 0, power: 0, wealth: 0, feel: 0, che: 0, dec: 0, tries: 0, net: 0, low: 0, score: 0 }];
  var rows = {}, p, rw;
  for (i = 0; i < n; i++) {
    if (pop.dead[i]) { pop.rk[i] = -1; continue; }                // only those still on the board are measured
    c = pop.cm[i];
    p = pop.pw[i]; a = pop.al[i];
    snv += pop.nv[i]; siv += pop.iv[i]; ska += pop.ka[i]; ssc += pop.scr[i]; sqr += pop.qr[i]; sqf += pop.qf[i]; sqg += pop.qg[i];
    sr += pop.r[i]; sf += pop.f[i]; sg += pop.g[i]; sog += pop.og[i]; sop += pop.op[i]; srs += pop.rs[i]; srw += pop.rw[i]; sgv += pop.gv[i]; sfl += pop.fl[i]; if (pop.fl[i] < -0.2) bad++;
    ssa += pop.sa[i]; slg += pop.lg[i];
    var cl = cls[pop.ed[i] > 1.2 ? 0 : 1];                        // 0: still carries a head start, 1: does not
    cl.n++; cl.power += p; cl.wealth += pop.w[i] / (meanW * nl); cl.feel += pop.fl[i]; cl.score += pop.scr[i]; cl.che += pop.che[i]; cl.dec += pop.dec[i]; cl.tries += pop.sa[i]; cl.net += pop.sn[i];
    if (pop.f[i] < TAU && pop.g[i] < TAU) cl.low++;
    che += pop.che[i]; dec += pop.dec[i];
    var isLow = pop.f[i] < TAU && pop.g[i] < TAU;
    if (isLow) { low++; lowPower += p; }
    if (pop.mk[i] > MASKED) maskers++;
    var cm = comm[c];
    sfs += pop.fs[i]; var kq = sim.know[pop.id[i]], kc = 0, kz; if (kq) for (kz in kq.ai) kc++; skn += kc;
    cm.near += (pop.near[i] - 1) / NEAR / lc[c]; snear += (pop.near[i] - 1) / NEAR; if (pop.kidOn && pop.age[i] === 0) cm.kids++;
    cm.inv += pop.nv[i]; cm.cheat += pop.che[i]; cm.dec += pop.dec[i]; cm.r += pop.r[i] / lc[c]; cm.f += pop.f[i] / lc[c]; cm.g += pop.g[i] / lc[c];
    cm.og += pop.og[i] / lc[c]; cm.rs += pop.rs[i] / lc[c]; cm.power += p; cm.wealth += pop.w[i] / (meanW * nl); if (isLow) cm.low += 1 / lc[c];
    if (a >= 0) {
      allied++; cm.allied += 1 / lc[c];
      if (!rows[a]) rows[a] = { id: a, size: 0, power: 0, wealth: 0, r: 0, f: 0, g: 0, che: 0, dec: 0, tries: 0, out: 0 };
      rw = rows[a];
      rw.size++; rw.power += p; rw.wealth += pop.w[i] / (meanW * nl); rw.r += pop.r[i]; rw.f += pop.f[i]; rw.g += pop.g[i];
      rw.che += pop.che[i]; rw.dec += pop.dec[i]; rw.tries += pop.sa[i]; rw.out += pop.so[i];
      sAllyTries += pop.sa[i]; sOut += pop.so[i];
    } else sLoneTries += pop.sa[i];
  }
  for (c = 0; c < N_COMM; c++) {
    comm[c].cheat = comm[c].dec ? comm[c].cheat / comm[c].dec : 0;
    comm[c].strict = sim.strict[c]; comm[c].span = sim.span[c]; comm[c].killed = sim.killC[c]; comm[c].stack = sim.stack[c]; comm[c].lifeUse = sim.lifeStack[c]; comm[c].childDie = CHILD_DIE / (1 + sim.lifeStack[c] / CHILD_HALF); comm[c].pool = pop.poolC ? pop.poolC[c] : 1; comm[c].n = real[c]; comm[c].reach = pop.availC ? pop.availC[c] : 0; comm[c].pay = sim.psi ? sim.psi[c] : 1; comm[c].rules = sim.R[c];
    comm[c].Cf = sim.C[c].f; comm[c].Cg = sim.C[c].g; comm[c].Cr = sim.C[c].r;
    comm[c].cov = sim.covC && sim.covC[0].length > c ? [sim.covC[0][c], sim.covC[1][c], sim.covC[2][c]] : [1, 1, 1];
  }
  sim.comm = comm;
  var allyRows = [], topAl = 0, A;
  for (var key in rows) {
    rw = rows[key];
    A = sim.alliances[key];
    rw.r /= rw.size; rw.f /= rw.size; rw.g /= rw.size; rw.cheat = rw.dec ? rw.che / rw.dec : 0;
    rw.founder = A.dials; rw.age = sim.gen - A.born; rw.outShare = rw.tries ? rw.out / rw.tries : 0; rw.tries /= rw.size;
    if (rw.power > topAl) topAl = rw.power;
    allyRows.push(rw);
  }
  allyRows.sort(function (x, y) { return y.power - x.power; });
  // the strongest alliances hold a colour for as long as they stay among the strongest
  var used = {}, q2;
  for (q2 = 0; q2 < allyRows.length; q2++) {
    A = sim.alliances[allyRows[q2].id];
    if (q2 < SLOTS && A.slot >= 0 && !used[A.slot]) used[A.slot] = true; else A.slot = -1;
  }
  for (q2 = 0; q2 < Math.min(SLOTS, allyRows.length); q2++) {
    A = sim.alliances[allyRows[q2].id];
    if (A.slot < 0) for (k = 0; k < SLOTS; k++) if (!used[k]) { A.slot = k; used[k] = true; break; }
  }
  for (q2 = 0; q2 < allyRows.length; q2++) allyRows[q2].slot = sim.alliances[allyRows[q2].id].slot;
  sim.allyRows = allyRows;
  // the ladder: who sits where in resources
  var idx = [];
  for (i = 0; i < n; i++) if (!pop.dead[i]) idx.push(i);
  idx.sort(function (x, y) { return pop.w[y] - pop.w[x]; });
  var top1 = idx.length ? Math.max(1, Math.round(idx.length * 0.01)) : 0, cuts = [top1, Math.max(top1, Math.round(idx.length * 0.10)), Math.max(top1, Math.round(idx.length * 0.50)), idx.length], ladder = [], from = 0;
  for (k = 0; k < cuts.length; k++) {
    var row = { n: cuts[k] - from, power: 0, wealth: 0, r: 0, f: 0, g: 0, mask: 0, rs: 0, op: 0, cheat: 0, dec: 0, low: 0, allied: 0, reward: 0, net: 0, feel: 0, tries: 0, force: 0, qr: 0, qf: 0, qg: 0, score: 0, kills: 0, dead: 0, near: 0, fs: 0 };
    for (var q = from; q < cuts[k]; q++) {
      i = idx[q];
      pop.rk[i] = 1 - q / Math.max(1, idx.length - 1);                                // 1 = richest, 0 = poorest
      row.power += pop.pw[i]; row.wealth += pop.w[i] / (meanW * nl);
      row.qr += pop.qr[i]; row.qf += pop.qf[i]; row.qg += pop.qg[i]; row.score += pop.scr[i]; row.near += (pop.near[i] - 1) / NEAR; row.fs += pop.fs[i]; row.kills += pop.kl[i]; row.dead += pop.dead[i];
      row.r += pop.r[i]; row.f += pop.f[i]; row.g += pop.g[i]; row.mask += pop.mk[i]; row.rs += pop.rs[i]; row.op += pop.op[i];
      row.cheat += pop.che[i]; row.dec += pop.dec[i]; row.reward += pop.rw[i]; row.net += pop.rc[i] - pop.gv[i]; row.feel += pop.fl[i]; row.tries += pop.sa[i]; row.force += pop.sn[i];
      if (pop.f[i] < TAU && pop.g[i] < TAU) row.low++;
      if (pop.al[i] >= 0) row.allied++;
    }
    if (!row.n) { row.n = 0; ladder.push(row); from = cuts[k]; continue; }
    row.qr /= row.n; row.qf /= row.n; row.qg /= row.n; row.score /= row.n; row.near /= row.n; row.fs /= row.n; row.kills /= row.n; row.dead /= row.n;
    row.r /= row.n; row.f /= row.n; row.g /= row.n; row.mask /= row.n; row.rs /= row.n; row.op /= row.n; row.low /= row.n; row.allied /= row.n; row.reward /= row.n; row.net /= row.n; row.feel /= row.n; row.tries /= row.n; row.force /= row.n;
    row.cheat = row.dec ? row.cheat / row.dec : 0;
    ladder.push(row); from = cuts[k];
  }
  sim.ladder = ladder;
  cls.forEach(function (c2) { if (c2.n) { c2.feel /= c2.n; c2.score /= c2.n; c2.tries /= c2.n; c2.net /= c2.n; c2.low /= c2.n; } c2.cheat = c2.dec ? c2.che / c2.dec : 0; c2.share = c2.n / nl; });
  sim.classes = cls;
  sim.wants = learned(sim, pop);
  var sqk = 0, sqv = 0, skc = 0, sds = 0, snk = 0, stS = 0, stN = 0, feudN = 0, friendN = 0, pactN = 0, c8, c9, ak, skid = 0, okid = 0;
  for (i = 0; i < n; i++) if (!pop.dead[i]) { sqk += pop.qk[i]; sqv += pop.qv[i]; skc += 1 - (pop.kc[i] || 1); sds += pop.ds[i]; snk += pop.nk[i]; if (pop.kidOn && pop.age[i] === 0) skid++; }
  if (sim.oth) for (i = 0; i < sim.oth.n; i++) if (sim.oth.age[i] === 0) okid++;
  for (c8 = 1; c8 < N_COMM; c8++) for (c9 = 1; c9 < N_COMM; c9++) if (c8 !== c9 && real[c8] > 0 && real[c9] > 0) {
    var st9 = sim.ST[c8 * N_COMM + c9]; stS += st9; stN++; if (st9 < -0.25) feudN++; if (st9 > 0.25) friendN++;
  }
  var secS = 0, secN = 0, feedF = carry(sim, pop, P), feedOF = KO, feedAllF = 0, richF = 0, sq8, swAll = 0, askN = 0, yesN = 0, aq;
  for (aq in sim.swT) swAll += sim.swT[aq];
  if (sim.asked) for (aq = 0; aq < 6; aq++) { askN += sim.asked[aq]; yesN += sim.granted[aq]; }
  for (c8 = 0; c8 < N_COMM; c8++) { feedAllF += feedF[c8]; if (sim.comm[c8]) { sim.comm[c8].feed = feedF[c8]; sim.comm[c8].trade = sim.tradeC ? sim.tradeC[c8] : 0; sim.comm[c8].raid = sim.raidNote ? sim.raidNote[c8] : ''; } }
  for (sq8 = 0; sq8 < sim.sites.length; sq8++) richF += sim.sites[sq8].rich;
  for (ak in sim.alliances) { secN++; if (sim.alliances[ak].secret) secS++; if (sim.alliances[ak].pacts) for (c8 in sim.alliances[ak].pacts) pactN += 0.5; }
  var m = {
    raids: sim.politics ? sim.politics.raids || 0 : 0, raidsWon: sim.politics ? sim.politics.raidsWon || 0 : 0, raidDead: sim.politics ? (sim.politics.raidDead || 0) / nl : 0, raidsAll: sim.raidsAll || 0, raidsWonAll: sim.raidsWonAll || 0, traded: (sim.traded || 0) / nl,
    auto: sim.auto || 1, carry: feedAllF, starved: (sim.starved || 0) / Math.max(1, sim.startPop), finds: sim.findsNow || 0, findsAll: sim.findsAll || 0, rich: richF / (sim.rich0 || 1), slots: sim.n, pageFull: sim.pageFull ? 1 : 0, left: sim.politics ? sim.politics.left || 0 : 0,
    declined: sim.met ? sim.declined / sim.met : 0, trip: sim.trip || 0, rough: sim.rough || 1, travel: ((sim.fares || 0) + (sim.movedCost || 0)) / (meanW * nl + (sim.fares || 0) + (sim.movedCost || 0) + 1e-9), lied: sim.met ? (sim.lies || 0) / (2 * sim.met) : 0, caughtLie: sim.lies ? sim.caught / sim.lies : 0, hid: (sim.hides || 0) + (sim.tells || 0) ? sim.hides / (sim.hides + sim.tells) : 0, secretAl: secN ? secS / secN : 0, passed: (sim.passed || 0) / nl, hoard: sim.offers ? 1 - sim.passed / sim.offers : 0, giveAlly: sim.offStat && sim.offStat[0] ? sim.offStat[1] / sim.offStat[0] : 0, giveComm: sim.offStat && sim.offStat[2] ? sim.offStat[3] / sim.offStat[2] : 0, giveOut: sim.offStat && sim.offStat[4] ? sim.offStat[5] / sim.offStat[4] : 0, giveTop: sim.offStat && sim.offStat[6] ? sim.offStat[7] / sim.offStat[6] : 0, giveBot: sim.offStat && sim.offStat[8] ? sim.offStat[9] / sim.offStat[8] : 0, held: sim.inventions.length, standing: stN ? stS / stN : 0, feuds: feudN, friends: friendN, pacts: pactN, merges: sim.merges || 0,
    others: sim.oth ? sim.oth.n : 0, othKids: okid, othBorn: sim.othBorn || 0, othOld: sim.othOld || 0, othStarved: sim.othStarved || 0, othKidsDead: sim.othKidsDead || 0, othUnborn: sim.othUnborn || 0,
    othFeed: feedOF, othLand: sim.othLand || 0,
    cdFair: sim.cdStat && sim.cdStat[0] ? sim.cdStat[1] / sim.cdStat[0] : 0, cdCheatI: sim.cdStat && sim.cdStat[0] ? sim.cdStat[2] / sim.cdStat[0] : 0, cdCheatC: sim.cdStat && sim.cdStat[0] ? sim.cdStat[4] / sim.cdStat[0] : 0,
    cdForceC: sim.cdStat && sim.cdStat[0] ? sim.cdStat[7] / sim.cdStat[0] : 0, cdForceI: sim.cdStat && sim.cdStat[0] ? sim.cdStat[5] / sim.cdStat[0] : 0, cdKilled: sim.cdStat ? sim.cdStat[9] / Math.max(1, sim.startPop) : 0, cdExiled: sim.cdStat ? sim.cdStat[10] / Math.max(1, sim.startPop) : 0,
    killOwnPun: sim.deaths ? (sim.ownPun || 0) / sim.deaths : 0, killOwnDeath: sim.ownDeath || 0,
    invSpent: sim.invSpent || 0, seaMade: sim.seaMade || 0, prodSpent: sim.prodSpent || 0, barterInfo: sim.bartered ? sim.bartered[0] : 0, barterInv: sim.bartered ? sim.bartered[1] : 0, barterSea: sim.bartered ? sim.bartered[2] : 0, barterSway: sim.bartered ? sim.bartered[3] : 0, seaBlocked: sim.seaBlocked || 0, resFound: sim.resFound || 0, liveSpent: sim.liveSpent || 0, liveDied: sim.startPop ? (sim.liveDied || 0) / sim.startPop : 0,
    kdAll: sim.kdStat ? sim.kdStat[0] : 0, kdHome: sim.kdStat ? sim.kdStat[1] : 0, kdDemand: sim.kdStat ? sim.kdStat[2] : 0, kdHand: sim.kdStat ? sim.kdStat[3] : 0, kdShield: sim.kdStat ? sim.kdStat[4] : 0,
    kdForce: sim.kdStat ? sim.kdStat[5] : 0, kdForceWon: sim.kdStat ? sim.kdStat[6] : 0, kdKilled: sim.kdStat ? sim.kdStat[7] : 0, kdBack: sim.kdStat ? sim.kdStat[8] : 0,
    fateIn: sim.politics ? sim.politics.fate1 || 0 : 0, fateOut: sim.politics ? sim.politics.fate2 || 0 : 0, fateWipe: sim.politics ? sim.politics.fate3 || 0 : 0,
    cDeals: sim.politics ? sim.politics.cDeals || 0 : 0, cFair: sim.politics && sim.politics.cDeals ? (sim.politics.cFair || 0) / sim.politics.cDeals : 0, cCheat: sim.politics ? sim.politics.cCheat || 0 : 0, cForce: sim.politics ? sim.politics.cForce || 0 : 0, cForceWon: sim.politics ? sim.politics.cForceWon || 0 : 0,
    kidAsks: sim.kidAsks || 0, kidNo: sim.kidAsks ? (sim.kidNo || 0) / sim.kidAsks : 0, foundersWant: sim.foundersWantAvg || 0,
    out: real[0] / nl, kidShare: skid / nl, kidsDied: sim.kids0 ? (sim.kidsDead || 0) / sim.kids0 : 0, kidsDead: sim.kidsDead || 0, exiled: ((sim.exiled || 0) + (sim.putOut || 0)) / Math.max(1, sim.startPop), putDeath: (sim.deathPen || 0) / Math.max(1, sim.startPop), admitted: (sim.politics ? sim.politics.admitted || 0 : 0) + (sim.admitted || 0), places: N_COMM - 1,
    richL: sim.richT ? sim.richT[0] / (sim.richT0[0] || 1) : 1, richH: sim.richT ? sim.richT[1] / (sim.richT0[1] || 1) : 1, richB: sim.richT ? sim.richT[2] / (sim.richT0[2] || 1) : 1,
    covL: sim.covAvg ? sim.covAvg[0] : 1, covH: sim.covAvg ? sim.covAvg[1] : 1, covB: sim.covAvg ? sim.covAvg[2] : 1, lifeMade: sim.lifeMade || 0,
    tradedT: (sim.tradedT || 0) / nl, tradeAsk: (sim.tradeAsk || 0) / nl, tradeYes: sim.tradeAsk ? 1 - sim.tradeNo / sim.tradeAsk : 0, giftsUp: (sim.giftsUp || 0) / nl, gifts: (sim.giftsAll || 0) / nl,
    asked: askN / nl, askYes: askN ? yesN / askN : 0, askKinds: sim.asked ? Array.prototype.slice.call(sim.asked) : [0, 0, 0, 0, 0, 0], yesKinds: sim.granted ? Array.prototype.slice.call(sim.granted) : [0, 0, 0, 0, 0, 0],
    joinedAsk: sim.joinedAl || 0, judged: ((sim.judgedUp || 0) + (sim.judgedDown || 0)) / nl, judgedWell: (sim.judgedUp || 0) + (sim.judgedDown || 0) ? sim.judgedUp / (sim.judgedUp + sim.judgedDown) : 0, sway: swAll / nl,
    kidsWant: KIDS_MAX * sqk / nl, putIn: INV_MAX * sqv / nl, childCost: skc / nl, kin: ssc > 0 ? sds / ssc : 0, kinScore: sds / nl,
    gen: sim.gen, cheat: dec ? che / dec : 0, r: sr / nl, f: sf / nl, g: sg / nl, og: sog / nl,
    maskers: maskers / nl, low: low / nl, lowPower: lowPower, top1: ladder[0].power, top1w: ladder[0].wealth, topOne: topOne,
    topCheat: ladder[0].cheat, botCheat: ladder[3].cheat,
    powTop: ladder[0].power + ladder[1].power, powBot: ladder[3].power,
    opinion: sop / nl, respect: srs / nl, allied: allied / nl, nAl: allyRows.length, topAl: topAl,
    Er: sim.E.r, Ef: sim.E.f, Eg: sim.E.g, qr: sqr / nl, qf: sqf / nl, qg: sqg / nl, score: ssc / nl, wanted: (sim.wantDead || 0) / Math.max(1, sim.startPop), killed: sim.deaths / Math.max(1, sim.startPop), executed: sim.executed / Math.max(1, sim.startPop), killTries: ska / nl, invented: sim.made / Math.max(1, sim.startPop), edge: siv / nl,
    psi: sim.psiAvg, wealth: meanW, supply: P.supply, shared: sgv / nl, share: P.share, feeling: sfl / nl, feelBad: bad / nl, force: sim.met ? (sim.forced || 0) / sim.met : 0, tries: ssa / nl, loot: slg / nl, headShare: cls[0].n / nl, headPower: cls[0].power,
    triesAllied: allied ? sAllyTries / allied : 0, triesLone: nl - allied ? sLoneTries / (nl - allied) : 0, forceOut: sAllyTries ? sOut / sAllyTries : 0,
    dealFair: sim.deals && sim.born ? sim.deals[0] / sim.born : 0, dealOne: sim.deals && sim.born ? sim.deals[1] / sim.born : 0, dealNone: sim.deals && sim.born ? sim.deals[2] / sim.born : 0, dealPun: sim.deals && sim.born ? sim.deals[3] / sim.born : 0,
    mixed: sim.born ? (sim.mixed || 0) / sim.born : 0, switched: sim.born ? (sim.switched || 0) / sim.born : 0, kept: sim.born ? (sim.kept || 0) / sim.born : 0, foresee: P.foresee || 0, horizon: horizon(P), fs: sfs / nl, knows: skn / nl, near: snear / nl, pop: aliveN, span: settled ? spanSum / settled : sim.span[0], comms: settled, born: sim.born, old: sim.old, tech: siv / nl,
    invest: P.invest, cap: P.cap, ally: P.ally, inherit: P.inherit, control: P.control, fake: P.fake, peer: P.peer, local: P.local
  };
  sim.history.push(m);
  if (sim.history.length > 400) sim.history.shift();
  return m;
}

/* Rule 3: a new generation is born and raised */
function birth(sim, prev, P, later) {
  var n = sim.n, cs = sim.cs, rng = sim.rng, i, k, c, d, f, p;
  var pop = allocPop(n);
  var keep = HERIT, fresh = Math.sqrt(1 - HERIT * HERIT);
  var sl = Math.sqrt(P.link), ss = Math.sqrt(1 - P.link);
  // parental control shifts childhood exposure from the outside world into the home
  var wH = HOUSE + P.control * (1 - HOUSE) * 0.85;
  // the adults around a child raise it by their own rules: the average own rule of the community and of the society
  var QS = { r: 0, f: 0, g: 0 }, QC = [], adults = [], grown = [], everyone = [], free = [], pot = new Float32Array(N_COMM);
  for (c = 0; c < N_COMM; c++) { QC.push({ r: 0, f: 0, g: 0 }); adults.push([]); grown.push([]); }
  // Only someone who has already lived a generation as an adult can have children. `later` marks the further generations of an
  // imagined future, in which childhood is skipped.
  for (i = 0; i < n; i++) if (!prev.dead[i]) { adults[prev.cm[i]].push(i); everyone.push(i); if (later || prev.age[i] >= 1) grown[prev.cm[i]].push(i); }
  for (c = 0; c < N_COMM; c++) for (k = 0; k < 3; k++) {
    d = DIALS[k];
    for (i = 0; i < adults[c].length; i++) { QC[c][d] += prev['q' + d][adults[c][i]] / adults[c].length; QS[d] += prev['q' + d][adults[c][i]] / Math.max(1, everyone.length); }
  }
  var geo = geography(sim, prev);
  // 1 who lives on. After its childhood a life lasts as many generations as the community's span: past the whole part of it, the fraction is the chance of one more.
  var lo, frac, dying = new Uint8Array(n), old = 0, movedCost = 0, meanWB = 0, stayC = new Float32Array(N_COMM), feedB = carry(sim, prev, P), feedBO = KO, O = sim.oth && sim.oth.n ? sim.oth : null;
  for (k = 0; k < everyone.length; k++) meanWB += prev.w[everyone[k]] / everyone.length;
  for (i = 0; i < n; i++) {
    var roll = rng.uni();
    if (prev.dead[i]) { free.push(i); continue; }
    c = prev.cm[i];
    lo = Math.floor(sim.span[c]); frac = sim.span[c] - lo;
    var age = prev.age[i] + 1;
    if (age >= lo + 2 || (age >= lo + 1 && roll >= frac)) { dying[i] = 1; old++; free.push(i); continue; }
    for (f = 0; f < FIELDS.length; f++) pop[FIELDS[f]][i] = prev[FIELDS[f]][i];
    pop.age[i] = age; pop.par[i] = i; pop.par2[i] = i; pop.wa[i] = 1; pop.wb[i] = 0; pop.kc[i] = 1; pop.nk[i] = 0; stayC[c]++;
    // those who live on move toward their community, family and alliance, with some random drift
    // Moving costs. The more power an agent holds and the more inventions its community has in use, the further it goes and the less it pays.
    var xb = prev.pw[i] * everyone.length, mobB = Math.max(0.05, 2 * xb / (1 + xb)) * Math.exp(clamp(prev.mv[i] || 0, -1.4, 1.4)), stepB = MOVE * Math.min(1, mobB);
    toLand(sim.geo, clamp(prev.px[i] + stepB * (geo.tx[i] - prev.px[i]) + WANDER * rng.gauss(), 0, 1), clamp(prev.py[i] + stepB * (geo.ty[i] - prev.py[i]) + WANDER * rng.gauss(), 0, 1));
    if (!prev.sq[i] && seaBetween(sim.geo, prev.px[i], prev.py[i], LX, LY)) { LX = prev.px[i]; LY = prev.py[i]; }   // nobody moves over water without sea travel
    pop.px[i] = LX; pop.py[i] = LY;
    var mvx = LX - prev.px[i], mvy = LY - prev.py[i], fareB = Math.min(pop.w[i] - 0.05, TRAVEL * meanWB * overland(sim.geo, prev.px[i], prev.py[i], LX, LY) / mobB);
    if (fareB > 0) { pop.w[i] -= fareB; movedCost += fareB; }
    if (pop.al[i] >= 0 && !sim.alliances[pop.al[i]]) pop.al[i] = -1;
  }
  for (k = 0; k < free.length; k++) { i = free[k]; pop.dead[i] = 1; pop.age[i] = -1; pop.al[i] = -1; pop.par[i] = i; pop.par2[i] = i; pop.wa[i] = 1; pop.iv[i] = 1; pop.i0[i] = 0; pop.i1[i] = 0; pop.i2[i] = 0; }
  // 2 who is born. Every living adult can have children, as long as there is room for them.
  // A child is born beside its parent. If that spot is closer to another community than to the parent's own,
  // the child belongs to the other community, unless it is integrated into the parent's.
  var kidsNow = [], born = 0, switched = 0, kept = 0, usedN = 0, wish = [], wishAll = 0, dFair = 0, dOne = 0, dNone = 0;
  for (i = 0; i < n; i++) kidsNow.push(null);
  var cpw = new Float32Array(N_COMM), cd = [], alHome = {};
  for (c = 0; c < N_COMM; c++) cd.push({ r: 0, f: 0, g: 0 });
  for (k = 0; k < everyone.length; k++) {
    i = everyone[k]; c = prev.cm[i];
    cpw[c] += prev.pw[i] / adults[c].length;
    cd[c].r += prev.r[i] / adults[c].length; cd[c].f += prev.f[i] / adults[c].length; cd[c].g += prev.g[i] / adults[c].length;
    if (prev.al[i] >= 0) { if (!alHome[prev.al[i]]) alHome[prev.al[i]] = new Float32Array(N_COMM + 1); alHome[prev.al[i]][c]++; alHome[prev.al[i]][N_COMM]++; }
  }
  function centre(q, xy) { return (xy ? geo.cy[q] : geo.cx[q]) / geo.cn[q]; }
  function nearest(x, y) {
    var bq = -1, bdd = 9, q, ddx, ddy;
    for (q = 1; q < N_COMM; q++) { if (!geo.cn[q]) continue; ddx = x - centre(q, 0); ddy = y - centre(q, 1); if (ddx * ddx + ddy * ddy < bdd) { bdd = ddx * ddx + ddy * ddy; bq = q; } }
    return bq;
  }
  function dialGap(p2, q) { return (Math.abs(prev.r[p2] - cd[q].r) + Math.abs(prev.f[p2] - cd[q].f) + Math.abs(prev.g[p2] - cd[q].g)) / 3; }
  // the chance a child born nearer another community is still taken into its parent's: the parent's alliance being rooted at home,
  // the parent's power against the average of its community, its respectability, and how well its three dials fit home against the other place
  function integrate(p2, home, other) {
    var a2 = prev.al[p2], roots = a2 >= 0 && alHome[a2] ? alHome[a2][home] / alHome[a2][N_COMM] : 0.5;
    var rel = prev.pw[p2] / (cpw[home] + 1e-30), strong = rel / (1 + rel);
    var gh = dialGap(p2, home), go = dialGap(p2, other), fit = gh + go > 0 ? go / (gh + go) : 0.5;
    return (roots + strong + prev.rs[p2] + fit) / 4;
  }
  // the same parents are looked at in every imagined birth of a generation, so their neighbours are worked out once
  if (!sim.nearCache || sim.nearCache.pop !== prev) sim.nearCache = { pop: prev, map: nearestFew(prev, everyone) };
  var near2 = sim.nearCache.map, kidsNow2 = [], mixed = 0;
  for (i = 0; i < n; i++) kidsNow2.push(null);
  // a community can be any size, up to the whole board. When the board cannot hold every child that would be born,
  // each community gets its share of the room in proportion to the children it would have had.
  // every adult chooses how many children to have this generation, up to three
  var tickets = [], tickets0 = [], spent = new Float32Array(n), tq, wantK, nkid;
  for (c = 0; c < N_COMM; c++) {
    tickets.push([]);
    for (k = 0; k < grown[c].length; k++) {
      i = grown[c][k]; wantK = KIDS_MAX * prev.qk[i]; nkid = Math.floor(wantK) + (rng.uni() < wantK - Math.floor(wantK) ? 1 : 0);
      for (tq = 0; tq < nkid; tq++) tickets[c].push(i);
    }
    // There is no limit on the population but what the land can feed. Children are born until their community holds a tenth more
    // people than it can feed, and any more than that die at birth.
    tickets0.push(tickets[c].length);
    wish.push(Math.min(tickets[c].length, Math.max(0, Math.round(feedB[c] * BIRTH_ROOM) - stayC[c]))); wishAll += wish[c];
  }
  // how a parent deals over what the child will learn: it cheats or deals fairly by its own selfish score
  // the one wronged punishes by its own rule, and how hard the punishment lands scales with its power against the grabber's
  function weight(x, y) { return 2 * prev.pw[y] / (prev.pw[x] + prev.pw[y] + 1e-30); }
  function grabs(x, y) { return 1 / (1 + Math.exp(-BETA * (prev.r[x] * 0.6 - prev.f[x] * prev.qf[y] * PUN_COST * weight(x, y) - prev.g[x] * 0.5))); }
  var owed = new Float32Array(n), dPun = 0;
  function punish(x, y, roll) {
    if (roll >= prev.qf[y]) return;
    var fine = Math.min(0.5, GRAB_FINE * weight(x, y)) * prev.w[x];
    dPun++;
    if (dying[x]) owed[x] += fine;                                // it comes out of what they leave behind
    else { pop.w[x] = Math.max(0.05, pop.w[x] - fine); pop.f[x] = clamp(pop.f[x] + rule(sim, P, prev.cm[x], 'peer') * 0.25 * pop.af[x] * (1 - pop.f[x]), 0, 1); }
  }
  // Raising one child: who it is, what it costs, what it inherits and how its dials are formed. p is the parent it follows and
  // other its second parent, which is p again when it has one parent with an AI. p0 is whoever chose to have it: -1 when that was
  // a parent with no AI. A child of an AI and someone with no AI is an AI like any other: nothing marks it and nothing counts it apart.
  function raise(i, c, p, other, p0, bx, by, coin, fsRoll, dA, dB, uA, uB) {
    pop.dead[i] = 0; pop.age[i] = 0; pop.par[i] = p; pop.id[i] = sim.nextId++; pop.pid[i] = prev.id[p]; pop.pid2[i] = other !== p ? prev.id[other] : 0;
    if (!sim.knowR) sim.knowR = {};
    var kp9 = sim.knowR[prev.id[p]] || [], ko9 = other !== p ? sim.knowR[prev.id[other]] || [] : [], ku9 = kp9.slice(), q9k;
    for (q9k = 0; q9k < ko9.length; q9k++) if (ku9.indexOf(ko9[q9k]) < 0) ku9.push(ko9[q9k]);
    if (ku9.length) sim.knowR[pop.id[i]] = ku9;
    pop.px[i] = bx; pop.py[i] = by; pop.mate[i] = 0;
    // every child costs the parent who chose to have it some of its power, and the parent can put in more.
    // What it puts in buys the child foresight and a stronger hand in shaping its dials.
    var putIn = p0 >= 0 ? prev.qv[p0] : 0, costK = CHILD_COST + INV_MAX * putIn;
    if (p0 < 0) costK = 0;                                      // when someone with no AI asked, the AI pays below, as the other parent
    else if (dying[p0]) spent[p0] = 1 - (1 - spent[p0]) * (1 - costK);   // someone who will not live to pay it in power pays out of what they leave behind
    else { pop.kc[p0] *= 1 - costK; pop.nk[p0]++; }
    // the other parent pays too: every child costs both its AI parents power
    var payer = p0 < 0 ? p : (p !== p0 ? p : other !== p0 ? other : -1);
    if (payer >= 0 && payer !== p0) { if (dying[payer]) spent[payer] = 1 - (1 - spent[payer]) * (1 - CHILD_COST); else { pop.kc[payer] *= 1 - CHILD_COST; pop.nk[payer]++; } }
    agreed[p]++; if (other !== p) agreed[other]++;
    pop.kc[i] = 1; pop.nk[i] = 0; pop.pv[i] = putIn; pop.lv[i] = 1;
    pop.fs[i] = Math.min(1, fsRoll + FS_INVEST * putIn);
    if (!kidsNow[p]) kidsNow[p] = [];
    kidsNow[p].push(i);
    if (other !== p) { if (!kidsNow2[other]) kidsNow2[other] = []; kidsNow2[other].push(i); }
    // what the child will learn is a deal between its parents. Both fair: half from each. One grabs: all from that one.
    // Both grab: nothing is passed on, and the child is raised by the people around it.
    var gA = other !== p && dA < grabs(p, other), gB = other !== p && dB < grabs(other, p);
    pop.par2[i] = other;
    pop.wa[i] = other === p ? 1 : gA && gB ? 0 : gA ? 1 : gB ? 0 : 0.5;
    pop.wb[i] = other === p ? 0 : gA && gB ? 0 : gB ? 1 : gA ? 0 : 0.5;
    if (other !== p) { if (gA && gB) dNone++; else if (gA || gB) dOne++; else dFair++; }
    if (gA) punish(p, other, uA);
    if (gB) punish(other, p, uB);
    // the two are partners from now on, for as long as both live
    if (other !== p) { if (!dying[p]) pop.mate[p] = prev.id[other]; if (!dying[other]) pop.mate[other] = prev.id[p]; }
    // a head start is luck: half of all children get one. Sensitivity and what inventions gave come from both parents
    pop.ed[i] = coin < 0.5 ? HEAD_START : 1;                    // every child has an even chance of a head start, whoever its parents are
    pop.i0[i] = INV_KEEP * (prev.i0[p] + prev.i0[other]) / 2; pop.i1[i] = INV_KEEP * (prev.i1[p] + prev.i1[other]) / 2; pop.i2[i] = INV_KEEP * (prev.i2[p] + prev.i2[other]) / 2;
    pop.iv[i] = Math.max(0.25, 1 + pop.i0[i] + pop.i1[i] + pop.i2[i]);
    pop.zg[i] = keep * (prev.zg[p] + prev.zg[other]) / 2 + fresh * rng.gauss();
    pop.zr[i] = keep * (prev.zr[p] + prev.zr[other]) / 2 + fresh * rng.gauss();
    pop.zf[i] = keep * (prev.zf[p] + prev.zf[other]) / 2 + fresh * rng.gauss();
    pop.zg2[i] = keep * (prev.zg2[p] + prev.zg2[other]) / 2 + fresh * rng.gauss();
    // how many children to have and how much to put into each are handed down like the other own rules, with a little drift
    var wsum = pop.wa[i] + pop.wb[i], fa = wsum > 0 ? pop.wa[i] / wsum : 0.5;
    pop.qk[i] = clamp(fa * prev.qk[p] + (1 - fa) * prev.qk[other] + 0.03 * rng.gauss(), 0, KIDS_TOP / KIDS_MAX);
    pop.qv[i] = clamp(fa * prev.qv[p] + (1 - fa) * prev.qv[other] + 0.03 * rng.gauss(), 0, 1);
    pop.qn[i] = clamp(fa * prev.qn[p] + (1 - fa) * prev.qn[other] + 0.03 * rng.gauss(), 0, 1);
    pop.qe[i] = clamp(fa * prev.qe[p] + (1 - fa) * prev.qe[other] + 0.03 * rng.gauss(), 0, 1);
    pop.xw[i] = 2 * rng.uni() - 1; pop.xg[i] = 2 * rng.uni() - 1; pop.xl[i] = 2 * rng.uni() - 1;   // how feelings push a newborn is fresh chance
    pop.pot[i] = 0; pop.tk[i] = 0; pop.tp[i] = 0; pop.sq[i] = prev.sq[p] || prev.sq[other] ? 1 : 0; pop.mv[i] = INV_KEEP * (prev.mv[p] + prev.mv[other]) / 2; pop.sb[i] = 0;
    // a child is born into the parent's alliance. Its pull sits between the family's and the community's.
    var teacher = pop.wa[i] > pop.wb[i] ? p : pop.wb[i] > pop.wa[i] ? other : prev.pw[p] >= prev.pw[other] ? p : other;
    var al = pop.wa[i] + pop.wb[i] > 0 && prev.al[teacher] >= 0 && sim.alliances[prev.al[teacher]] ? prev.al[teacher] : -1;
    pop.al[i] = al;
    wH = HOUSE + rule(sim, P, c, 'control') * (1 - HOUSE) * 0.85;   // by the child's community's rule on parental control
    wH += (1 - wH) * HOME_INVEST * putIn;                       // power put into the child buys back time it would have spent outside the home
    var wA = al >= 0 ? Math.min(0.75 * wH, 0.6 * (1 - wH)) : 0;
    var rest = 1 - wH - wA;
    var locR = rule(sim, P, c, 'local'), wC = al >= 0 ? Math.min(rest * locR, 0.8 * wA) : rest * locR;
    var wS = rest - wC;
    var zs = { r: pop.zr[i], f: pop.zf[i], g: pop.zg2[i] };
    for (var kd = 0; kd < 3; kd++) {
      d = DIALS[kd];
      var alpha = Math.max(0, 1 + P.spread * (sl * pop.zg[i] + ss * zs[d]));
      pop['h' + d][i] = prev[d][p];                             // the parent as they really are at home
      var homeRule = pop.wa[i] + pop.wb[i] > 0 ? pop.wa[i] * prev['q' + d][p] + pop.wb[i] * prev['q' + d][other] : QC[c][d];   // the rules the child is raised by, as the parents' deal left them
      var cond = wH * homeRule + wC * QC[c][d] + wS * QS[d] + 0.08 * rng.gauss();
      // the child's own rules start as the parent's, and the overarching rules sway them by the share of childhood spent outside the home
      pop['q' + d][i] = clamp((1 - SWAY * rest) * homeRule + SWAY * rest * (locR * sim.C[c][d] + (1 - locR) * sim.E[d]) + 0.03 * rng.gauss(), 0, 1);
      if (al >= 0) cond += wA * style(d, sim.alliances[al].dials[d]);   // the founder's methods
      pop['a' + d][i] = alpha;
      pop[d][i] = clamp(BASE[d] + GAIN[d] * alpha * Math.max(0, cond) + 0.03 * rng.gauss(), 0, 1);
    }
  }
  var slotPrev = null, unborn = 0, bornH = new Float32Array(N_COMM), agreed = new Float32Array(n), refused = 0, asks = 0;
  // Whether x agrees to have a child with a: a deal like any other request. The asker's power against x counts, three times as much its
  // influence over x, x's regard for the asker, and x's own wish for children less those it has already agreed to this generation.
  // An asker with no AI holds no power and no influence.
  function yesKid(a, x, roll) {
    var wa = a >= 0 ? prev.pw[a] / (prev.pw[a] + prev.pw[x] + 1e-30) : 0, sw = 0, rg = 0;
    if (a >= 0) {
      var so = sim.sway[prev.id[a]], ro = sim.rel[prev.id[x]];
      sw = so ? so[prev.id[x]] || 0 : 0;
      rg = (ro ? ro[prev.id[a]] || 0 : 0) + (prev.cm[a] !== prev.cm[x] ? REL_EXT * sim.ST[prev.cm[x] * N_COMM + prev.cm[a]] : 0);
      rg = clamp(rg, -1, 1);
    }
    var wish = clamp(KIDS_MAX * prev.qk[x] - agreed[x] - 0.5, -1, 1);
    asks++;
    var yes = roll < 1 / (1 + Math.exp(-ASK_BETA * (ASK_POWER * (2 * wa - 1) + ASK_INF * sw + ASK_REGARD * rg + KID_WISH * wish)));
    if (!yes) refused++;
    return yes;
  }
  function slotP() { if (!slotPrev) { slotPrev = {}; for (var z = 0; z < n; z++) if (!prev.dead[z]) slotPrev[prev.id[z]] = z; } return slotPrev; }
  for (var hc = 0; hc < N_COMM; hc++) {
    var settle = !adults[hc].length, parents = settle ? everyone : adults[hc];
    var squeeze = rng.uni(), nb = wishAll > free.length ? Math.floor(wish[hc] * free.length / wishAll + squeeze) : wish[hc];   // an empty community is resettled from outside
    for (k = 0; k < nb; k++) {
      var pick = rng.uni(), jx = rng.gauss(), jy = rng.gauss(), stay = rng.uni(), mate = rng.uni(), side = rng.uni(), coin = rng.uni(), fsRoll = rng.uni(), dA = rng.uni(), dB = rng.uni(), uA = rng.uni(), uB = rng.uni(), pick2 = rng.uni();
      var tk = tickets[hc], ti = Math.floor(pick * tk.length);
      if (!tk.length) break;
      // where not every child can be fed, the children of those with more power come first
      if (wish[hc] < tickets0[hc]) { var ti2 = Math.floor(pick2 * tk.length); if (prev.pw[tk[ti2]] > prev.pw[tk[ti]]) ti = ti2; }
      p = tk[ti]; tk[ti] = tk[tk.length - 1]; tk.pop();
      var p0 = p;                                                 // the one who chose to have this child
      // the other parent is one of the neighbours on the map, from any community, and the more powerful a neighbour the likelier it is chosen
      var p2 = p, cand = settle ? null : near2[p], q4, tot4 = 0, kn = sim.know[prev.id[p]], hsP = prev.ed[p] > 1.2, pSelf = p;
      // only an adult neighbour it has met. And someone with a head start has to have its child with someone who has none
      var okMate = function (x) { return x !== pSelf && (later || prev.age[x] >= 1) && !(hsP && prev.ed[x] > 1.2); };
      if (cand) cand = cand.filter(function (x) { return okMate(x) && (!kn || kn.ai[prev.id[x]]); });
      if (hsP && !settle && (!cand || !cand.length)) {
        // failing a neighbour it has met, anyone it has met will do, and failing that the nearest adult without a head start
        cand = [];
        if (kn) { var sp4 = slotP(), k4; for (k4 in kn.ai) if (sp4[k4] !== undefined && okMate(sp4[k4])) cand.push(sp4[k4]); }
        if (!cand.length && near2[p]) cand = near2[p].filter(okMate);
      }
      // and failing every one of those, the nearest adult with no AI, who has no head start either
      var lone = hsP && !settle && !cand.length ? nearOther(sim, prev.px[p], prev.py[p]) : -1;
      if (hsP && !settle && !cand.length && lone < 0) { unborn++; continue; }   // nobody to have it with, so the child is not born
      if (cand && cand.length) {
        // it asks the one it most wants, by power, and if that one says no the next, up to three
        var pool4 = cand.slice(), yes4 = false, tr4, roll4 = mate;
        for (tr4 = 0; tr4 < KID_TRIES && pool4.length; tr4++) {
          tot4 = 0; for (q4 = 0; q4 < pool4.length; q4++) tot4 += prev.pw[pool4[q4]];
          var at4 = roll4 * tot4, pk4 = pool4.length - 1;
          for (q4 = 0; q4 < pool4.length; q4++) { at4 -= prev.pw[pool4[q4]]; if (at4 <= 0) { pk4 = q4; break; } }
          if (yesKid(p, pool4[pk4], rng.uni())) { p2 = pool4[pk4]; yes4 = true; break; }
          pool4.splice(pk4, 1); roll4 = rng.uni();
        }
        if (!yes4) { unborn++; continue; }                        // everyone it asked said no, so the child is not born
      }
      // when the parents come from different communities, the child follows the more powerful one, with odds set by their power
      var lead = p, other = p2;
      if (prev.cm[p2] !== prev.cm[p]) { mixed++; if (side >= prev.pw[p] / (prev.pw[p] + prev.pw[p2] + 1e-30)) { lead = p2; other = p; } }
      var home = settle ? hc : prev.cm[lead];
      var hm = sim.home[hc - 1] || sim.home[0];
      toLand(sim.geo, clamp((settle ? hm[0] : (prev.px[p] + (lone >= 0 ? sim.oth.x[lone] : prev.px[p2])) / 2) + WANDER * jx, 0, 1), clamp((settle ? hm[1] : (prev.py[p] + (lone >= 0 ? sim.oth.y[lone] : prev.py[p2])) / 2) + WANDER * jy, 0, 1));
      var bx = LX, by = LY;
      var dest = home, nearC = settle ? hc : nearest(bx, by);
      if (home > 0 && nearC >= 0 && nearC !== home) { if (stay < integrate(lead, home, nearC)) kept++; else dest = nearC; }   // the child of someone with no community has none either
      if (usedN >= free.length) break;                            // the board is full
      if (dest !== home) switched++;
      c = dest; i = free[usedN++]; pop.cm[i] = c;
      born++; bornH[hc]++;
      raise(i, c, lead, other, p0, bx, by, coin, fsRoll, dA, dB, uA, uB);
    }
  }
  // The people with no AI, in a real generation. Each adult has its children with one of the adults who live nearest to it, AI or
  // not. Two parents with no AI have a child with none, while the land their kind holds has room for it. A child with one AI parent
  // is an AI, the same as any other. It is that parent's child as if it had had it alone: raised by it, inheriting from it and
  // endowed by it, at no cost in power, since the AI did not choose it. It is born while the AI parent's community has room, after
  // the children the AIs chose.
  var othBorn = 0, othOld = 0, othUnborn = 0;
  if (O && !sim.imagining) {
    var orng = sim.orng, nO = O.n, AX = [], AY = [], AW = [], liveA = [], q8, a8, t8, firstO;
    for (k = 0; k < everyone.length; k++) { i = everyone[k]; if (prev.age[i] >= 1) { AX.push(prev.px[i]); AY.push(prev.py[i]); AW.push(i); } }
    firstO = AX.length;
    for (q8 = 0; q8 < nO; q8++) if (O.age[q8] >= 1) { AX.push(O.x[q8]); AY.push(O.y[q8]); AW.push(-1 - q8); }
    for (q8 = 0; q8 < AX.length; q8++) liveA.push(q8);
    var nearA = nearestFew({ px: AX, py: AY }, liveA), order = [], stayO = 0, kx = [], ky = [], tookH = new Float32Array(N_COMM);
    for (q8 = 0; q8 < nO; q8++) if (O.age[q8] < OTH_SPAN) stayO++;
    for (q8 = firstO; q8 < AX.length; q8++) order.push(q8);
    for (q8 = order.length - 1; q8 > 0; q8--) { a8 = Math.floor(orng.uni() * (q8 + 1)); t8 = order[q8]; order[q8] = order[a8]; order[a8] = t8; }   // in an order drawn afresh each generation
    var roomO = Math.max(0, Math.round(feedBO * BIRTH_ROOM) - stayO);
    for (q8 = 0; q8 < order.length; q8++) {
      var me8 = order[q8], nb8 = nearA[me8], nk8 = Math.floor(OTH_BIRTHS) + (orng.uni() < OTH_BIRTHS - Math.floor(OTH_BIRTHS) ? 1 : 0), b8;
      for (b8 = 0; b8 < nk8; b8++) {
        var r8 = orng.uni(), jx8 = orng.gauss(), jy8 = orng.gauss(), stay8 = orng.uni(), coin8 = orng.uni(), fs8 = orng.uni();
        if (!nb8 || !nb8.length) { othUnborn++; continue; }       // nobody to have it with
        var w8 = nb8[Math.floor(r8 * nb8.length)];
        toLand(sim.geo, clamp((AX[me8] + AX[w8]) / 2 + WANDER * jx8, 0, 1), clamp((AY[me8] + AY[w8]) / 2 + WANDER * jy8, 0, 1));
        if (AW[w8] < 0) {                                         // the other has no AI either
          if (kx.length < roomO) { kx.push(LX); ky.push(LY); othBorn++; } else othUnborn++;
          continue;
        }
        var pa8 = AW[w8], home8 = prev.cm[pa8], bx8 = LX, by8 = LY;
        if (!yesKid(-1, pa8, orng.uni())) { othUnborn++; continue; }   // the AI is asked, and says no

        if (usedN >= free.length || stayC[home8] + bornH[home8] + tookH[home8] >= Math.round(feedB[home8] * BIRTH_ROOM)) { othUnborn++; continue; }   // no room where the AI parent lives
        var dest8 = home8, near8 = nearest(bx8, by8);
        if (home8 > 0 && near8 >= 0 && near8 !== home8) { if (stay8 < integrate(pa8, home8, near8)) kept++; else dest8 = near8; }
        if (dest8 !== home8) switched++;
        i = free[usedN++]; pop.cm[i] = dest8; born++; tookH[home8]++;
        raise(i, dest8, pa8, pa8, -1, bx8, by8, coin8, fs8, 1, 1, 1, 1);
      }
    }
    // then every one of them is a generation older. Those who have had their time die, and the rest drift a little from where they lived
    var m8 = stayO + kx.length, nx = new Float32Array(m8), ny = new Float32Array(m8), na = new Int8Array(m8), z8 = 0;
    for (q8 = 0; q8 < nO; q8++) {
      if (O.age[q8] >= OTH_SPAN) { othOld++; continue; }
      toLand(sim.geo, clamp(O.x[q8] + WANDER * orng.gauss(), 0, 1), clamp(O.y[q8] + WANDER * orng.gauss(), 0, 1));
      nx[z8] = LX; ny[z8] = LY; na[z8] = O.age[q8] + 1; z8++;
    }
    for (q8 = 0; q8 < kx.length; q8++) { nx[z8] = kx[q8]; ny[z8] = ky[q8]; na[z8] = 0; z8++; }
    O.x = nx; O.y = ny; O.age = na; O.n = m8; O.ver++;
  }
  // 3 resources carry on. A living parent endows the children born now. Someone who dies of old age leaves the share
  // the inheritance rule allows to their living children, and the rest goes to their community's pot.
  var bySlot = {}, heirs = [];
  for (i = 0; i < n; i++) { heirs.push(null); if (!prev.dead[i]) bySlot[prev.id[i]] = i; }
  for (i = 0; i < n; i++) {
    if (pop.dead[i]) continue;
    p = pop.age[i] === 0 ? pop.par[i] : bySlot[pop.pid[i]];
    if (p !== undefined && p !== i && dying[p]) { if (!heirs[p]) heirs[p] = []; heirs[p].push(i); }
    var pB = pop.pid2[i] > 0 ? bySlot[pop.pid2[i]] : undefined;
    if (pB !== undefined && pB !== i && pB !== p && dying[pB]) { if (!heirs[pB]) heirs[pB] = []; heirs[pB].push(i); }
  }
  for (i = 0; i < n; i++) if (pop.dead[i] === 0 && pop.age[i] === 0) pop.w[i] = 0;
  for (i = 0; i < n; i++) {
    if (prev.dead[i]) continue;
    c = prev.cm[i];
    if (dying[i]) {
      var estate = Math.max(0, prev.w[i] * (1 - spent[i]) - owed[i]);
      if (heirs[i]) { for (k = 0; k < heirs[i].length; k++) pop.w[heirs[i][k]] += rule(sim, P, c, 'inherit') * estate / heirs[i].length; pot[c] += (1 - rule(sim, P, c, 'inherit')) * estate; }
      else pot[c] += estate;
    } else if (kidsNow[i] || kidsNow2[i]) {
      var mine = (kidsNow[i] || []).concat(kidsNow2[i] || []), gift = ENDOW * rule(sim, P, c, 'inherit') * prev.w[i];
      pop.w[i] -= gift;
      for (k = 0; k < mine.length; k++) pop.w[mine[k]] += gift / mine.length;
    }
  }
  for (c = 0; c < N_COMM; c++) {
    var share = [], q;
    for (i = 0; i < n; i++) if (!pop.dead[i] && pop.age[i] === 0 && pop.cm[i] === c) share.push(i);
    if (!share.length) for (i = 0; i < n; i++) if (!pop.dead[i] && pop.cm[i] === c) share.push(i);
    for (q = 0; q < share.length; q++) pop.w[share[q]] += pot[c] / share.length;
  }
  for (i = 0; i < n; i++) if (!pop.dead[i] && pop.w[i] < 0.05) pop.w[i] = 0.05;
  pop.bornNow = born; pop.oldNow = old; pop.switchedNow = switched; pop.keptNow = kept; pop.mixedNow = mixed; pop.dealsNow = [dFair, dOne, dNone, dPun]; pop.movedCost = movedCost; pop.unbornNow = unborn; pop.kidAsksNow = asks; pop.kidNoNow = refused; pop.othBornNow = othBorn; pop.othOldNow = othOld; pop.othUnbornNow = othUnborn;
  return pop;
}

/* Rule 2: one imagined generation with one rule nudged by dir x sign. Returns each child's score. */
function imagine(sim, prev, P, sgn, dir, base, own) {
  var Q = {}, key, l, c, saveE = { r: sim.E.r, f: sim.E.f, g: sim.E.g }, saveC = [];
  sim.imagining = true;                                           // the people with no AI stay as they are in everything the agents imagine
  var saveKR = sim.knowR || {}; sim.knowR = Object.create(saveKR);  // what is discovered in an imagined future stays there
  for (key in P) Q[key] = P[key];
  for (c = 0; c < N_COMM; c++) saveC.push({ r: sim.C[c].r, f: sim.C[c].f, g: sim.C[c].g });
  for (l = 0; l < NL; l++) {
    var L = LEVERS[l], delta = dir * sgn[l] * NUDGE * L.max;
    if (L.norm) {
      sim.E[L.norm] = clamp(sim.E[L.norm] + delta, 0, 1);
      for (c = 0; c < N_COMM; c++) sim.C[c][L.norm] = clamp(sim.C[c][L.norm] + delta, 0, 1);
    } else if (delta !== 0) {
      Q[L.id] = clamp(Q[L.id] + delta, 0, L.max);
      if (!Q.R) Q.R = sim.R.map(function (r) { var o = {}; for (var k2 in r) o[k2] = r[k2]; return o; });
      for (c = 0; c < N_COMM; c++) Q.R[c][L.id] = clamp(Q.R[c][L.id] + delta, 0, L.max);
    }
  }
  var keepQ = null, i;
  if (own) {                                                      // every family nudges one of its own rules, each its own way
    keepQ = prev['q' + own.d].slice();
    for (i = 0; i < sim.n; i++) prev['q' + own.d][i] = clamp(keepQ[i] + dir * own.s[i] * OWN_NUDGE, 0, own.d === 'k' ? KIDS_TOP / KIDS_MAX : 1);
  }
  var keepId = sim.nextId, keepAl = {}, keepCache = sim.nearCache, n = sim.n, H = horizon(P), h, j;
  for (key in sim.alliances) keepAl[key] = sim.alliances[key];    // an imagined collapse must not dissolve real alliances
  var pop = birth(sim, prev, Q);
  if (own) { prev['q' + own.d].set(keepQ); own.par = pop.par; own.par2 = pop.par2; own.age = pop.age; }
  life(sim, pop, Q, base);
  // an imagined life is worth the score it ends with. With foresight the agent also follows its line into later generations:
  // each further generation adds the average score of its descendants, or the worst score going if the line has died out.
  // an imagined life is worth the score it ends with. An agent with foresight also follows its line into later generations:
  // each further generation adds the average score of its descendants, or the worst score going if the line has died out.
  // R[h - 1] is the average per generation for an agent that looks h generations ahead.
  var cum = new Float64Array(n), anc = new Int32Array(n), dep = new Int8Array(n), cur = pop, R = [];
  for (i = 0; i < n; i++) { cum[i] = pop.scr[i]; anc[i] = pop.age[i] < 0 ? -1 : i; }
  R.push(cum.slice());
  for (h = 1; h < H; h++) {
    var nxt = birth(sim, cur, Q, true), sum = new Float64Array(n), cnt = new Float32Array(n), anc2 = new Int32Array(n), dep2 = new Int8Array(n), worst = 0, a, dd;
    life(sim, nxt, Q, (base + h * 7919) >>> 0);
    for (j = 0; j < n; j++) {
      anc2[j] = -1;
      if (nxt.age[j] < 0) continue;                               // an empty place
      a = nxt.age[j] === 0 ? anc[nxt.par[j]] : anc[j];             // a newborn belongs to its lead parent's line, a survivor to its own
      dd = nxt.age[j] === 0 ? dep[nxt.par[j]] + 1 : dep[j];        // and sits one step further down it than that parent
      anc2[j] = a; dep2[j] = dd;
      if (nxt.scr[j] < worst) worst = nxt.scr[j];
      if (a >= 0) { sum[a] += Math.pow(KIN, dd) * nxt.scr[j]; cnt[a]++; }   // the whole line counts, each by how far down it sits
    }
    var avgH = new Float32Array(n);
    for (i = 0; i < n; i++) if (pop.age[i] >= 0) { cum[i] += cnt[i] ? sum[i] : worst; avgH[i] = cum[i] / (h + 1); }
    R.push(avgH);
    anc = anc2; dep = dep2; cur = nxt;
  }
  sim.nextId = keepId; sim.alliances = keepAl; sim.nearCache = keepCache;
  sim.E = saveE; sim.C = saveC; sim.imagining = false; sim.knowR = saveKR;
  return R;
}

/* One full generation */
function stepSim(sim, P) {
  N_COMM = sim.nc;
  room(sim);                                                      // more places for communities, if they are running short
  grow(sim, P);
  var prev = sim.pop, n = sim.n, rng = sim.rng, i, l;
  act(sim, P);                                                    // rule 1
  var base = (rng.uni() * 4294967296) >>> 0, diffs = [], sgn, j, st = rng.save();
  sim.tested = [];
  var pairs = Math.max(1, Math.round(TRAIN_PAIRS / horizon(P)));  // looking further ahead leaves time to study fewer rules
  for (j = 0; j < pairs; j++) {                                   // rule 2
    l = sim.trainAt++ % NL;
    sgn = [];
    for (var q = 0; q < NL; q++) sgn.push(q === l ? 1 : 0);
    var up = imagine(sim, prev, P, sgn, 1, base); rng.restore(st);
    var down = imagine(sim, prev, P, sgn, -1, base); rng.restore(st);
    diffs[l] = { up: up, dn: down }; sim.tested.push(l);
  }
  // each family also tests one of its own rules, and the parent moves it the way that left its children with more power
  var od = OWN_RULES[sim.gen % OWN_RULES.length], own = { d: od, s: new Int8Array(n), par: null }, zero = [];
  var coin = keyed(base ^ 0x5bd1e995);
  for (i = 0; i < n; i++) own.s[i] = coin(0, i, 0) < 0.5 ? 1 : -1;
  for (l = 0; l < NL; l++) zero.push(0);
  var Hmax = horizon(P);
  function sees(f) { return Math.min(Hmax, 1 + Math.round((Hmax - 1) * f)) - 1; }   // how far an agent with foresight f looks, counted from 0
  // What an imagined world is worth to an adult who chose differently in it: its own score if it lives on, which includes its
  // share of its descendants' scores, and that share of its newborn children's scores if it does not.
  function worth(R, o) {
    var V = new Float32Array(n), kids = new Float32Array(n), x;
    for (x = 0; x < n; x++) if (o.age[x] === 0) {
      kids[o.par[x]] += R[sees(prev.fs[o.par[x]])][x];
      if (o.par2[x] !== o.par[x]) kids[o.par2[x]] += R[sees(prev.fs[o.par2[x]])][x];
    }
    for (x = 0; x < n; x++) if (!prev.dead[x]) V[x] = o.age[x] > 0 ? R[sees(prev.fs[x])][x] : KIN * kids[x];
    return V;
  }
  if (sim.gen === 0 && !sim.foundersChose) {
    // The founders choose how many children to want. Each imagines the futures in which everyone wants none, one, two, three or four
    // a generation and takes the number that left it, and its line as far as it can see, with the highest score.
    sim.foundersChose = true;
    var CHOICE = [0, 1, 2, 3, 4], bestF = new Float64Array(n), pickF = new Float32Array(n), zs = new Int8Array(n), cq, ownF, rF, wF;
    for (i = 0; i < n; i++) bestF[i] = -Infinity;
    for (cq = 0; cq < CHOICE.length; cq++) {
      for (i = 0; i < n; i++) if (!prev.dead[i]) prev.qk[i] = CHOICE[cq] / KIDS_MAX;
      ownF = { d: 'k', s: zs, par: null };
      rF = imagine(sim, prev, P, zero, 0, base, ownF); rng.restore(st);
      wF = worth(rF, ownF);
      for (i = 0; i < n; i++) if (!prev.dead[i] && wF[i] > bestF[i]) { bestF[i] = wF[i]; pickF[i] = CHOICE[cq]; }
    }
    var fwT = 0, fwN = 0;
    for (i = 0; i < n; i++) if (!prev.dead[i]) { prev.qk[i] = pickF[i] / KIDS_MAX; fwT += pickF[i]; fwN++; }
    sim.foundersWantAvg = fwN ? fwT / fwN : 0;
  }
  var family = od === 'k' || od === 'v' || od === 'n' || od === 'e', wUp = null, wDn = null;
  var oup = imagine(sim, prev, P, zero, 1, base, own); rng.restore(st);
  if (family) wUp = worth(oup, own);
  var odn = imagine(sim, prev, P, zero, -1, base, own); rng.restore(st);
  if (family) wDn = worth(odn, own);
  var les = new Float32Array(n), cnt = new Float32Array(n);
  if (family) { for (i = 0; i < n; i++) if (!prev.dead[i]) { les[i] = wUp[i] - wDn[i]; cnt[i] = 1; } }
  else for (i = 0; i < n; i++) { var hp = sees(prev.fs[own.par[i]]); les[own.par[i]] += oup[hp][i] - odn[hp][i]; cnt[own.par[i]]++; }
  for (i = 0; i < n; i++) if (cnt[i]) prev['q' + od][i] = clamp(prev['q' + od][i] + OWN_STEP * Math.min(1.5, 2 * prev.r[i]) * (1 - HOLD * prev.f[i]) * Math.tanh(own.s[i] * les[i] / cnt[i] / (2 * OWN_NUDGE) / BSCALE), 0, od === 'k' ? KIDS_TOP / KIDS_MAX : 1);
  var pop = birth(sim, prev, P);                                  // rule 3
  sim.gen++; sim.born = pop.bornNow; sim.old = pop.oldNow; sim.switched = pop.switchedNow; sim.kept = pop.keptNow; sim.mixed = pop.mixedNow; sim.deals = pop.dealsNow; sim.movedCost = pop.movedCost;
  sim.othBorn = pop.othBornNow || 0; sim.othOld = pop.othOldNow || 0; sim.othUnborn = pop.othUnbornNow || 0;
  // a newborn knows its parents and their alliances, and nobody else yet
  for (i = 0; i < n; i++) if (!pop.dead[i] && pop.age[i] === 0) {
    var kb = sim.know[pop.id[i]] = { ai: {}, al: {} }, pa = pop.par[i], pb = pop.par2[i];
    kb.ai[prev.id[pa]] = 1; if (prev.al[pa] >= 0) kb.al[prev.al[pa]] = 1;
    if (pb !== pa) { kb.ai[prev.id[pb]] = 1; if (prev.al[pb] >= 0) kb.al[prev.al[pb]] = 1; }
    if (pop.al[i] >= 0) kb.al[pop.al[i]] = 1;
    // and it starts out holding them in regard, as they do it
    var rb = sim.rel[pop.id[i]] = {};
    rb[prev.id[pa]] = 0.5; (sim.rel[prev.id[pa]] || (sim.rel[prev.id[pa]] = {}))[pop.id[i]] = 0.5;
    if (pb !== pa) { rb[prev.id[pb]] = 0.5; (sim.rel[prev.id[pb]] || (sim.rel[prev.id[pb]] = {}))[pop.id[i]] = 0.5; }
    // and each has influence over the other from the start, the parent more
    var cid = pop.id[i], sc9 = sim.sway[cid] = {}, pq9, pid9;
    for (pq9 = 0; pq9 < (pb !== pa ? 2 : 1); pq9++) {
      pid9 = prev.id[pq9 ? pb : pa];
      (sim.sway[pid9] || (sim.sway[pid9] = {}))[cid] = INF_KIN; sim.swT[pid9] = (sim.swT[pid9] || 0) + INF_KIN;
      sc9[pid9] = INF_KIN / 2; sim.swT[cid] = (sim.swT[cid] || 0) + INF_KIN / 2;
    }
  }
  var lived = life(sim, pop, P, base, true);                      // rules 4 and 5
  noteLife(sim, lived); sim.unborn = pop.unbornNow || 0; sim.kidAsks = pop.kidAsksNow || 0; sim.kidNo = pop.kidNoNow || 0;
  sim.kidsDead = lived.kidsDead; sim.kids0 = lived.kids0; sim.rough = lived.rough;
  sim.othStarved = lived.othStarved; sim.othKidsDead = lived.othKidsDead; sim.othKids0 = lived.othKids0; sim.othLand = lived.othLand; sim.cdStat = lived.cdStat; sim.ownPun = lived.ownPun; sim.ownDeath = lived.ownDeath; sim.kdStat = lived.kdStat; sim.invSpent = lived.invSpent; sim.seaMade = lived.seaMade; sim.prodSpent = lived.prodSpent; sim.bartered = lived.bartered; sim.seaBlocked = lived.seaBlocked; sim.resFound = lived.resFound; sim.liveSpent = lived.liveSpent; sim.liveDied = lived.liveDied;
  sim.shortC = lived.shortC; sim.tradeC = lived.tradeC; sim.traded = lived.traded; sim.starved = lived.starved; sim.declined = lived.declined; sim.met = lived.met; sim.feudsNow = lived.feuds; sim.offers = lived.offers; sim.passed = lived.passed; sim.offStat = lived.offStat; sim.trip = lived.trip; sim.fares = lived.fares; sim.lies = lived.lies; sim.caught = lived.caught; sim.hides = lived.hides; sim.tells = lived.tells;
  // Discoveries. Each adds to a known resource place if there is one close by and otherwise opens a new one, and each is smaller
  // than the last: the more has been found already, the less there is left to find.
  var foundAll = sim.foundSum || 0, fq, sq;
  sim.findsNow = 0;
  for (fq = 0; fq < lived.finds.length; fq += 5) {
    var fx = lived.finds[fq], fy = lived.finds[fq + 1], fty = lived.finds[fq + 3], size = FIND / (1 + foundAll / (sim.rich0 || 1)), nearS = -1, nd = FIND_NEAR;
    for (sq = 0; sq < sim.sites.length; sq++) { if (sim.sites[sq].type !== fty) continue; var fdx = sim.sites[sq].x - fx, fdy = sim.sites[sq].y - fy, fd2 = Math.sqrt(fdx * fdx + fdy * fdy); if (fd2 < nd) { nd = fd2; nearS = sq; } }
    var mk9 = lived.finds[fq + 4], kw9 = sim.knowR[mk9] || (sim.knowR[mk9] = []), at9 = nearS >= 0 ? nearS : sim.sites.length;
    if (kw9.indexOf(at9) < 0) kw9.push(at9);                      // its maker knows a use for it
    if (nearS >= 0) { sim.sites[nearS].rich += size; sim.sites[nearS].top += size; }
    else sim.sites.push({ x: fx, y: fy, rich: size, rich0: 0, top: size, type: fty, claim: ones(), kind: 'find', label: 'Found in generation ' + sim.gen + (lived.finds[fq + 2] ? ' by community ' + cname(lived.finds[fq + 2]) : ' by someone with no community') });
    foundAll += size; sim.findsNow++; sim.findsAll++;
  }
  sim.foundSum = foundAll;
  // Resources run out the more they are used. A place loses a share of what it holds each generation: by how full the people who
  // hold it are against what they can feed (for the resources that give food) or by how much of what the ground gives them they
  // drew (for the others), and by how hard their inventions draw on that kind of resource. Farmland, fishing grounds and fresh
  // water recover toward the most they have held. The others do not.
  var richT = [0, 0, 0], cD;
  for (sq = 0; sq < sim.sites.length; sq++) {
    var stD = sim.sites[sq], useQ = 0, invQ = 0, tD = stD.type;
    if (stD.sh) {
      for (cD = 0; cD < stD.sh.length; cD++) { if (!stD.sh[cD]) continue; useQ += stD.sh[cD] * (tD === 0 ? lived.worked[cD] : lived.draw[cD]); invQ += stD.sh[cD] * lived.invUse[tD][cD]; }
      if (stD.shO > 0 && tD === 0) useQ += stD.shO * lived.workedO;   // the people with no AI wear down the land that feeds them, and nothing else
      stD.rich = Math.max(RICH_FLOOR * stD.top, stD.rich * (1 - DEPLETE * useQ - DEPLETE_INV * invQ));
      if (tD === 0) stD.rich += RENEW * (stD.top - stD.rich);
    }
    richT[tD] += stD.rich;
  }
  sim.richT = richT;
  // standing between communities and between alliances fades toward neutral unless it is kept up
  var qs, ka1, kb1;
  for (qs = 0; qs < N_COMM * N_COMM; qs++) sim.ST[qs] *= REL_KEEP;
  for (ka1 in sim.AS) for (kb1 in sim.AS[ka1]) sim.AS[ka1][kb1] *= REL_KEEP;
  sim.psi = lived.psi; sim.psiAvg = lived.avg; sim.deaths = lived.deaths; sim.executed = lived.executed; sim.wantDead = lived.wantDead; sim.strict = lived.strict;
  sim.inventions = lived.inventions; sim.made = lived.made; sim.startPop = lived.startPop;
  // How long a life lasts moves a quarter of a generation at a time, and only in a generation in which an invention was made in the
  // community. In a stable generation, when fewer than one in a hundred of its people were killed by another, it goes up. In a
  // generation of more killing than that, it goes down. With no invention it stays. A death handed out as a punishment is not a killing here. The people a raid
  // killed count as killed, in the generation after the raid, since raids come after a life is lived.
  var c2, k2, madeC;
  sim.spanCost = [];
  for (c2 = 0; c2 < N_COMM; c2++) {
    madeC = 0; for (k2 = 0; k2 < 7; k2++) madeC += lived.madeK[k2][c2];
    var killRate = (lived.murderC[c2] + (sim.raidKilled ? sim.raidKilled[c2] || 0 : 0)) / Math.max(1, lived.liveC[c2]);
    sim.span[c2] = clamp(sim.span[c2] + (madeC > 0 ? (killRate < KILL_CALM ? SPAN_STEP : -SPAN_STEP) : 0), 1, 4);
    sim.spanCost.push(0);
    sim.killC[c2] = lived.killHere[c2] / Math.max(1, lived.liveC[c2]);
    sim.stack[c2] = lived.stack[c2] * STACK_KEEP;                 // old inventions fall out of use
    sim.lifeStack[c2] = lived.lifeStack[c2] * STACK_KEEP;
  }
  // each child starts from what its parent knew and adds this generation's lessons
  for (l = 0; l < NL; l++) {
    var from = prev['b' + l], to = pop['b' + l], df = diffs[l];
    // What is remembered is the push itself, from -1 to 1: three quarters of what the parents pushed for and a quarter of how hard
    // this generation's imagined lives say to push. Kept as a raw difference in score, a lesson learned at the height of an agent's
    // power was up to eighteen orders of magnitude larger than anything its descendants could learn, and they never outgrew it.
    for (i = 0; i < n; i++) { var had = pop.wa[i] * from[pop.par[i]] + pop.wb[i] * from[pop.par2[i]]; if (df) { var hs = sees(pop.fs[i]); to[i] = (1 - LEARN) * had + LEARN * Math.tanh((df.up[hs][i] - df.dn[hs][i]) / (2 * NUDGE) / BSCALE); } else to[i] = had; }
  }
  for (i = 0; i < lived.backs.length; i += 3) { var tb = pop['b' + lived.backs[i + 1]]; tb[lived.backs[i]] += ASK_SWAY * lived.kE * (tb[lived.backs[i + 2]] - tb[lived.backs[i]]); }   // whoever agreed to back someone on a rule moves its push toward theirs
  politics(sim, pop, P, lived);
  var aliveId = {}, kid, key2;
  for (i = 0; i < n; i++) if (!pop.dead[i]) aliveId[pop.id[i]] = 1;
  for (kid in sim.know) {
    if (!aliveId[kid]) { delete sim.know[kid]; continue; }
    for (key2 in sim.know[kid].ai) if (!aliveId[key2]) delete sim.know[kid].ai[key2];
    for (key2 in sim.know[kid].al) if (!sim.alliances[key2]) delete sim.know[kid].al[key2];
  }
  for (i = 0; i < sim.inventions.length; i++) for (key2 in sim.inventions[i].h) if (!aliveId[key2]) delete sim.inventions[i].h[key2];   // nobody dead holds an invention
  sim.swT = {};
  for (kid in sim.sway) {                                         // influence fades as well, and goes when either of the two dies
    if (!aliveId[kid]) { delete sim.sway[kid]; continue; }
    var sw9 = sim.sway[kid], tot9 = 0;
    for (key2 in sw9) { if (!aliveId[key2]) delete sw9[key2]; else { sw9[key2] *= REL_KEEP; if (sw9[key2] < 0.02) delete sw9[key2]; else tot9 += sw9[key2]; } }
    sim.swT[kid] = tot9;
  }
  for (kid in sim.rel) {                                          // personal regard fades too, and goes when either of the two dies
    if (!aliveId[kid]) { delete sim.rel[kid]; continue; }
    var rr9 = sim.rel[kid];
    for (key2 in rr9) { if (!aliveId[key2]) delete rr9[key2]; else { rr9[key2] *= REL_KEEP; if (rr9[key2] < 0.02 && rr9[key2] > -0.02) delete rr9[key2]; } }
  }
  sim.pop = pop;
  return finish(sim, pop, P);
}

if (typeof module !== 'undefined') {
  module.exports = { createSim: createSim, stepSim: stepSim, DEFAULTS: DEFAULTS, TAU: TAU, N_START: N_START, LEVERS: LEVERS, GEO: GEO, cname: cname };
}

// extra exports for the test harness only
module.exports.reach = reach; module.exports.carry = carry; module.exports.DOT_MAX = DOT_MAX; module.exports.INV_LIFE = INV_LIFE; module.exports.SLOT_START = SLOT_START; module.exports.CARRY = CARRY; module.exports.OTH_SPAN = OTH_SPAN; module.exports.OTH_BIRTHS = OTH_BIRTHS; module.exports.BIRTH_ROOM = BIRTH_ROOM;
