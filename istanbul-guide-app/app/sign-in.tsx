import { router } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// SUPABASE AUTHENTICATION SERVICE
import { authService } from "../services/auth.services";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

export default function SignInScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignIn = async () => {
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      
    
      await authService.signIn(email, password);
      
      router.replace("/(tabs)/map");
    } catch (error: any) {
      // If it fails, show the Supabase error message
      setErrorMessage(error.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'tr' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
        <Text style={styles.langToggleText}>
          {i18n.language === 'en' ? '🇹🇷 TR' : '🇬🇧 EN'}
        </Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.eyebrow}>{t('signIn.welcomeBack')}</Text>
        <Text style={styles.title}>{t('signIn.title')}</Text>
        <Text style={styles.subtitle}>
          {t('signIn.subtitle')}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('signIn.emailLabel')}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('signIn.emailPlaceholder')}
            placeholderTextColor="#94a3b8"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('signIn.passwordLabel')}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('signIn.passwordPlaceholder')}
            placeholderTextColor="#94a3b8"
            style={styles.input}
            secureTextEntry
            editable={!loading}
          />
        </View>

       
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          activeOpacity={0.9}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>{t('signIn.buttonSignIn')}</Text>
          )}
        </TouchableOpacity>

    
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>{t('signIn.dontHaveAccount')} </Text>
          <TouchableOpacity onPress={() => router.push('/sign-up')} disabled={loading}>
            <Text style={styles.signUpLink}>{t('signIn.linkSignUp')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => router.replace("/(tabs)/map")}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>{t('signIn.buttonSkip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f4",
    padding: 16,
    justifyContent: "center",
  },
  langToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    zIndex: 10,
  },
  langToggleText: {
    fontWeight: '700',
    color: '#155e75',
    fontSize: 14,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  eyebrow: {
    color: "#155e75",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    color: "#102733",
    fontWeight: "800",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: "#66757d",
    marginBottom: 22,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#102733",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#103c4a",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  // YENİ EKLENEN STİLLER
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  signUpText: {
    color: "#66757d",
    fontSize: 14,
    fontWeight: "500",
  },
  signUpLink: {
    color: "#155e75",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#155e75",
    fontSize: 14,
    fontWeight: "700",
  },
});