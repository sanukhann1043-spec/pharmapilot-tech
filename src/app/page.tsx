"use client";

import { useEffect, useState } from "react";
import {
  ArrowUp,
  FileText,
  FlaskConical,
  Globe2,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const modules = [
  {
    name: "Chat",
    description: "Ask anything about medicines, pharmacy and healthcare.",
    icon: Sparkles,
  },
  {
    name: "Medicine Intelligence",
    description: "Mechanism, indications, interactions and evidence.",
    icon: FlaskConical,
  },
  {
    name: "Research Assistant",
    description: "Research questions with web-backed sources.",
    icon: Search,
  },
  {
    name: "Medical Writing",
    description: "Draft evidence-aware medical content and reports.",
    icon: FileText,
  },
  {
    name: "Regulatory AI",
    description: "Support for CTD, ICH, CDSCO and regulatory research.",
    icon: ShieldCheck,
  },
  {
    name: "Web Research",
    description: "Search the web and keep citations with answers.",
    icon: Globe2,
  },
];

type Citation = {
  title: string;
  url: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function ask(question = input) {
    const prompt = question.trim();

    if (!prompt || loading) return;

    setInput("");

    const userMessage: Message = {
      role: "user",
      content: prompt,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          history: nextMessages.slice(-10),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        citations: data.citations ?? [],
      };

      setMessages([...nextMessages, assistantMessage]);
    } catch (error: any) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "I couldn't complete that request. " +
            (error?.message || "Please try again."),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    setMessages([]);
    setInput("");
  }

  return (
    <div className="min-h-screen flex bg-[#0b0d10] text-white">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r border-white/10 bg-[#101318] p-4">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white font-bold text-black">
              PP
            </div>

            <div>
              <div className="font-semibold">PharmaPilot AI</div>
              <div className="text-xs text-white/45">
                Pharma & Healthcare Copilot
              </div>
            </div>
          </div>

          <button
            onClick={newChat}
            className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm transition hover:bg-white/[0.08]"
          >
            <Plus size={18} />
            New chat
          </button>

          <div className="mt-7 px-2 text-xs uppercase tracking-wider text-white/35">
            Workspace
          </div>

          <div className="mt-2 space-y-1">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <button
                  key={module.name}
                  onClick={() => setInput(`Help me with ${module.name}: `)}
                  className="flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-white/[0.05]"
                >
                  <Icon
                    size={18}
                    className="mt-0.5 shrink-0 text-white/70"
                  />

                  <span>
                    <span className="block text-sm">{module.name}</span>

                    <span className="mt-1 block line-clamp-2 text-xs text-white/35">
                      {module.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-white/45">
            Informational and research assistance only. Verify critical
            medical, pharmacy and regulatory information against authoritative
            sources.
          </div>
        </aside>
      )}

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-4 md:px-7">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 transition hover:bg-white/5"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>

            <span className="font-semibold md:hidden">PharmaPilot AI</span>
          </div>

          <div className="text-sm text-white/55">
            {user
              ? `Hi, ${user.name || user.email}`
              : "AI research workspace"}
          </div>
        </header>

        {/* Messages */}
        <section className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-5 py-12 md:py-20">
            {messages.length === 0 ? (
              <>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/55">
                    <Sparkles size={14} />
                    Built for pharma & healthcare
                  </div>

                  <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
                    What can I help you
                    <br />
                    <span className="text-white/45">
                      research today?
                    </span>
                  </h1>

                  <p className="mx-auto mt-5 max-w-2xl text-white/50">
                    Ask about medicines, clinical concepts, regulatory affairs,
                    pharmacovigilance, medical writing or research.
                  </p>
                </div>

                <div className="mt-12 grid gap-3 sm:grid-cols-2">
                  {[
                    "Explain mechanism of action of metformin",
                    "Compare ACE inhibitors vs ARBs",
                    "Summarize ICH Q10 for a beginner",
                    "Draft a medical literature review outline",
                  ].map((question) => (
                    <button
                      key={question}
                      onClick={() => ask(question)}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.06]"
                    >
                      <div className="text-sm">{question}</div>

                      <div className="mt-2 text-xs text-white/35">
                        Ask PharmaPilot
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-8">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={
                      message.role === "user"
                        ? "flex justify-end"
                        : "flex justify-start"
                    }
                  >
                    <div
                      className={
                        message.role === "user"
                          ? "max-w-[85%] rounded-2xl bg-white px-5 py-3 text-black"
                          : "max-w-[92%]"
                      }
                    >
                      <div className="whitespace-pre-wrap leading-7">
                        {message.content}
                      </div>

                      {message.citations &&
                        message.citations.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {message.citations.map((citation, citationIndex) => (
                              <a
                                key={citationIndex}
                                href={citation.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-xs text-white/55 underline hover:text-white"
                              >
                                [{citationIndex + 1}] {citation.title}
                              </a>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="text-sm text-white/45">
                    PharmaPilot is thinking…
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Input */}
        <div className="border-t border-white/10 p-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-end rounded-2xl border border-white/10 bg-[#12151a] p-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    ask();
                  }
                }}
                rows={1}
                placeholder="Message PharmaPilot AI…"
                className="min-h-11 max-h-40 flex-1 resize-none bg-transparent px-3 py-2 outline-none"
              />

              <button
                onClick={() => ask()}
                disabled={!input.trim() || loading}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white text-black disabled:opacity-30"
                aria-label="Send message"
              >
                <ArrowUp size={19} />
              </button>
            </div>

            <div className="mt-2 text-center text-[11px] text-white/30">
              PharmaPilot AI can make mistakes. Verify important information
              with authoritative sources.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
      }
