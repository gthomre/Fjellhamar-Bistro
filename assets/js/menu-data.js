/* Fjellhamar Bistro – menydata (kilde: «Meny 18.10.2026.pdf»)
   Endre priser/retter her, så oppdateres både forsiden og menysiden. */
window.BISTRO_ALLERGENS = {
  1: "Skalldyr", 2: "Egg", 3: "Fisk", 4: "Peanøtter", 5: "Soya", 6: "Melk", 7: "Nøtter",
  8: "Selleri", 9: "Sennep", 10: "Sesamfrø", 11: "Sulfitter", 12: "Lupin", 13: "Bløtdyr", 14: "Gluten"
};

window.BISTRO_COMBOS = [
  { name: "Meny A", min: "Minimum 2 personer", price: 399, courses: [
    { icon: "i-soup", no: "PEKING SOUP", en: "Hot and sour soup", a: [5, 14, 2] },
    { icon: "i-bowl", no: "KYLLING A LA SZECHUAN", en: "Chicken a la Szechuan", a: [14, 5] },
    { icon: "i-cloche", no: "INNBAKT SVINEKJØTT MED SURSØT SAUS", en: "Fried pork with sweet and sour sauce", a: [14, 6, 2] },
    { icon: "i-ice", no: "FRITERT BANAN MED ISKREM OG KAFFE", en: "Deep fried banana with ice cream. Coffee included", a: [6, 5, 2], dessert: true }
  ]},
  { name: "Meny B", min: "Minimum 2 personer", price: 459, courses: [
    { icon: "i-roll", no: "HJEMMELAGET SZECHUAN VÅRRULLER OG WONTON", en: "Homemade Szechuan spring rolls and wonton", a: [14, 2] },
    { icon: "i-bowl", no: "KYLLING SATAY", en: "Chicken in satay sauce", a: [7, 1, 14] },
    { icon: "i-cloche", no: "SPRØSTEKT OKSEKJØTT I SURSØT SAUS", en: "Dry fried shredded beef in sweet and sour sauce", a: [14] },
    { icon: "i-ice", no: "FRITERT BANAN MED ISKREM OG KAFFE", en: "Deep fried banana with ice cream. Coffee included", a: [6, 14, 2], dessert: true }
  ]},
  { name: "Meny C", min: "Minimum 2 personer", price: 549, courses: [
    { icon: "i-dumpling", no: "DIM SUM KOMBO", en: "Beef spring rolls, Ha Gau, Siu Mai, Tempura Scampi and Jiao Zi", a: [1, 5, 14, 2] },
    { icon: "i-plate", no: "TEPPAN OKSEINDREFILET I VARM METALLPLATE", en: "Beef tenderloin served with vegetables on a hot metal plate", a: [14, 5] },
    { icon: "i-cloche", no: "PANG PANG LAMMEFILET", en: "Lamb in Chinese Pang Pang style", a: [14, 2] },
    { icon: "i-cake", no: "SJOKOLADEFONDANT MED VANILJEIS OG KAFFE", en: "Chocolate fondant with vanilla ice cream. Coffee included", a: [6], dessert: true }
  ]}
];

window.BISTRO_SPECIAL = {
  price: 319,
  img: "spesial-kombo-b",
  options: [
    { key: "A", no: "Tallerken med kombinasjon av Szechuan vårrull, fritert tempura scampi og kylling Gongbao", en: "Combination of Szechuan spring rolls, fried tempura scampi and Chicken Gongbao", a: [7, 5, 14, 1] },
    { key: "B", no: "Tallerken med kombinasjon av Szechuan vårrull, fritert tempura scampi og biff Chopsuey", en: "Combination of Szechuan spring rolls, fried tempura scampi and Beef Chopsuey", a: [7, 5, 14, 1] }
  ]
};

