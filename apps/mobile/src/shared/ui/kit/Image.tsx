import { Image as ExpoImage } from 'expo-image';
import { withUniwind } from 'uniwind';

// Картинка с диск-кэшем (expo-image) и className — это не компонент react-native, поэтому через withUniwind
export const Image = withUniwind(ExpoImage);
