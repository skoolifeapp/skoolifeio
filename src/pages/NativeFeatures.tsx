import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, Bell, Smartphone } from "lucide-react";
import { useNativeFeatures } from "@/hooks/useNativeFeatures";

const NativeFeatures = () => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const {
    takePhoto,
    pickPhoto,
    getCurrentPosition,
    requestNotificationPermission,
    lightHaptic,
    mediumHaptic,
    heavyHaptic,
    successHaptic,
    errorHaptic
  } = useNativeFeatures();

  const handleTakePhoto = async () => {
    await lightHaptic();
    const url = await takePhoto();
    if (url) {
      setPhotoUrl(url);
      await successHaptic();
    } else {
      await errorHaptic();
    }
  };

  const handlePickPhoto = async () => {
    await lightHaptic();
    const url = await pickPhoto();
    if (url) {
      setPhotoUrl(url);
      await successHaptic();
    } else {
      await errorHaptic();
    }
  };

  const handleGetLocation = async () => {
    await mediumHaptic();
    const coords = await getCurrentPosition();
    if (coords) {
      setLocation(coords);
      await successHaptic();
    } else {
      await errorHaptic();
    }
  };

  const handleRequestNotifications = async () => {
    await mediumHaptic();
    const granted = await requestNotificationPermission();
    if (granted) {
      await successHaptic();
    } else {
      await errorHaptic();
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Fonctionnalités natives</h1>
        <p className="text-muted-foreground text-sm">
          Testez les capacités natives de votre appareil
        </p>
      </div>

      <div className="space-y-4">
        {/* Camera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Caméra & Photos
            </CardTitle>
            <CardDescription>
              Prenez des photos ou choisissez depuis la galerie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleTakePhoto} className="flex-1">
                Prendre une photo
              </Button>
              <Button onClick={handlePickPhoto} variant="outline" className="flex-1">
                Galerie
              </Button>
            </div>
            {photoUrl && (
              <div className="rounded-lg overflow-hidden border">
                <img src={photoUrl} alt="Photo prise" className="w-full h-auto" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geolocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Géolocalisation
            </CardTitle>
            <CardDescription>
              Obtenez votre position actuelle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGetLocation} className="w-full">
              Obtenir ma position
            </Button>
            {location && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Latitude:</strong> {location.latitude.toFixed(6)}
                </p>
                <p className="text-sm">
                  <strong>Longitude:</strong> {location.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications Push
            </CardTitle>
            <CardDescription>
              Activez les notifications pour vos examens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRequestNotifications} className="w-full">
              Activer les notifications
            </Button>
          </CardContent>
        </Card>

        {/* Haptics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Retour haptique
            </CardTitle>
            <CardDescription>
              Testez les vibrations tactiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={lightHaptic} variant="outline" className="w-full">
              Léger
            </Button>
            <Button onClick={mediumHaptic} variant="outline" className="w-full">
              Moyen
            </Button>
            <Button onClick={heavyHaptic} variant="outline" className="w-full">
              Fort
            </Button>
            <Button onClick={successHaptic} variant="outline" className="w-full">
              Succès ✓
            </Button>
            <Button onClick={errorHaptic} variant="outline" className="w-full">
              Erreur ✗
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NativeFeatures;
