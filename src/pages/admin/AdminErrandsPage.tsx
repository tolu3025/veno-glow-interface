import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ChevronLeft, ChevronRight, ArrowRightLeft, MapPin, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getFunctionErrorMessage, invokeAdminOperation } from "@/lib/admin-functions";

interface Zone {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  radius_meters: number | null;
  is_active: boolean;
}

const AdminErrandsPage = () => {
  const [errands, setErrands] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedErrand, setSelectedErrand] = useState<any>(null);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Zone management state
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [zoneLat, setZoneLat] = useState("");
  const [zoneLng, setZoneLng] = useState("");
  const [zoneRadius, setZoneRadius] = useState("500");
  const [zoneSaving, setZoneSaving] = useState(false);

  const loadErrands = async () => {
    setLoading(true);
    const { data, error } = await invokeAdminOperation({ action: "get_errands", statusFilter, page, limit: 20 });
    if (data?.success) {
      setErrands(data.errands || []);
      setTotal(data.total || 0);
    } else {
      toast.error(getFunctionErrorMessage(data, error, "Failed to load errands"));
    }
    setLoading(false);
  };

  const loadZones = async () => {
    setZonesLoading(true);
    const { data, error } = await supabase
      .from("errand_zones")
      .select("*")
      .order("name");
    if (!error) setZones(data as Zone[]);
    setZonesLoading(false);
  };

  useEffect(() => { loadErrands(); }, [page, statusFilter]);
  useEffect(() => { loadZones(); }, []);

  const resolveErrand = async (action: "resolve_errand_refund" | "resolve_errand_release") => {
    if (!selectedErrand) return;
    setResolving(true);
    const { data, error } = await invokeAdminOperation({ action, errandId: selectedErrand.id });
    setResolving(false);
    if (data?.success) {
      toast.success(action === "resolve_errand_refund" ? "Refunded to requester" : "Released to helper");
      setResolveOpen(false);
      loadErrands();
    } else {
      toast.error(getFunctionErrorMessage(data, error, "Failed"));
    }
  };

  const openAddZone = () => {
    setEditingZone(null);
    setZoneName("");
    setZoneLat("");
    setZoneLng("");
    setZoneRadius("500");
    setZoneDialogOpen(true);
  };

  const openEditZone = (zone: Zone) => {
    setEditingZone(zone);
    setZoneName(zone.name);
    setZoneLat(zone.lat?.toString() ?? "");
    setZoneLng(zone.lng?.toString() ?? "");
    setZoneRadius(zone.radius_meters?.toString() ?? "500");
    setZoneDialogOpen(true);
  };

  const saveZone = async () => {
    if (!zoneName.trim()) {
      toast.error("Zone name is required");
      return;
    }
    setZoneSaving(true);

    const payload: any = {
      name: zoneName.trim(),
      lat: zoneLat ? parseFloat(zoneLat) : null,
      lng: zoneLng ? parseFloat(zoneLng) : null,
      radius_meters: zoneRadius ? parseInt(zoneRadius) : 500,
      is_active: true,
    };

    if (editingZone) {
      const { error } = await supabase
        .from("errand_zones")
        .update(payload)
        .eq("id", editingZone.id);
      if (error) {
        toast.error("Failed to update zone");
      } else {
        toast.success("Zone updated");
      }
    } else {
      const { error } = await supabase
        .from("errand_zones")
        .insert(payload);
      if (error) {
        toast.error("Failed to add zone");
      } else {
        toast.success("Zone added");
      }
    }

    setZoneSaving(false);
    setZoneDialogOpen(false);
    loadZones();
  };

  const deleteZone = async (zoneId: string) => {
    const { error } = await supabase
      .from("errand_zones")
      .delete()
      .eq("id", zoneId);
    if (error) {
      toast.error("Failed to delete zone");
    } else {
      toast.success("Zone deleted");
      loadZones();
    }
  };

  const toggleZoneActive = async (zone: Zone) => {
    const { error } = await supabase
      .from("errand_zones")
      .update({ is_active: !zone.is_active })
      .eq("id", zone.id);
    if (error) {
      toast.error("Failed to update zone");
    } else {
      loadZones();
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="disputes">
        <TabsList>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
        </TabsList>

        <TabsContent value="disputes" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold">Errand Disputes & Management</h2>
              <p className="text-sm text-muted-foreground">{total} total</p>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Urgency</th>
                        <th className="text-right p-3 font-medium text-muted-foreground hidden md:table-cell">Created</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Resolve</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {errands.map((e) => (
                        <tr key={e.id} className="hover:bg-muted/50">
                          <td className="p-3 font-medium">{e.title}</td>
                          <td className="p-3">
                            <Badge variant={e.status === "completed" ? "default" : e.status === "cancelled" ? "destructive" : "secondary"} className="text-xs">
                              {e.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-mono">₦{Number(e.amount).toLocaleString()}</td>
                          <td className="p-3 hidden sm:table-cell text-muted-foreground">{e.urgency}</td>
                          <td className="p-3 text-right hidden md:table-cell text-muted-foreground">
                            {format(new Date(e.created_at), "MMM d")}
                          </td>
                          <td className="p-3 text-right">
                            {(e.status === "accepted" || e.status === "in_progress") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedErrand(e); setResolveOpen(true); }}
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={(page + 1) * 20 >= total} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Errand Zones</h2>
              <p className="text-sm text-muted-foreground">Manage delivery zones and locations</p>
            </div>
            <Button size="sm" className="gap-1" onClick={openAddZone}>
              <Plus className="h-4 w-4" /> Add Zone
            </Button>
          </div>

          {zonesLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : zones.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No zones configured yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {zones.map((z) => (
                <Card key={z.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{z.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {z.lat && z.lng ? `${z.lat}, ${z.lng}` : "No coordinates"}
                          {z.radius_meters ? ` · ${z.radius_meters}m radius` : ""}
                        </p>
                      </div>
                      {!z.is_active && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => toggleZoneActive(z)} title={z.is_active ? "Deactivate" : "Activate"}>
                        <Badge variant={z.is_active ? "default" : "secondary"} className="text-[10px] cursor-pointer">
                          {z.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditZone(z)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteZone(z.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Errand: {selectedErrand?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Amount in escrow: <span className="font-mono font-semibold">₦{selectedErrand ? Number(selectedErrand.amount).toLocaleString() : 0}</span>
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => resolveErrand("resolve_errand_refund")}
                disabled={resolving}
              >
                {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refund Requester"}
              </Button>
              <Button
                className="flex-1"
                onClick={() => resolveErrand("resolve_errand_release")}
                disabled={resolving}
              >
                {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Release to Helper"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Zone Add/Edit Dialog */}
      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingZone ? "Edit Zone" : "Add Zone"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Zone Name *</label>
              <Input value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="e.g. Hostel A" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input value={zoneLat} onChange={(e) => setZoneLat(e.target.value)} placeholder="7.123" type="number" step="any" />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input value={zoneLng} onChange={(e) => setZoneLng(e.target.value)} placeholder="4.567" type="number" step="any" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Radius (meters)</label>
              <Input value={zoneRadius} onChange={(e) => setZoneRadius(e.target.value)} placeholder="500" type="number" />
            </div>
            <Button className="w-full" onClick={saveZone} disabled={zoneSaving}>
              {zoneSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingZone ? "Update Zone" : "Add Zone"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminErrandsPage;
