export const FETCH_PARTIES = `
  query FetchParties($accountId: Int!) {
    parties(accountId: $accountId) {
      id
      partyTypes
      nameFull
      nameFirst
      nameLast
      nameMiddle
      email
      isActive
      notes
      createdAt
      updatedAt
      taxInfo {
        taxClassification
        taxId
        internalInHouse
        federalTaxWithheld
        nonEmployeeComp
        send1099
        w9OnFile
        backupWithholding
        severanceTaxExempt
        otherExempt
        minPaymentAmount
      }
      vendorInfo {
        pay
        duplicateInvoiceValidation
      }
      relatedContacts {
        id
        relationshipType
        notes
        isPrimary
        relatedParty {
          id
          nameFull
          nameFirst
          nameLast
          nameMiddle
          email
          phones {
            id
            phoneType
            isPrimary
            phone {
              id
              number
            }
          }
          addresses {
            id
            addressType
            isPrimary
            address {
              id
              line1
              line2
              city
              stateCode
              postalCode
            }
          }
        }
      }
      phones {
        id
        phoneType
        isPrimary
        phone {
          id
          number
        }
      }
      addresses {
        id
        addressType
        isPrimary
        address {
          id
          line1
          line2
          city
          stateCode
          postalCode
        }
      }
    }
  }
`;

export const CREATE_PARTY_MUTATION = `
  mutation CreateParty(
    $accountId: Int!
    $partyTypes: [String!]!
    $nameFull: String!
    $nameFirst: String
    $nameLast: String
    $nameMiddle: String
    $taxInfo: PartyTaxInfoInput
    $vendorInfo: PartyVendorInfoInput
    $email: String
    $isActive: Boolean
    $notes: String
  ) {
    createParty(
      accountId: $accountId
      partyTypes: $partyTypes
      nameFull: $nameFull
      nameFirst: $nameFirst
      nameLast: $nameLast
      nameMiddle: $nameMiddle
      taxInfo: $taxInfo
      vendorInfo: $vendorInfo
      email: $email
      isActive: $isActive
      notes: $notes
    ) {
      party {
        id
        partyTypes
        nameFull
        email
        isActive
        taxInfo {
          taxClassification
          taxId
          internalInHouse
          federalTaxWithheld
          nonEmployeeComp
          send1099
          w9OnFile
          backupWithholding
          severanceTaxExempt
          otherExempt
          minPaymentAmount
        }
        vendorInfo {
          pay
          duplicateInvoiceValidation
        }
      }
    }
  }
`;

export const UPDATE_PARTY_MUTATION = `
  mutation UpdateParty(
    $id: Int!
    $partyTypes: [String!]
    $nameFull: String
    $nameFirst: String
    $nameLast: String
    $nameMiddle: String
    $taxInfo: PartyTaxInfoInput
    $vendorInfo: PartyVendorInfoInput
    $email: String
    $isActive: Boolean
    $notes: String
  ) {
    updateParty(
      id: $id
      partyTypes: $partyTypes
      nameFull: $nameFull
      nameFirst: $nameFirst
      nameLast: $nameLast
      nameMiddle: $nameMiddle
      taxInfo: $taxInfo
      vendorInfo: $vendorInfo
      email: $email
      isActive: $isActive
      notes: $notes
    ) {
      party {
        id
        partyTypes
        nameFull
        email
        isActive
        taxInfo {
          taxClassification
          taxId
          internalInHouse
          federalTaxWithheld
          nonEmployeeComp
          send1099
          w9OnFile
          backupWithholding
          severanceTaxExempt
          otherExempt
          minPaymentAmount
        }
        vendorInfo {
          pay
          duplicateInvoiceValidation
        }
      }
    }
  }
`;

export const DELETE_PARTY_MUTATION = `
  mutation DeleteParty($id: Int!) {
    deleteParty(id: $id) {
      success
    }
  }
`;

export const CREATE_ADDRESS_MUTATION = `
  mutation CreateAddress(
    $line1: String!
    $line2: String
    $city: String!
    $stateCode: String!
    $postalCode: String
  ) {
    createAddress(
      line1: $line1
      line2: $line2
      city: $city
      stateCode: $stateCode
      postalCode: $postalCode
    ) {
      address {
        id
      }
    }
  }
`;

export const UPDATE_ADDRESS_MUTATION = `
  mutation UpdateAddress(
    $id: Int!
    $line1: String
    $line2: String
    $city: String
    $stateCode: String
    $postalCode: String
  ) {
    updateAddress(
      id: $id
      line1: $line1
      line2: $line2
      city: $city
      stateCode: $stateCode
      postalCode: $postalCode
    ) {
      address {
        id
      }
    }
  }
`;

export const CREATE_PARTY_RELATIONSHIP_MUTATION = `
  mutation CreatePartyRelationship(
    $accountId: Int!
    $partyId: Int!
    $relatedPartyId: Int!
    $relationshipType: String!
    $notes: String
    $isPrimary: Boolean
  ) {
    createPartyRelationship(
      accountId: $accountId
      partyId: $partyId
      relatedPartyId: $relatedPartyId
      relationshipType: $relationshipType
      notes: $notes
      isPrimary: $isPrimary
    ) {
      partyRelationship { id }
    }
  }
`;

export const UPDATE_PARTY_RELATIONSHIP_MUTATION = `
  mutation UpdatePartyRelationship(
    $id: Int!
    $relationshipType: String
    $notes: String
    $isPrimary: Boolean
  ) {
    updatePartyRelationship(
      id: $id
      relationshipType: $relationshipType
      notes: $notes
      isPrimary: $isPrimary
    ) {
      partyRelationship { id }
    }
  }
`;

export const DELETE_PARTY_RELATIONSHIP_MUTATION = `
  mutation DeletePartyRelationship($id: Int!) {
    deletePartyRelationship(id: $id) {
      success
    }
  }
`;

export const DELETE_PARTY_ADDRESS_MUTATION = `
  mutation DeletePartyAddress($id: Int!) {
    deletePartyAddress(id: $id) {
      success
    }
  }
`;

export const CREATE_PARTY_ADDRESS_MUTATION = `
  mutation CreatePartyAddress(
    $accountId: Int!
    $partyId: Int!
    $addressId: Int!
    $addressType: String!
    $isPrimary: Boolean
  ) {
    createPartyAddress(
      accountId: $accountId
      partyId: $partyId
      addressId: $addressId
      addressType: $addressType
      isPrimary: $isPrimary
    ) {
      partyAddress {
        id
      }
    }
  }
`;

export const CREATE_PHONE_MUTATION = `
  mutation CreatePhone($number: String!, $extension: String) {
    createPhone(number: $number, extension: $extension) {
      phone { id number }
    }
  }
`;

export const UPDATE_PHONE_MUTATION = `
  mutation UpdatePhone($id: Int!, $number: String) {
    updatePhone(id: $id, number: $number) {
      phone { id number }
    }
  }
`;

export const CREATE_PARTY_PHONE_MUTATION = `
  mutation CreatePartyPhone(
    $accountId: Int!
    $partyId: Int!
    $phoneId: Int!
    $phoneType: String!
    $isPrimary: Boolean
  ) {
    createPartyPhone(
      accountId: $accountId
      partyId: $partyId
      phoneId: $phoneId
      phoneType: $phoneType
      isPrimary: $isPrimary
    ) {
      partyPhone { id }
    }
  }
`;

export const DELETE_PARTY_PHONE_MUTATION = `
  mutation DeletePartyPhone($id: Int!) {
    deletePartyPhone(id: $id) {
      success
    }
  }
`;
