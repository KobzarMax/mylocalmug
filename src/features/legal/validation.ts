import { z } from 'zod';
import { BusinessLegalProfileInput } from './types';

const postcode = /^(GIR 0AA|[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2})$/;
const companyNumber = /^([0-9]{8}|[A-Z]{2}[0-9]{6})$/;
const charityNumber = /^([0-9]{6,8}(-[0-9]{1,2})?|[A-Z]{2}[0-9]{6})$/;
const vatNumber = /^GB[0-9]{9}([0-9]{3})?$/;
const phone = /^\+?[0-9 ()-]{7,25}$/;

const optionalPattern = (pattern: RegExp, message: string) =>
  z.string().refine((value) => !value || pattern.test(value), message);

export function normalizeLegalInput(input: BusinessLegalProfileInput): BusinessLegalProfileInput {
  const entityType = input.entityType;
  const vatRegistered = Boolean(input.vatRegistered);
  const compactPostcode = input.registeredPostcode.toUpperCase().replace(/\s/g, '');
  const vatDigits = input.vatNumber.toUpperCase().replace(/[^0-9]/g, '');
  return {
    ...input,
    entityType,
    legalName: input.legalName.trim(),
    tradingName: input.tradingName.trim(),
    registeredAddressLine1: input.registeredAddressLine1.trim(),
    registeredAddressLine2: input.registeredAddressLine2.trim(),
    registeredTownCity: input.registeredTownCity.trim(),
    registeredCounty: input.registeredCounty.trim(),
    registeredPostcode: compactPostcode ? `${compactPostcode.slice(0, -3)} ${compactPostcode.slice(-3)}` : '',
    contactEmail: input.contactEmail.trim().toLowerCase(),
    contactPhone: input.contactPhone.trim(),
    companyNumber: ['limited_company', 'limited_liability_partnership'].includes(entityType)
      ? input.companyNumber.toUpperCase().replace(/[^A-Z0-9]/g, '') : '',
    charityNumber: entityType === 'charity' ? input.charityNumber.toUpperCase().replace(/[^A-Z0-9-]/g, '') : '',
    vatRegistered,
    vatNumber: vatRegistered && vatDigits ? `GB${vatDigits}` : '',
  };
}

export const legalDraftSchema = z.object({
  entityType: z.enum(['sole_trader', 'limited_company', 'limited_liability_partnership', 'partnership', 'charity', 'other_organisation']),
  legalName: z.string().max(160),
  tradingName: z.string().max(120),
  registeredAddressLine1: z.string().max(160),
  registeredAddressLine2: z.string().max(160),
  registeredTownCity: z.string().max(100),
  registeredCounty: z.string().max(100),
  registeredPostcode: optionalPattern(postcode, 'Enter a valid UK postcode.'),
  contactEmail: z.union([z.literal(''), z.email('Enter a valid contact email.')]).pipe(z.string().max(254)),
  contactPhone: optionalPattern(phone, 'Enter a valid contact phone number.').pipe(z.string().max(30)),
  companyNumber: optionalPattern(companyNumber, 'Use an 8-digit or two-letter plus 6-digit company number.'),
  charityNumber: optionalPattern(charityNumber, 'Enter a valid charity number.'),
  vatRegistered: z.boolean(),
  vatNumber: optionalPattern(vatNumber, 'Enter a GB VAT number with 9 or 12 digits.'),
}).superRefine((value, context) => {
  const needsCompany = ['limited_company', 'limited_liability_partnership'].includes(value.entityType);
  if (!needsCompany && value.companyNumber) context.addIssue({ code: 'custom', path: ['companyNumber'], message: 'Company number is not used for this entity type.' });
  if (value.entityType !== 'charity' && value.charityNumber) context.addIssue({ code: 'custom', path: ['charityNumber'], message: 'Charity number is only used for charities.' });
  if (!value.vatRegistered && value.vatNumber) context.addIssue({ code: 'custom', path: ['vatNumber'], message: 'Remove the VAT number or mark the business as VAT registered.' });
});

export const legalSubmissionSchema = legalDraftSchema.superRefine((value, context) => {
  const required: [keyof BusinessLegalProfileInput, string][] = [
    ['legalName', 'Enter the registered legal name.'],
    ['tradingName', 'Enter the trading name.'],
    ['registeredAddressLine1', 'Enter the registered address.'],
    ['registeredTownCity', 'Enter the registered town or city.'],
    ['registeredPostcode', 'Enter the registered postcode.'],
    ['contactEmail', 'Enter the legal contact email.'],
    ['contactPhone', 'Enter the legal contact phone.'],
  ];
  for (const [path, message] of required) if (!value[path]) context.addIssue({ code: 'custom', path: [path], message });
  if (['limited_company', 'limited_liability_partnership'].includes(value.entityType) && !value.companyNumber) {
    context.addIssue({ code: 'custom', path: ['companyNumber'], message: 'Enter the Companies House number.' });
  }
  if (value.entityType === 'charity' && !value.charityNumber) context.addIssue({ code: 'custom', path: ['charityNumber'], message: 'Enter the charity number.' });
  if (value.vatRegistered && !value.vatNumber) context.addIssue({ code: 'custom', path: ['vatNumber'], message: 'Enter the VAT number.' });
});

export function firstValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Check the legal information and try again.';
}
