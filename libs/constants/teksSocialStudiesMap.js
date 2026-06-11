// /libs/constants/teksSocialStudiesMap.js
// Branch: v2/student-success-platform
//
// Grade 6-8 Texas Social Studies TEKS map for TEKS Portfolio v2 adaptive practice.
//
// Grade 6  — World Cultures and Geography
// Grade 7  — Texas History
// Grade 8  — United States History to Reconstruction
//
// Shape matches teksReadingMap.js: { gradeN: { bucketKey: ["X.YZ"] } }
// Bucket keys are shared with TEKS_SS_BUCKET_LABELS below for human-readable labels.

export const TEKS_SOCIAL_STUDIES_MAP = {
  // ── Grade 6: World Cultures and Geography ────────────────────────────────────
  grade6: {
    // History — major events, eras, and civilizations across world regions
    history_civilizations:       ["6.1A", "6.1B", "6.1C"],
    history_cause_effect:        ["6.2A", "6.2B"],

    // Geography — physical and human geography concepts
    geography_physical:          ["6.3A", "6.3B", "6.3C"],
    geography_human_environment: ["6.4A", "6.4B"],
    geography_regions:           ["6.5A", "6.5B"],

    // Economics — economic systems and trade
    economics_systems:           ["6.9A", "6.9B"],
    economics_trade:             ["6.10A", "6.10B"],

    // Government & Citizenship — types of government and rights
    government_types:            ["6.12A", "6.12B"],
    government_citizenship:      ["6.13A"],

    // Culture — cultural characteristics and diffusion
    culture_characteristics:     ["6.19A", "6.19B"],
    culture_religion_arts:       ["6.20A", "6.20B"],

    // Social Studies Skills — sources, maps, analysis
    skills_sources:              ["6.21A", "6.21B"],
    skills_maps_graphs:          ["6.22A", "6.22B"],
    skills_analysis:             ["6.23A"],
  },

  // ── Grade 7: Texas History ────────────────────────────────────────────────────
  grade7: {
    // History — Texas exploration through statehood and beyond
    history_exploration:         ["7.1A", "7.1B"],
    history_revolution:          ["7.2A", "7.2B", "7.2C"],
    history_republic_statehood:  ["7.3A", "7.3B", "7.3C"],
    history_civil_war_era:       ["7.4A", "7.4B"],
    history_late_1800s:          ["7.5A", "7.5B"],
    history_20th_century:        ["7.6A", "7.6B", "7.6C"],
    history_contemporary:        ["7.7A", "7.7B"],

    // Geography — Texas physical regions and human geography
    geography_physical_regions:  ["7.8A", "7.8B", "7.8C"],
    geography_human_environment: ["7.9A", "7.9B"],
    geography_population:        ["7.10A", "7.10B"],

    // Economics — Texas economy and resources
    economics_resources:         ["7.11A", "7.11B"],
    economics_free_enterprise:   ["7.12A", "7.12B"],

    // Government — Texas government structure
    government_structure:        ["7.13A", "7.13B"],
    government_constitution:     ["7.14A", "7.14B"],
    government_citizenship:      ["7.15A", "7.15B"],

    // Culture — Texas cultural contributions
    culture_contributions:       ["7.19A", "7.19B"],
    culture_fine_arts:           ["7.20A"],

    // Social Studies Skills
    skills_sources:              ["7.21A", "7.21B"],
    skills_maps_graphs:          ["7.22A", "7.22B"],
    skills_analysis:             ["7.23A", "7.23B"],
  },

  // ── Grade 8: United States History to Reconstruction ─────────────────────────
  grade8: {
    // History — Colonial era through Reconstruction
    history_colonial:            ["8.1A", "8.1B"],
    history_revolution:          ["8.2A", "8.2B", "8.2C"],
    history_new_nation:          ["8.3A", "8.3B", "8.3C"],
    history_early_republic:      ["8.4A", "8.4B"],
    history_expansion:           ["8.5A", "8.5B", "8.5C"],
    history_reform_antebellum:   ["8.6A", "8.6B"],
    history_civil_war:           ["8.7A", "8.7B", "8.7C"],
    history_reconstruction:      ["8.8A", "8.8B", "8.8C"],

    // Geography — physical geography and westward expansion
    geography_regions:           ["8.9A", "8.9B"],
    geography_human_environment: ["8.10A", "8.10B"],
    geography_migration:         ["8.11A", "8.11B"],

    // Economics — colonial and early American economy
    economics_colonial:          ["8.12A", "8.12B"],
    economics_industrialization: ["8.13A", "8.13B"],

    // Government — constitutional foundations and democracy
    government_constitution:     ["8.14A", "8.14B", "8.14C"],
    government_amendments:       ["8.15A", "8.15B"],
    government_citizenship:      ["8.16A", "8.16B"],

    // Culture — American cultural identity and contributions
    culture_identity:            ["8.24A", "8.24B"],
    culture_religion_reform:     ["8.25A", "8.25B"],

    // Social Studies Skills
    skills_sources:              ["8.29A", "8.29B"],
    skills_maps_graphs:          ["8.30A", "8.30B"],
    skills_analysis:             ["8.31A", "8.31B"],
  },
};

