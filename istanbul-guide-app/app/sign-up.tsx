import React, { useState } from 'react';
import { Alert, StyleSheet, View, TextInput, Button, Text, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { supabase } from '../services/supabase'; 
import { useTranslation } from "react-i18next";

export default function SignUpScreen() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if (!email || !password || !firstName) {
      Alert.alert(t('signUp.errorTitle'), t('signUp.errorMissing'));
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: firstName, 
        }
      }
    });

    if (error) {
      Alert.alert(t('signUp.signUpError'), error.message);
    } else {
      Alert.alert(t('signUp.successTitle'), t('signUp.successMessage'));
    }
    
    setLoading(false);
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
      <Text style={styles.title}>{t('signUp.title')}</Text>
      
      <TextInput
        style={styles.input}
        placeholder={t('signUp.firstName')}
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder={t('signUp.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder={t('signUp.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Button 
        title={loading ? t('signUp.buttonLoading') : t('signUp.button')} 
        onPress={signUpWithEmail} 
        disabled={loading} 
      />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
});
