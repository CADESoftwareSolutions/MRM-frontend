import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ContactPicker } from "../../../FormComponents/ContactPicker";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import type { WellOption } from "@/hooks/useWellOptions";
import type { CheckDetailCheck } from "@/lib/checkDetailCsv";
import { formatAccountLabel } from "@/types/chartOfAccounts";
import { FileCheckRail } from "./FileCheckRail";
import { LabelAccountCell } from "./LabelAccountCell";
import { MatchBadge } from "./MatchBadge";
import { WellPicker } from "./WellPicker";
import type {
  ContactMatchSource,
  ImportResolution,
  ResolvedLabel,
  ResolvedOperator,
  ResolvedOwner,
  ResolvedProperty,
  WellChoice,
} from "./importModel";
import { SECTION_HEADER_CLASS, useImportTheme } from "./importTheme";

export interface MatchStepProps {
  checks: CheckDetailCheck[];
  resolution: ImportResolution;
  contactsLoading: boolean;
  wells: WellOption[];
  wellsLoading: boolean;
  onChooseOperator: (key: string, contactId: string) => void;
  onChooseOwner: (key: string, contactId: string) => void;
  /** null clears the choice (back to the remembered match, if any). */
  onChooseWell: (key: string, choice: WellChoice | null) => void;
  onChooseAccount: (key: string, accountId: string | null) => void;
  remember: boolean;
  onRememberChange: (remember: boolean) => void;
  rememberFor: string;
}

const CONTACT_BADGE: Record<ContactMatchSource, { label: string; title: string }> = {
  chosen: { label: "Matched", title: "Chosen here" },
  remembered: { label: "Matched", title: "Remembered from an earlier import" },
  name: { label: "Matched", title: "Same name as the contact" },
  ownerNumber: { label: "By owner #", title: "Remembered from this operator's owner number" },
};