// ── Human-readable bucket labels ──────────────────────────────────────────────
// Used by teksSubjectMap.js to render option labels in assignment dropdowns.
// Key must match bucket key in TEKS_SOCIAL_STUDIES_MAP exactly.

export const TEKS_SS_BUCKET_LABELS = {
  // Grade 6 — World Cultures & Geography
  history_civilizations:       "History — World Civilizations",
  history_cause_effect:        "History — Cause and Effect",
  geography_physical:          "Geography — Physical Features",
  geography_human_environment: "Geography — Human-Environment Interaction",
  geography_regions:           "Geography — Regions of the World",
  economics_systems:           "Economics — Economic Systems",
  economics_trade:             "Economics — Global Trade",
  government_types:            "Government — Types of Government",
  government_citizenship:      "Government — Citizenship & Rights",
  culture_characteristics:     "Culture — Cultural Characteristics",
  culture_religion_arts:       "Culture — Religion & the Arts",
  skills_sources:              "Skills — Evaluating Sources",
  skills_maps_graphs:          "Skills — Maps, Charts & Graphs",
  skills_analysis:             "Skills — Historical Analysis",

  // Grade 7 — Texas History
  history_exploration:         "Texas History — Exploration Era",
  history_revolution:          "Texas History — Texas Revolution",
  history_republic_statehood:  "Texas History — Republic & Statehood",
  history_civil_war_era:       "Texas History — Civil War Era",
  history_late_1800s:          "Texas History — Late 1800s",
  history_20th_century:        "Texas History — 20th Century",
  history_contemporary:        "Texas History — Contemporary Texas",
  geography_physical_regions:  "Texas Geography — Physical Regions",
  geography_population:        "Texas Geography — Population & Settlement",
  economics_resources:         "Texas Economics — Natural Resources",
  economics_free_enterprise:   "Texas Economics — Free Enterprise",
  government_structure:        "Texas Government — Government Structure",
  government_constitution:     "Texas Government — Texas Constitution",
  culture_contributions:       "Texas Culture — Cultural Contributions",
  culture_fine_arts:           "Texas Culture — Fine Arts",

  // Grade 8 — US History to Reconstruction
  history_colonial:            "US History — Colonial Era",
  history_new_nation:          "US History — Forming the New Nation",
  history_early_republic:      "US History — Early Republic",
  history_expansion:           "US History — Westward Expansion",
  history_reform_antebellum:   "US History — Reform & Antebellum Era",
  history_civil_war:           "US History — Civil War",
  history_reconstruction:      "US History — Reconstruction",
  geography_migration:         "Geography — Migration & Settlement Patterns",
  economics_colonial:          "Economics — Colonial & Early Economy",
  economics_industrialization: "Economics — Early Industrialization",
  government_amendments:       "Government — Bill of Rights & Amendments",
  culture_identity:            "Culture — American Identity",
  culture_religion_reform:     "Culture — Religion & Reform Movements",
};

// ── Label map for individual TEKS codes ───────────────────────────────────────
// Maps code → human-readable description for dropdown display.
// Used when a flat label per code is needed (mirrors TEKS_LABELS in teksReadingMap.js).

