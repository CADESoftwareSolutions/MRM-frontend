// Manually-added cross-references (generic cross_reference_link table). NOT yet supported by the
// BE on main — nothing here is sent until MANUAL_CROSS_REFERENCES_ENABLED in
// useCrossReferences.ts is flipped on. Shape matches the CrossReferenceLink model from the
// unmerged mrm `cross-reference-feature` branch, except every type pair must be allowed (that
// branch restricted it to the pairs with no dedicated join table).
export const FETCH_CROSS_REFERENCE_LINKS = `
  query CrossReferenceLinks($entityType: String!, $entityId: Int!) {
    crossReferenceLinks(entityType: $entityType, entityId: $entityId) {
      id
      entityTypeA
      entityIdA
      entityTypeB
      entityIdB
    }
  }
`;

export const CREATE_CROSS_REFERENCE_LINK_MUTATION = `
  mutation CreateCrossReferenceLink(
    $accountId: Int!
    $entityTypeA: String!
    $entityIdA: Int!
    $entityTypeB: String!
    $entityIdB: Int!
  ) {
    createCrossReferenceLink(
      accountId: $accountId
      entityTypeA: $entityTypeA
      entityIdA: $entityIdA
      entityTypeB: $entityTypeB
      entityIdB: $entityIdB
      source: "manual"
    ) {
      crossReferenceLink { id }
    }
  }
`;

export const DELETE_CROSS_REFERENCE_LINK_MUTATION = `
  mutation DeleteCrossReferenceLink($id: Int!) {
    deleteCrossReferenceLink(id: $id) {
      success
    }
  }
`;
