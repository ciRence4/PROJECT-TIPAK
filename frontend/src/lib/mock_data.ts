import type { House } from "./types";

export const RECOMMENDATIONS: string[] = [
  "Patibayin ang bubong gamit ang bagong yero o sealant bago dumating ang susunod na bagyo.",
  "Suriin ang mga bitak sa pader at tapalan agad ng tamang semento o palitada.",
  "Makipag-ugnayan sa inyong Barangay para sa libreng inspeksyon ng isang structural engineer.",
  "Ihanda ang inyong emergency evacuation plan at disaster kit (Go Bag).",
  "Palitan ang mga nabulok na kahoy sa mga haligi upang maiwasan ang tuluyang pagguho.",
];

export const HOUSES: House[] = [
  // ─── MATAAS (High Risk) - Pula (#EF4444) ───
  {
    id: 1, lat: 14.6012, lng: 120.9851, risk: "MATAAS", color: "#EF4444",
    owner: "Juan A. Dela Cruz", address: "123 Rizal St., Brgy. 654",
    materials: "Bubong na Yero, Pader na Hollow Block",
    details: "Malalang bitak sa pundasyon, kinakalawang na yero, at marupok na mga pangunahing pader.", date: "Mar 22, 2026",
  },
  {
    id: 2, lat: 14.5985, lng: 120.9860, risk: "MATAAS", color: "#EF4444",
    owner: "Roberto V. Garcia", address: "88 Luna St., Brgy. 654",
    materials: "Plywood, Kinakalawang na Yero",
    details: "Matinding pinsala ng anay sa mga pangunahing haliging kahoy. 80% ng bubong ay kinakalawang na.", date: "Mar 24, 2026",
  },
  {
    id: 3, lat: 14.5999, lng: 120.9835, risk: "MATAAS", color: "#EF4444",
    owner: "Elena M. Bautista", address: "45 Del Pilar St., Brgy. 654",
    materials: "Pinagtagpi-tagping Kahoy at Yero",
    details: "Ang mga pader ay nakatagilid na. Mataas ang panganib na bumagsak tuwing may malakas na bagyo.", date: "Mar 25, 2026",
  },
  {
    id: 4, lat: 14.6005, lng: 120.9870, risk: "MATAAS", color: "#EF4444",
    owner: "Tomas L. Villanueva", address: "112 Bonifacio Blvd., Brgy. 654",
    materials: "Hollow Block na walang palitada, Lumang Kahoy",
    details: "Malalalim na pahilis na bitak sa mga panlabas na pader. Lubhang kuwestiyonable ang tibay ng istruktura.", date: "Mar 26, 2026",
  },
  {
    id: 5, lat: 14.5978, lng: 120.9841, risk: "MATAAS", color: "#EF4444",
    owner: "Carmen D. Ocampo", address: "201 Mabini Ave., Brgy. 654",
    materials: "Magagaang Materyales, Yero",
    details: "Hindi nakapako nang maayos ang bubong. Ang mga pader ay may matinding pinsala mula sa tubig at nabubulok na.", date: "Mar 27, 2026",
  },

  // ─── KATAMTAMAN (Moderate Risk) - Dilaw/Kahel (#F59E0B) ───
  {
    id: 6, lat: 14.5980, lng: 120.9825, risk: "KATAMTAMAN", color: "#F59E0B",
    owner: "Maria C. Santos", address: "456 Mabini Ave., Brgy. 654",
    materials: "Pader na Plywood, Bubong na Yero",
    details: "Maliliit na bitak sa pader, luma at marupok na plywood, may bahagyang kalawang ang bubong.", date: "Mar 21, 2026",
  },
  {
    id: 7, lat: 14.5992, lng: 120.9855, risk: "KATAMTAMAN", color: "#F59E0B",
    owner: "Jose P. Mendoza", address: "67 Rizal St., Brgy. 654",
    materials: "Pinintahang Hollow Block, Yero",
    details: "May katamtamang kalawang sa mga pinagdugtungan ng yero. May maliliit na bitak malapit sa mga bintana.", date: "Mar 23, 2026",
  },
  {
    id: 8, lat: 14.6001, lng: 120.9848, risk: "KATAMTAMAN", color: "#F59E0B",
    owner: "Lourdes T. Navarro", address: "90 Luna St., Brgy. 654",
    materials: "Semento ang 1st Floor, Kahoy ang 2nd Floor",
    details: "Nagsisimula nang mabulok ang ilang bahagi ng kahoy. May mga maluwag na pako sa bubong.", date: "Mar 24, 2026",
  },
  {
    id: 9, lat: 14.5988, lng: 120.9872, risk: "KATAMTAMAN", color: "#F59E0B",
    owner: "Ricardo S. Aguilar", address: "33 Bonifacio Blvd., Brgy. 654",
    materials: "Hollow Block, Yero",
    details: "Nababakbak ang pintura kaya nababasa ang semento. 30% ng media agua ay kinakalawang.", date: "Mar 25, 2026",
  },
  {
    id: 10, lat: 14.6010, lng: 120.9830, risk: "KATAMTAMAN", color: "#F59E0B",
    owner: "Teresa B. Castro", address: "14 Del Pilar St., Brgy. 654",
    materials: "Kalahating Semento, Kalahating Plywood",
    details: "Kailangan ng karagdagang suporta ang mga ekstensyong plywood. Matibay naman ang pangunahing istruktura.", date: "Mar 26, 2026",
  },
  {
    id: 11, lat: 14.5975, lng: 120.9858, risk: "KATAMTAMAN", color: "#F59E0B",
    owner: "Fernando G. Roxas", address: "210 Mabini Ave., Brgy. 654",
    materials: "Buhos na Semento, Lumang Yero",
    details: "Matibay ang mga pader ngunit kailangan nang pinturahan at lagyan ng rust converter ang bubong.", date: "Mar 26, 2026",
  },
  {
    id: 12, lat: 14.5995, lng: 120.9820, risk: "KATAMTAMAN", color: "#F59E0B",
    owner: "Anita L. Cruz", address: "55 Rizal St., Brgy. 654",
    materials: "Kahoy at Semento",
    details: "May kaunting pagkabakbak sa mga haliging semento. Nagsisimula nang mabulok ang mga pasamano ng bubong.", date: "Mar 27, 2026",
  },
  {
    id: 13, lat: 14.6008, lng: 120.9865, risk: "KATAMTAMAN", color: "#F59E0B",
    owner: "Manuel R. Diaz", address: "105 Bonifacio Blvd., Brgy. 654",
    materials: "Pinintahang Hollow Block, Yero",
    details: "Baradong alulod na nagdudulot ng pag-ipon ng tubig. Nagsisimula nang magkakalawang sa mga gilid.", date: "Mar 27, 2026",
  },

  // ─── MABABA (Low Risk) - Berde (#22C55E) ───
  {
    id: 14, lat: 14.5950, lng: 120.9880, risk: "MABABA", color: "#22C55E",
    owner: "Pedro L. Reyes", address: "789 Bonifacio Blvd., Brgy. 654",
    materials: "Buhos na Semento, Hollow Block",
    details: "Napakatibay ng pagkakagawa ng semento, walang nakikitang anumang depekto o sira.", date: "Mar 20, 2026",
  },
  {
    id: 15, lat: 14.5990, lng: 120.9840, risk: "MABABA", color: "#22C55E",
    owner: "Rosa C. Lim", address: "12 Rizal St., Brgy. 654",
    materials: "Semento, Decra Roofing",
    details: "Kaka-renovate lang. Gumamit ng mga de-kalidad na materyales. Walang nakitang problema.", date: "Mar 22, 2026",
  },
  {
    id: 16, lat: 14.5982, lng: 120.9868, risk: "MABABA", color: "#22C55E",
    owner: "Arturo M. Pascual", address: "44 Luna St., Brgy. 654",
    materials: "Purong Semento",
    details: "Napakaganda ng kondisyon ng istruktura. Matitibay ang mga biga at haligi.", date: "Mar 23, 2026",
  },
  {
    id: 17, lat: 14.6002, lng: 120.9825, risk: "MABABA", color: "#22C55E",
    owner: "Gloria S. Fernandez", address: "89 Del Pilar St., Brgy. 654",
    materials: "Semento, Rib-type na Bubong",
    details: "Moderno ang pagkakagawa at maayos na napapanatili. Walang bitak o kalawang.", date: "Mar 24, 2026",
  },
  {
    id: 18, lat: 14.5970, lng: 120.9850, risk: "MABABA", color: "#22C55E",
    owner: "Eduardo T. Soriano", address: "300 Mabini Ave., Brgy. 654",
    materials: "Hollow Block na may palitada, Pinintahang Bubong",
    details: "Bagong pintura ang bubong. Makakapal ang pader at walang mga bitak.", date: "Mar 25, 2026",
  },
  {
    id: 19, lat: 14.6015, lng: 120.9845, risk: "MABABA", color: "#22C55E",
    owner: "Silvia R. Gonzales", address: "22 Rizal St., Brgy. 654",
    materials: "Buhos na Semento",
    details: "Matibay ang pundasyon. Buo ang mga bakod. Napakababa ng panganib.", date: "Mar 26, 2026",
  },
  {
    id: 20, lat: 14.5987, lng: 120.9832, risk: "MABABA", color: "#22C55E",
    owner: "Mario K. Domingo", address: "18 Luna St., Brgy. 654",
    materials: "Semento, Tegula Tiles",
    details: "Heavy duty ang bubong, maayos ang palitada ng mga pader. Ligtas laban sa malalakas na hangin.", date: "Mar 26, 2026",
  },
  {
    id: 21, lat: 14.5997, lng: 120.9875, risk: "MABABA", color: "#22C55E",
    owner: "Lydia P. Ramos", address: "150 Bonifacio Blvd., Brgy. 654",
    materials: "Semento, Steel Trusses",
    details: "Bakal (galvanized steel) ang balangkas ng bubong. Walang kalawang. Makinis ang mga pader.", date: "Mar 27, 2026",
  },
  {
    id: 22, lat: 14.5972, lng: 120.9838, risk: "MABABA", color: "#22C55E",
    owner: "Vicente B. Alonzo", address: "205 Mabini Ave., Brgy. 654",
    materials: "Pre-cast Concrete Panels",
    details: "Pang-industriyal ang mga materyales na ginamit para sa bahay. Ligtas at matibay.", date: "Mar 27, 2026",
  },
  {
    id: 23, lat: 14.6006, lng: 120.9852, risk: "MABABA", color: "#22C55E",
    owner: "Celia V. De Leon", address: "77 Rizal St., Brgy. 654",
    materials: "Semento, Bagong Yero",
    details: "Kamakailan lang pinalitan ang buong bubong. Walang problema sa istruktura.", date: "Mar 27, 2026",
  },
  {
    id: 24, lat: 14.5984, lng: 120.9846, risk: "MABABA", color: "#22C55E",
    owner: "Nestor F. Tolentino", address: "50 Luna St., Brgy. 654",
    materials: "Hollow Block na may palitada",
    details: "Makapal na pader na semento. Nakapako nang maayos ang bubong. Ligtas tumira rito.", date: "Mar 27, 2026",
  },
  {
    id: 25, lat: 14.5991, lng: 120.9828, risk: "MABABA", color: "#22C55E",
    owner: "Belen J. Pineda", address: "10 Del Pilar St., Brgy. 654",
    materials: "Semento ang 1st Floor, Matibay na Kahoy ang 2nd Floor",
    details: "Ginamitan ng treated lumber. Walang sira mula sa anay. Maganda ang kondisyon ng istruktura.", date: "Mar 27, 2026",
  }
];