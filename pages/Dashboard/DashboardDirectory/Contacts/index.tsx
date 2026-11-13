import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import Form from "../../../../components/FormComponents/Form";
import { ContactList } from "../../../../components/FormComponents/ContactList/ContactList";
import { ContactListToolbar } from "../../../../components/FormComponents/ContactList/ContactListToolbar";
import { useContactListRows } from "../../../../components/FormComponents/ContactList/useContactListRows";
import { useContactListView } from "../../../../components/FormComponents/ContactList/useContactListView";
import { DeleteConfirmModal } from "../../../../components/modals/DeleteConfirmModal";
import {
  MultiAddressField,
  AddressEntry,
} from "../../../../components/FormComponents/MultiAddressField";
import {
  MultiPhoneField,
  PhoneEntry,
} from "../../../../components/FormComponents/MultiPhoneField";
import { ContactAuditLine } from "../../../../components/FormComponents/ContactRecord/ContactAuditLine";
import {
  NotificationRecap,
  RecapLiveValues,
} from "../../../../components/FormComponents/ContactRecord/NotificationRecap";
import { CommentLog } from "../../../../components/FormComponents/ContactRecord/CommentLog";
import { ContactPersonCard } from "../../../../components/FormComponents/ContactRecord/ContactPersonCard";
import { CustomClassificationAddon } from "../../../../components/FormComponents/ContactRecord/CustomClassificationAddon";
import { ContactDocumentsTab } from "../../../../components/FormComponents/ContactRecord/ContactDocumentsTab";
import { LinkedRecordsTab } from "../../../../components/FormComponents/ContactRecord/LinkedRecordsTab";
import { describeAddressChanges } from "../../../../components/FormComponents/ContactRecord/addressChanges";
import { TaxIdInput } from "../../../../components/FormComponents/ContactRecord/TaxIdInput";
import { W9UploadAddon } from "../../../../components/FormComponents/ContactRecord/W9UploadAddon";
import { MinimumPaymentField } from "../../../../components/FormComponents/ContactRecord/MinimumPaymentField";
import { TaxRestrictedBanner } from "../../../../components/FormComponents/ContactRecord/TaxRestrictedBanner";
import { TaxIdAccessLog } from "../../../../components/FormComponents/ContactRecord/TaxIdAccessLog";
import {
  describeTaxChanges,
  taxIdChangeKind,
} from "../../../../components/FormComponents/ContactRecord/taxChanges";
import { VendorInfoBanner } from "../../../../components/FormComponents/ContactRecord/VendorInfoBanner";
import { VendorPayOptions } from "../../../../components/FormComponents/ContactRecord/VendorPayOptions";
import { VendorRemitToSelect } from "../../../../components/FormComponents/ContactRecord/VendorRemitToSelect";
import { VendorSnapshot } from "../../../../components/FormComponents/ContactRecord/VendorSnapshot";
import {
  describeVendorChanges,
  useQueuedVendorDefaultsSave,
  vendorDefaultsPatch,
  vendorDisplayValues,
  vendorFormValues,
} from "../../../../components/FormComponents/ContactRecord/vendorInfo";
import { AccountPicker } from "../../../../components/AccountingComponents/AccountPicker";
import { ContactImport } from "../../../../components/FormComponents/ContactImport/ContactImport";
import { contactsConfig } from "@/config/contactsConfig";
import { useContacts } from "@/hooks/useContacts";
import {
  AutoComment,
  pickMockedFormValues,
  useContactDetails,
  useRecapWithMoneyFacts,
} from "@/hooks/useContactDetails";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useVendorDefaults } from "@/hooks/useVendorDefaults";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { AccountCategory, formatAccountLabel } from "@/types/chartOfAccounts";
import { downloadContactsReport } from "@/lib/contactsReport";
import { useEffect, useMemo, useRef, useState } from "react";
import { NettingEntry } from "../../../../components/FormComponents/NettingTab";
import { useAtom, useSetAtom } from "jotai";
import { userProfileAtom } from "@/atoms/userProfileAtom";
import {
  moduleViewAtom,
  pageHeaderAtom,
  themeAtom,
} from "@/atoms/NavigationAtom";

const DEFAULT_ADDRESSES: AddressEntry[] = [
  {
    type: "Physical",
    address: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
  },
];

const DEFAULT_PHONES: PhoneEntry[] = [{ type: "Home", number: "" }];

