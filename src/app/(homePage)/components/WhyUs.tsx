import Image from "next/image";
import { CalendarIcon, ChatIcon, ClockIcon, ShieldIcon } from "./HomeIcons";

const POINTS = [
  {
    icon: ChatIcon,
    title: "তাৎক্ষণিক সংযোগ",
    text: "হোয়াটসঅ্যাপে সরাসরি ডাক্তারের সাথে কথা — মাঝখানে কোনো দালাল নেই।",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: ClockIcon,
    title: "সময়মতো ভিজিট",
    text: "আগে থেকে সিরিয়াল নিন, ঠিক সময়ে চেম্বারে যান — ঘণ্টার পর ঘণ্টা বসে থাকা শেষ।",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: ShieldIcon,
    title: "যাচাইকৃত ডাক্তার",
    text: "প্রতিটি ডাক্তারের ডিগ্রি ও পরিচয় যাচাই করে তবেই তালিকায় যোগ করা হয়।",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: CalendarIcon,
    title: "সহজ সিরিয়াল",
    text: "এলাকা বেছে নিন, সময় দেখুন, এক ক্লিকে সিরিয়াল — সব বাংলায়।",
    color: "bg-rose-100 text-rose-700",
  },
];

export function WhyUs() {
  return (
    <section className="bg-gradient-to-b from-white to-indigo-50/60 py-12 sm:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2">
        {/* Image */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-amber-300 via-rose-300 to-fuchsia-300 opacity-50 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl ring-1 ring-white">
            <Image
              src="/images/equipment.jpg"
              alt="আধুনিক চিকিৎসা সরঞ্জাম"
              width={640}
              height={800}
              className="h-auto w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 left-4 right-4 rounded-2xl bg-slate-950/90 px-4 py-3 text-center shadow-xl backdrop-blur sm:left-8 sm:right-8">
            <p className="text-sm font-black text-white">
              ⏱ গড় অপেক্ষা <span className="text-emerald-300">প্রায় শূন্য</span> — আগাম সিরিয়ালে
            </p>
          </div>
        </div>

        {/* Copy */}
        <div>
          <p className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet-700">
            কেন মিস্টার ডাক্তার?
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
            অসুস্থ শরীরে লাইনে দাঁড়ানোর দিন শেষ
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500 sm:text-base">
            আমরা রোগীকে ডাক্তারের সাথে সরাসরি যুক্ত করি। ফলে সিরিয়াল, সময় আর
            ঠিকানা নিয়ে কোনো ঝামেলা থাকে না।
          </p>
          <div className="mt-6 space-y-3">
            {POINTS.map((p) => (
              <div key={p.title} className="flex gap-3.5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${p.color}`}>
                  <p.icon className="h-6 w-6" />
                </span>
                <span>
                  <h3 className="font-black text-slate-900">{p.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{p.text}</p>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
