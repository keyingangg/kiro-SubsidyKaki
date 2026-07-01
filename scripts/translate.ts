/**
 * Auto-translate i18n keys using DeepL, with glossary overrides for SG terms.
 *
 * Usage:
 *   DEEPL_KEY=your_key npx tsx scripts/translate.ts
 *
 * Or add DEEPL_KEY to .env.local and run:
 *   npx tsx scripts/translate.ts
 *
 * Flags:
 *   --lang=ZH,MS,TA   Only translate specific languages (default: all)
 *   --dry-run          Print result without writing to i18n.tsx
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { applyGlossary, type GlossaryLang } from './glossary'

// ── Config ─────────────────────────────────────────────────────────────────

const DEEPL_API = 'https://api-free.deepl.com/v2/translate'
const I18N_PATH = join(import.meta.dirname, '../src/hooks/i18n.tsx')
const BATCH_SIZE = 50 // DeepL max texts per request

const LANG_MAP: Record<GlossaryLang, string> = {
  ZH: 'ZH',  // Simplified Chinese
  MS: 'MS',  // Malay
  TA: 'TA',  // Tamil
}

// Keys whose values should never be translated (proper names, phone numbers, symbols)
const SKIP_KEYS = new Set([
  'appName', 'helpline_hours',
  'size_xs', 'size_sm', 'size_default', 'size_lg', 'size_xl',
  'matched',        // contains ✓ symbol — translated separately via glossary if needed
  'detected_from_doc', 'criteria_not_met',  // contain ✓/✗ symbols
])

// ── Argument parsing ────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const langArg = args.find(a => a.startsWith('--lang='))
const targetLangs: GlossaryLang[] = langArg
  ? (langArg.split('=')[1].split(',') as GlossaryLang[])
  : ['ZH', 'MS', 'TA']

// ── DeepL helper ────────────────────────────────────────────────────────────

const DEEPL_KEY = process.env.DEEPL_KEY
if (!DEEPL_KEY) {
  console.error('❌  DEEPL_KEY environment variable is not set.')
  console.error('    Add it to .env.local or set it inline: DEEPL_KEY=xxx npx tsx scripts/translate.ts')
  process.exit(1)
}

async function deeplTranslate(texts: string[], targetLang: string): Promise<string[]> {
  const res = await fetch(DEEPL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}`,
    },
    body: JSON.stringify({
      text: texts,
      target_lang: targetLang,
      source_lang: 'EN',
      preserve_formatting: true,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`DeepL error ${res.status}: ${body}`)
  }

  const data = await res.json() as { translations: { text: string }[] }
  return data.translations.map(t => t.text)
}

async function translateBatched(texts: string[], targetLang: string): Promise<string[]> {
  const results: string[] = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const translated = await deeplTranslate(batch, targetLang)
    results.push(...translated)
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(r => setTimeout(r, 200)) // gentle rate limiting
    }
  }
  return results
}

// ── Extract English source from i18n.tsx ────────────────────────────────────

function extractEnglishKeys(source: string): Record<string, string> {
  // Find the en: { ... } block
  const enMatch = source.match(/en:\s*\{([\s\S]*?)\n  \},?\n\n  [Zz][Hh]:/)
  if (!enMatch) throw new Error('Could not find en: { } block in i18n.tsx')

  const block = enMatch[1]
  const entries: Record<string, string> = {}

  // Match:  key: 'value',   or   key: "value",   (handles escaped quotes)
  const lineRe = /^\s{4}(\w+):\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/gm
  let m: RegExpExecArray | null
  while ((m = lineRe.exec(block)) !== null) {
    const key = m[1]
    const value = (m[2] ?? m[3]).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    entries[key] = value
  }

  return entries
}

// ── Format a translated language block ──────────────────────────────────────

function formatLangBlock(lang: string, entries: Record<string, string>): string {
  const lines = Object.entries(entries).map(([k, v]) => {
    const escaped = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    return `    ${k}: '${escaped}',`
  })
  return `  ${lang.toLowerCase()}: {\n${lines.join('\n')}\n  },`
}

// ── Patch i18n.tsx — replace a language block in place ──────────────────────

function patchI18n(source: string, lang: string, entries: Record<string, string>): string {
  const newBlock = formatLangBlock(lang, entries)
  const langLower = lang.toLowerCase()

  // Match:  zh: {   ...content...   },
  // We look for  `  zh: {` up to next `  },` (closing of that lang block)
  // Match both lowercase (zh/ms/ta) and uppercase (ZH/MS/TA) existing blocks
  const blockRe = new RegExp(`  ${langLower}:\\s*\\{[\\s\\S]*?\\n  \\},`, 'gi')
  if (!blockRe.test(source)) {
    throw new Error(`Could not find ${langLower}: { } block in i18n.tsx`)
  }
  return source.replace(
    new RegExp(`  ${langLower}:\\s*\\{[\\s\\S]*?\\n  \\},`, 'i'),
    newBlock,
  )
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🌐  SubsidyKaki translation script`)
  console.log(`    Targets: ${targetLangs.join(', ')}${dryRun ? '  [DRY RUN]' : ''}`)

  const source = readFileSync(I18N_PATH, 'utf8')
  const en = extractEnglishKeys(source)
  const keys = Object.keys(en)

  console.log(`    Found ${keys.length} English keys`)

  // Separate translatable from skipped
  const toTranslate = keys.filter(k => !SKIP_KEYS.has(k))
  const toSkip = keys.filter(k => SKIP_KEYS.has(k))
  const texts = toTranslate.map(k => en[k])

  console.log(`    Translating ${toTranslate.length} keys, keeping ${toSkip.length} as-is`)

  let patched = source

  for (const lang of targetLangs) {
    console.log(`\n  → ${lang}  (DeepL code: ${LANG_MAP[lang]})`)

    const rawTranslated = await translateBatched(texts, LANG_MAP[lang])

    // Apply glossary overrides
    const translated = rawTranslated.map(t => applyGlossary(t, lang))

    // Build full entry map: translated keys + pass-through skipped keys
    const langEntries: Record<string, string> = {}
    let tIdx = 0
    for (const key of keys) {
      if (SKIP_KEYS.has(key)) {
        langEntries[key] = en[key]  // keep original
      } else {
        langEntries[key] = translated[tIdx++]
      }
    }

    if (dryRun) {
      console.log('    Sample (first 5):')
      Object.entries(langEntries).slice(0, 5).forEach(([k, v]) => {
        console.log(`      ${k}: ${v}`)
      })
    } else {
      patched = patchI18n(patched, lang, langEntries)
      console.log(`    ✓  ${lang} block written`)
    }
  }

  if (!dryRun) {
    writeFileSync(I18N_PATH, patched, 'utf8')
    console.log(`\n✅  i18n.tsx updated. Review changes with: git diff src/hooks/i18n.tsx`)
  } else {
    console.log('\n(Dry run — no files written)')
  }
}

main().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
