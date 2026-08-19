export const FETCH_FILE_ATTACHMENTS = `
  query FileAttachments($entityType: String, $entityId: Int) {
    fileAttachments(entityType: $entityType, entityId: $entityId) {
      id
      label
      documentKind
      createdAt
      storedFile {
        id
        originalFilename
        byteSize
        contentType
        status
      }
    }
  }
`;

export const ATTACH_FILE_MUTATION = `
  mutation AttachFile(
    $fileId: Int!
    $entityType: String!
    $entityId: Int!
    $label: String
    $documentKind: String
  ) {
    attachFile(
      fileId: $fileId
      entityType: $entityType
      entityId: $entityId
      label: $label
      documentKind: $documentKind
    ) {
      fileAttachment {
        id
        label
        documentKind
        createdAt
        storedFile {
          id
          originalFilename
          byteSize
          contentType
          status
        }
      }
    }
  }
`;

export const DETACH_FILE_MUTATION = `
  mutation DetachFile($attachmentId: Int!) {
    detachFile(attachmentId: $attachmentId) {
      success
    }
  }
`;
