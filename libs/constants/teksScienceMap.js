// /libs/constants/teksScienceMap.js
// Branch: v2/student-success-platform
//
// Grade 6-8 Texas Science TEKS map for TEKS Portfolio v2 adaptive practice.
//
// Grade 6 — Matter & Energy, Force & Motion, Earth & Space, Organisms & Environments
// Grade 7 — Cells & Organisms, Genetics, Evolution, Earth History, Ecosystems
// Grade 8 — Force & Motion, Energy, Waves, Matter Properties, Earth & Space
//
// Shape matches teksReadingMap.js: { gradeN: { bucketKey: ["X.YZ"] } }
// Bucket keys are shared with TEKS_SCIENCE_BUCKET_LABELS below for human-readable labels.

export const TEKS_SCIENCE_MAP = {
  // ── Grade 6 ────────────────────────────────────────────────────────────────
  grade6: {
    // Matter & Energy — properties, changes, and conservation
    matter_properties:        ["6.5A", "6.5B", "6.5C"],
    matter_changes:           ["6.5D", "6.5E"],

    // Force & Motion — describing and calculating motion
    force_motion:             ["6.8A", "8.8B"],
    force_net:                ["6.8C", "6.8D"],

    // Earth & Space — Earth systems and space science
    earth_systems:            ["6.10A", "6.10B", "6.10C"],
    earth_space:              ["6.11A", "6.11B", "6.11C"],

    // Organisms & Environments — ecology and ecosystems
    organisms_structure:      ["6.12A", "6.12B"],
    ecosystems_interactions:  ["6.12C", "6.12D", "6.12E"],

    // Science Process & Lab Skills
    sci_process:              ["6.2A", "6.2B", "6.2C", "6.2D", "6.2E"],
    sci_tools_safety:         ["6.4A", "6.4B"],
  },

  // ── Grade 7 ────────────────────────────────────────────────────────────────
  grade7: {
    // Cells — structure and function
    cells_structure:          ["7.12A", "7.12B", "7.12C"],
    cells_processes:          ["7.12D", "7.12E"],

    // Genetics — heredity and variation
    genetics_heredity:        ["7.14A", "7.14B"],
    genetics_variation:       ["7.14C", "7.14D"],

    // Evolution — natural selection and adaptation
    evolution_natural_sel:    ["7.13A", "7.13B"],
    evolution_adaptations:    ["7.13C", "7.13D"],

    // Earth History — geologic time and change
    earth_history:            ["7.8A", "7.8B", "7.8C"],
    earth_geologic_time:      ["7.8D", "7.8E"],

    // Ecosystems — interactions and interdependence
    ecosystems_roles:         ["7.11A", "7.11B"],
    ecosystems_food_webs:     ["7.11C", "7.11D"],
    ecosystems_biotic_ab:     ["7.11E", "7.11F"],

    // Science Process & Lab Skills
    sci_process:              ["7.2A", "7.2B", "7.2C", "7.2D", "7.2E"],
    sci_tools_safety:         ["7.4A", "7.4B"],
  },

  // ── Grade 8 ────────────────────────────────────────────────────────────────
  grade8: {
    // Force & Motion — speed, velocity, acceleration
    force_speed_velocity:     ["8.6A", "8.6B"],
    force_acceleration:       ["8.6C", "8.6D"],
    force_newtons_laws:       ["8.6E", "8.6F"],

    // Energy — types, transformations, conservation
    energy_types:             ["8.7A", "8.7B"],
    energy_transformations:   ["8.7C", "8.7D"],

    // Waves — properties and behavior
    waves_properties:         ["8.7E", "8.7F"],
    waves_em_spectrum:        ["8.7G"],

    // Matter — properties and periodic table
    matter_periodic_table:    ["8.5A", "8.5B", "8.5C"],
    matter_bonding:           ["8.5D", "8.5E", "8.5F"],

    // Earth & Space — solar system, universe, plate tectonics
    earth_plate_tectonics:    ["8.9A", "8.9B", "8.9C"],
    earth_solar_system:       ["8.10A", "8.10B", "8.10C"],
    earth_universe:           ["8.10D", "8.10E"],

    // Science Process & Lab Skills
    sci_process:              ["8.2A", "8.2B", "8.2C", "8.2D", "8.2E"],
    sci_tools_safety:         ["8.4A", "8.4B"],
  },
};

