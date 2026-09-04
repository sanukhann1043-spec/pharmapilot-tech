"use client";

import { useEffect, useState } from "react";
import { ArrowUp, FileText, FlaskConical, Globe2, Menu, Plus, Search, ShieldCheck, Sparkles, X } from "lucide-react";

const modules = [
  ["Chat", "Ask anything about medicines, pharmacy and healthcare.", Sparkles],
  ["Medicine Intelligence", "Mechanism, indications, interactions and evidence.", FlaskConical],
  ["Research Assistant", "Research questions with web-backed sources.", Search],
  ["Medical Writing", "Draft evidence-aware medical content and reports.", FileText],
  ["Regulatory AI", "Support for CTD, ICH, CDSCO and regulatory research.", ShieldCheck],
  ["Web Research", "Search the web and keep citations with answers.", Globe2],
];

type Message = { role: "user" | "assistant"; content: string; citations?: { title: string; url: string }[] };

export default function Home() {
  const [sidebar, setSidebar] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => { fetch("/api/auth/session").then(r => r.json()).then(x => setUser(x.user)); }, []);

  async function ask(text = input) {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: prompt }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: prompt, history: next.slice(-10) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessages([...next, { role: "assistant", content: data.answer, citations: data.citations }]);
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: `I couldn't complete that request. ${e.message}` }]);
    } finally { setLoading(false); }
  }

  return <div className="min-h-screen flex bg-[#0b0d10]">
    {sidebar && <aside className="w-[270px] border-r border-white/10 bg-[#101318] p-4 hidden md:flex flex-col">
      <div className="flex items-center gap-3 px-2 py-3"><div className="w-10 h-10 rounded-xl bg-white text-black grid place-items-center font-bold">PP</div><div><div className="font-semibold">PharmaPilot AI</div><div className="text-xs text-white/45">Pharma & Healthcare Copilot</div></div></div>
      <button onClick={() => { setMessages([]); setInput(""); }} className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 hover:bg-white/[.08]"><Plus size={18}/> New chat</button>
      <div className="mt-7 text-xs uppercase tracking-wider text-white/35 px-2">Workspace</div>
      <div className="mt-2 space-y-1">{modules.map(([name, desc, Icon]) => <button key={name as string} onClick={() => setInput(`Help me with ${name}: `)} className="w-full text-left flex gap-3 p-3 rounded-xl hover:bg-white/[.05]"><Icon size={18} className="mt-0.5 text-white/70"/><span><span className="block text-sm">{name as string}</span><span className="block text-xs text-white/35 mt-1 line-clamp-1">{desc as string}</span></span></button>)}</div>
      <div className="mt-auto rounded-xl bg-white/[.04] border border-white/10 p-3 text-xs text-white/45">Informational and research assistance only. Verify critical medical, pharmacy and regulatory information against authoritative sources.</div>
    </aside>}

    <main className="flex-1 min-w-0 flex flex-col">
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-7"><div className="flex items-center gap-3"><button className="p-2 rounded-lg hover:bg-white/5" onClick={() => setSidebar(!sidebar)}><Menu size={20}/></button><span className="md:hidden font-semibold">PharmaPilot AI</span></div><div className="text-sm text-white/55">{user ? `Hi, ${user.name || user.email}` : "AI research workspace"}</div></header>
      <section className="flex-1 overflow-y-auto"><div className="max-w-4xl mx-auto px-5 py-12 md:py-20">
        {messages.length === 0 ? <>
          <div className="text-center"><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs text-white/55"><Sparkles size={14}/> Built for pharma & healthcare</div><h1 className="text-4xl md:text-6xl font-semibold tracking-tight mt-6">What can I help you<br/><span className="text-white/45">research today?</span></h1><p className="max-w-2xl mx-auto mt-5 text-white/50">Ask about medicines, clinical concepts, regulatory affairs, pharmacovigilance, medical writing or research.</p></div>
          <div className="grid sm:grid-cols-2 gap-3 mt-12">{["Explain mechanism of action of metformin", "Compare ACE inhibitors vs ARBs", "Summarize ICH Q10 for a beginner", "Draft a medical literature review outline"].map(q => <button key={q} onClick={() => ask(q)} className="text-left rounded-2xl border border-white/10 bg-white/[.03] p-4 hover:bg-white/[.06]"><div className="text-sm">{q}</div><div className="text-xs text-white/35 mt-2">Ask PharmaPilot</div></button>)}</div>
        </> : <div className="space-y-8">{messages.map((m,i) => <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}><div className={m.role === "user" ? "max-w-[85%] rounded-2xl bg-white text-black px-5 py-3" : "max-w-[92%]"}><div className="whitespace-pre-wrap leading-7">{m.content}</div>{m.citations?.length ? <div className="mt-4 space-y-2">{m.citations.map((c,j) => <a key={j} href={c.url} target="_blank" rel="noreferrer" className="block text-xs text-white/55 hover:text-white underline">[{j+1}] {c.title}</a>)}</div> : null}</div></div>)}{loading && <div className="text-white/45 text-sm">PharmaPilot is thinking…</div>}</div>}
      </div></section>
      <div className="border-t border-white/10 p-4"><div className="max-w-4xl mx-auto"><div className="rounded-2xl border border-white/10 bg-[#12151a] flex items-end p-2"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }} rows={1} placeholder="Message PharmaPilot AI…" className="flex-1 resize-none bg-transparent outline-none px-3 py-2 min-h-11 max-h-40"/><button onClick={() => ask()} disabled={!input.trim() || loading} className="w-10 h-10 rounded-xl bg-white text-black grid place-items-center disabled:opacity-30"><ArrowUp size={19}/></button></div><div className="text-center text-[11px] text-white/30 mt-2">PharmaPilot AI can make mistakes. Verify important information with authoritative sources.</div></div></div>
    </main>
  </div>;
}