const MatchSection = ({
  title,
  columns,
  empty,
  children,
}: {
  title: string;
  columns: [string, string];
  empty?: string;
  children: ReactNode;
}) => {
  const theme = useImportTheme();
  const th = `px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap ${theme.headerText}`;
  return (
    <section aria-label={title} className="min-w-0 rounded-xl border border-purple-300/20 bg-white/5 px-3.5 py-3">
      <h3 className={`${SECTION_HEADER_CLASS} mb-1.5`}>{title}</h3>
      {empty ? (
        <p className="px-2 py-3 text-sm text-white/60">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-purple-300/20">
                <th className={th}>{columns[0]}</th>
                <th className={th}>{columns[1]}</th>
                <th className={th}>
                  <span className="sr-only">Status</span>
                </th>
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const Row = ({ file, match, badge }: { file: ReactNode; match: ReactNode; badge: ReactNode }) => {
  const theme = useImportTheme();
  return (
    <tr className={`border-b last:border-0 ${theme.rowBorder}`}>
      <td className="px-2 py-2 align-middle text-white">{file}</td>
      <td className="w-[55%] min-w-[200px] px-2 py-2 align-middle">{match}</td>
      <td className="px-2 py-2 text-right align-middle whitespace-nowrap">{badge}</td>
    </tr>
  );
};

const FileName = ({ name, note }: { name: string; note?: string }) => (
  <>
    <span className="block font-medium">{name}</span>
    {note && <span className="block text-xs text-white/60">{note}</span>}
  </>
);

const ContactBadge = ({ source, loading }: { source: ContactMatchSource | null; loading: boolean }) =>
  !source && loading ? (
    <MatchBadge tone="gray">Checking…</MatchBadge>
  ) : source ? (
    <MatchBadge tone="green" title={CONTACT_BADGE[source].title}>
      {CONTACT_BADGE[source].label}
    </MatchBadge>
  ) : (
    <MatchBadge tone="yellow" title="No contact matches this name yet">
      New
    </MatchBadge>
  );

const Suggestion = ({
  label,
  detail,
  forRow,
  onUse,
}: {
  label: string;
  detail?: string;
  forRow: string;
  onUse: () => void;
}) => {
  const theme = useImportTheme();
  return (
    <span className="mt-1 block text-xs text-white/80">
      Suggested: {label}
      {detail ? ` (${detail})` : ""} ·{" "}
      <button type="button" onClick={onUse} aria-label={`Use ${label} for ${forRow}`} className={theme.link}>
        Use it
      </button>
    </span>
  );
};

export const MatchStep = ({
  checks,
  resolution,
  contactsLoading,
  wells,
  wellsLoading,
  onChooseOperator,
  onChooseOwner,
  onChooseWell,
  onChooseAccount,
  remember,
  onRememberChange,
  rememberFor,
}: MatchStepProps) => {
  const theme = useImportTheme();
  const queryClient = useQueryClient();
  const { getAccount } = useChartOfAccounts();
  const [addingContact, setAddingContact] = useState(false);
  const severalOperators = resolution.operators.length > 1;

  // A contact added in the other tab shows up here once the user comes back to this one.
  useEffect(() => {
    if (!addingContact) return;
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["parties"] });
      setAddingContact(false);
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [addingContact, queryClient]);

  const addContact = () => {
    window.open("/Dashboard/contacts", "_blank", "noopener");
    setAddingContact(true);
  };

  const accountLabel = (id: string | null) => {
    const account = getAccount(id);
    return account ? formatAccountLabel(account) : (id ?? "");
  };

  const ambiguityNote = (candidates: number, contactId: string | null, inactiveOnly: boolean) =>
    contactId ? null : inactiveOnly ? (
      <span className={`mt-1 block text-xs ${theme.warnText}`}>
        The only contact with this name is inactive. Choose it yourself or pick another.
      </span>
    ) : candidates > 1 ? (
      <span className={`mt-1 block text-xs ${theme.warnText}`}>
        {candidates} contacts have this name. Choose the right one.
      </span>
    ) : null;

  const operatorRow = (operator: ResolvedOperator) => (
    <Row
      key={`op-${operator.key}`}
      file={<FileName name={operator.name} note="Operator" />}
      match={
        <>
          <ContactPicker
            size="sm"
            value={operator.contactId}
            onChange={(id) => onChooseOperator(operator.key, id)}
            classifications={["OPERATOR", "PURCHASER"]}
            placeholder="Choose a contact"
            className={operator.contactId ? undefined : `border-dashed ${theme.needRing}`}
            onAddNew={addContact}
            aria-label={`Contact for operator ${operator.name}`}
          />
          {ambiguityNote(operator.candidates, operator.contactId, operator.inactiveOnly)}
        </>
      }
      badge={<ContactBadge source={operator.source} loading={contactsLoading} />}
    />
  );

  const ownerRow = (owner: ResolvedOwner) => (
    <Row
      key={`ow-${owner.key}`}
      file={
        <FileName
          name={owner.name}
          note={[owner.number && `Owner # ${owner.number}`, severalOperators && owner.operatorName].filter(Boolean).join(" · ")}
        />
      }
      match={
        <>
          <ContactPicker
            size="sm"
            value={owner.contactId}
            onChange={(id) => onChooseOwner(owner.key, id)}
            classifications={["REV"]}
            placeholder="Choose a contact"
            className={owner.contactId ? undefined : `border-dashed ${theme.needRing}`}
            onAddNew={addContact}
            aria-label={`Contact for owner ${owner.name}`}
          />
          {ambiguityNote(owner.candidates, owner.contactId, owner.inactiveOnly)}
        </>
      }
      badge={<ContactBadge source={owner.source} loading={contactsLoading} />}
    />
  );

  const propertyRow = (property: ResolvedProperty) => {
    const name = [property.operatorCc, property.description].filter(Boolean).join(" · ") || "property with no Operator CC";
    const suggestion = property.suggestion;
    return (
      <Row
        key={property.key}
        file={
          <FileName
            name={property.operatorCc || "No Operator CC"}
            note={[property.description, severalOperators && property.operatorName].filter(Boolean).join(" · ")}
          />
        }
        match={
          <>
            <WellPicker
              wells={wells}
              loading={wellsLoading}
              value={property.well?.wellId ?? null}
              valueLabel={property.well?.wellLabel}
              onChange={(well) => onChooseWell(property.key, { wellId: well.id, wellLabel: well.label })}
              needsMatch={!property.later}
              aria-label={`Well for ${name}`}
            />
            {suggestion && !property.later && (
              <Suggestion
                label={suggestion.label}
                detail={[suggestion.apiNumber && `API ${suggestion.apiNumber}`, suggestion.countyName].filter(Boolean).join(", ")}
                forRow={name}
                onUse={() => onChooseWell(property.key, { wellId: suggestion.id, wellLabel: suggestion.label })}
              />
            )}
            <span className="mt-1 block text-xs text-white/70">
              {property.later ? (
                <>
                  Imported without a well. Link it on the check before posting ·{" "}
                  <button
                    type="button"
                    onClick={() => onChooseWell(property.key, null)}
                    aria-label={`Undo link later for ${name}`}
                    className={theme.link}
                  >
                    Undo
                  </button>
                </>
              ) : (
                <>
                  {property.well && (
                    <>
                      <button
                        type="button"
                        onClick={() => onChooseWell(property.key, "none")}
                        aria-label={`Clear the well for ${name}`}
                        className={theme.link}
                      >
                        Clear well
                      </button>
                      {" · "}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onChooseWell(property.key, "later")}
                    aria-label={`Link ${name} later`}
                    className={theme.link}
                  >
                    Link later
                  </button>
                </>
              )}
            </span>
          </>
        }
        badge={
          property.well ? (
            <MatchBadge
              tone="green"
              title={property.source === "remembered" ? "Remembered from an earlier import" : "Chosen here"}
            >
              Matched
            </MatchBadge>
          ) : property.later ? (
            <MatchBadge tone="gray">Link later</MatchBadge>
          ) : (
            <MatchBadge tone="yellow">New</MatchBadge>
          )
        }
      />
    );
  };

  const labelRow = (label: ResolvedLabel) => {
    const kindName = label.kind === "tax" ? "Tax" : "Deduct";
    const suggestion = getAccount(label.suggestionId);
    return (
      <Row
        key={label.key}
        file={<FileName name={label.label} note={kindName} />}
        match={
          label.source === "saved" ? (
            <span className="text-white">{accountLabel(label.accountId)}</span>
          ) : (
            <>
              <LabelAccountCell
                label={label.label}
                value={label.accountId}
                onChange={(id) => onChooseAccount(label.key, id)}
              />
              {!label.accountId && suggestion?.isActive && (
                <Suggestion
                  label={formatAccountLabel(suggestion)}
                  forRow={label.label}
                  onUse={() => onChooseAccount(label.key, suggestion.id)}
                />
              )}
            </>
          )
        }
        badge={
          label.source === "saved" ? (
            <MatchBadge tone="green" title="Saved on the Tax & Deduct Types tab">
              Saved
            </MatchBadge>
          ) : label.source === "chosen" ? (
            <MatchBadge tone="green" title="Saved to the Tax & Deduct Types tab when you import">
              Matched
            </MatchBadge>
          ) : (
            <MatchBadge
              tone="yellow"
              title={label.type ? "On the Tax & Deduct Types tab without an account" : "Not seen before"}
            >
              {label.type && !label.type.isNew ? "No account" : "New"}
            </MatchBadge>
          )
        }
      />
    );
  };

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="grid min-w-0 flex-[999_1_640px] gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,24rem),1fr))]">
        <MatchSection title="Operator & Owner" columns={["On the file", "Matched to"]}>
          {resolution.operators.map((operator) => [
            operatorRow(operator),
            ...resolution.owners.filter((owner) => owner.operatorKey === operator.key).map(ownerRow),
          ])}
        </MatchSection>

        <MatchSection
          title="Properties (Operator CC)"
          columns={["On the file", "Matched to"]}
          empty={resolution.properties.length ? undefined : "No properties on this file."}
        >
          {resolution.properties.map(propertyRow)}
        </MatchSection>

        <MatchSection
          title="Products"
          columns={["On the file", "Income account"]}
          empty={resolution.products.length ? undefined : "No product codes on this file."}
        >
          {resolution.products.map((product) => (
            <Row
              key={product.code}
              file={<FileName name={product.code} />}
              match={<span className="text-white">{accountLabel(product.accountId)}</span>}
              badge={
                product.standard ? (
                  <MatchBadge tone="green">Matched</MatchBadge>
                ) : (
                  <MatchBadge tone="gray" title="Not a standard product code, so it goes to the catch-all income account">
                    Default
                  </MatchBadge>
                )
              }
            />
          ))}
        </MatchSection>

        <MatchSection
          title="Tax & Deduct Types"
          columns={["On the file", "Account"]}
          empty={resolution.labels.length ? undefined : "No tax or deduct labels on this file."}
        >
          {resolution.labels.map(labelRow)}
        </MatchSection>
      </div>

      <FileCheckRail
        checks={checks}
        needsMatch={resolution.needsMatch}
        remember={remember}
        onRememberChange={onRememberChange}
        rememberFor={rememberFor}
      />
    </div>
  );
};

export default MatchStep;