// ── Bucket label map ──────────────────────────────────────────────────────────
// Key must match bucket key in TEKS_SCIENCE_MAP exactly.

export const TEKS_SCIENCE_BUCKET_LABELS = {
  // Grade 6
  matter_properties:        "Matter — Physical & Chemical Properties",
  matter_changes:           "Matter — Physical & Chemical Changes",
  force_motion:             "Force & Motion — Describing Motion",
  force_net:                "Force & Motion — Net Force",
  earth_systems:            ["Earth & Space — Earth Systems"],
  earth_space:              "Earth & Space — Space Science",
  organisms_structure:      "Organisms — Structure & Function",
  ecosystems_interactions:  "Ecosystems — Interactions & Interdependence",
  sci_process:              "Science Process — Scientific Investigations",
  sci_tools_safety:         "Science Process — Tools & Lab Safety",

  // Grade 7
  cells_structure:          "Cells — Structure & Function",
  cells_processes:          "Cells — Cell Processes",
  genetics_heredity:        "Genetics — Heredity & Traits",
  genetics_variation:       "Genetics — Variation & Mutation",
  evolution_natural_sel:    "Evolution — Natural Selection",
  evolution_adaptations:    "Evolution — Adaptations",
  earth_history:            "Earth History — Fossil Record & Change",
  earth_geologic_time:      "Earth History — Geologic Time Scale",
  ecosystems_roles:         "Ecosystems — Organism Roles",
  ecosystems_food_webs:     "Ecosystems — Food Webs & Energy Flow",
  ecosystems_biotic_ab:     "Ecosystems — Biotic & Abiotic Factors",

  // Grade 8
  force_speed_velocity:     "Force & Motion — Speed & Velocity",
  force_acceleration:       "Force & Motion — Acceleration",
  force_newtons_laws:       "Force & Motion — Newton's Laws",
  energy_types:             "Energy — Types of Energy",
  energy_transformations:   "Energy — Energy Transformations",
  waves_properties:         "Waves — Wave Properties",
  waves_em_spectrum:        "Waves — Electromagnetic Spectrum",
  matter_periodic_table:    "Matter — Periodic Table & Elements",
  matter_bonding:           "Matter — Chemical Bonding & Reactions",
  earth_plate_tectonics:    "Earth & Space — Plate Tectonics",
  earth_solar_system:       "Earth & Space — Solar System",
  earth_universe:           "Earth & Space — Universe & Galaxies",
};

// ── Label map for individual TEKS codes ───────────────────────────────────────
// Maps code → human-readable description for dropdown display.