export const TEKS_SS_LABELS = {
  // ── Grade 6 ──────────────────────────────────────────────────────────────────
  "6.1A": "6.1A — Describe characteristics of civilizations across world regions",
  "6.1B": "6.1B — Explain the development of early river valley civilizations",
  "6.1C": "6.1C — Identify contributions of ancient civilizations to modern society",
  "6.2A": "6.2A — Analyze cause-and-effect relationships in world history",
  "6.2B": "6.2B — Explain how major events shaped world regions",
  "6.3A": "6.3A — Identify major physical features of world regions",
  "6.3B": "6.3B — Describe how physical geography affects human settlement",
  "6.3C": "6.3C — Locate and describe major bodies of water and landforms",
  "6.4A": "6.4A — Analyze human-environment interactions across world regions",
  "6.4B": "6.4B — Describe how humans adapt to and modify their environments",
  "6.5A": "6.5A — Identify and compare major world regions",
  "6.5B": "6.5B — Explain how regions are defined by physical and human characteristics",
  "6.9A": "6.9A — Compare economic systems (traditional, command, market)",
  "6.9B": "6.9B — Explain basic economic concepts: scarcity, supply, demand",
  "6.10A": "6.10A — Describe patterns of global trade",
  "6.10B": "6.10B — Analyze why countries specialize in the production of certain goods",
  "6.12A": "6.12A — Compare types of government (monarchy, democracy, republic, dictatorship)",
  "6.12B": "6.12B — Identify the role of citizens in different government systems",
  "6.13A": "6.13A — Explain the importance of civic participation and the rule of law",
  "6.19A": "6.19A — Describe major cultural characteristics of world regions",
  "6.19B": "6.19B — Explain how cultural diffusion occurs between regions",
  "6.20A": "6.20A — Identify major world religions and their geographic distribution",
  "6.20B": "6.20B — Describe contributions of various cultures to art, music, and literature",
  "6.21A": "6.21A — Distinguish between primary and secondary sources",
  "6.21B": "6.21B — Evaluate the credibility and bias of historical sources",
  "6.22A": "6.22A — Interpret maps, charts, and graphs to analyze geographic and historical data",
  "6.22B": "6.22B — Use scale and compass rose to interpret maps",
  "6.23A": "6.23A — Apply critical thinking to analyze historical perspectives and events",

  // ── Grade 7 ──────────────────────────────────────────────────────────────────
  "7.1A": "7.1A — Identify European exploration of Texas and its impact on Native peoples",
  "7.1B": "7.1B — Explain Spanish colonial influence on early Texas",
  "7.2A": "7.2A — Analyze the causes of the Texas Revolution",
  "7.2B": "7.2B — Describe major battles and events of the Texas Revolution",
  "7.2C": "7.2C — Explain the outcomes of the Battle of San Jacinto",
  "7.3A": "7.3A — Describe the challenges of the Republic of Texas",
  "7.3B": "7.3B — Explain the annexation of Texas and its impact on U.S.-Mexico relations",
  "7.3C": "7.3C — Analyze the causes and outcomes of the Mexican-American War",
  "7.4A": "7.4A — Explain Texas's role in the Civil War",
  "7.4B": "7.4B — Describe the impact of Reconstruction on Texas",
  "7.5A": "7.5A — Describe the cattle industry and its impact on Texas",
  "7.5B": "7.5B — Explain westward migration and settlement patterns in Texas",
  "7.6A": "7.6A — Describe the impact of the oil industry on Texas's economy",
  "7.6B": "7.6B — Explain Texas's role in World War I and World War II",
  "7.6C": "7.6C — Analyze the Civil Rights movement in Texas",
  "7.7A": "7.7A — Describe the growth of major Texas cities in the modern era",
  "7.7B": "7.7B — Explain the role of technology in Texas's economy today",
  "7.8A": "7.8A — Identify and describe the physical regions of Texas",
  "7.8B": "7.8B — Explain how physical geography shaped Texas settlement patterns",
  "7.8C": "7.8C — Describe major rivers, climate zones, and landforms in Texas",
  "7.9A": "7.9A — Analyze human-environment interactions in Texas history",
  "7.9B": "7.9B — Explain how Texans have adapted to and modified their environment",
  "7.10A": "7.10A — Describe population distribution and growth in Texas",
  "7.10B": "7.10B — Explain push-pull factors of migration to Texas",
  "7.11A": "7.11A — Identify Texas's major natural resources and their economic significance",
  "7.11B": "7.11B — Describe Texas's role in agriculture and energy production",
  "7.12A": "7.12A — Explain characteristics of the free enterprise system in Texas",
  "7.12B": "7.12B — Describe the role of entrepreneurs in Texas's economy",
  "7.13A": "7.13A — Describe the structure of Texas state government",
  "7.13B": "7.13B — Explain the roles and powers of the three branches of Texas government",
  "7.14A": "7.14A — Identify key provisions of the Texas Constitution",
  "7.14B": "7.14B — Compare the Texas Constitution to the U.S. Constitution",
  "7.15A": "7.15A — Describe the rights and responsibilities of Texas citizens",
  "7.15B": "7.15B — Explain the importance of civic participation in Texas",
  "7.19A": "7.19A — Describe contributions of various cultural groups to Texas heritage",
  "7.19B": "7.19B — Explain the impact of cultural diffusion on Texas society",
  "7.20A": "7.20A — Identify contributions of Texas artists, musicians, and writers",
  "7.21A": "7.21A — Distinguish between primary and secondary sources about Texas history",
  "7.21B": "7.21B — Evaluate the credibility and point of view of historical sources",
  "7.22A": "7.22A — Interpret maps and graphs related to Texas geography and history",
  "7.22B": "7.22B — Analyze timelines and charts to sequence Texas historical events",
  "7.23A": "7.23A — Apply critical thinking to analyze causes and effects in Texas history",
  "7.23B": "7.23B — Evaluate multiple perspectives on significant Texas historical events",

  // ── Grade 8 ──────────────────────────────────────────────────────────────────
  "8.1A": "8.1A — Describe major Native American cultures in North America before European contact",
  "8.1B": "8.1B — Explain the impact of European exploration on Native Americans",
  "8.2A": "8.2A — Analyze the causes of the American Revolution",
  "8.2B": "8.2B — Describe major battles and turning points of the Revolution",
  "8.2C": "8.2C — Explain the significance of the Declaration of Independence",
  "8.3A": "8.3A — Explain the challenges of governing under the Articles of Confederation",
  "8.3B": "8.3B — Describe the Constitutional Convention and its major compromises",
  "8.3C": "8.3C — Analyze the arguments of Federalists and Anti-Federalists",
  "8.4A": "8.4A — Describe the presidency of George Washington and early U.S. government",
  "8.4B": "8.4B — Explain the causes and effects of the War of 1812",
  "8.5A": "8.5A — Explain the concept of Manifest Destiny and westward expansion",
  "8.5B": "8.5B — Analyze the causes and outcomes of the Mexican-American War",
  "8.5C": "8.5C — Describe the impact of westward expansion on Native Americans",
  "8.6A": "8.6A — Identify major reform movements of the antebellum period",
  "8.6B": "8.6B — Explain the abolitionist movement and its influence on the Civil War",
  "8.7A": "8.7A — Analyze the causes of the Civil War",
  "8.7B": "8.7B — Describe major battles and military leaders of the Civil War",
  "8.7C": "8.7C — Explain the significance of the Emancipation Proclamation",
  "8.8A": "8.8A — Describe the goals and outcomes of Reconstruction",
  "8.8B": "8.8B — Explain the constitutional amendments passed during Reconstruction",
  "8.8C": "8.8C — Analyze the end of Reconstruction and its long-term effects",
  "8.9A": "8.9A — Identify major physical regions of the United States",
  "8.9B": "8.9B — Explain how geography influenced early American settlement patterns",
  "8.10A": "8.10A — Describe human-environment interactions during westward expansion",
  "8.10B": "8.10B — Explain how Americans adapted to different physical environments",
  "8.11A": "8.11A — Describe major migration patterns in early U.S. history",
  "8.11B": "8.11B — Analyze push-pull factors that influenced immigration to the U.S.",
  "8.12A": "8.12A — Describe the colonial economy and major industries",
  "8.12B": "8.12B — Explain economic differences between Northern and Southern states",
  "8.13A": "8.13A — Describe early industrialization and its impact on American society",
  "8.13B": "8.13B — Explain the growth of factories and the working class",
  "8.14A": "8.14A — Identify key provisions of the U.S. Constitution and Bill of Rights",
  "8.14B": "8.14B — Explain the system of checks and balances and separation of powers",
  "8.14C": "8.14C — Describe the amendment process and its significance",
  "8.15A": "8.15A — Identify the rights protected by the First Amendment",
  "8.15B": "8.15B — Explain the significance of the 13th, 14th, and 15th Amendments",
  "8.16A": "8.16A — Describe the rights and responsibilities of U.S. citizens",
  "8.16B": "8.16B — Explain the importance of civic participation in a democracy",
  "8.24A": "8.24A — Describe factors that shaped American cultural identity",
  "8.24B": "8.24B — Explain how diverse cultural groups contributed to American society",
  "8.25A": "8.25A — Describe the role of religion in early American communities",
  "8.25B": "8.25B — Explain major reform movements and their impact on American society",
  "8.29A": "8.29A — Distinguish between primary and secondary sources in U.S. history",
  "8.29B": "8.29B — Evaluate the credibility, bias, and point of view of historical sources",
  "8.30A": "8.30A — Interpret maps, timelines, and graphs related to U.S. history",
  "8.30B": "8.30B — Analyze charts and data to draw historical conclusions",
  "8.31A": "8.31A — Apply critical thinking to analyze causes and effects in U.S. history",
  "8.31B": "8.31B — Evaluate multiple perspectives on significant events in U.S. history",
};

// ── Flat code list builder ─────────────────────────────────────────────────────
// Returns all TEKS codes for a given grade as a flat array of strings.
// Matches the pattern in teksReadingMap.js buildTeksAllowed().

export function buildTeksSSAllowed(gradeLevel) {
  const key = `grade${gradeLevel}`;
  const m = TEKS_SOCIAL_STUDIES_MAP[key];
  if (!m) return [];
  const allTeks = Object.values(m).flat();
  return [...new Set(allTeks.filter(Boolean))];
}