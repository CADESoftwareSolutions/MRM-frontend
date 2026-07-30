export const FETCH_DEEDS = `
  query {
    deeds {
      id
      documentType
      interestType
      grantor
      grantorInterestConveyed
      grantee
      granteeInterestReceived
      effectiveDate
      executedDate
      consideration
      acres
      reservations
      notes
      recordations {
        id
        stateCode
        countyName
        volume
        page
        instrumentNumber
        recordingDate
      }
      tracts {
        tractId
        sortOrder
        grossAcres
        netAcres
        tract {
          id
          tractNo
          tractLabel
          stateCode
          countyName
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
    $grantor: String
    $grantorInterestConveyed: String
    $grantee: String
    $granteeInterestReceived: String
    $effectiveDate: Date
    $executedDate: Date
    $consideration: Float
    $acres: Float
    $reservations: String
    $notes: String
    $recordations: [RecordationInput]
    $tractLinks: [TitleDocumentTractLinkInput]
  ) {
    createDeed(
      accountId: $accountId
      documentType: $documentType
      interestType: $interestType
      grantor: $grantor
      grantorInterestConveyed: $grantorInterestConveyed
      grantee: $grantee
      granteeInterestReceived: $granteeInterestReceived
      effectiveDate: $effectiveDate
      executedDate: $executedDate
      consideration: $consideration
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
    $grantor: String
    $grantorInterestConveyed: String
    $grantee: String
    $granteeInterestReceived: String
    $effectiveDate: Date
    $executedDate: Date
    $consideration: Float
    $acres: Float
    $reservations: String
    $notes: String
    $recordations: [RecordationInput]
    $tractLinks: [TitleDocumentTractLinkInput]
  ) {
    updateDeed(
      id: $id
      documentType: $documentType
      interestType: $interestType
      grantor: $grantor
      grantorInterestConveyed: $grantorInterestConveyed
      grantee: $grantee
      granteeInterestReceived: $granteeInterestReceived
      effectiveDate: $effectiveDate
      executedDate: $executedDate
      consideration: $consideration
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