const BUILT_IN_CLASSIFICATIONS = (contactsConfig.fields.find(
  (f) => f.id === "classifications",
)?.options ?? []) as string[];

// Read live by the recap (Name & Address) and the Vendor Snapshot.
const LIVE_WATCH_FIELDS = [
  "w9OnFile",
  "send1099",
  "form1099Type",
  "ownerNettingApplies",
  "type1099",
];
type LiveValues = RecapLiveValues & { type1099?: string };

const AP_ACCOUNT_CATEGORIES: AccountCategory[] = ["LIABILITY"];

const NO_ROWS: Record<string, any>[] = [];

// Roles don't exist yet, so every user is treated as having Tax access.
const HAS_TAX_ACCESS = true;

const addressesFromItem = (item: any): AddressEntry[] => {
  const raw = item?._rawData?.addresses;
  if (!raw?.length) return DEFAULT_ADDRESSES;
  const mapped: AddressEntry[] = raw.map((a: any) => ({
    type: a.addressType || "Physical",
    address: a.address?.line1 || "",
    addressLine2: a.address?.line2 || "",
    city: a.address?.city || "",
    state: a.address?.stateCode || "",
    zip: a.address?.postalCode || "",
    _addressId: a.address?.id ? parseInt(a.address.id, 10) : undefined,
    _partyAddressId: a.id ? parseInt(a.id, 10) : undefined,
  }));
  const physical = mapped.find((a) => a.type === "Physical");
  const others = mapped.filter((a) => a.type !== "Physical");
  return physical ? [physical, ...others] : [DEFAULT_ADDRESSES[0], ...mapped];
};

const phonesFromItem = (item: any): PhoneEntry[] => {
  const rawPhones: any[] = item?._rawData?.phones || [];
  if (!rawPhones.length) return DEFAULT_PHONES;
  return rawPhones.map((pp: any) => ({
    type: pp.phoneType || "Home",
    number: pp.phone?.number || "",
    _phoneId: pp.phone?.id ? parseInt(pp.phone.id, 10) : undefined,
    _partyPhoneId: pp.id ? parseInt(pp.id, 10) : undefined,
  }));
};

