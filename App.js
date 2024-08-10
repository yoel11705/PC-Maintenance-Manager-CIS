import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './screens/WelcomeScreen';
import FormScreen from './screens/FormScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="PC Maintenance Manager CIS">
        <Stack.Screen name="Bienvenido" component={WelcomeScreen} />
        <Stack.Screen name="Form" component={FormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
