import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTabNavigator from './BottomTabNavigator';
import CustomDrawerContent from './CustomDrawerContent';


const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        swipeEdgeWidth: 100, // optional, smooth drawer open
      }}
    >
      <Drawer.Screen 
        name="HomeTabs" 
        component={BottomTabNavigator} 
        options={{ drawerItemStyle: { display: 'none' } }} 
      />
    
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;


