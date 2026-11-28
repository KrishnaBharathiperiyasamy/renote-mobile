/**
 * ReNote Centralized Approved Email List & Authorization Validator (Frontend)
 * Only the following 15 approved email addresses can register and log in to ReNote.
 */

export const APPROVED_EMAILS = [
  "muhamedashik@krishub.in",
  "bharanitharan@krishub.in",
  "yashikasri@krishub.in",
  "sanjay@krishub.in",
  "santhosh@krishub.in",
  "mothilalnehru@krishub.in",
  "suriya@krishub.in",
  "gowdham@krishub.in",
  "mukesh@krishub.in",
  "abinesh@krishub.in",
  "krishnabharathi@krishub.in",
  "moushami@krishub.in",
  "afshana@krishub.in",
  "nisha@krishub.in",
  "admin@krishub.in",
] as const;

export const UNAUTHORIZED_EMAIL_MESSAGE =
  "Your email address is not authorized to access ReNote. Please contact your administrator.";

// Set for O(1) case-insensitive lookup
const APPROVED_EMAILS_SET = new Set(
  APPROVED_EMAILS.map((email) => email.trim().toLowerCase())
);

/**
 * Validates whether an email address is among the 15 approved ReNote emails.
 * Comparison is case-insensitive and trims unnecessary whitespace.
 *
 * @param email - The email address to check
 * @returns true if the email is on the approved list, false otherwise
 */
export function isApprovedEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  return APPROVED_EMAILS_SET.has(email.trim().toLowerCase());
}

export default {
  APPROVED_EMAILS,
  UNAUTHORIZED_EMAIL_MESSAGE,
  isApprovedEmail,
};

