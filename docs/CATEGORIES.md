# Category & Subcategory Definitions

This document defines the category hierarchy and mapping rules for automatic transaction categorization.

---

## Category Hierarchy

### 🏠 Housing
| Subcategory | Description | Example Patterns |
|-------------|-------------|------------------|
| Rent/Mortgage | Monthly housing payment | `BERGNÄS`, `LÅN 4704*` |
| Utilities | Electricity, water, heating | `VATTENFALL`, `HUDDINGE KOMMUN` |
| Insurance | Home insurance | `ICA FÖRSÄKR`, `TRYGG-HANSA` |
| Maintenance | Property upkeep, repairs | `FASTIGHETSSKÄT` |
| Security | Alarm systems | `SECTOR ALARM` |

### 🚗 Transportation
| Subcategory | Description | Example Patterns |
|-------------|-------------|------------------|
| Fuel | Gas/petrol | `CIRCLE K`, `OKQ8`, `PREEM`, `ST1` |
| Public Transit | Buses, trains, metro | `SL`, `SJ PENDELTAG` |
| Parking | Parking fees | `EASYPARK`, `AIMO PARK`, `PARKMAN` |
| Taxi/Rideshare | Uber, Bolt, taxis | `UBER`, `BOLT`, `TAXI STOCKHO` |
| Car Insurance | Vehicle insurance | Vehicle-specific |
| Car Maintenance | Repairs, service | `AUTODOC`, `EMBLADS BILS` |
| Vehicle Tax | Fordonsskatt | `FORDONSSKATT` |

### 🛒 Groceries
| Subcategory | Description | Example Patterns |
|-------------|-------------|------------------|
| Supermarket | Large grocery stores | `WILLYS`, `ICA`, `COOP`, `LIDL`, `HEMKÖP`, `MAXI` |
| Convenience | Small stores, kiosks | `PRESSBYRÅN`, `7-ELEVEN` |
| Specialty | Ethnic, organic, specialty | `GREKISK LIVS` |
| Alcohol | Systembolaget | `SYSTEMBOLAGE` |

### 🍽️ Food & Dining
| Subcategory | Description | Example Patterns |
|-------------|-------------|------------------|
| Restaurants | Sit-down dining | `MELINS`, `JURESKOG`, `IL FORNO` |
| Fast Food | Quick service | `MAX BURGERS`, `MCDONALD`, `SUBWAY` |
| Coffee | Coffee shops | `ESPRESSO HOU`, `WAYNES COFFE`, `STARBUCKS` |
| Delivery | Food delivery | `FOODORA`, `UBER EATS` |
| Bakery | Bread, pastries | `BRÖD OCH SAL`, `FABRIQUE` |

### 🛍️ Shopping
| Subcategory | Description | Example Patterns |
|-------------|-------------|------------------|
| Clothing | Apparel | `H&M`, `LINDEX`, `KAPPAHL`, `ZARA` |
| Electronics | Tech, gadgets | `AMAZON`, `CDON` |
| Home Goods | Furniture, decor | `IKEA`, `CLAS OHLSON` |
| Online Shopping | E-commerce | `AMAZON`, `ZALANDO`, `K*` (Klarna) |
| Hardware | DIY, tools | `BAUHAUS`, `HORNBACH` |

### 🎬 Entertainment
| Subcategory | Description | Example Patterns |
|-------------|-------------|------------------|
| Streaming | Video/music services | `NETFLIX`, `SPOTIFY`, `DISNEY+` |
| Gaming | Games, subscriptions | `GOOGLE PLAY`, `NINTENDO`, `STEAM` |
| Events | Concerts, shows | `TICKETMASTER`, `FILMSTADEN` |
| Activities | Recreation | `JUMPYARD`, `RACEHALL` |
| Bars/Nightlife | Drinks, clubs | `O LEARYS`, `BAR` |

### 💊 Health & Wellness
| Subcategory | Description | Example Patterns |
|-------------|-------------|------------------|
| Pharmacy | Medicine, health products | `KRONANS APOT`, `APOTEKET`, `K*APOTEA` |
| Medical | Doctor visits, treatments | `KRY`, `LÄKARE` |
| Fitness | Gym, sports | `ACTIC`, `ERIKSDALSBAD` |
| Personal Care | Haircuts, spa | `SJÖDALSSALON` |

