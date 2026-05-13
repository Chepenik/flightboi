import {
  AcademyLesson,
  AircraftProfile,
  GameModeProfile,
  MapProfile,
  RealismPreset,
  RealismSettings,
} from "./types";

export const aircraft: AircraftProfile[] = [
  {
    id: "falcon-x",
    name: "Falcon-X",
    role: "Balanced all-purpose",
    description:
      "Stable, quick to recover, and tuned for first-flight confidence without feeling slow.",
    accent: "#7de7ff",
    secondaryAccent: "#f7fbff",
    hudColor: "#7de7ff",
    mass: 1180,
    wingArea: 16.5,
    maxSpeed: 440,
    cruiseSpeed: 245,
    stallSpeed: 62,
    thrust: 32,
    boostThrust: 54,
    lift: 1.05,
    drag: 0.32,
    rollRate: 2.9,
    pitchRate: 1.55,
    yawRate: 0.78,
    stability: 0.72,
    energyRetention: 0.76,
    cameraShake: 0.38,
    cockpit: {
      panel: "clean glass aerobatic",
      instrumentColor: "#89f5ff",
      warningColor: "#ffcf5b",
    },
    soundProfile: {
      idle: "balanced turbine idle",
      boost: "cyan compressor surge",
      wind: "smooth canopy rush",
    },
  },
  {
    id: "wraith-interceptor",
    name: "Wraith Interceptor",
    role: "Fast and aggressive",
    description:
      "High roll authority, violent boost, and lower stability for players chasing canyon lines.",
    accent: "#ff3b53",
    secondaryAccent: "#15181f",
    hudColor: "#ff5668",
    mass: 980,
    wingArea: 13.4,
    maxSpeed: 590,
    cruiseSpeed: 315,
    stallSpeed: 78,
    thrust: 39,
    boostThrust: 86,
    lift: 0.9,
    drag: 0.27,
    rollRate: 4.4,
    pitchRate: 1.85,
    yawRate: 1,
    stability: 0.43,
    energyRetention: 0.88,
    cameraShake: 0.72,
    cockpit: {
      panel: "redline combat glass",
      instrumentColor: "#ff6f7f",
      warningColor: "#ffd166",
    },
    soundProfile: {
      idle: "low stealth turbine",
      boost: "red afterburner snap",
      wind: "sharp high-speed hiss",
    },
  },
  {
    id: "atlas-cruiser",
    name: "Atlas Cruiser",
    role: "Heavy cinematic explorer",
    description:
      "Big momentum, strong glide, and generous stability for scenic approaches and cargo runs.",
    accent: "#ffc46b",
    secondaryAccent: "#2b2118",
    hudColor: "#ffd38f",
    mass: 3450,
    wingArea: 42,
    maxSpeed: 320,
    cruiseSpeed: 175,
    stallSpeed: 52,
    thrust: 24,
    boostThrust: 48,
    lift: 1.28,
    drag: 0.48,
    rollRate: 1.42,
    pitchRate: 0.92,
    yawRate: 0.48,
    stability: 0.9,
    energyRetention: 0.64,
    cameraShake: 0.24,
    cockpit: {
      panel: "brass cargo steam-glass hybrid",
      instrumentColor: "#ffd38f",
      warningColor: "#ff7a45",
    },
    soundProfile: {
      idle: "warm radial rumble",
      boost: "wide golden trail bloom",
      wind: "deep fuselage wash",
    },
  },
];

