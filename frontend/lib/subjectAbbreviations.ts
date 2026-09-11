// Short forms shown in compact table displays (e.g. the Assignment table). Selection lists
// (dropdowns, the admin Subjects page) always keep the full name - only this lookup is used
// to shorten it for display. Any subject not listed here falls back to its full name.
const SUBJECT_ABBREVIATIONS: Record<string, string> = {
  Mathematics: "Math",
  "Bangladesh and Global Studies": "BGS",
  "Information and Communication Technology (ICT)": "ICT",
  "Physical Education and Health": "PE & Health",
  "Work and Life Oriented Education": "WLE",
  "Religion and Moral Education": "Religion & Moral Edu.",
  "Career Education": "Career Edu.",
  "Physical Education, Health Science and Sports": "PE, Health & Sports",
  "Higher Mathematics": "H. Math",
  "Finance and Banking": "Finance & Banking",
  "Business Entrepreneurship": "Business Entrep.",
  "History of Bangladesh and World Civilization": "History of BD & World Civ.",
  "Geography and Environment": "Geography & Env.",
  "Civics and Citizenship": "Civics & Citizenship",
  "Business Organization and Management": "Business Org. & Mgmt.",
  "Finance, Banking and Insurance": "Finance, Banking & Ins.",
  "Production Management and Marketing": "Production Mgmt. & Marketing",
  "Civics and Good Governance": "Civics & Good Governance",
  "Islamic History and Culture": "Islamic History & Culture",
  "Arts and Crafts": "Arts & Crafts",
};

export function getSubjectAbbreviation(name: string): string {
  return SUBJECT_ABBREVIATIONS[name] ?? name;
}