### 👶 Children
| Subcategory | Description | Example Patterns |
|-------------|-------------|------------------|
| Daycare | Förskola fees | Municipality patterns |
| Toys | Toys and games | `LEKIA`, `LEKSAK` |
| Clothing | Kids' clothes | `BABYLAND`, `BARNBUTIKEN` |
| Activities | Kids' entertainment | `JUMPYARD`, `HOP N POP` |

### 💰 Financial
| Subcategory | Description | Example Patterns |
|-------------|-------------|------------------|
| Bank Fees | Account fees | `BANKAKTIEBOL` |
| Transfers | Swish, transfers | `SWISH`, phone numbers |
| Loans | Loan payments | `LÅN`, `LÃN` |
| Investments | Investment-related | `AVANZA`, `NORDNET` |

### 📱 Subscriptions
| Subcategory | Description | Example Patterns |
|-------------|-------------|------------------|
| Streaming | Media subscriptions | `NETFLIX`, `SPOTIFY`, `HBO` |
| Software | Apps, cloud services | `GOOGLE ONE`, `APPLE COM/BI` |
| Memberships | Clubs, unions | `UNIONEN`, `AKAD.A-KASSA` |
| Insurance | Recurring insurance | `TRYGG-HANSA`, `SECTOR ALARM` |

### 🎁 Donations & Charity
| Subcategory | Description | Example Patterns |
|-------------|-------------|------------------|
| Charity | Charitable donations | `LÄKARE UTAN`, `RÖDA KORSET`, `STADSMISSION` |
| Religious | Church donations | `TYSKA S:TA GERTRUDS` |

### 📦 Other
| Subcategory | Description | Example Patterns |
|-------------|-------------|------------------|
| Uncategorized | Needs manual review | No match |
| Personal | Swish to individuals | Phone number patterns |
| Refunds | Money back | `REFUN`, `RETUR`, positive amounts |

---

## Mapping Rules

### Pattern Types

1. **Exact Match** - Full text must match
2. **Contains** - Text contains pattern
3. **Starts With** - Text begins with pattern
4. **Regex** - Regular expression match

### Mapping Priority

1. User-defined custom mappings (highest priority)
2. Exact matches
3. Starts-with matches
4. Contains matches
5. Regex patterns
6. Default (Uncategorized)

---

## Initial Mapping Definitions

