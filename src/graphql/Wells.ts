export const FETCH_WELLS = `
  query {
    wells {
      id
      name
      leaseName
      wellNumber
      operatorName
      fieldName
      rrcDistrict
      apiNumber
      stateCode
      countyName
      notes
      legalDescriptions {
        id
        sortOrder
        stateCode
        countyName
        tractType
        tractLabel
        legalDescription
        lotNo
        blockNo
        township
        section
        range
        abstract
        survey
        quarterCalls
        grossAcres
        netAcres
      }
    }
  }
`;

export const CREATE_WELL_MUTATION = `
  mutation CreateWell(
    $accountId: Int!
    $name: String!
    $leaseName: String
    $wellNumber: String
    $operatorName: String
    $fieldName: String
    $rrcDistrict: String
    $apiNumber: String
    $stateCode: String
    $countyName: String
    $notes: String
    $legalDescriptions: [LegalDescriptionInput]
  ) {
    createWell(
      accountId: $accountId
      name: $name
      leaseName: $leaseName
      wellNumber: $wellNumber
      operatorName: $operatorName
      fieldName: $fieldName
      rrcDistrict: $rrcDistrict
      apiNumber: $apiNumber
      stateCode: $stateCode
      countyName: $countyName
      notes: $notes
      legalDescriptions: $legalDescriptions
    ) {
      well { id }
    }
  }
`;

export const UPDATE_WELL_MUTATION = `
  mutation UpdateWell(
    $id: Int!
    $name: String
    $leaseName: String
    $wellNumber: String
    $operatorName: String
    $fieldName: String
    $rrcDistrict: String
    $apiNumber: String
    $stateCode: String
    $countyName: String
    $notes: String
    $legalDescriptions: [LegalDescriptionInput]
  ) {
    updateWell(
      id: $id
      name: $name
      leaseName: $leaseName
      wellNumber: $wellNumber
      operatorName: $operatorName
      fieldName: $fieldName
      rrcDistrict: $rrcDistrict
      apiNumber: $apiNumber
      stateCode: $stateCode
      countyName: $countyName
      notes: $notes
      legalDescriptions: $legalDescriptions
    ) {
      well { id }
    }
  }
`;

export const DELETE_WELL_MUTATION = `
  mutation DeleteWell($id: Int!) {
    deleteWell(id: $id) {
      success
    }
  }
`;
