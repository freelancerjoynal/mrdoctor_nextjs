const FAQS = [
  {
    q: "সিরিয়াল নিতে কি টাকা লাগে?",
    a: "না। মিস্টার ডাক্তারে অ্যাকাউন্ট খোলা ও সিরিয়াল নেওয়া সম্পূর্ণ ফ্রি। শুধু চেম্বারে ডাক্তারের নির্ধারিত ভিজিট ফি দেবেন।",
  },
  {
    q: "অপেক্ষা না করে কীভাবে সময়মতো ডাক্তার দেখাব?",
    a: "আপনার জেলা ও থানা বেছে ডাক্তার ও সময় ঠিক করুন। নির্ধারিত সময়ের ১০–১৫ মিনিট আগে চেম্বারে পৌঁছালেই হবে — লাইনে দাঁড়ানোর দরকার নেই।",
  },
  {
    q: "হোয়াটসঅ্যাপে কীভাবে সিরিয়াল নেব?",
    a: "ডাক্তার বেছে নেওয়ার পর আপনার সমস্যা, নাম ও এলাকা লিখুন। আমাদের সিস্টেম হোয়াটসঅ্যাপে সিরিয়াল নিশ্চিত করে জানিয়ে দেবে।",
  },
  {
    q: "আমার এলাকায় ডাক্তার না থাকলে কী হবে?",
    a: "উপরের এলাকা তালিকায় শুধু সেই জেলা-থানাই দেখায় যেখানে সক্রিয় ডাক্তার আছেন। নতুন এলাকায় ডাক্তার যোগ হলেই তালিকায় চলে আসে।",
  },
  {
    q: "ডাক্তার হিসেবে কীভাবে যোগ দেব?",
    a: "রেজিস্টার পেজে ‘ডাক্তার’ ভূমিকা বেছে অ্যাকাউন্ট খুলুন। যাচাই শেষ হলে চেম্বার, ফি ও সময়সূচি যোগ করতে পারবেন।",
  },
];

export function Faq() {
  return (
    <section className="bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
          সাধারণ প্রশ্ন
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 sm:text-base">
          মনে যা প্রশ্ন আসে, তার উত্তর এখানেই।
        </p>
        <div className="mt-7 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition open:shadow-lg [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 font-black text-slate-900">
                {f.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm text-indigo-700 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-500">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
