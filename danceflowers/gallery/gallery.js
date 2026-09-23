// Dance Flowers gallery. One line per photo. Files live in ../photos/gallery/ as <file>.jpg (max 1600px)
// and <file>-thumb.jpg (max 800px). Sections: corsages, boutonnieres, pairs (a corsage and boutonnière together), bouquets.
// w and h are the full-size pixel dimensions (used to reserve space so the page doesn't jump while loading).
// House rule: no faces. Crop them out before a photo goes in here.
const SECTIONS = [
  ["corsages",     "Corsages",      "Wrist corsages, color matched to the dress."],
  ["boutonnieres", "Boutonnières",  "For the date, the groomsmen, or dad."],
  ["pairs",        "Matched sets",  "A corsage and boutonnière made to go together."],
  ["bouquets",     "Bouquets",      "Hand-tied, for pictures, promposals, and small weddings."],
];
const PHOTOS = [
  {file:"corsage-white-roses-table", section:"corsages", w:1600, h:1200, caption:"White spray roses, baby's breath, and a sparkle band"},
  {file:"corsages-five", section:"corsages", w:1600, h:1067, caption:"Five friends, five corsages, one homecoming"},
  {file:"corsage-yellow-white", section:"corsages", w:1600, h:1365, caption:"Yellow and white roses with silver ribbon"},
  {file:"corsage-red-white", section:"corsages", w:1553, h:1600, caption:"Red roses and white ranunculus"},
  {file:"corsage-white-red", section:"corsages", w:1600, h:1245, caption:"White orchid with red spray roses"},
  {file:"corsage-white-pearls", section:"corsages", w:1600, h:1226, caption:"White spray roses with pearls"},
  {file:"corsage-white-greenery", section:"corsages", w:1486, h:1431, caption:"White roses on a pearl band with greenery"},
  {file:"corsage-yellow-grey-suit", section:"corsages", w:1600, h:933, caption:"Yellow rose corsage against a grey suit"},
  {file:"corsage-white-pink-dress", section:"corsages", w:1600, h:1320, caption:"White spray roses on a blush dress"},
  {file:"bout-red-rose", section:"boutonnieres", w:1600, h:1152, caption:"Red rose with white waxflower"},
  {file:"bout-white-blue-suit", section:"boutonnieres", w:1600, h:1309, caption:"Blush and white on a blue suit"},
  {file:"bout-yellow-rose", section:"boutonnieres", w:1321, h:1376, caption:"Yellow rose and baby's breath"},
  {file:"bout-red-navy", section:"boutonnieres", w:1189, h:1090, caption:"Red rose on navy with a floral tie"},
  {file:"bout-pinning-on", section:"boutonnieres", w:1418, h:1600, caption:"Pinning it on"},
  {file:"pair-burgundy-navy", section:"pairs", w:1600, h:1095, caption:"Red roses for a burgundy dress and navy suit"},
  {file:"pair-blush-blue", section:"pairs", w:1600, h:1348, caption:"Blush and white with a blue suit"},
  {file:"pair-blue-black", section:"pairs", w:1600, h:1440, caption:"White roses and lavender for a light blue dress"},
  {file:"pair-gold-tan", section:"pairs", w:1600, h:1275, caption:"White roses and greenery with a tan suit"},
  {file:"pair-yellow-black", section:"pairs", w:1600, h:1092, caption:"Yellow rose boutonnière, white and yellow corsage"},
  {file:"bouquet-red-white", section:"bouquets", w:1600, h:1209, caption:"Small hand-tied bouquet of red roses and white ranunculus"},
];
