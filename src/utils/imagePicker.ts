import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { t } from './i18n';

export interface SelectedImage {
  uri: string;
  width?: number;
  height?: number;
  fileSize?: number;
}

export const ImagePickerHelper = {
  /**
   * Captures a photo using the device camera
   */
  takePhoto: async (): Promise<SelectedImage | null> => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert(t('common.permissionDenied'), t('common.cameraPermissionDesc'));
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
        };
      }
      return null;
    } catch (e) {
      console.error('Error taking photo with camera:', e);
      return null;
    }
  },

  /**
   * Selects a photo from the device library roll
   */
  selectFromGallery: async (): Promise<SelectedImage | null> => {
    try {
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libraryPermission.granted) {
        Alert.alert(t('common.permissionDenied'), t('common.galleryPermissionDesc'));
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
        };
      }
      return null;
    } catch (e) {
      console.error('Error selecting photo from gallery:', e);
      return null;
    }
  },
};
