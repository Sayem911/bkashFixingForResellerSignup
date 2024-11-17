'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Store, Palette, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StoreSetup() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      settings: {
        defaultMarkup: 20,
        minimumMarkup: 10,
        maximumMarkup: 50,
        autoFulfillment: true,
        lowBalanceAlert: 100
      },
      theme: {
        primaryColor: '#6366f1',
        accentColor: '#4f46e5',
        backgroundColor: '#000000'
      }
    });
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
  
      try {
        const response = await fetch('/api/reseller/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
  
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create store');
        }
  
        toast({
          title: 'Success',
          description: 'Your store has been created successfully!',
        });
  
        // Redirect to reseller dashboard after successful store creation
        router.push('/reseller');
        router.refresh(); // Force a refresh to update middleware checks
      } catch (error) {
        console.error('Store setup error:', error);
        setError(error instanceof Error ? error.message : 'Failed to create store');
      } finally {
        setLoading(false);
      }
    
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-4xl p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Set Up Your Store</h1>
            <p className="text-muted-foreground mt-2">
              Configure your reseller store settings to start selling
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList>
                <TabsTrigger value="basic">
                  <Store className="w-4 h-4 mr-2" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="theme">
                  <Palette className="w-4 h-4 mr-2" />
                  Theme
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Gaming Store"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be your store's display name
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Store Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell customers about your store..."
                    className="min-h-[100px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="theme" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={formData.theme.primaryColor}
                        onChange={(e) => setFormData({
                          ...formData,
                          theme: { ...formData.theme, primaryColor: e.target.value }
                        })}
                        className="w-12 p-1 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.theme.primaryColor}
                        onChange={(e) => setFormData({
                          ...formData,
                          theme: { ...formData.theme, primaryColor: e.target.value }
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={formData.theme.accentColor}
                        onChange={(e) => setFormData({
                          ...formData,
                          theme: { ...formData.theme, accentColor: e.target.value }
                        })}
                        className="w-12 p-1 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.theme.accentColor}
                        onChange={(e) => setFormData({
                          ...formData,
                          theme: { ...formData.theme, accentColor: e.target.value }
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={formData.theme.backgroundColor}
                        onChange={(e) => setFormData({
                          ...formData,
                          theme: { ...formData.theme, backgroundColor: e.target.value }
                        })}
                        className="w-12 p-1 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.theme.backgroundColor}
                        onChange={(e) => setFormData({
                          ...formData,
                          theme: { ...formData.theme, backgroundColor: e.target.value }
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultMarkup">Default Markup (%)</Label>
                    <Input
                      id="defaultMarkup"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.settings.defaultMarkup}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          defaultMarkup: parseFloat(e.target.value)
                        }
                      })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Default markup percentage for products
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lowBalanceAlert">Low Balance Alert ($)</Label>
                    <Input
                      id="lowBalanceAlert"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.settings.lowBalanceAlert}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          lowBalanceAlert: parseFloat(e.target.value)
                        }
                      })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Get notified when balance falls below this amount
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minimumMarkup">Minimum Markup (%)</Label>
                    <Input
                      id="minimumMarkup"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.settings.minimumMarkup}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          minimumMarkup: parseFloat(e.target.value)
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maximumMarkup">Maximum Markup (%)</Label>
                    <Input
                      id="maximumMarkup"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.settings.maximumMarkup}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          maximumMarkup: parseFloat(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Store
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}