/* Kategorier. `img` peker på assets/img/<img>-800.webp */
window.BISTRO_MENU = [
  { id: "forretter", title: "Forretter", script: "Dim sum &", sub: "Hjemmelagde vårruller, dumplings og supper", groups: [ { items: [
    { n: "1", no: "Hjemmelaget Szechuan vårrull med salat", en: "Spring roll with salad served with sweet and sour sauce", p: 95, a: [14], img: "varruller" },
    { n: "2", no: "Hjemmelaget vegetarvårrull med salat", en: "Vegetarian spring roll served with sweet and sour sauce", p: 89, a: [14], veg: true },
    { n: "3", no: "Ha Gau (rekedumpling)", en: "Steamed prawn dumpling served with soy sauce", p: 105, a: [1, 5, 14], img: "ha-gau" },
    { n: "4", no: "Hjemmelaget wonton", en: "Fried pork dumplings with sweet and sour sauce", p: 95, a: [2, 14], img: "wonton" },
    { n: "5", no: "Tempura scampi i sursøt saus", en: "Tempura scampi served with sweet and sour sauce", p: 95, a: [1, 14], img: "tempura-scampi" },
    { n: "6", no: "Siu Mai (svinekjøtt dumpling)", en: "Steamed pork dumplings served with soy sauce", p: 105, a: [1, 5, 14, 2], img: "siu-mai" },
    { n: "7", no: "Hjemmelaget biff vårrull", en: "Spring roll with beef served in sweet and sour sauce", p: 95, a: [14] },
    { n: "8", no: "Jiao Zi (svinekjøtt dumpling)", en: "3 pieces pan fried dumplings", p: 95, a: [14], img: "jiao-zi" },
    { n: "9", no: "Peking suppe", en: "Peking soup – hot and sour", p: 105, a: [5, 14, 2], img: "peking-suppe" },
    { n: "", no: "Wontonsuppe", en: "Wonton soup with 8 dumplings with pork mince and scampi", p: 125, a: [5, 14, 1, 10] },
    { n: "", no: "Innbakt kylling med salat og pommes frites", en: "2 pieces of deep fried chicken with salad, sweet and sour sauce and pommes frites", p: 149, a: [14] },
    { n: "", no: "Rekechips", en: "Prawn crackers", p: 59, a: [] },
    { n: "", no: "Dim sum kurv", en: "2 × Jiao Zi, 1 × chicken spring roll, 2 × deep fried wonton, 1 × tempura scampi", p: 205, a: [14, 1, 2] }
  ]}]},

  { id: "kylling", title: "Kylling", script: "Hovedretter", sub: "Chicken", groups: [ { items: [
    { n: "010", no: "Ma La kylling", en: "Deep fried Ma La chicken with vegetables in Chinese pepper sauce", p: 239, a: [5, 14], hot: true },
    { n: "10", no: "Kylling Gongbao med cashewnøtter", en: "Gong Bao chicken with stir-fried vegetables, topped with cashew nuts", p: 239, a: [7, 5, 14] },
    { n: "11", no: "Kylling satay", en: "Sliced chicken in satay sauce served with vegetables", p: 239, a: [7, 1, 14], img: "kylling-satay" },
    { n: "12", no: "Kylling karri", en: "Sliced chicken in curry sauce served with vegetables", p: 229, a: [14] },
    { n: "13", no: "Frityrstekt kylling med sursøt saus", en: "Deep fried chicken in sweet and sour sauce served with vegetables", p: 229, a: [14, 2] },
    { n: "14", no: "Kylling chopsuey", en: "Sliced chicken in chopsuey sauce served with vegetables", p: 229, a: [5] },
    { n: "15", no: "Kylling i rød karri", en: "Sliced chicken in red curry sauce served with vegetables", p: 229, a: [14, 5, 2], img: "kylling-rod-karri", hot: true },
    { n: "16", no: "Kylling a la Szechuan", en: "Sliced chicken in Szechuan sauce with stir-fried vegetables", p: 229, a: [14, 5], hot: true }
  ]}]},

  { id: "biff", title: "Biff", script: "Hovedretter", sub: "Beef", groups: [ { items: [
    { n: "017", no: "Biff Gongbao med cashewnøtter", en: "Shredded beef Gongbao with cashew nuts", p: 259, a: [14, 5], img: "biff-gongbao" },
    { n: "17", no: "Biff chopsuey", en: "Shredded beef chopsuey stir-fried with vegetables", p: 249, a: [14, 5] },
    { n: "18", no: "Biff med brokkoli og babymais", en: "Shredded beef with broccoli and mini corn", p: 249, a: [14], img: "biff-brokkoli" },
    { n: "19", no: "Biff med bambusskudd og sjampinjong", en: "Shredded beef with bamboo shoots and mushrooms", p: 249, a: [14, 3] },
    { n: "20", no: "Biff karri", en: "Shredded beef with curry sauce", p: 249, a: [7, 14], img: "biff-karri" },
    { n: "21", no: "Kinesisk pepperbiff", en: "Chinese shredded pepper beef stir-fried with vegetables and Chinese chili sauce", p: 259, a: [14, 5], hot: true },
    { n: "22", no: "Pang Pang biff", en: "Thick strips of beef tenderloin stir-fried with vegetables in special Pang Pang sauce", p: 349, a: [14, 5, 1] },
    { n: "23", no: "Sprøstekt oksekjøtt i sursøt saus", en: "Crispy fried shredded beef served with sweet and sour sauce", p: 299, a: [14], img: "sprostekt-oksekjott" },
    { n: "24", no: "Biffsnadder med pommes frites", en: "Shredded beef served with béarnaise sauce, salad and pommes frites", p: 249, a: [14, 6], img: "biffsnadder", nor: true },
    { n: "25", no: "Teppan okseindrefilet", en: "Beef tenderloin served with vegetables on a hot metal plate", p: 349, a: [14, 5] },
    { n: "26", no: "Hjemmelaget karbonader", en: "Chopped steak served with vegetables, potatoes and brown sauce", p: 229, a: [14, 6], img: "karbonader", nor: true },
    { n: "27", no: "Pepperstek biff (200 g)", en: "Beef steak served with potatoes, salad and pepper sauce", p: 419, a: [14, 6], nor: true },
    { n: "34", no: "Szechuan biff", en: "Shredded beef in Szechuan sauce served with stir-fried vegetables", p: 249, a: [14, 6], hot: true }
  ]}]},

  { id: "svin", title: "Svinekjøtt", script: "Hovedretter", sub: "Pork", groups: [ { items: [
    { n: "28", no: "Innbakt svinefilet i sursøt saus", en: "Deep fried pork served with sweet and sour sauce", p: 239, a: [14, 2] },
    { n: "29", no: "Wienerschnitzel", en: "Wienerschnitzel served with pommes frites", p: 239, a: [14], img: "wienerschnitzel", nor: true }
  ]}]},

  { id: "lam-and", title: "Lam & and", script: "Hovedretter", sub: "Lamb and duck", groups: [ { items: [
    { n: "30", no: "Lam ytrefilet a la Szechuan", en: "Lamb slices in Szechuan sauce stir-fried with vegetables", p: 319, a: [14, 1, 5], img: "lam-szechuan", hot: true },
    { n: "31", no: "Lam ytrefilet i karri og chilisaus", en: "Lamb slices with curry and chili sauce stir-fried with vegetables", p: 319, a: [14], img: "lam-karri", hot: true },
    { n: "32", no: "Crispy duck med kinesiske pannekaker", en: "Crispy duck served with Chinese pancakes", p: 329, a: [7, 1, 14], img: "crispy-duck" },
    { n: "33", no: "Innbakt and (med ris)", en: "Deep fried duck served in slices with hoisin sauce", p: 329, a: [14, 5, 7], img: "innbakt-and" }
  ]}]},

  { id: "sjomat", title: "Fisk & skalldyr", script: "Hovedretter", sub: "Fish and shellfish", groups: [ { items: [
    { n: "35", no: "Steinbitfilet a la Szechuan", en: "Wolf fish in Szechuan sauce stir-fried with vegetables", p: 259, a: [3, 14, 1, 5], hot: true },
    { n: "36", no: "Innbakt steinbitfilet med sursøt saus", en: "Deep fried wolf fish with sweet and sour sauce and stir-fried vegetables", p: 259, a: [3, 14, 1], img: "innbakt-steinbit" },
    { n: "37", no: "Innbakt scampi i sursøt saus", en: "Deep fried scampi served with sweet and sour sauce", p: 279, a: [1, 14, 2], img: "innbakt-scampi" },
    { n: "38", no: "Stekte kongereker med brokkoli i hvitløkssaus", en: "Stir-fried tiger prawns with broccoli in garlic sauce", p: 279, a: [1, 14] },
    { n: "39", no: "Sjømat wok", en: "Shrimp, scallops, homemade shrimp balls and green shellfish stir-fried with vegetables", p: 299, a: [14, 5, 1], img: "sjomat-wok" }
  ]}]},

  { id: "kombinasjonsrett", title: "Kombinasjonsrett", script: "Husets", sub: "Combination dish", groups: [ { items: [
    { n: "40", no: "Kombo wok", en: "Chicken, lamb, shrimp, beef, seafood balls, green shell, scallop and vegetables", p: 329, a: [14, 5, 1], img: "kombo-wok" }
  ]}]},

  { id: "ris-nudler", title: "Ris, nudler & vegetar", script: "Wok &", sub: "Fried rice, noodles, omelette and vegetarian", groups: [ { items: [
    { n: "41", no: "Stekt ris med egg, scampi, kylling og skinke", en: "Fried rice with egg, scampi, chicken and ham with vegetables", p: 219, a: [2, 14, 5, 1], img: "stekt-ris" },
    { n: "42", no: "Stekt ris i karri med egg, scampi, kylling og skinke", en: "Curry fried rice with egg, scampi, chicken and ham with vegetables", p: 219, a: [2, 14, 5, 1] },
    { n: "43", no: "Stekte nudler med kylling (soyasausbasert)", en: "Fried noodles with chicken and vegetables in soy sauce", p: 229, a: [14, 5] },
    { n: "44", no: "Stekte nudler med biff (soyasausbasert)", en: "Fried noodles with beef and vegetables in soy sauce", p: 229, a: [14, 5] },
    { n: "45", no: "Stekte nudler mixed med biff, kylling og scampi i satay", en: "Fried noodles with beef, chicken and scampi in satay sauce", p: 249, a: [14, 5, 1], img: "stekte-nudler" },
    { n: "46", no: "Omelett med skinke, ost og sjampinjong", en: "Omelette with ham, cheese and mushroom, served with pommes frites", p: 199, a: [2], nor: true },
    { n: "47", no: "Dagens grønnsakswok med tofu", en: "Stir-fried vegetables with tofu", p: 199, a: [5, 1], veg: true }
  ]}]},

  { id: "barnemeny", title: "Barnemeny", script: "For de små", sub: "Kids menu", groups: [ { items: [
    { n: "48", no: "Grillet kylling med ris eller pommes frites", en: "Grilled chicken with rice or pommes frites", p: 125, a: [14] },
    { n: "49", no: "Fritert scampi med ris eller pommes frites", en: "Fried scampi with rice or pommes frites", p: 125, a: [1, 14] },
    { n: "50", no: "Pølse (2 stk) med pommes frites", en: "Sausages with pommes frites", p: 99, a: [14] },
    { n: "51", no: "Pommes frites", en: "French fries", p: 59, a: [14] }
  ]}]},

  { id: "dessert", title: "Dessert", script: "Søtt til slutt", sub: "Desserts", groups: [ { items: [
    { n: "52", no: "Fritert banan", en: "Deep fried bananas with ice cream and fruits", p: 110, a: [6, 14, 2] },
    { n: "53", no: "Banansplitt med kuleis og krem", en: "Banana split with ice cream, cream and fruits", p: 110, a: [14, 6, 7, 2] },
    { n: "54", no: "Varm eplepai med kuleis", en: "Warm apple cake with ice cream and fruits", p: 125, a: [6, 14, 2] },
    { n: "55", no: "Sjokoladefondant med kuleis", en: "Chocolate fondant served with fruit and ice cream", p: 139, a: [6, 2] },
    { n: "56", no: "Crème brûlée", en: "Crème brûlée", p: 125, a: [6, 2] },
    { n: "57", no: "Sorbet med dagens frukt", en: "Sorbet with fruits – lactose and gluten free", p: 75, a: [] }
  ]}]},

  { id: "ekstra", title: "Ekstra", script: "Litt", sub: "Extras", groups: [ { items: [
    { n: "", no: "Ekstra saus", en: "Extra sauce", p: 45, a: [] },
    { n: "", no: "Ekstra ris", en: "Extra rice", p: 45, a: [] }
  ]}]}
];
