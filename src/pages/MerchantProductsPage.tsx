import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { toast } from "sonner";
import EmptyState from "@/components/shared/EmptyState";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
  is_available: boolean;
}

const MerchantProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", quantity: "", image_url: "" });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await friendlyInvoke<{ merchant?: { id: string } }>("manage-merchant", {
        body: { action: "get_my_merchant" },
      }, "Couldn't load your store. Please try again.");
      if (res?.merchant) {
        setMerchantId(res.merchant.id);
        const { data } = await supabase
          .from("merchant_products")
          .select("*")
          .eq("merchant_id", res.merchant.id)
          .order("created_at", { ascending: false });
        setProducts((data as Product[]) || []);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "", price: "", quantity: "", image_url: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      quantity: String(p.quantity),
      image_url: p.image_url || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error("Name and price required"); return; }
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      quantity: Number(form.quantity) || 0,
      image_url: form.image_url || null,
      merchant_id: merchantId!,
    };

    if (editing) {
      const { error } = await supabase
        .from("merchant_products")
        .update(payload)
        .eq("id", editing.id);
      if (error) { toast.error("Failed to update"); setSaving(false); return; }
      toast.success("Product updated");
    } else {
      const { error } = await supabase
        .from("merchant_products")
        .insert(payload);
      if (error) { toast.error("Failed to add product"); setSaving(false); return; }
      toast.success("Product added");
    }
    setSaving(false);
    setDialogOpen(false);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("merchant_products").delete().eq("id", id);
    toast.success("Product deleted");
    loadProducts();
  };

  const toggleAvailability = async (p: Product) => {
    await supabase
      .from("merchant_products")
      .update({ is_available: !p.is_available })
      .eq("id", p.id);
    loadProducts();
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${merchantId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("merchant-images").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data } = supabase.storage.from("merchant-images").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: data.publicUrl }));
    toast.success("Image uploaded");
  };

  if (loading) {
    return <div className="flex justify-center pt-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="px-5 pt-10 pb-24 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/merchants/dashboard")}><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-bold">Products</h1>
        </div>
        <Button size="sm" className="gap-1" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState icon={Package} title="No products" description="Add products for students to browse and purchase." />
      ) : (
        <div className="space-y-3">
          {products.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4 flex gap-3">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                    <Badge variant={p.is_available ? "default" : "secondary"} className="text-[10px]">
                      {p.is_available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <p className="font-mono-num text-primary font-bold">₦{p.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Qty: {p.quantity}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(p)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Price (₦) *</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
              {form.image_url && <img src={form.image_url} alt="Preview" className="mt-2 h-20 w-20 rounded-lg object-cover" />}
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? "Update" : "Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MerchantProductsPage;