export const maps: MapProfile[] = [
  {
    id: "alpine-dominion",
    name: "Alpine Dominion",
    inspiration: "Telluride / Swiss Alps",
    tagline: "Snow canyons, frozen lakes, and mountain strip discipline.",
    weather: "snow",
    skyTop: "#29456b",
    skyBottom: "#f8c982",
    sunColor: "#ffd590",
    fogColor: "#dcecff",
    groundColor: "#d9e8f7",
    waterColor: "#91c9f2",
    accent: "#92e5ff",
    runwayHeading: 92,
    wind: { directionDeg: 280, speedKt: 11, gustKt: 19 },
    hazards: ["ridge rotors", "snow fog", "cable bridges"],
    features: ["frozen lakes", "PAPI approach", "avalanche plumes"],
  },
  {
    id: "neon-pacific",
    name: "Neon Pacific",
    inspiration: "Tokyo night rain",
    tagline: "Wet towers, holographic gates, and electric storm cells.",
    weather: "rain",
    skyTop: "#090b24",
    skyBottom: "#20133c",
    sunColor: "#ff4fd8",
    fogColor: "#271d50",
    groundColor: "#121423",
    waterColor: "#151f3f",
    accent: "#ff4fd8",
    runwayHeading: 34,
    wind: { directionDeg: 65, speedKt: 15, gustKt: 26 },
    hazards: ["skyscraper slots", "thunderheads", "elevated highways"],
    features: ["rain reflections", "holograms", "night VFR work"],
  },
  {
    id: "emerald-frontier",
    name: "Emerald Frontier",
    inspiration: "Costa Rica",
    tagline: "Waterfalls, jungle valleys, ruins, and soft-field strips.",
    weather: "fog",
    skyTop: "#0d584a",
    skyBottom: "#f2d17c",
    sunColor: "#ffe08b",
    fogColor: "#b8e2bf",
    groundColor: "#1f6f3b",
    waterColor: "#2ab5a6",
    accent: "#8dff9e",
    runwayHeading: 124,
    wind: { directionDeg: 110, speedKt: 8, gustKt: 16 },
    hazards: ["jungle fog", "river canyon sink", "short wet strip"],
    features: ["waterfalls", "ancient ruins", "river bends"],
  },
  {
    id: "crimson-dunes",
    name: "Crimson Dunes",
    inspiration: "Sahara sunset",
    tagline: "Heat shimmer, dust walls, and long-horizon navigation.",
    weather: "dust",
    skyTop: "#54213a",
    skyBottom: "#ffb15d",
    sunColor: "#ffcf7a",
    fogColor: "#d98a55",
    groundColor: "#bf6b35",
    waterColor: "#8dc5c5",
    accent: "#ff8d4d",
    runwayHeading: 260,
    wind: { directionDeg: 230, speedKt: 18, gustKt: 31 },
    hazards: ["dust storms", "sand vortex", "heat haze"],
    features: ["ancient towers", "dune waves", "sunset checkpoints"],
  },
  {
    id: "azure-archipelago",
    name: "Azure Archipelago",
    inspiration: "Maldives / Bora Bora",
    tagline: "Island approaches, reflective water, and storm-line decisions.",
    weather: "ocean-haze",
    skyTop: "#1e7ad8",
    skyBottom: "#ffd1a1",
    sunColor: "#fff0b8",
    fogColor: "#acd5e8",
    groundColor: "#36a87b",
    waterColor: "#1ab3d5",
    accent: "#65fff1",
    runwayHeading: 82,
    wind: { directionDeg: 95, speedKt: 13, gustKt: 23 },
    hazards: ["crosswind island final", "storm cells", "ocean cloud layers"],
    features: ["beach flyovers", "tiny runways", "seaplane docks"],
  },
];

export const gameModes: GameModeProfile[] = [
  {
    id: "free-flight",
    name: "Free Flight",
    shortName: "Free",
    description: "Relaxed exploration with dynamic weather, cruise camera, and photo-ready scenery.",
    learningFocus: "Scan attitude, speed, terrain, and wind without pressure.",
  },
  {
    id: "time-trial",
    name: "Time Trial",
    shortName: "Trial",
    description: "Hit clean gates, manage boost, and chase repeatable route time.",
    learningFocus: "Smooth bank angles, coordinated turns, and altitude discipline.",
  },
  {
    id: "canyon-rush",
    name: "Canyon Rush",
    shortName: "Rush",
    description: "Increasing speed, near-miss bonuses, and route survival through terrain.",
    learningFocus: "Energy management and sight-picture planning under load.",
  },
  {
    id: "sky-delivery",
    name: "Sky Delivery",
    shortName: "Cargo",
    description: "Cargo runs that reward gentle handling, stable approaches, and fuel planning.",
    learningFocus: "Weight, balance, throttle, and descent planning.",
  },
  {
    id: "sky-academy",
    name: "Sky Academy",
    shortName: "Academy",
    description: "Structured aviation lessons with visual coaching and flight grading.",
    learningFocus: "Airspeed, AoA, trim, flaps, wind correction, and landing setup.",
  },
  {
    id: "pilot-sandbox",
    name: "Pilot Sandbox",
    shortName: "Sandbox",
    description: "Full familiarization cockpit, W&B, navigation, and realism toggles for free practice.",
    learningFocus: "Pilot workflow, cockpit interpretation, and realistic cause/effect.",
  },
];

