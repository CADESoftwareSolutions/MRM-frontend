export const FETCH_LEASES = `
  query {
    leases {
      id
      leaseType
      paymentType
      parentLeaseId
      lessor
      lessee
      effectiveDate
      primaryTermEndDate
      primaryTermValue
      primaryTermUnit
      royaltyFractionNumerator
      royaltyFractionDenominator
      royaltyOfRoyaltyNumerator
      royaltyOfRoyaltyDenominator
      royaltyPercent
      status
      stateCode
      countyName
      acres
      costFree
      paidUpBonus
      paidUpBonusReceived
      bonusPerAcre
      delayRentalAmount
      delayRentalPerAcre
      delayRentalFrequency
      surfaceRights
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
      provisions {
        id
        provisionType
        isEnabled
        periodValue
        periodUnit
        paymentPerAcre
        paymentFrequency
        extendDurationValue
        extendDurationUnit
        timeBetweenCompletionValue
        timeBetweenCompletionUnit
        offsetDistance
        consentType
        notes
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
    }
  }
`;

export const CREATE_LEASE_MUTATION = `
  mutation CreateLease(
    $accountId: Int!
    $effectiveDate: Date!
    $status: String!
    $paymentType: String!
    $leaseType: String
    $parentLeaseId: Int
    $lessor: String
    $lessee: String
    $primaryTermEndDate: Date
    $primaryTermValue: Int
    $primaryTermUnit: String
    $royaltyFractionNumerator: Int
    $royaltyFractionDenominator: Int
    $royaltyOfRoyaltyNumerator: Int
    $royaltyOfRoyaltyDenominator: Int
    $royaltyPercent: Float
    $stateCode: String
    $countyName: String
    $acres: Float
    $costFree: Boolean
    $paidUpBonus: Float
    $paidUpBonusReceived: Boolean
    $bonusPerAcre: Float
    $delayRentalAmount: Float
    $delayRentalPerAcre: Float
    $delayRentalFrequency: String
    $surfaceRights: Boolean
    $notes: String
    $recordations: [RecordationInput]
    $provisions: [LeaseProvisionInput]
    $tractLinks: [LeaseTractLinkInput]
  ) {
    createLease(
      accountId: $accountId
      effectiveDate: $effectiveDate
      status: $status
      paymentType: $paymentType
      leaseType: $leaseType
      parentLeaseId: $parentLeaseId
      lessor: $lessor
      lessee: $lessee
      primaryTermEndDate: $primaryTermEndDate
      primaryTermValue: $primaryTermValue
      primaryTermUnit: $primaryTermUnit
      royaltyFractionNumerator: $royaltyFractionNumerator
      royaltyFractionDenominator: $royaltyFractionDenominator
      royaltyOfRoyaltyNumerator: $royaltyOfRoyaltyNumerator
      royaltyOfRoyaltyDenominator: $royaltyOfRoyaltyDenominator
      royaltyPercent: $royaltyPercent
      stateCode: $stateCode
      countyName: $countyName
      acres: $acres
      costFree: $costFree
      paidUpBonus: $paidUpBonus
      paidUpBonusReceived: $paidUpBonusReceived
      bonusPerAcre: $bonusPerAcre
      delayRentalAmount: $delayRentalAmount
      delayRentalPerAcre: $delayRentalPerAcre
      delayRentalFrequency: $delayRentalFrequency
      surfaceRights: $surfaceRights
      notes: $notes
      recordations: $recordations
      provisions: $provisions
      tractLinks: $tractLinks
    ) {
      lease { id }
    }
  }
`;

