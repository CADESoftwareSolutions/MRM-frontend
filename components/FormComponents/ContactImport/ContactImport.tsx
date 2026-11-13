import type { FC } from "react";

export interface ContactImportProps {
  onClose: () => void;
}

export const ContactImport: FC<ContactImportProps> = () => (
  <div className="text-white/70">Contact import coming soon.</div>
);

export default ContactImport;
