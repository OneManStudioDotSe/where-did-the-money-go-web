import type { CategoryMapping } from '../types';

let mappingId = 0;
const createMapping = (
  pattern: string,
  categoryId: string,
  subcategoryId: string,
  matchType: CategoryMapping['matchType'] = 'contains',
  priority: number = 50
): CategoryMapping => ({
  id: `default-${++mappingId}`,
  pattern,
  categoryId,
  subcategoryId,
  matchType,
  priority,
  isCustom: false,
});

/**
 * Default category mappings for Swedish bank transactions
 * Priority: higher = checked first
 */
export const defaultCategoryMappings: CategoryMapping[] = [
  // === STREAMING SERVICES (high priority) ===
  createMapping('NETFLIX', 'entertainment', 'streaming', 'contains', 90),
  createMapping('SPOTIFY', 'entertainment', 'streaming', 'contains', 90),
  createMapping('HBO', 'entertainment', 'streaming', 'contains', 90),
  createMapping('DISNEY', 'entertainment', 'streaming', 'contains', 90),
  createMapping('VIAPLAY', 'entertainment', 'streaming', 'contains', 90),

  // === SOFTWARE/CLOUD SERVICES ===
  createMapping('GOOGLE ONE', 'subscriptions', 'software', 'contains', 85),
  createMapping('APPLE COM/BI', 'subscriptions', 'software', 'contains', 85),
  createMapping('GOOGLE GSUIT', 'subscriptions', 'software', 'contains', 85),
  createMapping('GOOGLE GOOG', 'subscriptions', 'software', 'contains', 85),
  createMapping('GOOGLE PLAY', 'entertainment', 'gaming', 'contains', 80),
  createMapping('GOOGLE ROBLO', 'entertainment', 'gaming', 'contains', 80),

  // === GROCERIES - SUPERMARKETS ===
  createMapping('WILLYS', 'groceries', 'supermarket', 'contains', 70),
  createMapping('ICA ', 'groceries', 'supermarket', 'contains', 70),
  createMapping('COOP', 'groceries', 'supermarket', 'contains', 70),
  createMapping('LIDL', 'groceries', 'supermarket', 'contains', 70),
  createMapping('HEMKOP', 'groceries', 'supermarket', 'contains', 70),
  createMapping('HEMKÖP', 'groceries', 'supermarket', 'contains', 70),
  createMapping('MAXI', 'groceries', 'supermarket', 'contains', 70),
  createMapping('CITY GROSS', 'groceries', 'supermarket', 'contains', 70),
  createMapping('MATHEM', 'groceries', 'supermarket', 'contains', 70),

  // === GROCERIES - CONVENIENCE ===
  createMapping('PRESSBYRÅ', 'groceries', 'convenience', 'contains', 70),
  createMapping('PRESSBYRAN', 'groceries', 'convenience', 'contains', 70),
  createMapping('7-ELEVEN', 'groceries', 'convenience', 'contains', 70),
  createMapping('CONVINI', 'groceries', 'convenience', 'contains', 70),
  createMapping('MYWAY', 'groceries', 'convenience', 'contains', 70),
  createMapping('MY WAY', 'groceries', 'convenience', 'contains', 70),
  createMapping('DIREKTEN', 'groceries', 'convenience', 'contains', 70),
  createMapping('QUICKSHOPS', 'groceries', 'convenience', 'contains', 70),

  // === ALCOHOL ===
  createMapping('SYSTEMBOLAGE', 'groceries', 'alcohol', 'contains', 75),

  // === TRANSPORTATION - FUEL ===
  createMapping('CIRCLE K', 'transportation', 'fuel', 'contains', 70),
  createMapping('OKQ8', 'transportation', 'fuel', 'contains', 70),
  createMapping('PREEM', 'transportation', 'fuel', 'contains', 70),
  createMapping('ST1 ', 'transportation', 'fuel', 'starts_with', 70),
  createMapping('SHELL', 'transportation', 'fuel', 'contains', 70),

  // === TRANSPORTATION - PARKING ===
  createMapping('EASYPARK', 'transportation', 'parking', 'contains', 75),
  createMapping('AIMO PARK', 'transportation', 'parking', 'contains', 75),
  createMapping('AIMO AIMO P', 'transportation', 'parking', 'contains', 75),
  createMapping('PARKMAN', 'transportation', 'parking', 'contains', 75),
  createMapping('P-SERVICE', 'transportation', 'parking', 'contains', 75),
  createMapping('PARKERINGSSERVICE', 'transportation', 'parking', 'contains', 75),

  // === TRANSPORTATION - PUBLIC TRANSIT ===
  createMapping('SL', 'transportation', 'public_transit', 'exact', 90),  // Exact match for "SL"
  createMapping('SL ', 'transportation', 'public_transit', 'starts_with', 80),
  createMapping('AB STORSTOCK', 'transportation', 'public_transit', 'contains', 80),
  createMapping('SJ PENDELTAG', 'transportation', 'public_transit', 'contains', 80),

  // === TRANSPORTATION - TAXI/RIDESHARE ===
  createMapping('UBER', 'transportation', 'taxi', 'contains', 75),
  createMapping('BOLT EU', 'transportation', 'taxi', 'contains', 75),
  createMapping('TAXI', 'transportation', 'taxi', 'contains', 60),

  // === TRANSPORTATION - OTHER ===
  createMapping('FORDONSSKATT', 'transportation', 'vehicle_tax', 'contains', 85),
  createMapping('TRÄNGSELSKATT', 'transportation', 'vehicle_tax', 'contains', 85),
  createMapping('TRANGSELSKATT', 'transportation', 'vehicle_tax', 'contains', 85),

  // === FOOD & DINING - COFFEE ===
  createMapping('ESPRESSO HOU', 'food_dining', 'coffee', 'contains', 70),
  createMapping('WAYNES COFFE', 'food_dining', 'coffee', 'contains', 70),
  createMapping('COFFEE HOUSE', 'food_dining', 'coffee', 'contains', 70),
  createMapping('COFFE HOUSE', 'food_dining', 'coffee', 'contains', 70),
  createMapping('STARBUCKS', 'food_dining', 'coffee', 'contains', 70),
  createMapping('FRANKLIN COF', 'food_dining', 'coffee', 'contains', 70),
  createMapping('FIKATERIAN', 'food_dining', 'coffee', 'contains', 70),
  createMapping('GRILLSKA HUS', 'food_dining', 'coffee', 'contains', 70),
  createMapping('LUSSINS KOND', 'food_dining', 'coffee', 'contains', 70),
  createMapping('KLADDKAKAN', 'food_dining', 'coffee', 'contains', 70),
  createMapping('CAFE VAXTHUS', 'food_dining', 'coffee', 'contains', 70),
  createMapping('ELIN CAFE', 'food_dining', 'coffee', 'contains', 70),
  createMapping('CAFE FRESH', 'food_dining', 'coffee', 'contains', 70),
  createMapping('CAFE', 'food_dining', 'coffee', 'contains', 50),

  // === FOOD & DINING - FAST FOOD ===
  createMapping('MAX BURGERS', 'food_dining', 'fast_food', 'contains', 75),
  createMapping('MCDONALD', 'food_dining', 'fast_food', 'contains', 75),
  createMapping('SUBWAY', 'food_dining', 'fast_food', 'contains', 75),
  createMapping('BURGER', 'food_dining', 'fast_food', 'contains', 60),

  // === FOOD & DINING - RESTAURANTS ===
  createMapping('MELINS', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('O LEARYS', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('DADOS KÖK', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('ANTONIOS KOK', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('BONGO KOK', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('STEAKHOUSE', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('KIMCHISTAN', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('58 DIM SUM', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('LA NETA', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('LILLA RUCCOL', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('IL FORNO', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('BROTHER TUCK', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('JACKS BURGER', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('EFENDI', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('NORDISKA BAR', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('RAMA 2 THAI', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('UM THAI', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('GREKISK', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('GREKISKA', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('THE BISHOPS', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('LEBANESE FOO', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('PONG EXPRE', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('SULTAN EN SM', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('BRON RESTAUR', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('GRILLPALATSE', 'food_dining', 'restaurant', 'contains', 70),
  createMapping('RESTAURANG', 'food_dining', 'restaurant', 'contains', 60),

  // === FOOD & DINING - DELIVERY ===
  createMapping('FOODORA', 'food_dining', 'delivery', 'contains', 75),
  createMapping('UBER EATS', 'food_dining', 'delivery', 'contains', 75),
  createMapping('WOLT', 'food_dining', 'delivery', 'contains', 75),

  // === HOUSING ===
  createMapping('BERGNÄS', 'housing', 'rent', 'contains', 90),
  createMapping('BERGNAS', 'housing', 'rent', 'contains', 90),
  createMapping('LÅN 4704', 'housing', 'rent', 'starts_with', 90),
  createMapping('LÃN 4704', 'housing', 'rent', 'starts_with', 90),
  createMapping('VATTENFALL', 'housing', 'utilities', 'contains', 85),
  createMapping('TELENOR', 'housing', 'utilities', 'contains', 85),
  createMapping('TELE2', 'housing', 'utilities', 'contains', 85),
  createMapping('COMVIQ', 'housing', 'utilities', 'contains', 85),
  createMapping('HUDDINGE KOMMUN', 'housing', 'utilities', 'contains', 85),
  createMapping('SECTOR ALARM', 'housing', 'security', 'contains', 85),
  createMapping('FASTIGHETSSKÖ', 'housing', 'maintenance', 'contains', 85),
  createMapping('NÄRA&KÄRA', 'housing', 'maintenance', 'contains', 85),

  // === INSURANCE ===
  createMapping('TRYGG-HANSA', 'subscriptions', 'insurance', 'contains', 85),
  createMapping('ICA FÖRSÄKR', 'subscriptions', 'insurance', 'contains', 85),
  createMapping('ICA FORSAKR', 'subscriptions', 'insurance', 'contains', 85),
  createMapping('HEDVIG', 'subscriptions', 'insurance', 'contains', 85),
  createMapping('T HEDVIG', 'subscriptions', 'insurance', 'contains', 85),
  createMapping('BLIWA', 'subscriptions', 'insurance', 'contains', 85),

  // === SUBSCRIPTIONS - OTHER ===
  createMapping('ENKLA VARDAG', 'subscriptions', 'other', 'contains', 85),
  createMapping('BILLMATE', 'subscriptions', 'other', 'contains', 85),

  // === HEALTH ===
  createMapping('KRONANS APOT', 'health', 'pharmacy', 'contains', 75),
  createMapping('APOTEKET', 'health', 'pharmacy', 'contains', 75),
  createMapping('K*APOTEA', 'health', 'pharmacy', 'contains', 75),
  createMapping('KRY', 'health', 'medical', 'contains', 75),
  createMapping('LÄKARE', 'health', 'medical', 'contains', 70),

  // === MEMBERSHIPS ===
  createMapping('UNIONEN', 'subscriptions', 'membership', 'contains', 85),
  createMapping('AKAD.A-KASSA', 'subscriptions', 'membership', 'contains', 85),
  createMapping('SV INGENJ', 'subscriptions', 'membership', 'contains', 85),

  // === DONATIONS ===
  createMapping('LÄKARE UTAN', 'donations', 'charity', 'contains', 80),
  createMapping('LAKARE UTAN', 'donations', 'charity', 'contains', 80),
  createMapping('RÖDA KORSET', 'donations', 'charity', 'contains', 80),
  createMapping('RODA KORSET', 'donations', 'charity', 'contains', 80),
  createMapping('STADSMISSION', 'donations', 'charity', 'contains', 80),

  // === SHOPPING - ONLINE ===
  createMapping('AMAZON', 'shopping', 'online', 'contains', 70),
  createMapping('LUXEMBOURG', 'shopping', 'online', 'contains', 70), // Amazon purchases
  createMapping('PAYPAL ALIP', 'shopping', 'online', 'contains', 70),
  createMapping('ETSY', 'shopping', 'online', 'contains', 70),
  createMapping('VINTED', 'shopping', 'online', 'contains', 70),
  createMapping('CDON', 'shopping', 'online', 'contains', 70),
  createMapping('SMARTPHOTO', 'shopping', 'online', 'contains', 70),
  createMapping('ZALANDO', 'shopping', 'online', 'contains', 70),
  createMapping('K*', 'shopping', 'online', 'starts_with', 40), // Klarna purchases

  // === SHOPPING - HOME GOODS ===
  createMapping('IKEA', 'shopping', 'home_goods', 'contains', 70),
  createMapping('CLAS OHLSON', 'shopping', 'home_goods', 'contains', 70),

  // === SHOPPING - CLOTHING ===
  createMapping('H&M', 'shopping', 'clothing', 'contains', 70),
  createMapping('HM SE', 'shopping', 'clothing', 'starts_with', 70),
  createMapping('LINDEX', 'shopping', 'clothing', 'contains', 70),
  createMapping('KAPPAHL', 'shopping', 'clothing', 'contains', 70),
  createMapping('DEICHMANN', 'shopping', 'clothing', 'contains', 70),
  createMapping('DIN SKO', 'shopping', 'clothing', 'contains', 70),
  createMapping('XXL SPORT', 'shopping', 'clothing', 'contains', 70),
  createMapping('STADIUM', 'shopping', 'clothing', 'contains', 70),
  createMapping('LINDRA SECON', 'shopping', 'clothing', 'contains', 70),
  createMapping('MYRORNA', 'shopping', 'clothing', 'contains', 70),

  // === SHOPPING - HARDWARE ===
  createMapping('BAUHAUS', 'shopping', 'hardware', 'contains', 70),
  createMapping('HORNBACH', 'shopping', 'hardware', 'contains', 70),
  createMapping('AUTODOC', 'shopping', 'hardware', 'contains', 70),
  createMapping('EMBLADS BILS', 'shopping', 'hardware', 'contains', 70),

  // === ENTERTAINMENT - EVENTS ===
  createMapping('FILMSTADEN', 'entertainment', 'events', 'contains', 75),
  createMapping('TICKETMASTER', 'entertainment', 'events', 'contains', 75),
  createMapping('TICKET SE', 'entertainment', 'events', 'contains', 75),
  createMapping('KULTURBILJET', 'entertainment', 'events', 'contains', 75),
  createMapping('ZITA FOLKETS', 'entertainment', 'events', 'contains', 75),
  createMapping('TM TICKETMA', 'entertainment', 'events', 'contains', 75),
  createMapping('K*AXS SWEDEN', 'entertainment', 'events', 'contains', 75),
  createMapping('JESSIES MUSI', 'entertainment', 'events', 'contains', 75),

  // === ENTERTAINMENT - ACTIVITIES ===
  createMapping('JUMPYARD', 'entertainment', 'activities', 'contains', 75),
  createMapping('RACEHALL', 'entertainment', 'activities', 'contains', 75),
  createMapping('ACCROPARK', 'entertainment', 'activities', 'contains', 75),
  createMapping('GLOMSTAPOOLE', 'entertainment', 'activities', 'contains', 75),
  createMapping('HESSELBY SLO', 'entertainment', 'activities', 'contains', 75),

  // === CHILDREN ===
  createMapping('LEKIA', 'children', 'toys', 'contains', 70),
  createMapping('LEKSAK', 'children', 'toys', 'contains', 60),
  createMapping('BABYLAND', 'children', 'kids_clothing', 'contains', 70),
  createMapping('BARNBUTIKEN', 'children', 'kids_clothing', 'contains', 70),

  // === FINANCIAL ===
  createMapping('LÅN ', 'financial', 'loans', 'starts_with', 85),
  createMapping('LÃN ', 'financial', 'loans', 'starts_with', 85),
  createMapping('BANKAKTIEBOL', 'financial', 'bank_fees', 'contains', 70),

  // === INCOME ===
  createMapping('LÖN', 'income', 'salary', 'contains', 90),
  createMapping('LON', 'income', 'salary', 'contains', 90),
  createMapping('FKASSA', 'income', 'benefits', 'contains', 85),
  createMapping('BARNBDR', 'income', 'benefits', 'contains', 85),
  createMapping('KLARNA REFUN', 'income', 'refund', 'contains', 80),

  // === PUBLIC SERVICES ===
  // Municipal fees (kommunala avgifter)
  createMapping('KOMMUN', 'public_services', 'municipal_fees', 'contains', 75),
  createMapping('KOMMUNAL', 'public_services', 'municipal_fees', 'contains', 75),
  createMapping('STOCKHOLMS STAD', 'public_services', 'municipal_fees', 'contains', 80),
  createMapping('GÖTEBORGS STAD', 'public_services', 'municipal_fees', 'contains', 80),
  createMapping('MALMÖ STAD', 'public_services', 'municipal_fees', 'contains', 80),
  // Parking fines
  createMapping('PARKERINGSBOT', 'public_services', 'parking_fines', 'contains', 85),
  createMapping('P-BOT', 'public_services', 'parking_fines', 'contains', 85),
  createMapping('KONTROLLAVGIFT', 'public_services', 'parking_fines', 'contains', 85),
  createMapping('FELPARKERINGSAVGIFT', 'public_services', 'parking_fines', 'contains', 85),
  // Government agencies
  createMapping('SKATTEVERKET', 'public_services', 'public_fees', 'contains', 85),
  createMapping('TRANSPORTSTYRELSEN', 'public_services', 'public_fees', 'contains', 85),
  createMapping('POLISEN', 'public_services', 'public_fees', 'contains', 80),
  createMapping('KRONOFOGDEN', 'public_services', 'public_fees', 'contains', 85),
  createMapping('LANTMÄTERIET', 'public_services', 'permits', 'contains', 80),
  createMapping('MIGRATIONSVERKET', 'public_services', 'permits', 'contains', 80),
];
