import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, Eye, CheckCircle, XCircle, Ban, UserCheck, ChevronLeft, ChevronRight, Crown, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getFunctionErrorMessage, invokeAdminOperation } from "@/lib/admin-functions";

interface UserProfile {
  id: string;
  full_name: string;
  matric_number: string;
  university: string;
  phone_number: string;
  kyc_status: string;
  kyc_level: number;
  is_suspended: boolean;
  suspended_reason: string | null;
  created_at: string;
}

interface UserDetail {
  profile: UserProfile;
  wallet: { balance: number } | null;
  transactions: any[];
  kycDocuments: any[];
  roles: string[];
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [kycFilter, setKycFilter] = useState("all");
  const [universitySearch, setUniversitySearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; label: string } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await invokeAdminOperation({ action: "get_users", kycFilter, universityFilter: universitySearch, page, limit: 20 });
    if (data?.success) {
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } else {
      toast.error(getFunctionErrorMessage(data, error, "Failed to load users"));
    }
    setLoading(false);
  }, [kycFilter, universitySearch, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const viewUser = async (userId: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    const { data, error } = await invokeAdminOperation({ action: "get_user_detail", userId });
    if (data?.success) setSelectedUser(data as UserDetail);
    else toast.error(getFunctionErrorMessage(data, error, "Failed to load user"));
    setDetailLoading(false);
  };

  const adminAction = async (action: string, params: any) => {
    setActionLoading(action);
    const { data, error } = await invokeAdminOperation({ action, ...params });
    setActionLoading("");
    if (data?.success) {
      toast.success("Action completed");
      loadUsers();
      if (selectedUser) viewUser(selectedUser.profile.id);
    } else {
      toast.error(getFunctionErrorMessage(data, error, "Action failed"));
    }
  };

  const kycBadgeVariant = (status: string) => {
    switch (status) {
      case "verified": return "default";
      case "submitted": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by university..."
            value={universitySearch}
            onChange={(e) => { setUniversitySearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={kycFilter} onValueChange={(v) => { setKycFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="KYC Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
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
                    <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Matric</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">University</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">KYC</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/50">
                      <td className="p-3 font-medium">{u.full_name}</td>
                      <td className="p-3 hidden sm:table-cell text-muted-foreground">{u.matric_number}</td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{u.university}</td>
                      <td className="p-3">
                        <Badge variant={kycBadgeVariant(u.kyc_status)} className="text-xs">{u.kyc_status}</Badge>
                      </td>
                      <td className="p-3">
                        {u.is_suspended ? (
                          <Badge variant="destructive" className="text-xs">Suspended</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Active</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => viewUser(u.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} users total</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={(page + 1) * 20 >= total} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Detail</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : selectedUser ? (
            <div className="space-y-4">
              {/* Profile info */}
              <div className="space-y-2">
                <p className="font-semibold">{selectedUser.profile.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.profile.matric_number} · {selectedUser.profile.university}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.profile.phone_number}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={kycBadgeVariant(selectedUser.profile.kyc_status)}>KYC: {selectedUser.profile.kyc_status}</Badge>
                  <Badge variant="outline">Level {selectedUser.profile.kyc_level}</Badge>
                  {selectedUser.profile.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                  {selectedUser.roles?.includes("organizer") && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Organizer</Badge>}
                </div>
                {selectedUser.wallet && (
                  <p className="text-sm">Balance: <span className="font-mono-num font-semibold">₦{Number(selectedUser.wallet.balance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span></p>
                )}
              </div>

              {/* KYC Documents */}
              {selectedUser.kycDocuments && selectedUser.kycDocuments.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">KYC Documents</p>
                  {selectedUser.kycDocuments.map((doc: any) => (
                    <div key={doc.id} className="space-y-2 bg-muted p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-medium">Level {doc.kyc_level || "?"} — {doc.verification_status}</p>
                      </div>
                      {doc.nin_number && (
                        <p className="text-xs">NIN: <span className="font-mono">{doc.nin_number}</span></p>
                      )}
                      {doc.kyc_level === 1 && doc.nin_number && !doc.nin_image_url && (
                        <p className="text-xs text-muted-foreground">No slip attached (NIN number only)</p>
                      )}
                      {doc.extracted_name && (
                        <p className="text-xs">Extracted Name: <strong>{doc.extracted_name}</strong> {doc.name_match ? "✅" : "❌"}</p>
                      )}
                      {doc.nin_image_url && (
                        <div>
                          <p className="text-xs font-medium mb-1">NIN Document</p>
                          <button onClick={() => setLightboxImage({ url: doc.nin_image_url, label: "NIN Document" })} className="relative group rounded-lg overflow-hidden border border-border">
                            <img src={doc.nin_image_url} alt="NIN" className="rounded-lg max-h-40 object-contain" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        </div>
                      )}
                      {doc.id_card_image_url && (
                        <div>
                          <p className="text-xs font-medium mb-1">ID Card</p>
                          <button onClick={() => setLightboxImage({ url: doc.id_card_image_url, label: "ID Card" })} className="relative group rounded-lg overflow-hidden border border-border">
                            <img src={doc.id_card_image_url} alt="ID Card" className="rounded-lg max-h-40 object-contain" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        </div>
                      )}
                      {doc.selfie_image_url && (
                        <div>
                          <p className="text-xs font-medium mb-1">Selfie</p>
                          <button onClick={() => setLightboxImage({ url: doc.selfie_image_url, label: "Selfie" })} className="relative group rounded-lg overflow-hidden border border-border">
                            <img src={doc.selfie_image_url} alt="Selfie" className="rounded-lg max-h-40 object-contain" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        </div>
                      )}
                      {doc.face_match_confidence != null && (
                        <p className="text-xs">Face Match: <span className="font-mono-num">{doc.face_match_confidence}%</span></p>
                      )}
                      {doc.address_text && (
                        <div>
                          <p className="text-xs font-medium mb-1">Address</p>
                          <p className="text-xs text-muted-foreground">{doc.address_text}</p>
                        </div>
                      )}
                      {doc.address_proof_url && (
                        <div>
                          <p className="text-xs font-medium mb-1">Address Proof</p>
                          <button onClick={() => setLightboxImage({ url: doc.address_proof_url, label: "Address Proof" })} className="relative group rounded-lg overflow-hidden border border-border">
                            <img src={doc.address_proof_url} alt="Address Proof" className="rounded-lg max-h-40 object-contain" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* KYC Actions */}
              {(selectedUser.profile.kyc_status === "submitted" || selectedUser.profile.kyc_status === "pending") && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Approve to KYC Level:</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((lvl) => (
                      <Button
                        key={lvl}
                        size="sm"
                        variant={lvl <= selectedUser.profile.kyc_level ? "outline" : "default"}
                        className="flex-1 gap-1"
                        disabled={!!actionLoading || lvl <= selectedUser.profile.kyc_level}
                        onClick={() => adminAction("approve_kyc", { userId: selectedUser.profile.id, level: lvl })}
                      >
                        {actionLoading === "approve_kyc" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        L{lvl}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full gap-1"
                      onClick={() => adminAction("reject_kyc", { userId: selectedUser.profile.id, reason: rejectReason })}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === "reject_kyc" ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                      Reject KYC
                    </Button>
                  </div>
                  <Input
                    placeholder="Rejection reason (optional)..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="text-sm"
                  />
                </div>
              )}

              {/* Organizer Role */}
              <div className="space-y-2">
                {selectedUser.roles?.includes("organizer") ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1"
                    onClick={() => adminAction("remove_organizer", { userId: selectedUser.profile.id })}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === "remove_organizer" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crown className="h-3 w-3" />}
                    Remove Organizer Role
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full gap-1"
                    onClick={() => adminAction("make_organizer", { userId: selectedUser.profile.id })}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === "make_organizer" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crown className="h-3 w-3" />}
                    Make Organizer
                  </Button>
                )}
              </div>

              {/* Suspend / Activate */}
              <div className="space-y-2">
                {selectedUser.profile.is_suspended ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1"
                    onClick={() => adminAction("activate_user", { userId: selectedUser.profile.id })}
                    disabled={!!actionLoading}
                  >
                    <UserCheck className="h-3 w-3" /> Activate Account
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Suspension reason..."
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full gap-1"
                      onClick={() => adminAction("suspend_user", { userId: selectedUser.profile.id, reason: suspendReason })}
                      disabled={!!actionLoading || !suspendReason}
                    >
                      <Ban className="h-3 w-3" /> Suspend Account
                    </Button>
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              {selectedUser.transactions && selectedUser.transactions.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Recent Transactions</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {selectedUser.transactions.map((tx: any) => (
                      <div key={tx.id} className="flex justify-between items-center text-xs p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{tx.type}</span>
                          <span className="text-muted-foreground ml-2">{format(new Date(tx.created_at), "MMM d, h:mm a")}</span>
                        </div>
                        <span className="font-mono-num font-semibold">₦{Number(tx.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Full-size Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 rounded-full p-2 backdrop-blur-sm"
          >
            <X className="h-6 w-6" />
          </button>
          <p className="absolute top-4 left-4 text-white/80 text-sm font-medium">{lightboxImage.label}</p>
          <img
            src={lightboxImage.url}
            alt={lightboxImage.label}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
