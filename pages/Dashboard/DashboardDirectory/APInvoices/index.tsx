import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/router";
import DashboardLayout from "../../../../components/DashboardComponents/DashboardLayout";
import { InvoiceList } from "../../../../components/AccountingComponents/APInvoices/InvoiceList";
import { InvoiceEntry } from "../../../../components/AccountingComponents/APInvoices/InvoiceEntry";
import { moduleViewAtom } from "@/atoms/NavigationAtom";

const APInvoices = () => {
  const router = useRouter();
  const [view, setView] = useAtom(moduleViewAtom);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [newEntryKey, setNewEntryKey] = useState(0);

  useEffect(() => () => setView("list"), [setView]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view, invoiceId, newEntryKey]);

  const openInvoice = (id: string) => {
    setInvoiceId(id);
    setView("edit");
  };

  const newInvoice = () => {
    setInvoiceId(null);
    setNewEntryKey((k) => k + 1);
    setView("add");
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen px-6 pb-6 pt-20">
        <div className="max-w-7xl mx-auto">
          {view === "list" && (
            <InvoiceList
              onOpenInvoice={openInvoice}
              onNewInvoice={newInvoice}
              onPayBills={() => router.push("/Dashboard/pay-bills")}
            />
          )}
          {(view === "add" || view === "edit") && (
            <InvoiceEntry
              key={view === "edit" ? `edit-${invoiceId}` : `new-${newEntryKey}`}
              invoiceId={view === "edit" ? invoiceId : null}
              onBack={() => setView("list")}
              onOpenInvoice={openInvoice}
              onNewInvoice={newInvoice}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default APInvoices;
