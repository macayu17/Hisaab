import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

const BACKGROUND_DIR = `${FileSystem.documentDirectory ?? ""}backgrounds`;

function extensionFromUri(uri: string) {
  const cleanUri = uri.split("?")[0] ?? uri;
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? "jpg";
}

export async function pickLocalBackground() {
  if (Platform.OS !== "web") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Photo library permission is required to choose a background.");
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.86,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;

  const selectedUri = result.assets[0].uri;
  if (Platform.OS === "web" || !FileSystem.documentDirectory) {
    return selectedUri;
  }

  const directoryInfo = await FileSystem.getInfoAsync(BACKGROUND_DIR);
  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(BACKGROUND_DIR, { intermediates: true });
  }

  const targetUri = `${BACKGROUND_DIR}/hisaab-background-${Date.now()}.${extensionFromUri(selectedUri)}`;
  await FileSystem.copyAsync({ from: selectedUri, to: targetUri });
  return targetUri;
}
