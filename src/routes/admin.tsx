import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Plus, Pencil, Trash2, Upload, LogOut, ArrowLeft, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { claimAdminIfNone } from "@/lib/admin.functions";

type PromptRow = {
  id: string;
  title: string;
  category: string;
  prompt: string;
  image: string;
  position: number;
};

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Prompts de Imagem" }] }),
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const claim = useServerFn(claimAdminIfNone);

  const [items, setItems] = useState<PromptRow[]>([]);
  const [editing, setEditing] = useState<PromptRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  async function load() {
    const { data } = await supabase
      .from("prompts")
      .select("*")
      .order("position", { ascending: true });
    setItems((data ?? []) as PromptRow[]);
  }

  async function handleClaim() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await claim();
      if (r.granted) {
        setMsg("Você agora é admin!");
        router.invalidate();
        window.location.reload();
      } else {
        setMsg("Já existe um administrador. Peça acesso.");
      }
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(p: PromptRow) {
    if (!confirm(`Excluir "${p.title}"?`)) return;
    const { error } = await supabase.from("prompts").delete().eq("id", p.id);
    if (error) alert(error.message);
    else load();
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (loading) {
    return <main className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</main>;
  }
  if (!user) return null;

  if (!isAdmin) {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card/70 p-8 text-center backdrop-blur">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-3 text-xl font-semibold">Você ainda não é admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Se ninguém ainda reivindicou o painel, clique abaixo para se tornar o primeiro administrador.
          </p>
          <button onClick={handleClaim} disabled={busy}
            className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
            {busy ? "..." : "Tornar-me admin"}
          </button>
          {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
          <button onClick={signOut} className="mt-4 text-xs text-muted-foreground hover:text-foreground">Sair</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold sm:text-3xl">Painel admin</h1>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">{items.length} prompts</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditing(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Novo prompt
            </button>
            <button onClick={signOut}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <article key={p.id} className="flex gap-3 rounded-xl border border-border bg-card/60 p-3 backdrop-blur">
              <img src={p.image} alt="" className="h-20 w-20 flex-none rounded-lg object-cover" />
              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="truncate text-sm font-semibold">{p.title}</h3>
                <span className="mt-0.5 w-fit rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{p.category}</span>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.prompt}</p>
                <div className="mt-auto flex gap-1 pt-2">
                  <button onClick={() => { setEditing(p); setShowForm(true); }}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary/40 hover:text-primary">
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                  <button onClick={() => handleDelete(p)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-destructive hover:border-destructive/50">
                    <Trash2 className="h-3 w-3" /> Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {showForm && (
        <PromptForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </main>
  );
}

function PromptForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: PromptRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("prompt-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("prompt-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl) { setErr("Faça upload de uma imagem."); return; }
    setSaving(true);
    setErr(null);
    try {
      if (initial) {
        const { error } = await supabase.from("prompts")
          .update({ title, category, prompt, image: imageUrl })
          .eq("id", initial.id);
        if (error) throw error;
      } else {
        const { data: last } = await supabase
          .from("prompts")
          .select("position")
          .order("position", { ascending: false })
          .limit(1)
          .maybeSingle(); // Usando maybeSingle para evitar erros caso a tabela esteja vazia

        const nextPos = (last?.position ?? 0) + 1;

        const { error } = await supabase.from("prompts")
          .insert({ title, category, prompt, image: imageUrl, position: nextPos });
        if (error) throw error;
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={save}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <button type="button" onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          <h2 className="text-xl font-semibold">{initial ? "Editar prompt" : "Novo prompt"}</h2>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Imagem</label>
              <div className="mt-1 flex items-center gap-3">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-lg border border-dashed border-border text-muted-foreground">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/40 hover:text-primary">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Enviando..." : imageUrl ? "Trocar imagem" : "Enviar imagem"}
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Título</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background/60 px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Categoria</label>
              <input required value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="ex.: Masculino, Feminino, Infantil"
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background/60 px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Prompt</label>
              <textarea required value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={10}
                className="mt-1 w-full rounded-lg border border-border bg-background/60 p-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
            </div>

            {err && <p className="text-sm text-destructive">{err}</p>}

            <button type="submit" disabled={saving || uploading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
