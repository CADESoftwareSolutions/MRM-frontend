import { useMemo } from "react";
import { useContactOptions } from "@/hooks/useContactOptions";
import { useImportMatches } from "@/hooks/useImportMatches";
import { useTaxDeductTypes } from "@/hooks/useTaxDeductTypes";
import { useWellOptions } from "@/hooks/useWellOptions";
import type { CheckDetailCheck } from "@/lib/checkDetailCsv";
import { findTaxDeductType, incomeAccountForProduct } from "@/types/revenue";
import {
  ContactMatchSource,
  ImportChoices,
  ImportResolution,
  ResolvedLabel,
  ResolvedOperator,
  ResolvedOwner,
  ResolvedProperty,
  collectImportItems,
  countNeedsMatch,
  isStandardProduct,
  matchContactByName,
  suggestAccountForLabel,
  suggestWell,
} from "./importModel";

type ContactPick = { contactId: string | null; source: ContactMatchSource | null };

const firstPick = (...picks: [string | null | undefined, ContactMatchSource][]): ContactPick => {
  const found = picks.find(([id]) => id);
  return found ? { contactId: found[0]!, source: found[1] } : { contactId: null, source: null };
};

/** Resolves everything on the file against contacts, wells, saved labels and remembered matches.
 * The user's own choices win, then remembered matches, then name matches. */
export const useImportResolution = (checks: CheckDetailCheck[], choices: ImportChoices) => {
  const { options, loading: contactsLoading } = useContactOptions();
  const { wells, loading: wellsLoading } = useWellOptions();
  const { types } = useTaxDeductTypes();
  const { findOperatorId, getOwnerId, getWell } = useImportMatches();

  const items = useMemo(() => collectImportItems(checks), [checks]);
  const contactsById = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

  const resolution = useMemo<ImportResolution>(() => {
    const stillExists = (id: string | null) => (id && (options.length === 0 || contactsById.has(id)) ? id : null);
    const nameOf = (id: string | null) => (id ? (contactsById.get(id)?.name ?? null) : null);

    const operators: ResolvedOperator[] = items.operators.map((operator) => {
      const byName = matchContactByName(options, operator.name);
      const pick = firstPick(
        [choices.operators[operator.key], "chosen"],
        [stillExists(findOperatorId(operator.name)), "remembered"],
        [byName.contact?.id, "name"],
      );
      return {
        ...operator,
        ...pick,
        contactName: nameOf(pick.contactId),
        candidates: byName.candidates,
        inactiveOnly: !pick.contactId && byName.inactiveOnly,
      };
    });
    const operatorByKey = new Map(operators.map((o) => [o.key, o]));

    const owners: ResolvedOwner[] = items.owners.map((owner) => {
      const operator = operatorByKey.get(owner.operatorKey);
      const byName = matchContactByName(options, owner.name);
      const pick = firstPick(
        [choices.owners[owner.key], "chosen"],
        [owner.number ? stillExists(getOwnerId(operator?.contactId ?? null, owner.number)) : null, "ownerNumber"],
        [byName.contact?.id, "name"],
      );
      return {
        ...owner,
        ...pick,
        operatorName: operator?.name ?? "",
        contactName: nameOf(pick.contactId),
        candidates: byName.candidates,
        inactiveOnly: !pick.contactId && byName.inactiveOnly,
      };
    });

    const properties: ResolvedProperty[] = items.properties.map((property) => {
      const operator = operatorByKey.get(property.operatorKey);
      const chosen = choices.wells[property.key];
      const remembered = chosen ? null : getWell(operator?.contactId ?? null, property.operatorCc);
      const chosenWell = chosen && chosen !== "later" && chosen !== "none" ? chosen : null;
      const well = chosenWell ?? remembered;
      const later = chosen === "later";
      return {
        ...property,
        operatorName: operator?.name ?? "",
        well,
        later,
        source: chosenWell ? "chosen" : remembered ? "remembered" : null,
        suggestion: well ? null : suggestWell(wells, property.description),
      };
    });

    const products = items.products.map((code) => ({
      code,
      accountId: incomeAccountForProduct(code),
      standard: isStandardProduct(code),
    }));

    const labels: ResolvedLabel[] = items.labels.map((label) => {
      const type = findTaxDeductType(types, label.label, label.kind);
      const chosen = choices.accounts[label.key];
      const accountId = type?.accountId || chosen || null;
      return {
        ...label,
        type,
        accountId,
        source: type?.accountId ? "saved" : chosen ? "chosen" : null,
        suggestionId: suggestAccountForLabel(label.label, label.kind),
      };
    });

    const resolved = { operators, owners, properties, products, labels };
    return { ...resolved, needsMatch: countNeedsMatch(resolved) };
  }, [items, options, contactsById, wells, types, choices, findOperatorId, getOwnerId, getWell]);

  return { resolution, contactsLoading, wellsLoading, wells };
};
