export const validateLocalCompany = (company: any, existingCompanies: any[] = []) => {
  const errors: string[] = [];

  const { name, phone, email, city, companyType, flag, zipCode, gstNo, panNo, upiId, state, address, description } = company;

  // Required fields
  if (!name?.trim()) errors.push("Company name is required");
  else if (name.trim().length < 2 || name.trim().length > 100) errors.push("Company name must be between 2 and 100 characters");

  if (!phone?.trim()) errors.push("Phone number is required");
  else if (!/^[6-9]\d{9}$/.test(phone.trim())) errors.push("Invalid phone number! It should be 10 digits without country code (starts with 6-9).");

  if (!city?.trim()) errors.push("City is required");
  else if (!/^[a-zA-Z\s.'-]{2,50}$/.test(city.trim())) errors.push("Enter a valid city name");

  if (!companyType?.trim()) errors.push("Company category is required");
  if (!flag) errors.push("Flag is required");

  // Email validation (optional)
  if (email && email.trim()) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) errors.push("Invalid email format.");
  }

  // State validation (optional)
  if (state && state.trim()) {
    if (!/^[a-zA-Z\s.'-]{2,50}$/.test(state.trim())) errors.push("Enter a valid state name");
  }

  // Zip validation (optional, 6-digit Indian PIN code starting 1-9)
  if (zipCode && zipCode.trim()) {
    const zipRegex = /^[1-9]\d{5}$/;
    if (!zipRegex.test(zipCode.trim())) errors.push("Invalid zip code! It should be a valid 6-digit PIN code.");
  }

  // GST format & duplicate validation (optional)
  if (gstNo && gstNo.trim()) {
    const normalizedGst = gstNo.trim().toUpperCase();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(normalizedGst)) {
      errors.push("Invalid GST format. Expected 15-character GSTIN (e.g. 22AAAAA0000A1Z5).");
    } else {
      const duplicateGST = existingCompanies.find(
        c => c.gstNo?.trim()?.toUpperCase() === normalizedGst && c._id !== company._id
      );
      if (duplicateGST) errors.push("GST number already exists!");
    }
  }

  // PAN format & duplicate validation (optional)
  if (panNo && panNo.trim()) {
    if (flag !== "vendor") {
      errors.push("PAN number can only be added for vendor companies.");
    } else {
      const normalizedPan = String(panNo).trim().toUpperCase();
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
      if (!panRegex.test(normalizedPan)) {
        errors.push("Invalid PAN format. Expected format: AAAAA9999A");
      } else {
        if (gstNo && gstNo.trim()) {
          const normalizedGst = gstNo.trim().toUpperCase();
          if (normalizedGst.slice(2, 12) !== normalizedPan) {
            errors.push("GST number PAN part does not match the entered PAN number.");
          }
        }
        const duplicatePAN = existingCompanies.find(
          c => c.panNo?.trim()?.toUpperCase() === normalizedPan && c._id !== company._id
        );
        if (duplicatePAN) errors.push("PAN number already exists!");
      }
    }
  }

  // UPI validation (optional)
  if (upiId && upiId.trim()) {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId.trim())) {
      errors.push("Invalid UPI ID format (e.g. name@upi or name@bank)");
    }
  }

  // Text length checks
  if (address && address.trim().length > 500) {
    errors.push("Street address cannot exceed 500 characters.");
  }
  if (description && description.trim().length > 1000) {
    errors.push("About company cannot exceed 1000 characters.");
  }

  // Duplicate name validation (case insensitive)
  if (name && name.trim()) {
    const normalizedName = name.trim().toLowerCase();
    const duplicateName = existingCompanies.find(
      c => c.name?.trim().toLowerCase() === normalizedName && c._id !== company._id
    );
    if (duplicateName) errors.push("Company name already exists!");
  }

  return errors;
};
