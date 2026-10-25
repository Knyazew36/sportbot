import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff8f1',
      }}
    >
      <Text style={{ color: '#0a0a0a', fontSize: 20 }}>Спортбот</Text>
    </View>
  );
}
