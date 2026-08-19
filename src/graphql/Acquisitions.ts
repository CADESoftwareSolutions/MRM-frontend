export const FETCH_ACQUISITIONS = `
  query {
    acquisitions {
      id
      name
      acquisitionDate
      acquisitionAmount
      notes
    }
  }
`;

export const CREATE_ACQUISITION_MUTATION = `
  mutation CreateAcquisition(
    $accountId: Int!
    $name: String!
    $acquisitionDate: Date!
    $acquisitionAmount: Float
    $notes: String
  ) {
    createAcquisition(
      accountId: $accountId
      name: $name
      acquisitionDate: $acquisitionDate
      acquisitionAmount: $acquisitionAmount
      notes: $notes
    ) {
      acquisition { id }
    }
  }
`;

export const UPDATE_ACQUISITION_MUTATION = `
  mutation UpdateAcquisition(
    $id: Int!
    $name: String
    $acquisitionDate: Date
    $acquisitionAmount: Float
    $notes: String
  ) {
    updateAcquisition(
      id: $id
      name: $name
      acquisitionDate: $acquisitionDate
      acquisitionAmount: $acquisitionAmount
      notes: $notes
    ) {
      acquisition { id }
    }
  }
`;

export const DELETE_ACQUISITION_MUTATION = `
  mutation DeleteAcquisition($id: Int!) {
    deleteAcquisition(id: $id) {
      success
    }
  }
`;
