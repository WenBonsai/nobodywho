export const parseCoffeeLabel = (rawText) => {
  const text = rawText.toUpperCase();
  return {
    brand: rawText.split('\n')[0]?.trim() || '',
    origin: extractOrigin(text),
    roastLevel: extractRoastLevel(text),
    grindSize: extractGrindSize(text),
    brewMethod: extractBrewMethod(text),
    flavorNotes: extractFlavorNotes(text),
    weight: extractWeight(text),
  };
};

const extractOrigin = (text) => {
  const origins = ['COLOMBIA', 'BRAZIL', 'ETHIOPIA', 'KENYA', 'INDONESIA', 'GUATEMALA', 'PERU', 'MEXICO', 'PANAMA', 'COSTA RICA', 'VIETNAM'];
  for (const origin of origins) {
    if (text.includes(origin)) return origin;
  }
  return 'Unknown Origin';
};

const extractRoastLevel = (text) => {
  if (text.match(/DARK|FRENCH|ITALIAN|ESPRESSO/)) return 'Dark';
  if (text.match(/MEDIUM|CITY|FULL/)) return 'Medium';
  if (text.match(/LIGHT|CINNAMON/)) return 'Light';
  return 'Unknown Roast';
};

const extractGrindSize = (text) => {
  if (text.match(/COARSE/)) return 'Coarse';
  if (text.match(/MEDIUM|FILTER/)) return 'Medium';
  if (text.match(/FINE|ESPRESSO/)) return 'Fine';
  return 'Unknown Grind';
};

const extractBrewMethod = (text) => {
  if (text.match(/ESPRESSO/)) return 'Espresso';
  if (text.match(/FRENCH PRESS|PLUNGER/)) return 'French Press';
  if (text.match(/POUR OVER|FILTER|DRIP/)) return 'Pour Over';
  if (text.match(/AEROPRESS/)) return 'AeroPress';
  if (text.match(/MOKA|STOVETOP/)) return 'Moka Pot';
  return 'Pour Over';
};

const extractFlavorNotes = (text) => {
  const flavors = [];
  const commonNotes = ['CHOCOLATE', 'CARAMEL', 'NUTTY', 'FRUITY', 'FLORAL', 'EARTHY', 'SPICY', 'SWEET', 'BRIGHT', 'SMOOTH'];
  commonNotes.forEach(note => {
    if (text.includes(note)) flavors.push(note.charAt(0) + note.slice(1).toLowerCase());
  });
  return flavors.length > 0 ? flavors : ['Rich', 'Balanced'];
};

const extractWeight = (text) => {
  const match = text.match(/(\d+)\s*(G|GRAMS|OZ|OUNCES)/);
  return match ? `${match[1]}${match[2]}` : 'Unknown';
};

export const getBrewingGuide = (coffeeData) => {
  const guides = {
    'Espresso': { temp: '200-205°F', time: '25-30s', ratio: '1:2', steps: ['Grind fine', 'Tamp firmly', 'Pull shot'] },
    'Pour Over': { temp: '195-205°F', time: '3-4 min', ratio: '1:16', steps: ['Heat water', 'Bloom 30s', 'Pour slowly'] },
    'French Press': { temp: '195-205°F', time: '4 min', ratio: '1:15', steps: ['Coarse grind', 'Add water', 'Plunge down'] },
    'AeroPress': { temp: '175-185°F', time: '1-2 min', ratio: '1:16', steps: ['Insert filter', 'Add grounds', 'Pour water', 'Press'] },
    'Moka Pot': { temp: 'Medium heat', time: '5-10 min', ratio: '1:2', steps: ['Fill water', 'Add grounds', 'Heat until hiss'] },
  };
  return guides[coffeeData.brewMethod] || guides['Pour Over'];
};
