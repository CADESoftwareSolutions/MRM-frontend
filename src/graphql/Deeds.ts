export const FETCH_DEEDS = `
  query {
    deeds {
      id
      documentType
      interestType
      conveyanceParties {
        role
        name
        interest
        sortOrder
      }
      stateCode
      countyName
      effectiveDate
      acres
      reservations
      notes
      createdAt
      acquisitionLinks {
        id
        acquisitionId
        allocatedCost
        acquisition {
          id
          name
        }
      }
      recordations {
        id
        stateCode
        countyName
        book
        volume
        page
        instrumentNumber
        recordingDate
      }
      tracts {
        id
        tractId
        sortOrder
        grossAcres
        netAcres
        quarterCalls
        depthRights
        tract {
          id
          tractNo
          tractType
          stateCode
          countyName
          upi
          tractLabel
          subSurvey
          legalDescription
          lotNo
          blockNo
          township
          surveyTownship
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
  }
`;

export const CREATE_DEED_MUTATION = `
  mutation CreateDeed(
    $accountId: Int!
    $documentType: String
    $interestType: String
    $conveyanceParties: [ConveyancePartyInput]
    $stateCode: String
    $countyName: String
    $effectiveDate: Date
    $acres: Float
    $reservations: String
    $notes: String
    $recordations: [RecordationInput]
    $tractLinks: [TractLinkInput]
  ) {
    createDeed(
      accountId: $accountId
      documentType: $documentType
      interestType: $interestType
      conveyanceParties: $conveyanceParties
      stateCode: $stateCode
      countyName: $countyName
      effectiveDate: $effectiveDate
      acres: $acres
      reservations: $reservations
      notes: $notes
      recordations: $recordations
      tractLinks: $tractLinks
    ) {
      deed { id }
    }
  }
`;

export const UPDATE_DEED_MUTATION = `
  mutation UpdateDeed(
    $id: Int!
    $documentType: String
    $interestType: String
    $conveyanceParties: [ConveyancePartyInput]
    $stateCode: String
    $countyName: String
    $effectiveDate: Date
    $acres: Float
    $reservations: String
    $notes: String
    $recordations: [RecordationInput]
    $tractLinks: [TractLinkInput]
  ) {
    updateDeed(
      id: $id
      documentType: $documentType
      interestType: $interestType
      conveyanceParties: $conveyanceParties
      stateCode: $stateCode
      countyName: $countyName
      effectiveDate: $effectiveDate
      acres: $acres
      reservations: $reservations
      notes: $notes
      recordations: $recordations
      tractLinks: $tractLinks
    ) {
      deed { id }
    }
  }
`;

export const DELETE_DEED_MUTATION = `
  mutation DeleteDeed($id: Int!) {
    deleteDeed(id: $id) {
      success
    }
  }
`;

export const CREATE_DEED_ACQUISITION_MUTATION = `
  mutation CreateDeedAcquisition(
    $accountId: Int!
    $deedId: Int!
    $acquisitionId: Int!
    $allocatedCost: Float
  ) {
    createDeedAcquisition(
      accountId: $accountId
      deedId: $deedId
      acquisitionId: $acquisitionId
      allocatedCost: $allocatedCost
    ) {
      deedAcquisition { id }
    }
  }
`;

export const UPDATE_DEED_ACQUISITION_MUTATION = `
  mutation UpdateDeedAcquisition($id: Int!, $allocatedCost: Float) {
    updateDeedAcquisition(id: $id, allocatedCost: $allocatedCost) {
      deedAcquisition { id }
    }
  }
`;

export const DELETE_DEED_ACQUISITION_MUTATION = `
  mutation DeleteDeedAcquisition($id: Int!) {
    deleteDeedAcquisition(id: $id) {
      success
    }
  }
`;
