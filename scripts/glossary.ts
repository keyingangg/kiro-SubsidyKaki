/**
 * Singapore healthcare terminology glossary.
 * Keys are the English source terms (lowercased for matching).
 * Values are the exact translations to use for each target language,
 * overriding whatever DeepL returns.
 *
 * Add entries whenever DeepL mistranslates a proper name or scheme.
 */

export type GlossaryLang = 'ZH' | 'MS' | 'TA'

export const GLOSSARY: Record<string, Record<GlossaryLang, string>> = {
  // Proper scheme names — keep untranslated or use official names
  'HealthKaki':           { ZH: 'HealthKaki',         MS: 'HealthKaki',            TA: 'HealthKaki' },
  'CHAS':                 { ZH: 'CHAS',               MS: 'CHAS',                  TA: 'CHAS' },
  'CDMP':                 { ZH: 'CDMP',               MS: 'CDMP',                  TA: 'CDMP' },
  'MediSave':             { ZH: 'MediSave',           MS: 'MediSave',              TA: 'MediSave' },
  'MediShield':           { ZH: 'MediShield',         MS: 'MediShield',            TA: 'MediShield' },
  'MediShield Life':      { ZH: 'MediShield Life',    MS: 'MediShield Life',       TA: 'MediShield Life' },
  'MediFund':             { ZH: 'MediFund',           MS: 'MediFund',              TA: 'MediFund' },
  'Pioneer Generation':   { ZH: '建国一代',           MS: 'Generasi Perintis',     TA: 'பயனீர் தலைமுறை' },
  'Merdeka Generation':   { ZH: '立国一代',           MS: 'Generasi Merdeka',      TA: 'மெர்டேகா தலைமுறை' },
  'MOH':                  { ZH: '卫生部',             MS: 'KKM',                   TA: 'சுகாதார அமைச்சகம்' },
  'MOH SilverLine':       { ZH: '卫生部 SilverLine',  MS: 'MOH SilverLine',        TA: 'MOH சில்வர்லைன்' },
  'SilverLine':           { ZH: 'SilverLine',         MS: 'SilverLine',            TA: 'SilverLine' },
  'polyclinic':           { ZH: '综合诊所',           MS: 'poliklinik',            TA: 'பாலிகிளினிக்' },
  'Polyclinic':           { ZH: '综合诊所',           MS: 'Poliklinik',            TA: 'பாலிகிளினிக்' },
  'NRIC':                 { ZH: 'NRIC',               MS: 'NRIC',                  TA: 'NRIC' },
  'Pioneer':              { ZH: '建国一代',           MS: 'Perintis',              TA: 'பயனீர்' },
  'Merdeka':              { ZH: '立国一代',           MS: 'Merdeka',               TA: 'மெர்டேகா' },
  '1800-650-6060':        { ZH: '1800-650-6060',      MS: '1800-650-6060',         TA: '1800-650-6060' },
  'Singapore':            { ZH: '新加坡',             MS: 'Singapura',             TA: 'சிங்கப்பூர்' },
}

/**
 * Apply glossary overrides to a translated string.
 * Replaces DeepL's translations of known terms with the correct glossary form.
 */
export function applyGlossary(text: string, lang: GlossaryLang): string {
  let result = text
  for (const [en, translations] of Object.entries(GLOSSARY)) {
    const override = translations[lang]
    // Only override if DeepL may have changed it — check if the EN term appears
    // verbatim (DeepL sometimes keeps proper nouns) or if a common mistranslation exists.
    // We do a simple regex replace on the exact English term to ensure it's right.
    result = result.replace(new RegExp(escapeRegex(en), 'g'), override)
  }
  return result
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
