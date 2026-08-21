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
      parties {
        id
        role
        notes
        party {
          id
          nameFull
        }
      }
      leaseLinks {
        id
        notes
        lease {
          id
          lessor
          lessee
        }
      }
      wellLinks {
        id
        notes
        well {
          id
          name
        }
      }
      acquisitionLinks {
        id
        allocatedCost
        acquisition {
          id
          name
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
    $consideration: Float
    $acres: Float
    $reservations: String
    $notes: String
    $recordations: [RecordationInput]
    $legalDescriptions: [LegalDescriptionInput]
  ) {
    createDeed(
      accountId: $accountId
      documentType: $documentType
      interestType: $interestType
      conveyanceParties: $conveyanceParties
      stateCode: $stateCode
      countyName: $countyName
      consideration: $consideration
      acres: $acres
      reservations: $reservations
      notes: $notes
      recordations: $recordations
      legalDescriptions: $legalDescriptions
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
    $consideration: Float
    $acres: Float
    $reservations: String
    $notes: String
    $recordations: [RecordationInput]
    $legalDescriptions: [LegalDescriptionInput]
  ) {
    updateDeed(
      id: $id
      documentType: $documentType
      interestType: $interestType
      conveyanceParties: $conveyanceParties
      stateCode: $stateCode
      countyName: $countyName
      consideration: $consideration
      acres: $acres
      reservations: $reservations
      notes: $notes
      recordations: $recordations
      legalDescriptions: $legalDescriptions
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

// ── Cross-reference links (Cross-References tab) ──
// Unlike conveyanceParties/recordations/tractLinks, the backend does not accept these as
// createDeed/updateDeed arguments — each link is its own row (title_document_party /
// _lease / _well / _acquisition) persisted immediately via its own mutation, same shape as
// file attachments (useFileUpload.ts): requires an existing deed id, invalidate + refetch after.

export const CREATE_DEED_PARTY_MUTATION = `
  mutation CreateDeedParty($accountId: Int!, $deedId: Int!, $partyId: Int!, $role: String!, $notes: String) {
    createDeedParty(accountId: $accountId, deedId: $deedId, partyId: $partyId, role: $role, notes: $notes) {
      deedParty {
        id
        role
        notes
        party { id nameFull }
      }
    }
  }
`;

export const DELETE_DEED_PARTY_MUTATION = `
  mutation DeleteDeedParty($id: Int!) {
    deleteDeedParty(id: $id) {
      success
    }
  }
`;

export const CREATE_DEED_LEASE_MUTATION = `
  mutation CreateDeedLease($accountId: Int!, $deedId: Int!, $leaseId: Int!, $notes: String) {
    createDeedLease(accountId: $accountId, deedId: $deedId, leaseId: $leaseId, notes: $notes) {
      deedLease {
        id
        notes
        lease { id lessor lessee }
      }
    }
  }
`;

export const DELETE_DEED_LEASE_MUTATION = `
  mutation DeleteDeedLease($id: Int!) {
    deleteDeedLease(id: $id) {
      success
    }
  }
`;

export const CREATE_DEED_WELL_MUTATION = `
  mutation CreateDeedWell($accountId: Int!, $deedId: Int!, $wellId: Int!, $notes: String) {
    createDeedWell(accountId: $accountId, deedId: $deedId, wellId: $wellId, notes: $notes) {
      deedWell {
        id
        notes
        well { id name }
      }
    }
  }
`;

export const DELETE_DEED_WELL_MUTATION = `
  mutation DeleteDeedWell($id: Int!) {
    deleteDeedWell(id: $id) {
      success
    }
  }
`;

export const CREATE_DEED_ACQUISITION_MUTATION = `
  mutation CreateDeedAcquisition($accountId: Int!, $deedId: Int!, $acquisitionId: Int!, $allocatedCost: Float) {
    createDeedAcquisition(accountId: $accountId, deedId: $deedId, acquisitionId: $acquisitionId, allocatedCost: $allocatedCost) {
      deedAcquisition {
        id
        allocatedCost
        acquisition { id name }
      }
    }
  }
`;

export const UPDATE_DEED_ACQUISITION_MUTATION = `
  mutation UpdateDeedAcquisition($id: Int!, $allocatedCost: Float) {
    updateDeedAcquisition(id: $id, allocatedCost: $allocatedCost) {
      deedAcquisition {
        id
        allocatedCost
        acquisition { id name }
      }
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
