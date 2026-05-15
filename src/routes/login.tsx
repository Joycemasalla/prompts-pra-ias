import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Entrar — Prompts de Imagem" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        setMsg("Conta criada. Verifique seu e-mail para confirmar e depois faça login.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      }
    } catch (err: any) {
      setMsg(err.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/70 p-8 backdrop-blur"
        style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/30 bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Acesso administrador</h1>
        </div>

        <div className="mt-6 flex gap-2 rounded-lg border border-border bg-background/40 p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={"flex-1 rounded-md py-1.5 text-sm transition " +
                (mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {m === "signin" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background/60 px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Senha</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background/60 px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
          </div>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
            {loading ? "..." : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <Link to="/" className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground">
          ← Voltar para a galeria
        </Link>
      </div>
    </main>
  );
}