export const TEKS_SCIENCE_LABELS = {
  // ── Grade 6 ──────────────────────────────────────────────────────────────────
  "6.2A": "6.2A — Plan and implement descriptive, comparative, and experimental investigations",
  "6.2B": "6.2B — Collect and record data using appropriate tools and units",
  "6.2C": "6.2C — Construct tables and graphs to organize and summarize data",
  "6.2D": "6.2D — Analyze data and identify trends to construct reasonable explanations",
  "6.2E": "6.2E — Communicate valid conclusions using evidence and reasoning",
  "6.4A": "6.4A — Use appropriate tools, including lab equipment and technology, safely",
  "6.4B": "6.4B — Collect and analyze information using tools such as microscopes and balances",
  "6.5A": "6.5A — Classify matter based on physical properties including mass, volume, and density",
  "6.5B": "6.5B — Identify and compare chemical and physical properties of matter",
  "6.5C": "6.5C — Describe the relationship between mass, volume, and density",
  "6.5D": "6.5D — Distinguish between physical and chemical changes in matter",
  "6.5E": "6.5E — Describe how elements combine to form compounds with new properties",
  "6.8A": "6.8A — Measure and calculate average speed using distance and time",
  "6.8B": "6.8B — Investigate and describe how position, direction, and speed relate to motion",
  "6.8C": "6.8C — Identify and describe the effects of force on objects",
  "6.8D": "6.8D — Explain how unbalanced forces cause changes in the speed or direction of motion",
  "6.10A": "6.10A — Describe the layers of the Earth including the core, mantle, and crust",
  "6.10B": "6.10B — Explain how the rock cycle, plate tectonics, and weathering shape Earth's surface",
  "6.10C": "6.10C — Describe how natural events like volcanoes and earthquakes affect Earth's surface",
  "6.11A": "6.11A — Describe the physical characteristics of the universe and our solar system",
  "6.11B": "6.11B — Explain how gravity controls the motion of planets and moons",
  "6.11C": "6.11C — Describe the role of the Sun as the primary source of energy in our solar system",
  "6.12A": "6.12A — Describe the structure and function of cells in living organisms",
  "6.12B": "6.12B — Differentiate between unicellular and multicellular organisms",
  "6.12C": "6.12C — Describe the flow of energy through food webs and food chains",
  "6.12D": "6.12D — Identify the roles of producers, consumers, and decomposers in an ecosystem",
  "6.12E": "6.12E — Describe the effects of environmental changes on ecosystems",

  // ── Grade 7 ──────────────────────────────────────────────────────────────────
  "7.2A": "7.2A — Plan and implement descriptive, comparative, and experimental investigations",
  "7.2B": "7.2B — Collect and record data using appropriate tools and units",
  "7.2C": "7.2C — Construct tables and graphs to organize and summarize data",
  "7.2D": "7.2D — Analyze data to identify patterns and construct explanations",
  "7.2E": "7.2E — Communicate valid conclusions supported by data",
  "7.4A": "7.4A — Use appropriate lab tools and equipment safely",
  "7.4B": "7.4B — Collect and analyze information using technology and lab tools",
  "7.8A": "7.8A — Interpret the fossil record as evidence of how life has changed over time",
  "7.8B": "7.8B — Describe how relative and absolute dating are used to determine age of rock layers",
  "7.8C": "7.8C — Explain how index fossils are used to correlate rock strata",
  "7.8D": "7.8D — Identify major events on the geologic time scale",
  "7.8E": "7.8E — Relate changes in Earth's climate to changes in life over geologic time",
  "7.11A": "7.11A — Describe the roles of organisms in a food web",
  "7.11B": "7.11B — Explain the cycling of matter through ecosystems (carbon, water, nitrogen cycles)",
  "7.11C": "7.11C — Describe how energy flows through a food web and is lost at each level",
  "7.11D": "7.11D — Interpret food webs and energy pyramids",
  "7.11E": "7.11E — Distinguish between biotic and abiotic factors in an ecosystem",
  "7.11F": "7.11F — Describe how changes in abiotic factors affect organisms in an ecosystem",
  "7.12A": "7.12A — Describe the structure and function of cell organelles including the nucleus and mitochondria",
  "7.12B": "7.12B — Compare the structures of prokaryotic and eukaryotic cells",
  "7.12C": "7.12C — Relate cell structure to cell function in plant and animal cells",
  "7.12D": "7.12D — Describe the process of photosynthesis and its role in the carbon cycle",
  "7.12E": "7.12E — Describe the process of cellular respiration and its relationship to photosynthesis",
  "7.13A": "7.13A — Explain how natural selection leads to changes in a population over time",
  "7.13B": "7.13B — Describe how environmental changes can lead to the extinction of species",
  "7.13C": "7.13C — Identify structural, behavioral, and physiological adaptations of organisms",
  "7.13D": "7.13D — Explain how adaptations increase the survival of organisms in an environment",
  "7.14A": "7.14A — Describe the role of DNA in heredity and protein synthesis",
  "7.14B": "7.14B — Predict the results of monohybrid crosses using Punnett squares",
  "7.14C": "7.14C — Distinguish between dominant and recessive traits",
  "7.14D": "7.14D — Describe how mutations can affect genetic variation in a population",

  // ── Grade 8 ──────────────────────────────────────────────────────────────────
  "8.2A": "8.2A — Plan and implement descriptive, comparative, and experimental investigations",
  "8.2B": "8.2B — Collect and record data using the International System of Units",
  "8.2C": "8.2C — Construct graphs and tables to organize and summarize data",
  "8.2D": "8.2D — Analyze data to identify patterns and construct explanations",
  "8.2E": "8.2E — Communicate valid, peer-reviewed conclusions supported by evidence",
  "8.4A": "8.4A — Use and maintain appropriate lab equipment safely",
  "8.4B": "8.4B — Use tools including triple beam balances, spring scales, and calculators",
  "8.5A": "8.5A — Describe the structure of atoms including protons, neutrons, and electrons",
  "8.5B": "8.5B — Interpret the periodic table to identify elements, groups, and periods",
  "8.5C": "8.5C — Describe how the periodic table organizes elements by properties",
  "8.5D": "8.5D — Distinguish between ionic and covalent bonds",
  "8.5E": "8.5E — Describe how atoms combine to form molecules and compounds",
  "8.5F": "8.5F — Identify evidence of chemical reactions including changes in temperature, color, and gas production",
  "8.6A": "8.6A — Describe and calculate average speed using the formula d = rt",
  "8.6B": "8.6B — Describe the relationship between speed, velocity, and acceleration",
  "8.6C": "8.6C — Calculate net force and describe how balanced and unbalanced forces affect motion",
  "8.6D": "8.6D — Interpret distance-time and speed-time graphs",
  "8.6E": "8.6E — Describe Newton's first law: objects in motion stay in motion unless acted on by a force",
  "8.6F": "8.6F — Apply Newton's second law (F = ma) to calculate force, mass, or acceleration",
  "8.7A": "8.7A — Differentiate between potential and kinetic energy",
  "8.7B": "8.7B — Describe the law of conservation of energy",
  "8.7C": "8.7C — Identify and describe transformations between different forms of energy",
  "8.7D": "8.7D — Explain how thermal energy is transferred through conduction, convection, and radiation",
  "8.7E": "8.7E — Describe the properties of waves including amplitude, wavelength, and frequency",
  "8.7F": "8.7F — Explain how the speed of a wave is related to wavelength and frequency",
  "8.7G": "8.7G — Describe the electromagnetic spectrum and the properties of different types of waves",
  "8.9A": "8.9A — Describe the evidence for plate tectonics including fossil records and seafloor spreading",
  "8.9B": "8.9B — Explain how plate movement causes earthquakes, volcanoes, and mountain building",
  "8.9C": "8.9C — Identify convergent, divergent, and transform plate boundaries and their features",
  "8.10A": "8.10A — Describe the physical characteristics of the components of our solar system",
  "8.10B": "8.10B — Explain the role of gravity and inertia in orbital motion",
  "8.10C": "8.10C — Describe the relationship between the Sun, Moon, and Earth including tides and phases",
  "8.10D": "8.10D — Describe characteristics of stars including size, temperature, and life cycle",
  "8.10E": "8.10E — Explain the Big Bang theory and evidence for the expanding universe",
};

// ── Flat code list builder ─────────────────────────────────────────────────────
// Returns all TEKS codes for a given grade as a flat array of strings.
// Matches the pattern in teksSocialStudiesMap.js buildTeksSSAllowed().

export function buildTeksScienceAllowed(gradeLevel) {
  const key = `grade${gradeLevel}`;
  const m = TEKS_SCIENCE_MAP[key];
  if (!m) return [];
  const allTeks = Object.values(m).flat();
  return [...new Set(allTeks.filter(Boolean))];
}