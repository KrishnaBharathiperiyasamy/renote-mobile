/**
 * ReNote Centralized Approved Email List & Authorization Validator
 * Only the following 15 approved email addresses can register, login, and verify OTPs in ReNote.
 */

export const APPROVED_EMAILS = Object.freeze([
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
]);

export const UNAUTHORIZED_EMAIL_MESSAGE =
  "Your email address is not authorized to access ReNote. Please contact your administrator.";

// Fast O(1) set with trimmed, lowercase normalized entries
const APPROVED_EMAILS_SET = new Set(
  APPROVED_EMAILS.map((email) => email.trim().toLowerCase())
);

/**
 * Validates whether an email address is among the 15 approved ReNote emails.
 * Comparison is case-insensitive and trims unnecessary whitespace.
 *
 * @param {string} email - The email address to validate
 * @returns {boolean} True if the email is on the approved list, false otherwise
 */
export function isApprovedEmail(email) {
  if (!email || typeof email !== "string") return false;
  const cleanEmail = email.trim().toLowerCase();
  return APPROVED_EMAILS_SET.has(cleanEmail);
}

export default {
  APPROVED_EMAILS,
  UNAUTHORIZED_EMAIL_MESSAGE,
  isApprovedEmail,
};

