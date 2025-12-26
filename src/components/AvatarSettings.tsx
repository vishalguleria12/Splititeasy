import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Check, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Preset avatars (these will be stored as URLs)
const PRESET_AVATARS = [
  '/avatars/avatar-1.svg',
  '/avatars/avatar-2.svg',
  '/avatars/avatar-3.svg',
  '/avatars/avatar-4.svg',
  '/avatars/avatar-5.svg',
  '/avatars/avatar-6.svg',
];

// Generate preset avatar URLs using UI Avatars
const getPresetAvatarUrl = (index: number) => {
  const colors = ['4f46e5', 'dc2626', '059669', 'd97706', '7c3aed', '0891b2'];
  const names = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Casey'];
  return `https://ui-avatars.com/api/?name=${names[index]}&background=${colors[index]}&color=fff&size=128&bold=true`;
};

export function AvatarSettings() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [uploading, setUploading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache buster to force refresh
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile
      await updateProfile({ avatar_url: avatarUrl });
      toast.success('Avatar updated');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handlePresetSelect = async (index: number) => {
    const presetUrl = getPresetAvatarUrl(index);
    setSelectedPreset(presetUrl);
    try {
      await updateProfile({ avatar_url: presetUrl });
    } catch (error) {
      setSelectedPreset(null);
    }
  };

  const currentAvatar = profile?.avatar_url;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Profile Avatar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-2 border-border">
            <AvatarImage src={currentAvatar || undefined} />
            <AvatarFallback className="text-2xl">
              {profile?.username?.[0]?.toUpperCase() || <User className="w-8 h-8" />}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <p className="font-medium">{profile?.username || 'Your Avatar'}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              Upload Photo
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Preset Avatars */}
        <div className="space-y-3">
          <Label>Or choose a preset avatar</Label>
          <div className="grid grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const presetUrl = getPresetAvatarUrl(index);
              const isSelected = currentAvatar === presetUrl;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePresetSelect(index)}
                  className={cn(
                    'relative rounded-full overflow-hidden transition-all',
                    'hover:ring-2 hover:ring-primary/50',
                    isSelected && 'ring-2 ring-primary'
                  )}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={presetUrl} />
                  </Avatar>
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}