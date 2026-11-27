import { useEffect, useState } from "react";
import { GraduationCap, Loader2, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Campus {
  id: string;
  name: string;
  state: string | null;
  aliases: string[];
  is_active: boolean;
  created_at: string;
}

const AdminCampusesPage = () => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Campus | null>(null);
  const [form, setForm] = useState({ name: "", state: "", aliases: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("campuses")
      .select("*")
      .order("name");
    if (error) toast.error(error.message);
    setCampuses((data as Campus[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", state: "", aliases: "" });
    setOpen(true);
  };

  const openEdit = (c: Campus) => {
    setEditing(c);
    setForm({
      name: c.name,
      state: c.state ?? "",
      aliases: (c.aliases ?? []).join(", "),
    });
    setOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) return toast.error("Name is required");
    setSaving(true);
    const aliases = form.aliases
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    const payload = { name, state: form.state.trim() || null, aliases };
    const { error } = editing
      ? await supabase.from("campuses").update(payload).eq("id", editing.id)
      : await supabase.from("campuses").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Campus updated" : "Campus added");
    setOpen(false);
    load();
  };

  const toggleActive = async (c: Campus) => {
    const { error } = await supabase
      .from("campuses")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (c: Campus) => {
    if (!confirm(`Delete campus "${c.name}"? Merchants/errands on this campus will become inaccessible.`))
      return;
    const { error } = await supabase.from("campuses").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Campus deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Campuses</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit campus" : "New campus"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Name (e.g. University of Lagos)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="State (optional)"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
              <Input
                placeholder="Aliases, comma-separated (e.g. UNILAG, Akoka)"
                value={form.aliases}
                onChange={(e) => setForm({ ...form, aliases: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Aliases match how users typed their university on signup. Add common
                short names and misspellings.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving} className="gap-1">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : campuses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No campuses yet. Add one to start scoping merchants and errands.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {campuses.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{c.name}</h3>
                    {c.state && (
                      <Badge variant="outline" className="text-[10px]">
                        {c.state}
                      </Badge>
                    )}
                    {!c.is_active && (
                      <Badge className="text-[10px] bg-muted text-muted-foreground border-0">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {c.aliases?.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      Aliases: {c.aliases.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => remove(c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCampusesPage;
