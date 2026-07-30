export const FETCH_TRACTS = `
  query {
    tracts {
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
`;

export const CREATE_TRACT_MUTATION = `
  mutation CreateTract($accountId: Int!, $tract: TractInput!) {
    createTract(accountId: $accountId, tract: $tract) {
      tract { id }
    }
  }
`;

export const UPDATE_TRACT_MUTATION = `
  mutation UpdateTract($id: Int!, $tract: TractInput!) {
    updateTract(id: $id, tract: $tract) {
      tract { id }
    }
  }
`;

export const DELETE_TRACT_MUTATION = `
  mutation DeleteTract($id: Int!) {
    deleteTract(id: $id) {
      success
    }
  }
`;