export const UPDATE_LEASE_MUTATION = `
  mutation UpdateLease(
    $id: Int!
    $effectiveDate: Date
    $status: String
    $paymentType: String
    $leaseType: String
    $parentLeaseId: Int
    $lessor: String
    $lessee: String
    $primaryTermEndDate: Date
    $primaryTermValue: Int
    $primaryTermUnit: String
    $royaltyFractionNumerator: Int
    $royaltyFractionDenominator: Int
    $royaltyOfRoyaltyNumerator: Int
    $royaltyOfRoyaltyDenominator: Int
    $royaltyPercent: Float
    $stateCode: String
    $countyName: String
    $acres: Float
    $costFree: Boolean
    $paidUpBonus: Float
    $paidUpBonusReceived: Boolean
    $bonusPerAcre: Float
    $delayRentalAmount: Float
    $delayRentalPerAcre: Float
    $delayRentalFrequency: String
    $surfaceRights: Boolean
    $notes: String
    $recordations: [RecordationInput]
    $provisions: [LeaseProvisionInput]
    $tractLinks: [LeaseTractLinkInput]
  ) {
    updateLease(
      id: $id
      effectiveDate: $effectiveDate
      status: $status
      paymentType: $paymentType
      leaseType: $leaseType
      parentLeaseId: $parentLeaseId
      lessor: $lessor
      lessee: $lessee
      primaryTermEndDate: $primaryTermEndDate
      primaryTermValue: $primaryTermValue
      primaryTermUnit: $primaryTermUnit
      royaltyFractionNumerator: $royaltyFractionNumerator
      royaltyFractionDenominator: $royaltyFractionDenominator
      royaltyOfRoyaltyNumerator: $royaltyOfRoyaltyNumerator
      royaltyOfRoyaltyDenominator: $royaltyOfRoyaltyDenominator
      royaltyPercent: $royaltyPercent
      stateCode: $stateCode
      countyName: $countyName
      acres: $acres
      costFree: $costFree
      paidUpBonus: $paidUpBonus
      paidUpBonusReceived: $paidUpBonusReceived
      bonusPerAcre: $bonusPerAcre
      delayRentalAmount: $delayRentalAmount
      delayRentalPerAcre: $delayRentalPerAcre
      delayRentalFrequency: $delayRentalFrequency
      surfaceRights: $surfaceRights
      notes: $notes
      recordations: $recordations
      provisions: $provisions
      tractLinks: $tractLinks
    ) {
      lease { id }
    }
  }
`;

export const DELETE_LEASE_MUTATION = `
  mutation DeleteLease($id: Int!) {
    deleteLease(id: $id) {
      success
    }
  }
`;

// ── Cross-reference links (Cross-References tab) ──
// Same immediate-mutation shape as the Deeds equivalents in Deeds.ts — Deed cross-references
// reuse CREATE_DEED_LEASE_MUTATION/DELETE_DEED_LEASE_MUTATION from there directly (it's the
// same title_document_lease row either way, just created with this lease's id as leaseId).

export const CREATE_LEASE_WELL_MUTATION = `
  mutation CreateLeaseWell($accountId: Int!, $leaseId: Int!, $wellId: Int!, $notes: String) {
    createLeaseWell(accountId: $accountId, leaseId: $leaseId, wellId: $wellId, notes: $notes) {
      leaseWell {
        id
        notes
        well { id name }
      }
    }
  }
`;

export const DELETE_LEASE_WELL_MUTATION = `
  mutation DeleteLeaseWell($id: Int!) {
    deleteLeaseWell(id: $id) {
      success
    }
  }
`;

export const CREATE_LEASE_ACQUISITION_MUTATION = `
  mutation CreateLeaseAcquisition($accountId: Int!, $leaseId: Int!, $acquisitionId: Int!, $allocatedCost: Float) {
    createLeaseAcquisition(accountId: $accountId, leaseId: $leaseId, acquisitionId: $acquisitionId, allocatedCost: $allocatedCost) {
      leaseAcquisition {
        id
        allocatedCost
        acquisition { id name }
      }
    }
  }
`;

export const UPDATE_LEASE_ACQUISITION_MUTATION = `
  mutation UpdateLeaseAcquisition($id: Int!, $allocatedCost: Float) {
    updateLeaseAcquisition(id: $id, allocatedCost: $allocatedCost) {
      leaseAcquisition {
        id
        allocatedCost
        acquisition { id name }
      }
    }
  }
`;

export const DELETE_LEASE_ACQUISITION_MUTATION = `
  mutation DeleteLeaseAcquisition($id: Int!) {
    deleteLeaseAcquisition(id: $id) {
      success
    }
  }
`;
