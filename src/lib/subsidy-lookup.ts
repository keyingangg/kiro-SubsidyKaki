import { createClient } from "@/services/supabase/server";
import type {
  SubsidyScheme,
  SubsidyLookupParams,
  SubsidyLookupResult,
  SubsidyResult,
  SupportedLanguage,
} from "@/types";

type ClinicType = "public_hospital" | "polyclinic" | "gp_clinic";

/**
 * Maps an institution name to a clinic type category.
 * Uses keyword matching on the institution string.
 */
export function mapInstitutionToClinicType(
  institution: string | null
): ClinicType | null {
  if (!institution) return null;

  const lower = institution.toLowerCase();

  if (lower.includes("hospital")) return "public_hospital";
  if (lower.includes("polyclinic")) return "polyclinic";
  if (
    lower.includes("clinic") ||
    lower.includes("gp") ||
    lower.includes("family medicine") ||
    lower.includes("medical centre") ||
    lower.includes("medical center")
  ) {
    return "gp_clinic";
  }

  return null;
}

/**
 * Filters subsidy schemes by birth year eligibility.
 * A scheme matches if:
 *   - Both eligible_birth_year_min and eligible_birth_year_max are null (no bounds), OR
 *   - birthYear falls within [eligible_birth_year_min, eligible_birth_year_max] (inclusive,
 *     treating null min as -Infinity and null max as +Infinity)
 *
 * If birthYear is undefined, all schemes are included (age-gated schemes
 * like Pioneer/Merdeka cannot be filtered without birth year data).
 */
export function filterByBirthYear(
  schemes: SubsidyScheme[],
  birthYear: number | undefined
): SubsidyScheme[] {
  if (birthYear === undefined) {
    return schemes;
  }

  return schemes.filter((scheme) => {
    const min = scheme.eligible_birth_year_min;
    const max = scheme.eligible_birth_year_max;

    // No bounds — scheme is not age-gated
    if (min === null && max === null) return true;

    // Only lower bound
    if (min !== null && max === null) return birthYear >= min;

    // Only upper bound
    if (min === null && max !== null) return birthYear <= max;

    // Both bounds
    return birthYear >= min! && birthYear <= max!;
  });
}

/**
 * Transforms a SubsidyScheme DB row into a SubsidyResult for the API response.
 */
function toSubsidyResult(scheme: SubsidyScheme): SubsidyResult {
  const translations = {} as Record<
    SupportedLanguage,
    {
      schemeName: string;
      coverageDescription: string;
      eligibilityConditions: string;
    } | null
  >;

  const languages: SupportedLanguage[] = [
    "en-SG",
    "cmn-Hans-CN",
    "ms-MY",
    "ta-IN",
  ];

  for (const lang of languages) {
    const t = scheme.translations[lang];
    if (t) {
      translations[lang] = {
        schemeName: t.scheme_name,
        coverageDescription: t.coverage_description,
        eligibilityConditions: t.eligibility_conditions,
      };
    } else {
      translations[lang] = null;
    }
  }

  return {
    schemeName: scheme.scheme_name,
    coverageDescription: scheme.coverage_description,
    eligibilityConditions: scheme.eligibility_conditions,
    estimatedCoveragePercent: scheme.estimated_coverage_percent,
    translations,
  };
}

/**
 * Queries Supabase subsidy_schemes table.
 * Matches on medical codes OR diagnosis keywords.
 * Filters by institution type mapping.
 * Returns empty with message if no codes/diagnoses provided.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7
 */
export async function lookupSubsidies(
  params: SubsidyLookupParams
): Promise<SubsidyLookupResult> {
  const { medicalCodes, diagnoses, institution, birthYear, clinicType } =
    params;

  // Requirement 5.7: Skip query if no codes and no diagnoses
  const hasCodes = medicalCodes.length > 0 && medicalCodes.some((c) => c.trim() !== "");
  const hasDiagnoses = diagnoses.length > 0 && diagnoses.some((d) => d.trim() !== "");

  if (!hasCodes && !hasDiagnoses) {
    return {
      subsidies: [],
      message: "Insufficient data was extracted to determine subsidy eligibility",
      needsManualInput: true,
    };
  }

  // Determine clinic type: explicit param takes priority, then map from institution
  const resolvedClinicType: ClinicType | null =
    clinicType ?? mapInstitutionToClinicType(institution);

  try {
    const supabase = await createClient();

    const nonEmptyCodes = medicalCodes.map((c) => c.trim()).filter(Boolean).slice(0, 50);
    const nonEmptyDiagnoses = diagnoses.map((d) => d.trim()).filter(Boolean).slice(0, 50);

    let allSchemes: SubsidyScheme[] = [];

    if (nonEmptyCodes.length > 0) {
      const { data, error } = await supabase
        .from("subsidy_schemes")
        .select("*")
        .overlaps("medical_codes", nonEmptyCodes);

      if (error) {
        console.error("[subsidy-lookup] Supabase query error:", error.message, error.code);
        return {
          subsidies: [],
          message: "Subsidy lookup unavailable",
          needsManualInput: false,
        };
      }
      allSchemes = (data as SubsidyScheme[]) ?? [];
    }

    if (nonEmptyDiagnoses.length > 0) {
      const { data, error } = await supabase
        .from("subsidy_schemes")
        .select("*")
        .overlaps("condition_keywords", nonEmptyDiagnoses);

      if (error) {
        console.error("[subsidy-lookup] Supabase query error:", error.message, error.code);
        return {
          subsidies: [],
          message: "Subsidy lookup unavailable",
          needsManualInput: false,
        };
      }
      const existing = new Map(allSchemes.map((scheme) => [scheme.id, scheme]));
      for (const scheme of (data as SubsidyScheme[]) ?? []) existing.set(scheme.id, scheme);
      allSchemes = [...existing.values()];
    }

    // Filter by clinic type if resolved
    if (resolvedClinicType) {
      allSchemes = allSchemes.filter((scheme) =>
        scheme.eligible_clinic_types.includes(resolvedClinicType)
      );
    }

    // Filter by birth year
    allSchemes = filterByBirthYear(allSchemes, birthYear);

    // Requirement 5.4: Return message if no matches found
    if (allSchemes.length === 0) {
      return {
        subsidies: [],
        message:
          "No matching subsidy schemes were found. Please consult a medical social worker for further assistance.",
        needsManualInput: false,
      };
    }

    // Transform to SubsidyResult format
    const subsidies = allSchemes.map(toSubsidyResult);

    return {
      subsidies,
      message: null,
      needsManualInput: false,
    };
  } catch (error) {
    // Instead of throwing and crashing the whole pipeline, return graceful empty result
    console.error("[subsidy-lookup] Unexpected error:", error);
    return {
      subsidies: [],
      message: "Subsidy lookup unavailable",
      needsManualInput: false,
    };
  }
}
