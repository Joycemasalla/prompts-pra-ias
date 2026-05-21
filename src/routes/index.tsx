import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles, Copy, Eye, HelpCircle, X, Check, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Prompt = {
  id: string;
  title: string;
  image: string;
  category: string;
  prompt: string;
};

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Prompts de Imagem — Galeria de Prompts para IA" },
      {
        name: "description",
        content:
          "Explore prompts criativos para geração de imagens com IA. Retratos editoriais, ensaios fotográficos, anúncios e muito mais.",
      },
    ],
  }),
});

function HomePage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [open, setOpen] = useState<Prompt | null>(null);
  const [howTo, setHowTo] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("prompts")
      .select("id,title,image,category,prompt")
      .order("position", { ascending: true })
      .then(({ data }) => {
        setPrompts((data ?? []) as Prompt[]);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(prompts.map((p) => p.category)))],
    [prompts],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prompts.filter((p) => {
      const inCat = category === "Todos" || p.category === category;
      if (!inCat) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [query, category, prompts]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl border border-primary/30"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Prompts de Imagem
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                Biblioteca curada de prompts profissionais para geração de imagens e marketing com IA.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHowTo(true)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium text-foreground/90 backdrop-blur transition hover:border-primary/40 hover:text-primary"
            >
              <HelpCircle className="h-4 w-4" />
              Como usar
            </button>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium text-foreground/90 backdrop-blur transition hover:border-primary/40 hover:text-primary"
            >
              <Lock className="h-4 w-4" />
              Admin
            </Link>
          </div>
        </header>


        {/* Search */}
        <div className="mt-10">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar prompts..."
              className="h-12 w-full rounded-full border border-border bg-card/60 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Categories */}
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={
                    "rounded-full border px-4 py-1.5 text-sm transition " +
                    (active
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-foreground")
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            {loading ? "Carregando..." : `${filtered.length} prompts encontrados`}
          </p>
        </div>

        {/* Grid */}
        <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const key = p.id;
            return (
              <article
                key={key}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur transition-all duration-300 hover:border-primary/50 hover:-translate-y-1"
                style={{ boxShadow: "var(--shadow-card)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = "var(--shadow-card-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow = "var(--shadow-card)")
                }
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800&q=80&auto=format&fit=crop";
                    }}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
                  <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-primary/30 bg-background/70 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="absolute left-3 top-3 rounded-full border border-primary/40 bg-background/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
                    {p.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h3 className="text-lg font-semibold leading-snug tracking-tight">
                    {p.title}
                  </h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {p.prompt}
                  </p>
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleCopy(p.prompt, key)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary/15 px-3 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/25"
                    >
                      {copiedKey === key ? (
                        <>
                          <Check className="h-4 w-4" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" /> Copiar Prompt
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setOpen(p)}
                      aria-label="Ver detalhes"
                      className="grid h-10 w-10 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>

            );
          })}
        </section>

        {!loading && filtered.length === 0 && (
          <div className="mt-16 text-center text-muted-foreground">
            Nenhum prompt encontrado.
          </div>
        )}

        <footer className="mt-20 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Galeria de prompts para geração de imagens com IA.
        </footer>
      </div>

      {/* Detail modal */}
      {open && (
        <Modal onClose={() => setOpen(null)}>
          <div className="grid gap-0 sm:grid-cols-2">
            <div className="aspect-[3/4] overflow-hidden bg-muted sm:aspect-auto">
              <img
                src={open.image}
                alt={open.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex max-h-[90vh] flex-col p-6 sm:max-h-none">
              <h2 className="text-2xl font-semibold">{open.title}</h2>
              <span className="mt-2 w-fit rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {open.category}
              </span>
              <div className="mt-4 flex-1 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-background/40 p-4 text-sm leading-relaxed text-foreground/90">
                {open.prompt}
              </div>
              <button
                onClick={() => handleCopy(open.prompt, "modal")}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                {copiedKey === "modal" ? (
                  <>
                    <Check className="h-4 w-4" /> Prompt copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copiar Prompt
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* How to use modal */}
      {howTo && (
        <Modal onClose={() => setHowTo(false)}>
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">Como usar os prompts</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Siga os passos abaixo para gerar suas imagens com IA.
            </p>
            <ol className="mt-6 space-y-5">
              {[
                {
                  t: "Acesse uma ferramenta de IA",
                  d: "Use Gemini, ChatGPT ou outra ferramenta de geração de imagem.",
                },
                {
                  t: "Escolha um prompt detalhado",
                  d: "Copie um dos prompts prontos do nosso app.",
                },
                {
                  t: "Cole e anexe sua referência",
                  d: "Anexe imagens do seu rosto para gerar ensaios personalizados.",
                },
                {
                  t: "Faça ajustes se necessário",
                  d: "Refine o prompt até chegar no resultado ideal.",
                },
                {
                  t: "Use onde quiser",
                  d: "Perfeito para capas, redes sociais, anúncios e conteúdos.",
                },
              ].map((s, i) => (
                <li key={i} className="flex gap-4">
                  <div className="grid h-8 w-8 flex-none place-items-center rounded-full border border-primary/40 bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-medium">{s.t}</h3>
                    <p className="text-sm text-muted-foreground">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button
              onClick={() => setHowTo(false)}
              className="mt-8 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Começar a explorar
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground backdrop-blur transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
