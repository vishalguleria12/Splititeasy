import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

export function UsernameSetup() {
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Don't show dialog if profile is loading or already has username
  if (profileLoading || profile?.username) {
    return null;
  }

  const validateUsername = (value: string) => {
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 20) {
      return 'Username must be less than 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

  const checkAvailability = async (value: string) => {
    if (!value.trim()) return;
    
    const validationError = validateUsername(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    setChecking(true);
    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', value.toLowerCase())
        .maybeSingle();

      if (queryError) throw queryError;
      
      if (data) {
        setError('Username is already taken');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Error checking username:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ username: username.toLowerCase() });
      toast.success('Username set successfully!');
    } catch (err: any) {
      if (err.code === '23505') {
        setError('Username is already taken');
      } else {
        toast.error('Failed to set username');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Choose Your Username
          </DialogTitle>
          <DialogDescription>
            Pick a unique username so friends can find and invite you to groups. This will be visible to other users instead of your email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                placeholder="yourname"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                onBlur={() => checkAvailability(username)}
                className="pl-8"
                disabled={saving}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              3-20 characters. Letters, numbers, and underscores only.
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!username.trim() || !!error || checking || saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : checking ? (
              'Checking...'
            ) : (
              'Set Username'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