export const academyLessons: AcademyLesson[] = [
  {
    id: "basic-flight",
    title: "Basic Flight",
    objective: "Hold a steady attitude, keep airspeed alive, and make gentle corrections.",
    checkpoints: ["Level at 1,500 ft", "Set 65% throttle", "Track the horizon bar"],
    mistakeCoaching:
      "Large pitch inputs trade speed for altitude quickly. Relax the stick, let the wing work, then trim.",
  },
  {
    id: "turning-coordination",
    title: "Turning & Coordination",
    objective: "Bank smoothly, add a touch of back pressure, and keep the ball centered.",
    checkpoints: ["Enter a 25 degree bank", "Hold altitude", "Roll out on the heading bug"],
    mistakeCoaching:
      "If altitude decays in a turn, increase lift with slight pitch or reduce bank angle.",
  },
  {
    id: "takeoffs",
    title: "Takeoffs",
    objective: "Build speed, rotate gently, and climb without dragging the airplane behind the power curve.",
    checkpoints: ["Line up", "Full power", "Rotate above safe speed", "Positive climb"],
    mistakeCoaching:
      "Rotating early creates a mushy climb. Let the airspeed tape come alive before lifting the nose.",
  },
  {
    id: "landings",
    title: "Landings",
    objective: "Fly a stable approach with runway alignment, descent rate, and flare timing.",
    checkpoints: ["Intercept glide path", "Set flaps", "Idle over threshold", "Flare and settle"],
    mistakeCoaching:
      "A stable final starts early: speed first, runway alignment second, flare last.",
  },
  {
    id: "crosswind",
    title: "Crosswind Handling",
    objective: "Crab into the wind, align with rudder, and lower the upwind wing near touchdown.",
    checkpoints: ["Identify wind", "Crab on final", "De-crab", "Hold centerline"],
    mistakeCoaching:
      "The nose can point away from the runway while the ground track remains centered.",
  },
  {
    id: "mountain-flying",
    title: "Mountain Flying",
    objective: "Respect density altitude, terrain escape paths, and ridge wind behavior.",
    checkpoints: ["Cross ridge at angle", "Keep escape route", "Avoid valley dead ends"],
    mistakeCoaching:
      "Never point at rising terrain without a turning option. Cross ridges diagonally with margin.",
  },
  {
    id: "storm-flying",
    title: "Storm Flying",
    objective: "Read visibility, turbulence, and wind shear before committing to a route.",
    checkpoints: ["Skirt storm cell", "Manage turbulence", "Hold attitude"],
    mistakeCoaching:
      "Chasing headings inside turbulence makes the ride worse. Hold attitude and let small deviations pass.",
  },
  {
    id: "navigation",
    title: "Navigation",
    objective: "Use compass, route cues, GPS, and landmarks to stay oriented.",
    checkpoints: ["Set heading bug", "Track waypoint", "Confirm landmark"],
    mistakeCoaching:
      "Great VFR navigation is constant cross-checking, not staring at one instrument.",
  },
  {
    id: "energy-management",
    title: "Energy Management",
    objective: "Trade speed, altitude, bank, and throttle intentionally.",
    checkpoints: ["Dive for speed", "Zoom climb", "Recover cruise", "Plan descent"],
    mistakeCoaching:
      "Speed is stored energy. Spend it on climb or turn only when you know how you will regain it.",
  },
  {
    id: "emergency-recovery",
    title: "Emergency Recovery",
    objective: "Recover from stalls, engine heat, and unusual attitudes with calm priorities.",
    checkpoints: ["Reduce AoA", "Level wings", "Add power", "Recover climb"],
    mistakeCoaching:
      "Stall recovery starts by reducing angle of attack. Power helps after the wing is flying again.",
  },
];

export function realismFromPreset(preset: RealismPreset): RealismSettings {
  const base = {
    preset,
    stalls: false,
    trim: false,
    flaps: false,
    densityAltitude: false,
    wind: true,
    turbulence: false,
    structuralStress: false,
    engineStress: false,
    icing: false,
    crosswind: true,
    gyroDrift: false,
  };

  if (preset === "game") return base;

  if (preset === "pilot-familiarization") {
    return {
      ...base,
      stalls: true,
      trim: true,
      flaps: true,
      turbulence: true,
    };
  }

  return {
    ...base,
    stalls: true,
    trim: true,
    flaps: true,
    densityAltitude: true,
    turbulence: true,
    structuralStress: true,
    engineStress: true,
    icing: preset === "near-sim",
    gyroDrift: preset === "near-sim",
  };
}

export function getAircraft(id: string) {
  return aircraft.find((item) => item.id === id) ?? aircraft[0];
}

export function getMap(id: string) {
  return maps.find((item) => item.id === id) ?? maps[0];
}

export function getMode(id: string) {
  return gameModes.find((item) => item.id === id) ?? gameModes[0];
}

export function getLesson(id: string) {
  return academyLessons.find((item) => item.id === id) ?? academyLessons[0];
}
