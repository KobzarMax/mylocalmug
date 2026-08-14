import assert from 'node:assert/strict';
import { ENTITY_OPTIONS } from '../src/features/legal/types';
import { legalDraftSchema, legalSubmissionSchema, normalizeLegalInput } from '../src/features/legal/validation';

const base = {
  entityType: 'sole_trader' as const,
  legalName: 'Nimbus Coffee',
  tradingName: 'Nimbus',
  registeredAddressLine1: '10 High Street',
  registeredAddressLine2: '',
  registeredTownCity: 'London',
  registeredCounty: '',
  registeredPostcode: 'sw1a1aa',
  contactEmail: ' OWNER@EXAMPLE.COM ',
  contactPhone: '+44 20 7946 0958',
  companyNumber: '',
  charityNumber: '',
  vatRegistered: false,
  vatNumber: '',
};

for (const option of ENTITY_OPTIONS) {
  const candidate = normalizeLegalInput({
    ...base,
    entityType: option.value,
    companyNumber: ['limited_company', 'limited_liability_partnership'].includes(option.value) ? 'SC123456' : '',
    charityNumber: option.value === 'charity' ? 'SC123456' : '',
  });
  assert.equal(legalSubmissionSchema.safeParse(candidate).success, true, `${option.value} should validate`);
}

const normalized = normalizeLegalInput({ ...base, vatRegistered: true, vatNumber: '123 456 789' });
assert.equal(normalized.registeredPostcode, 'SW1A 1AA');
assert.equal(normalized.contactEmail, 'owner@example.com');
assert.equal(normalized.vatNumber, 'GB123456789');
assert.equal(legalSubmissionSchema.safeParse(normalized).success, true);

assert.equal(legalDraftSchema.safeParse(normalizeLegalInput({ ...base, legalName: '', tradingName: '' })).success, true, 'incomplete drafts are allowed');
assert.equal(legalSubmissionSchema.safeParse(normalizeLegalInput({ ...base, legalName: '' })).success, false, 'legal name is required to submit');
assert.equal(legalSubmissionSchema.safeParse(normalizeLegalInput({ ...base, entityType: 'limited_company', companyNumber: '' })).success, false, 'company number is required');
assert.equal(legalDraftSchema.safeParse(normalizeLegalInput({ ...base, registeredPostcode: 'NOT A POSTCODE' })).success, false, 'invalid postcode is rejected');
assert.equal(legalDraftSchema.safeParse(normalizeLegalInput({ ...base, vatRegistered: true, vatNumber: '123' })).success, false, 'invalid VAT number is rejected');
assert.equal(legalDraftSchema.safeParse(normalizeLegalInput({ ...base, contactPhone: 'abc' })).success, false, 'invalid phone is rejected');

console.log('UK legal-profile validation tests passed.');
