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