```typescript
const categoryMappings: CategoryMapping[] = [
  // Streaming Services
  { pattern: 'NETFLIX', categoryId: 'entertainment', subcategoryId: 'streaming', matchType: 'contains' },
  { pattern: 'SPOTIFY', categoryId: 'entertainment', subcategoryId: 'streaming', matchType: 'contains' },
  { pattern: 'HBO', categoryId: 'entertainment', subcategoryId: 'streaming', matchType: 'contains' },
  { pattern: 'DISNEY', categoryId: 'entertainment', subcategoryId: 'streaming', matchType: 'contains' },

  // Software/Cloud
  { pattern: 'GOOGLE ONE', categoryId: 'subscriptions', subcategoryId: 'software', matchType: 'contains' },
  { pattern: 'APPLE COM/BI', categoryId: 'subscriptions', subcategoryId: 'software', matchType: 'contains' },
  { pattern: 'GOOGLE GSUIT', categoryId: 'subscriptions', subcategoryId: 'software', matchType: 'contains' },

  // Groceries - Supermarkets
  { pattern: 'WILLYS', categoryId: 'groceries', subcategoryId: 'supermarket', matchType: 'contains' },
  { pattern: 'ICA', categoryId: 'groceries', subcategoryId: 'supermarket', matchType: 'contains' },
  { pattern: 'COOP', categoryId: 'groceries', subcategoryId: 'supermarket', matchType: 'contains' },
  { pattern: 'LIDL', categoryId: 'groceries', subcategoryId: 'supermarket', matchType: 'contains' },
  { pattern: 'HEMKÖP', categoryId: 'groceries', subcategoryId: 'supermarket', matchType: 'contains' },
  { pattern: 'HEMKOP', categoryId: 'groceries', subcategoryId: 'supermarket', matchType: 'contains' },
  { pattern: 'MAXI', categoryId: 'groceries', subcategoryId: 'supermarket', matchType: 'contains' },
  { pattern: 'CITY GROSS', categoryId: 'groceries', subcategoryId: 'supermarket', matchType: 'contains' },

  // Groceries - Convenience
  { pattern: 'PRESSBYRÅN', categoryId: 'groceries', subcategoryId: 'convenience', matchType: 'contains' },
  { pattern: 'PRESSBYRAN', categoryId: 'groceries', subcategoryId: 'convenience', matchType: 'contains' },
  { pattern: '7-ELEVEN', categoryId: 'groceries', subcategoryId: 'convenience', matchType: 'contains' },

  // Alcohol
  { pattern: 'SYSTEMBOLAGE', categoryId: 'groceries', subcategoryId: 'alcohol', matchType: 'contains' },

  // Transportation - Fuel
  { pattern: 'CIRCLE K', categoryId: 'transportation', subcategoryId: 'fuel', matchType: 'contains' },
  { pattern: 'OKQ8', categoryId: 'transportation', subcategoryId: 'fuel', matchType: 'contains' },
  { pattern: 'PREEM', categoryId: 'transportation', subcategoryId: 'fuel', matchType: 'contains' },
  { pattern: 'ST1', categoryId: 'transportation', subcategoryId: 'fuel', matchType: 'starts_with' },

  // Transportation - Parking
  { pattern: 'EASYPARK', categoryId: 'transportation', subcategoryId: 'parking', matchType: 'contains' },
  { pattern: 'AIMO PARK', categoryId: 'transportation', subcategoryId: 'parking', matchType: 'contains' },
  { pattern: 'PARKMAN', categoryId: 'transportation', subcategoryId: 'parking', matchType: 'contains' },

  // Transportation - Public Transit
  { pattern: 'SL ', categoryId: 'transportation', subcategoryId: 'public_transit', matchType: 'starts_with' },
  { pattern: 'AB STORSTOCK', categoryId: 'transportation', subcategoryId: 'public_transit', matchType: 'contains' },
  { pattern: 'SJ PENDELTAG', categoryId: 'transportation', subcategoryId: 'public_transit', matchType: 'contains' },

  // Transportation - Taxi/Rideshare
  { pattern: 'UBER', categoryId: 'transportation', subcategoryId: 'taxi', matchType: 'contains' },
  { pattern: 'BOLT', categoryId: 'transportation', subcategoryId: 'taxi', matchType: 'contains' },
  { pattern: 'TAXI', categoryId: 'transportation', subcategoryId: 'taxi', matchType: 'contains' },

  // Food & Dining - Coffee
  { pattern: 'ESPRESSO HOU', categoryId: 'food_dining', subcategoryId: 'coffee', matchType: 'contains' },
  { pattern: 'WAYNES COFFE', categoryId: 'food_dining', subcategoryId: 'coffee', matchType: 'contains' },
  { pattern: 'COFFEE HOUSE', categoryId: 'food_dining', subcategoryId: 'coffee', matchType: 'contains' },
  { pattern: 'STARBUCKS', categoryId: 'food_dining', subcategoryId: 'coffee', matchType: 'contains' },

  // Food & Dining - Fast Food
  { pattern: 'MAX BURGERS', categoryId: 'food_dining', subcategoryId: 'fast_food', matchType: 'contains' },
  { pattern: 'MCDONALD', categoryId: 'food_dining', subcategoryId: 'fast_food', matchType: 'contains' },
  { pattern: 'SUBWAY', categoryId: 'food_dining', subcategoryId: 'fast_food', matchType: 'contains' },
  { pattern: 'BURGER', categoryId: 'food_dining', subcategoryId: 'fast_food', matchType: 'contains' },

  // Food & Dining - Restaurants
  { pattern: 'MELINS', categoryId: 'food_dining', subcategoryId: 'restaurant', matchType: 'contains' },
  { pattern: 'RESTAURANG', categoryId: 'food_dining', subcategoryId: 'restaurant', matchType: 'contains' },

  // Housing
  { pattern: 'BERGNÄS', categoryId: 'housing', subcategoryId: 'rent', matchType: 'contains' },
  { pattern: 'BERGNAS', categoryId: 'housing', subcategoryId: 'rent', matchType: 'contains' },
  { pattern: 'LÅN 4704', categoryId: 'housing', subcategoryId: 'mortgage', matchType: 'starts_with' },
  { pattern: 'LÃN 4704', categoryId: 'housing', subcategoryId: 'mortgage', matchType: 'starts_with' },
  { pattern: 'VATTENFALL', categoryId: 'housing', subcategoryId: 'utilities', matchType: 'contains' },
  { pattern: 'TELENOR', categoryId: 'housing', subcategoryId: 'utilities', matchType: 'contains' },
  { pattern: 'SECTOR ALARM', categoryId: 'housing', subcategoryId: 'security', matchType: 'contains' },

  // Insurance
  { pattern: 'TRYGG-HANSA', categoryId: 'subscriptions', subcategoryId: 'insurance', matchType: 'contains' },
  { pattern: 'ICA FÖRSÄKR', categoryId: 'subscriptions', subcategoryId: 'insurance', matchType: 'contains' },

  // Health
  { pattern: 'KRONANS APOT', categoryId: 'health', subcategoryId: 'pharmacy', matchType: 'contains' },
  { pattern: 'APOTEKET', categoryId: 'health', subcategoryId: 'pharmacy', matchType: 'contains' },
  { pattern: 'K*APOTEA', categoryId: 'health', subcategoryId: 'pharmacy', matchType: 'contains' },
  { pattern: 'KRY', categoryId: 'health', subcategoryId: 'medical', matchType: 'contains' },

  // Memberships
  { pattern: 'UNIONEN', categoryId: 'subscriptions', subcategoryId: 'membership', matchType: 'contains' },
  { pattern: 'AKAD.A-KASSA', categoryId: 'subscriptions', subcategoryId: 'membership', matchType: 'contains' },
  { pattern: 'SV INGENJ', categoryId: 'subscriptions', subcategoryId: 'membership', matchType: 'contains' },

  // Donations
  { pattern: 'LÄKARE UTAN', categoryId: 'donations', subcategoryId: 'charity', matchType: 'contains' },
  { pattern: 'LAKARE UTAN', categoryId: 'donations', subcategoryId: 'charity', matchType: 'contains' },
  { pattern: 'RÖDA KORSET', categoryId: 'donations', subcategoryId: 'charity', matchType: 'contains' },
  { pattern: 'STADSMISSION', categoryId: 'donations', subcategoryId: 'charity', matchType: 'contains' },

  // Shopping
  { pattern: 'AMAZON', categoryId: 'shopping', subcategoryId: 'online', matchType: 'contains' },
  { pattern: 'IKEA', categoryId: 'shopping', subcategoryId: 'home_goods', matchType: 'contains' },
  { pattern: 'H&M', categoryId: 'shopping', subcategoryId: 'clothing', matchType: 'contains' },
  { pattern: 'HM SE', categoryId: 'shopping', subcategoryId: 'clothing', matchType: 'starts_with' },
  { pattern: 'LINDEX', categoryId: 'shopping', subcategoryId: 'clothing', matchType: 'contains' },
  { pattern: 'CLAS OHLSON', categoryId: 'shopping', subcategoryId: 'home_goods', matchType: 'contains' },
  { pattern: 'BAUHAUS', categoryId: 'shopping', subcategoryId: 'hardware', matchType: 'contains' },
  { pattern: 'HORNBACH', categoryId: 'shopping', subcategoryId: 'hardware', matchType: 'contains' },

  // Entertainment - Events
  { pattern: 'FILMSTADEN', categoryId: 'entertainment', subcategoryId: 'events', matchType: 'contains' },
  { pattern: 'TICKETMASTER', categoryId: 'entertainment', subcategoryId: 'events', matchType: 'contains' },

  // Municipal
  { pattern: 'HUDDINGE KOMMUN', categoryId: 'housing', subcategoryId: 'utilities', matchType: 'contains' },
  { pattern: 'FORDONSSKATT', categoryId: 'transportation', subcategoryId: 'vehicle_tax', matchType: 'contains' },
];
```

---

## Subscription Detection

### Criteria for Subscription Detection

A transaction is marked as a subscription if:

1. **Recurring Pattern**: Same or similar merchant appears monthly
2. **Amount Consistency**: Amount varies by less than 10%
3. **Minimum Occurrences**: At least 2 occurrences
4. **Time Pattern**: Roughly monthly interval (25-35 days apart)

### Known Subscription Patterns

| Merchant | Typical Day | Typical Amount (SEK) |
|----------|-------------|---------------------|
| NETFLIX | ~18th | 149 |
| SPOTIFY | ~2nd | 169-189 |
| GOOGLE ONE | ~4th | 249 |
| TRYGG-HANSA | ~1st | 633 + 638 |
| SECTOR ALARM | ~27th | 547 |
| APPLE COM/BI | ~21st | 40 |

---

## User Customization

Users can:

1. **Create Custom Mappings**: Define new pattern → category rules
2. **Override Default Mappings**: Custom rules take priority
3. **Manually Categorize**: Assign category to specific transactions
4. **Learn from Behavior**: When user categorizes, offer to create rule

### Persistence

All custom mappings stored in `localStorage`:
- `custom_category_mappings`: User-defined pattern rules
- `manual_assignments`: Specific transaction → category overrides