const Contacts = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [, setPageHeader] = useAtom(pageHeaderAtom);
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const setModuleView = useSetAtom(moduleViewAtom);
  const [addresses, setAddresses] = useState<AddressEntry[]>(DEFAULT_ADDRESSES);
  const [phones, setPhones] = useState<PhoneEntry[]>(DEFAULT_PHONES);
  const [nettingEntries, setNettingEntries] = useState<NettingEntry[]>([]);
  const [showAddressValidation, setShowAddressValidation] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [liveValues, setLiveValues] = useState<LiveValues>({});
  const addressesRef = useRef(addresses);
  const phonesRef = useRef(phones);
  addressesRef.current = addresses;
  phonesRef.current = phones;

  const {
    data,
    view,
    loading,
    searchTerm,
    selectedItem,
    filteredData,
    saveError,
    clearSaveError,
    pendingDeleteItem,
    confirmDelete,
    cancelDelete,
    contacts,
    handleAddContact,
    handleUpdateContact,
    handleDeleteContact,
    setSearchTerm,
    handleAdd: _handleAdd,
    handleEdit: _handleEdit,
    handleSave,
    handleDelete,
    handleCancel,
  } = useContacts({
    config: contactsConfig,
    accountId: userProfile?.account?.id ?? 0,
  });

  const {
    view: listView,
    setView: setListView,
    ready: listViewReady,
  } = useContactListView(userProfile?.user?.id);
  // Only the list needs the per-row extras, so nothing is read for them while a record is open.
  const contactList = useContactListRows({
    rows: view === "list" ? filteredData : NO_ROWS,
    allRows: data,
  });

  const partyKey = selectedItem?.id != null ? String(selectedItem.id) : null;
  const partyId = partyKey ? parseInt(partyKey, 10) : null;
  const {
    details,
    loading: detailsLoading,
    addComment,
    setRecapPrefs,
    addCustomClassification,
    recordSave,
    logTaxIdView,
  } = useContactDetails(partyKey);
  const recap = useRecapWithMoneyFacts(
    partyKey,
    ((selectedItem?.classifications as string[] | undefined) ?? []).includes(
      "REV",
    ),
    details.recap,
  );
  const { attachments } = useFileUpload({
    entityType: "party",
    entityId: partyId,
  });
  const { settings: companySettings } = useCompanySettings();
  // A contact's A/P vendor id is its party id.
  const { defaults: vendorDefaults, loading: vendorDefaultsLoading } =
    useVendorDefaults(partyKey);
  const queueVendorDefaults = useQueuedVendorDefaultsSave();
  const { getAccount } = useChartOfAccounts();
  const accountLabel = (id: string) => {
    const account = getAccount(id);
    return account ? formatAccountLabel(account) : id;
  };

  // Fields the BE can't store yet (MOCKED_FORM_FIELDS) start from the mocked extras, and the vendor
  // tab from the stored vendor defaults. The Form only reads initialData when it mounts, so in edit
  // mode it waits for them (recordLoading).
  const initialFormValues = useMemo<Record<string, any>>(
    () =>
      view === "edit" && selectedItem
        ? {
            ...selectedItem,
            ...pickMockedFormValues(details),
            ...vendorFormValues(vendorDefaults, {
              pay: selectedItem.pay,
              duplicateInvoiceValidation:
                selectedItem.duplicateInvoiceValidation,
              form1099Type: details.form1099Type,
            }),
          }
        : vendorFormValues(vendorDefaults),
    [view, selectedItem, details, vendorDefaults],
  );
  const recordLoading =
    view === "edit" && (detailsLoading || vendorDefaultsLoading);
  // The Form reports its live values from an effect, so until then show the loaded ones rather
  // than "Missing" / "Not set".
  const recapLive = useMemo<LiveValues>(
    () => ({
      ...Object.fromEntries(
        LIVE_WATCH_FIELDS.map((id) => [id, initialFormValues[id]]),
      ),
      ...liveValues,
    }),
    [initialFormValues, liveValues],
  );

  const classificationOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...BUILT_IN_CLASSIFICATIONS,
          ...details.customClassifications,
          ...((selectedItem?.classifications as string[] | undefined) ?? []),
        ]),
      ),
    [details.customClassifications, selectedItem],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    if (view === "edit" && selectedItem) {
      setPageHeader({
        title: "Contacts",
        subtitle: [selectedItem.name, selectedItem.nameId]
          .filter(Boolean)
          .join(" · "),
      });
    } else if (view === "add") {
      setPageHeader({ title: "Contacts", subtitle: "New contact" });
    } else if (view === "import") {
      setPageHeader({ title: "Contacts", subtitle: "Import contacts" });
    } else {
      const count = contactList.rows.length;
      setPageHeader({
        title: "Contacts",
        subtitle: `${count} ${count === 1 ? "contact" : "contacts"}`,
      });
    }
    return () => setPageHeader({});
  }, [view, selectedItem, contactList.rows.length]);

  const handleAdd = () => {
    setAddresses(DEFAULT_ADDRESSES);
    setPhones(DEFAULT_PHONES);
    setNettingEntries([]);
    setShowAddressValidation(false);
    setLiveValues({});
    setActiveTab("basic");
    _handleAdd();
  };

  const handleEdit = (item: any) => {
    setAddresses(addressesFromItem(item));
    setPhones(phonesFromItem(item));
    setNettingEntries([]);
    setShowAddressValidation(false);
    setLiveValues({});
    setActiveTab("basic");
    _handleEdit(item);
  };

  const onSave = async (formData: any) => {
    const anyInvalid = addressesRef.current.some(
      (a) => !a.address || !a.city || !a.state,
    );
    if (anyInvalid) {
      setShowAddressValidation(true);
      setActiveTab("basic");
      return;
    }
    setShowAddressValidation(false);
    const isNew = view === "add";
    const before: Record<string, any> = isNew ? {} : initialFormValues;
    const addressTypes = addressesRef.current.map((a) => a.type);
    const isVendor = (
      (formData.classifications as string[] | undefined) ?? []
    ).includes("VENDOR");
    // A new contact's vendor tab started from the defaults, so only the user's own picks count.
    const vendorBeforeTypes = isNew
      ? addressTypes
      : addressesFromItem(selectedItem).map((a) => a.type);
    const autoComments: AutoComment[] = [
      ...(isNew
        ? []
        : describeAddressChanges(
            addressesFromItem(selectedItem),
            addressesRef.current,
          )),
      ...describeTaxChanges(before, formData),
      ...(isVendor
        ? describeVendorChanges(
            vendorDisplayValues(
              initialFormValues,
              vendorBeforeTypes,
              accountLabel,
            ),
            vendorDisplayValues(formData, addressTypes, accountLabel),
            isNew,
          )
        : []),
    ];
    const taxIdChange = taxIdChangeKind(before.taxId, formData.taxId);
    const savedId = await handleSave(
      formData,
      addressesRef.current,
      phonesRef.current,
    );
    if (savedId != null) {
      if (isVendor)
        queueVendorDefaults(
          String(savedId),
          vendorDefaultsPatch(formData, addressTypes),
        );
      await recordSave(String(savedId), {
        isNew,
        autoComments,
        formValues: pickMockedFormValues(formData),
        taxIdChange,
      });
    }
  };

  const rawParty = selectedItem?._rawData;
  const legacyNote = rawParty?.notes
    ? { text: rawParty.notes, createdAt: rawParty.createdAt }
    : null;

  return (
    <DashboardLayout>
      <div className="min-h-screen px-6 pb-6 pt-20">
        <div className="max-w-7xl mx-auto">
          {view === "list" && listViewReady && (
            <>
              <ContactListToolbar
                view={listView}
                onViewChange={setListView}
                onReport={() => downloadContactsReport(contactList.rows)}
                reportDisabled={loading || contactList.rows.length === 0}
                onAdd={handleAdd}
                extraActions={
                  <Button
                    variant="outline"
                    onClick={() => setModuleView("import")}
                    className={`bg-transparent shadow-none cursor-pointer ${
                      isLight
                        ? "border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
                        : "border-purple-300/30 text-purple-200 hover:bg-purple-500/20 hover:text-white"
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Import from Excel
                  </Button>
                }
                isLight={isLight}
              />
              <ContactList
                view={listView}
                rows={contactList.rows}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filters={contactList.filters}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </>
          )}

          {view === "import" && (
            <ContactImport onClose={() => setModuleView("list")} />
          )}

          {recordLoading && (
            <p className="py-10 text-center text-sm text-white/70">
              Loading contact…
            </p>
          )}

          {(view === "add" || (view === "edit" && !recordLoading)) && (
            <Form
              config={contactsConfig}
              initialData={initialFormValues}
              onSave={onSave}
              onCancel={handleCancel}
              mode={view}
              saveError={saveError}
              onClearSaveError={clearSaveError}
              partyId={partyId ?? undefined}
              contacts={contacts}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
              nettingEntries={nettingEntries}
              onNettingChange={setNettingEntries}
              allParties={filteredData.map((p: any) => ({
                id: String(p.id),
                name: p.name,
              }))}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              headerContent={
                view === "edit" ? (
                  <ContactAuditLine
                    createdBy={details.createdBy}
                    createdAt={rawParty?.createdAt}
                    updatedBy={details.updatedBy}
                    updatedAt={rawParty?.updatedAt}
                  />
                ) : undefined
              }
              dynamicOptions={{ classifications: classificationOptions }}
              fieldAddons={{
                classifications: ({ value, onChange }) => (
                  <CustomClassificationAddon
                    value={value}
                    onChange={onChange}
                    existingOptions={classificationOptions}
                    onCreate={addCustomClassification}
                    isLight={isLight}
                  />
                ),
                w9OnFile: ({ value, onChange }) => (
                  <W9UploadAddon
                    value={value}
                    onChange={onChange}
                    partyId={partyId}
                    isLight={isLight}
                    onUploaded={(fileName) =>
                      addComment(`W-9 uploaded: ${fileName}.`, {
                        auto: true,
                        category: "tax",
                      })
                    }
                  />
                ),
              }}
              fieldRenderers={{
                taxId: ({ value, onChange, onBlur, invalid, values }) => (
                  <TaxIdInput
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    invalid={invalid}
                    taxType={values.taxClassification}
                    canReveal={HAS_TAX_ACCESS}
                    onReveal={partyKey ? logTaxIdView : undefined}
                  />
                ),
                minPaymentAmount: ({ value, onChange, onBlur, invalid }) => (
                  <MinimumPaymentField
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    invalid={invalid}
                    companyDefault={
                      companySettings?.minimumPaymentAmount ?? null
                    }
                    savedValue={
                      view === "edit"
                        ? selectedItem?.minPaymentAmount
                        : undefined
                    }
                  />
                ),
                pay: ({ value, onChange, onBlur }) => (
                  <VendorPayOptions
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    isLight={isLight}
                  />
                ),
                apAccountId: ({ value, onChange, onBlur, invalid }) => (
                  <AccountPicker
                    value={value || null}
                    onChange={(id) => onChange(id)}
                    onBlur={onBlur}
                    invalid={invalid}
                    categories={AP_ACCOUNT_CATEGORIES}
                    aria-label="A/P account"
                  />
                ),
                defaultExpenseAccountId: ({
                  value,
                  onChange,
                  onBlur,
                  invalid,
                }) => (
                  <AccountPicker
                    value={value || null}
                    onChange={(id) => onChange(id)}
                    onClear={() => onChange("")}
                    onBlur={onBlur}
                    invalid={invalid}
                    placeholder="None"
                    aria-label="Default expense account"
                  />
                ),
                remitToAddressType: ({ value, onChange, onBlur, invalid }) => (
                  <VendorRemitToSelect
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    invalid={invalid}
                    addresses={addresses}
                  />
                ),
              }}
              tabIntro={{
                tax: <TaxRestrictedBanner isLight={isLight} />,
                vendor: <VendorInfoBanner isLight={isLight} />,
              }}
              externalErrors={
                showAddressValidation &&
                addresses.some((a) => !a.address || !a.city || !a.state)
                  ? { basic: ["Each address needs a street, city and state."] }
                  : undefined
              }
              watchFields={LIVE_WATCH_FIELDS}
              onFieldsChange={setLiveValues}
              sidePanels={{
                basic: (
                  <>
                    <NotificationRecap
                      recap={partyKey ? recap : null}
                      live={recapLive}
                      prefs={details.recapPrefs}
                      onPrefsChange={setRecapPrefs}
                      isLight={isLight}
                    />
                    <CommentLog
                      comments={details.comments}
                      legacyNote={legacyNote}
                      onAdd={partyKey ? (text) => addComment(text) : undefined}
                    />
                  </>
                ),
                tax: (
                  <>
                    <CommentLog
                      comments={details.comments}
                      legacyNote={legacyNote}
                      onAdd={
                        partyKey
                          ? (text) => addComment(text, { category: "tax" })
                          : undefined
                      }
                      filterCategory="tax"
                    />
                    <TaxIdAccessLog
                      entries={details.taxIdAccessLog}
                      saved={partyKey != null}
                    />
                  </>
                ),
                vendor: (
                  <VendorSnapshot
                    vendorId={partyKey}
                    w9OnFile={liveValues.w9OnFile}
                    send1099={liveValues.send1099}
                    type1099={liveValues.type1099}
                    isLight={isLight}
                  />
                ),
              }}
              tabContent={{
                documents:
                  activeTab === "documents" ? (
                    <ContactDocumentsTab partyId={partyId} isLight={isLight} />
                  ) : null,
                linked: (
                  <LinkedRecordsTab
                    records={details.linkedRecords}
                    saved={partyId != null}
                    isLight={isLight}
                  />
                ),
              }}
              tabBadges={{
                documents: attachments.length > 0 ? attachments.length : null,
              }}
              customContent={{
                addresses: (
                  <MultiAddressField
                    value={addresses}
                    onChange={setAddresses}
                    showValidation={showAddressValidation}
                  />
                ),
                phones: (
                  <div>
                    <Label className="text-white font-semibold flex items-center gap-1 mb-1 text-sm">
                      Phone Numbers
                    </Label>
                    <MultiPhoneField value={phones} onChange={setPhones} />
                  </div>
                ),
                contactPerson: (
                  <ContactPersonCard
                    contacts={contacts}
                    canManage={partyId != null}
                    onManage={() => setActiveTab("contacts")}
                    onUpdateContact={handleUpdateContact}
                    isLight={isLight}
                  />
                ),
                vendorComments: (
                  <CommentLog
                    bare
                    comments={details.comments}
                    legacyNote={legacyNote}
                    onAdd={
                      partyKey
                        ? (text) => addComment(text, { category: "vendor" })
                        : undefined
                    }
                    filterCategory="vendor"
                  />
                ),
              }}
            />
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!pendingDeleteItem}
        itemName={pendingDeleteItem?.name || "this contact"}
        itemType="Contact"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </DashboardLayout>
  );
};

export default Contacts;
