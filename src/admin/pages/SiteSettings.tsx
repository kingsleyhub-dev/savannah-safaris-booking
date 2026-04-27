import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "../lib/audit";

interface Branding { name: string; tagline: string; }

const deploymentVariables = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
];

const SiteSettings = () => {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkedVars, setCheckedVars] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("deployment-env-checklist") ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "branding").maybeSingle().then(({ data }) => {
      setBranding((data?.value as unknown as Branding) ?? { name: "", tagline: "" });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!branding) return;
    if (!branding.name.trim()) { toast.error("Brand name is required"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("site_settings")
      .update({ value: branding as never, updated_by: user?.id })
      .eq("key", "branding");
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Branding updated");
    await logAudit("update", "site_setting", "branding");
  };

  const toggleVariable = (variable: string) => {
    setCheckedVars((current) => {
      const next = current.includes(variable) ? current.filter((item) => item !== variable) : [...current, variable];
      localStorage.setItem("deployment-env-checklist", JSON.stringify(next));
      return next;
    });
  };

  if (loading || !branding) return <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Site-wide branding and configuration.</p>
      </div>

      <Card className="p-6 space-y-5">
        <h2 className="font-display text-lg font-bold">Branding</h2>
        <div className="space-y-2"><Label>Brand name</Label>
          <Input value={branding.name} onChange={(e) => setBranding({ ...branding, name: e.target.value })} maxLength={80} />
        </div>
        <div className="space-y-2"><Label>Tagline</Label>
          <Input value={branding.tagline} onChange={(e) => setBranding({ ...branding, tagline: e.target.value })} maxLength={160} />
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
        </Button>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-display text-lg font-bold">Payments (Phase 2)</h2>
        <p className="text-sm text-muted-foreground">
          Card payments via Stripe, M-Pesa STK Push, and PayPal will be wired up in the next phase.
          The database is already prepared to record transactions.
        </p>
      </Card>

      <Card className="p-6 space-y-5">
        <div>
          <h2 className="font-display text-lg font-bold">Deployment checklist</h2>
          <p className="mt-1 text-sm text-muted-foreground">Confirm these variables are added to your Vercel project before deploying from GitHub.</p>
        </div>
        <div className="space-y-3">
          {deploymentVariables.map((variable) => {
            const checked = checkedVars.includes(variable);
            return (
              <label key={variable} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleVariable(variable)}
                  className="size-4 rounded border-border accent-primary"
                />
                <code className="flex-1 break-all rounded-md bg-muted px-2 py-1 text-xs text-foreground">{variable}</code>
                {checked && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
              </label>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default SiteSettings;
