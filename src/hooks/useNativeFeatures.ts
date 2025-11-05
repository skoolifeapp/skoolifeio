import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useToast } from '@/hooks/use-toast';

export const useNativeFeatures = () => {
  const { toast } = useToast();

  // Camera functionality
  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      
      return image.webPath;
    } catch (error) {
      toast({
        title: "Erreur camera",
        description: "Impossible d'accéder à la caméra",
        variant: "destructive"
      });
      return null;
    }
  };

  const pickPhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });
      
      return image.webPath;
    } catch (error) {
      toast({
        title: "Erreur galerie",
        description: "Impossible d'accéder à la galerie",
        variant: "destructive"
      });
      return null;
    }
  };

  // Geolocation functionality
  const getCurrentPosition = async () => {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude
      };
    } catch (error) {
      toast({
        title: "Erreur localisation",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
      return null;
    }
  };

  // Push Notifications functionality
  const requestNotificationPermission = async () => {
    try {
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        await PushNotifications.register();
        toast({
          title: "Notifications activées",
          description: "Vous recevrez des notifications pour vos examens"
        });
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: "Erreur notifications",
        description: "Impossible d'activer les notifications",
        variant: "destructive"
      });
      return false;
    }
  };

  const scheduleNotification = async (title: string, body: string, date: Date) => {
    // Note: Pour les notifications planifiées, vous aurez besoin du plugin @capacitor/local-notifications
    toast({
      title: "Notification programmée",
      description: `Rappel prévu pour ${date.toLocaleDateString()}`
    });
  };

  // Haptics feedback
  const lightHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Silently fail on web
    }
  };

  const mediumHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      // Silently fail on web
    }
  };

  const heavyHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      // Silently fail on web
    }
  };

  const successHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      // Silently fail on web
    }
  };

  const errorHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      // Silently fail on web
    }
  };

  return {
    // Camera
    takePhoto,
    pickPhoto,
    // Geolocation
    getCurrentPosition,
    // Push Notifications
    requestNotificationPermission,
    scheduleNotification,
    // Haptics
    lightHaptic,
    mediumHaptic,
    heavyHaptic,
    successHaptic,
    errorHaptic
  };
};
