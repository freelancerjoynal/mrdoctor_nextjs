import { ContactMessagesPanel } from "@/components/admin/ContactMessagesPanel";

/** /admin/messages — contact-form inbox (/contact submissions triage). */
export default function AdminMessagesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">যোগাযোগের বার্তা</h1>
        <p className="mt-1 text-sm text-slate-500">
          /contact ফর্মে আসা মতামত ও প্রশ্ন — পড়ুন, উত্তর দিয়ে স্ট্যাটাস বদলান।
        </p>
      </div>
      <ContactMessagesPanel />
    </div>
  );
}
