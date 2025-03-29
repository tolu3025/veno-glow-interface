
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

type ProfileData = {
  full_name?: string;
  avatar_url?: string;
};

interface ProfileEditorProps {
  open: boolean;
  onClose: () => void;
}

const ProfileEditor = ({ open, onClose }: ProfileEditorProps) => {
  const { user, updateUserMetadata } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProfileData>({
    full_name: user?.user_metadata?.full_name || '',
    avatar_url: user?.user_metadata?.avatar_url || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setFormData({
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
      });
    }
  }, [open, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateUserMetadata({
        full_name: formData.full_name,
        avatar_url: formData.avatar_url
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleChange}
                placeholder="https://example.com/avatar.png"
              />
              {formData.avatar_url && (
                <div className="mt-2 flex justify-center">
                  <img 
                    src={formData.avatar_url} 
                    alt="Avatar preview" 
                    className="h-16 w-16 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/150";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-veno-primary hover:bg-veno-primary/90">
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditor;
