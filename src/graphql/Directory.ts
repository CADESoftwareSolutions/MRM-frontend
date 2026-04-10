export const FETCH_PARTIES = `
  query FetchParties($accountId: Int!) {
    parties(accountId: $accountId) {
      id
      partyType
      nameFull
      nameFirst
      nameLast
      nameMiddle
      email
      phone
      isActive
      createdAt
      updatedAt
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
    $partyType: String!
    $nameFull: String!
    $nameFirst: String
    $nameLast: String
    $nameMiddle: String
    $taxId: String
    $email: String
    $phone: String
    $isActive: Boolean
  ) {
    createParty(
      accountId: $accountId
      partyType: $partyType
      nameFull: $nameFull
      nameFirst: $nameFirst
      nameLast: $nameLast
      nameMiddle: $nameMiddle
      taxId: $taxId
      email: $email
      phone: $phone
      isActive: $isActive
    ) {
      party {
        id
        partyType
        nameFull
        email
        phone
        isActive
      }
    }
  }
`;

export const UPDATE_PARTY_MUTATION = `
  mutation UpdateParty(
    $id: Int!
    $partyType: String
    $nameFull: String
    $nameFirst: String
    $nameLast: String
    $nameMiddle: String
    $taxId: String
    $email: String
    $phone: String
    $isActive: Boolean
  ) {
    updateParty(
      id: $id
      partyType: $partyType
      nameFull: $nameFull
      nameFirst: $nameFirst
      nameLast: $nameLast
      nameMiddle: $nameMiddle
      taxId: $taxId
      email: $email
      phone: $phone
      isActive: $isActive
    ) {
      party {
        id
        partyType
        nameFull
        email
        phone
        isActive
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

export const CREATE_CONTACT_MUTATION = `
  mutation CreateContact(
    $partyId: Int!
    $name: String!
    $phone: String
    $email: String
    $addressType: [String]
    $address: String
    $addressLine2: String
    $city: String
    $state: String
    $zip: String
  ) {
    createContact(
      partyId: $partyId
      name: $name
      phone: $phone
      email: $email
      addressType: $addressType
      address: $address
      addressLine2: $addressLine2
      city: $city
      state: $state
      zip: $zip
    ) {
      contact { id name phone email addressType address addressLine2 city state zip }
    }
  }
`;

export const UPDATE_CONTACT_MUTATION = `
  mutation UpdateContact(
    $id: Int!
    $name: String
    $phone: String
    $email: String
    $addressType: [String]
    $address: String
    $addressLine2: String
    $city: String
    $state: String
    $zip: String
  ) {
    updateContact(
      id: $id
      name: $name
      phone: $phone
      email: $email
      addressType: $addressType
      address: $address
      addressLine2: $addressLine2
      city: $city
      state: $state
      zip: $zip
    ) {
      contact { id name phone email addressType address addressLine2 city state zip }
    }
  }
`;

export const DELETE_CONTACT_MUTATION = `
  mutation DeleteContact($id: Int!) {
    deleteContact(id: $id) {
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
