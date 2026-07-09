export const FETCH_STATE_COUNTY_REFERENCE = `
  query FetchStateCountyReference {
    stateCountyReference {
      code
      name
      counties {
        name
        stateCode
        fullName
        fipsState
        fipsCounty
      }
    }
  }
`;
