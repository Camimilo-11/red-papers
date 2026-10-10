export const UNIVERSITY_HOME_URL = 'https://yachaytech.edu.ec/';

export const SCHOOLS = [
  {
    code: 'ECIAA',
    name: 'Escuela de Ciencias Agropecuarias y Agroindustriales',
    shortName: 'Ciencias Agropecuarias',
    accent: '#00b7b4',
    logoCrop: { x: 55, y: 7, width: 190, height: 60 },
    emblemCrop: { x: 64, y: 10, width: 43, height: 52 },
    iconTilePosition: { x: 23, y: 14 },
    researchLines: [
      'Ciencias Agrícolas',
      'Investigación del mercado de productos agroindustriales',
      'Ciencias Animales',
      'I+D+i Agroindustrial',
    ],
  },
  {
    code: 'ECBI',
    name: 'Escuela de Ciencias Biológicas e Ingeniería',
    shortName: 'Ciencias Biológicas e Ingeniería',
    accent: '#68b347',
    logoCrop: { x: 392, y: 7, width: 205, height: 60 },
    emblemCrop: { x: 400, y: 10, width: 45, height: 52 },
    iconTilePosition: { x: 151, y: 14 },
    researchLines: [
      'Ecología, evolución y conservación de ecosistemas terrestres',
      'Microbiología',
      'Biología de Sistemas Acuáticos',
      'Biología celular, biología molecular y genética',
      'Biomedicina',
      'Biomateriales',
    ],
  },
  {
    code: 'ECFN',
    name: 'Escuela de Ciencias Físicas y Nanotecnología',
    shortName: 'Ciencias Físicas y Nanotecnología',
    accent: '#f4c400',
    logoCrop: { x: 735, y: 7, width: 205, height: 63 },
    emblemCrop: { x: 742, y: 10, width: 49, height: 52 },
    iconTilePosition: { x: 23, y: 141 },
    researchLines: [
      'Materiales nanoestructurados, síntesis y caracterización',
      'Ciencia de materiales teórica',
      'Física de sistemas complejos e interdisciplinarios',
      'Astrofísica, Cosmología y Física Teórica',
      'Desarrollo Instrumentación científica de bajo costo',
      'Acústica y Aplicaciones',
    ],
  },
  {
    code: 'ECTEA',
    name: 'Escuela de Ciencias de la Tierra, Energía y Ambiente',
    shortName: 'Ciencias de la Tierra, Energía y Ambiente',
    accent: '#f4863e',
    logoCrop: { x: 1075, y: 7, width: 200, height: 60 },
    emblemCrop: { x: 1082, y: 10, width: 47, height: 52 },
    iconTilePosition: { x: 151, y: 141 },
    researchLines: [
      'Geología física y aplicada',
      'Medioambiente y clima',
      'Riesgos y amenazas naturales',
      'Patrimonio geológico, geoeducación y sostenibilidad',
      'Geomática aplicada a las geociencias',
    ],
  },
  {
    code: 'ECMC',
    name: 'Escuela de Ciencias Matemáticas y Computacionales',
    shortName: 'Ciencias Matemáticas y Computacionales',
    accent: '#ef4035',
    logoCrop: { x: 55, y: 151, width: 200, height: 60 },
    emblemCrop: { x: 59, y: 153, width: 49, height: 56 },
    iconTilePosition: { x: 23, y: 270 },
    researchLines: [
      'Ecuaciones diferenciales, análisis matemático, modelamiento y optimización',
      'Ciencia de datos',
      'Computación científica',
      'Inteligencia artificial',
      'Tecnologías de la información',
      'Ciencia, Tecnología y Sociedad',
    ],
  },
  {
    code: 'ECQI',
    name: 'Escuela de Ciencias Químicas e Ingeniería',
    shortName: 'Ciencias Químicas e Ingeniería',
    accent: '#21acd5',
    logoCrop: { x: 398, y: 148, width: 180, height: 68 },
    emblemCrop: { x: 405, y: 148, width: 45, height: 62 },
    iconTilePosition: { x: 151, y: 270 },
    researchLines: [
      'Materiales funcionales',
      'Química medicinal y farmacología molecular',
      'Desarrollo sostenible: Energía, alimentos, agricultura y medio ambiente',
      'Química teórica y computacional',
    ],
  },
  {
    code: 'YTLC',
    name: 'Yachay Tech Language Center',
    shortName: 'Yachay Tech Language Center',
    accent: '#0ca2b0',
    logoCrop: { x: 737, y: 149, width: 180, height: 68 },
    emblemCrop: { x: 744, y: 145, width: 54, height: 70 },
    iconTilePosition: { x: 23, y: 398 },
    researchLines: [
      'Education technology & AI',
      'English-Medium Instruction',
      'English for specific purposes',
      'Pedagogy, teacher and teacher education',
      'Sociolinguistics/Language and Culture',
      'Language Assessment',
    ],
  },
] as const;

export type SchoolConfig = (typeof SCHOOLS)[number];
export type SchoolCode = SchoolConfig['code'];
export type OfficialResearchLine = SchoolConfig['researchLines'][number];

export function getSchoolByCode(code?: string | null): SchoolConfig | undefined {
  return SCHOOLS.find((school) => school.code === code);
}
