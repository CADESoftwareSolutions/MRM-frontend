// The generic entity_type/entity_id cross-reference link — only for pairs with no dedicated
// join table: well<->tract, lease<->lease, title_document<->title_document, well<->well. Every
// other pair (lease<->tract, deed<->tract, lease<->deed, lease<->well, deed<->well) already has
// its own mutations in Leases.ts/Deeds.ts/Wells.ts and must keep using those.

export const FETCH_CROSS_REFERENCE_LINKS = `
  query FetchCrossReferenceLinks($entityType: String, $entityId: Int) {
    crossReferenceLinks(entityType: $entityType, entityId: $entityId) {
      id
      entityTypeA
      entityIdA
      entityTypeB
      entityIdB
      source
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
    $source: String
  ) {
    createCrossReferenceLink(
      accountId: $accountId
      entityTypeA: $entityTypeA
      entityIdA: $entityIdA
      entityTypeB: $entityTypeB
      entityIdB: $entityIdB
      source: $source
    ) {
      crossReferenceLink {
        id
        entityTypeA
        entityIdA
        entityTypeB
        entityIdB
        source
      }
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

// Legal-description match suggestions (Cross-References tab's suggestion modal) — see
// legal_description_matching.py on the BE for the actual matching rule. Only valid for
// entityType "lease" | "title_document" | "well" (a Tract is never a suggestion source).
export const FETCH_LEGAL_DESCRIPTION_MATCH_SUGGESTIONS = `
  query FetchLegalDescriptionMatchSuggestions($entityType: String!, $entityId: Int!) {
    legalDescriptionMatchSuggestions(entityType: $entityType, entityId: $entityId) {
      entityType
      entityId
    }
  }
`;
