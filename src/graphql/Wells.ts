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
      leaseLinks {
        id
        notes
        lease {
          id
          lessor
          lessee
        }
      }
      titleDocumentLinks {
        id
        notes
        titleDocument {
          id
          documentType
          conveyanceParties {
            role
            name
            sortOrder
          }
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

// ── Cross-reference links (Cross-References tab) ──
// Same immediate-mutation shape as Deeds/Leases — Well cross-references to Lease/Deed reuse
// CREATE_LEASE_WELL_MUTATION/CREATE_DEED_WELL_MUTATION from those files directly (it's the same
// lease_well / title_document_well row either way, just created with this well's id as wellId).

export const CREATE_WELL_ACQUISITION_MUTATION = `
  mutation CreateWellAcquisition($accountId: Int!, $wellId: Int!, $acquisitionId: Int!, $allocatedCost: Float) {
    createWellAcquisition(accountId: $accountId, wellId: $wellId, acquisitionId: $acquisitionId, allocatedCost: $allocatedCost) {
      wellAcquisition {
        id
        allocatedCost
        acquisition { id name }
      }
    }
  }
`;

export const UPDATE_WELL_ACQUISITION_MUTATION = `
  mutation UpdateWellAcquisition($id: Int!, $allocatedCost: Float) {
    updateWellAcquisition(id: $id, allocatedCost: $allocatedCost) {
      wellAcquisition {
        id
        allocatedCost
        acquisition { id name }
      }
    }
  }
`;

export const DELETE_WELL_ACQUISITION_MUTATION = `
  mutation DeleteWellAcquisition($id: Int!) {
    deleteWellAcquisition(id: $id) {
      success
    }
  }
`;
