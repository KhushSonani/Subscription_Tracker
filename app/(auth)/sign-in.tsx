import { useSignIn } from "@clerk/expo";
import clsx from "clsx";
import { Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

// ─── Validation ───────────────────────────────────────────────────────────────

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// ─── OTP step (Client Trust / second factor) ─────────────────────────────────

interface VerifyStepProps {
  code: string;
  setCode: (v: string) => void;
  onVerify: () => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  loading: boolean;
  error: string;
}

function VerifyStep({
  code,
  setCode,
  onVerify,
  onResend,
  onBack,
  loading,
  error,
}: VerifyStepProps) {
  return (
    <View className="auth-card">
      <View className="auth-form">
        <View className="auth-field">
          <Text className="auth-label">Verification code</Text>
          <TextInput
            className={clsx("auth-input", error && "auth-input-error")}
            placeholder="Enter the 6-digit code"
            placeholderTextColor="rgba(0,0,0,0.35)"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            autoComplete="one-time-code"
          />
          {!!error && <Text className="auth-error">{error}</Text>}
          <Text className="auth-helper">
            We sent a verification code to your email.
          </Text>
        </View>

        <Pressable
          className={clsx(
            "auth-button",
            (loading || code.length < 6) && "auth-button-disabled"
          )}
          onPress={onVerify}
          disabled={loading || code.length < 6}
          accessibilityRole="button"
          accessibilityLabel="Verify and sign in"
        >
          {loading ? (
            <ActivityIndicator color="#fff9e3" />
          ) : (
            <Text className="auth-button-text">Verify &amp; sign in</Text>
          )}
        </Pressable>

        <Pressable
          className="auth-secondary-button"
          onPress={onResend}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Resend code"
        >
          <Text className="auth-secondary-button-text">Resend code</Text>
        </Pressable>

        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          className="mt-1 items-center"
        >
          <Text className="auth-link-copy">← Back to sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Sign-in screen ───────────────────────────────────────────────────────────

export default function SignIn() {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showVerify, setShowVerify] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [globalError, setGlobalError] = useState("");

  const loading = fetchStatus === "fetching";

  // ── Helpers ────────────────────────────────────────────────────────────────

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
    setCodeError("");
    setGlobalError("");
  };

  const parseClerkError = (err: unknown) => {
    const clerkErr = err as { errors?: Array<{ code?: string; longMessage?: string; message?: string }> };
    const errors = clerkErr?.errors ?? [];
    let handled = false;
    for (const e of errors) {
      const code = e.code ?? "";
      const msg = e.longMessage ?? e.message ?? "Something went wrong.";
      if (code.includes("identifier") || code.includes("email")) {
        setEmailError(msg);
        handled = true;
      } else if (code.includes("password")) {
        setPasswordError(msg);
        handled = true;
      } else if (code.includes("code") || code.includes("verification")) {
        setCodeError(msg);
        handled = true;
      }
    }
    if (!handled) {
      setGlobalError(
        errors[0]?.longMessage ?? errors[0]?.message ?? "Something went wrong. Please try again."
      );
    }
  };

  const handleNavigateHome = () => router.replace("/(tabs)");

  // ── Sign-in submit ─────────────────────────────────────────────────────────

  const handleSignIn = async () => {
    if (!signIn) return;
    clearErrors();

    let valid = true;
    if (!email.trim()) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }
    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    }
    if (!valid) return;

    try {
      const { error } = await signIn.password({
        emailAddress: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        parseClerkError(error);
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: () => handleNavigateHome(),
        });
      } else if (signIn.status === "needs_second_factor") {
        // Client Trust — send email code for MFA
        const { error: mfaError } = await signIn.mfa.sendEmailCode();
        if (mfaError) {
          parseClerkError(mfaError);
          return;
        }
        setShowVerify(true);
      } else {
        setGlobalError("Sign-in could not be completed. Please try again.");
      }
    } catch (err) {
      parseClerkError(err);
    }
  };

  // ── OTP verify ─────────────────────────────────────────────────────────────

  const handleVerify = async () => {
    if (!signIn) return;
    clearErrors();

    if (code.trim().length < 6) {
      setCodeError("Please enter the full 6-digit code.");
      return;
    }

    try {
      const { error } = await signIn.mfa.verifyEmailCode({
        code: code.trim(),
      });

      if (error) {
        parseClerkError(error);
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: () => handleNavigateHome(),
        });
      } else {
        setCodeError("Verification failed. Please try again.");
      }
    } catch (err) {
      parseClerkError(err);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (!signIn) return;
    clearErrors();
    try {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) parseClerkError(error);
    } catch (err) {
      parseClerkError(err);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="auth-screen"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-content">
            {/* Brand */}
            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <View className="auth-logo-mark">
                  <Text className="auth-logo-mark-text">R</Text>
                </View>
                <View>
                  <Text className="auth-wordmark">Recurly</Text>
                  <Text className="auth-wordmark-sub">Smart Billing</Text>
                </View>
              </View>

              <Text className="auth-title">
                {showVerify ? "Check your email" : "Welcome back"}
              </Text>
              <Text className="auth-subtitle">
                {showVerify
                  ? "Enter the code we sent to verify your identity."
                  : "Sign in to continue managing your subscriptions."}
              </Text>
            </View>

            {/* Card */}
            {showVerify ? (
              <VerifyStep
                code={code}
                setCode={setCode}
                onVerify={handleVerify}
                onResend={handleResend}
                onBack={() => {
                  setShowVerify(false);
                  setCode("");
                  clearErrors();
                }}
                loading={loading}
                error={codeError || globalError}
              />
            ) : (
              <View className="auth-card">
                <View className="auth-form">
                  {/* Global error banner */}
                  {!!globalError && (
                    <View className="rounded-2xl bg-destructive/10 px-4 py-3">
                      <Text className="text-sm font-sans-medium text-destructive">
                        {globalError}
                      </Text>
                    </View>
                  )}

                  {/* Email */}
                  <View className="auth-field">
                    <Text className="auth-label">Email</Text>
                    <TextInput
                      className={clsx("auth-input", emailError && "auth-input-error")}
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      value={email}
                      onChangeText={(v) => {
                        setEmail(v);
                        if (emailError) setEmailError("");
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      returnKeyType="next"
                    />
                    {!!emailError && (
                      <Text className="auth-error">{emailError}</Text>
                    )}
                  </View>

                  {/* Password */}
                  <View className="auth-field">
                    <Text className="auth-label">Password</Text>
                    <TextInput
                      className={clsx("auth-input", passwordError && "auth-input-error")}
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      value={password}
                      onChangeText={(v) => {
                        setPassword(v);
                        if (passwordError) setPasswordError("");
                      }}
                      secureTextEntry
                      autoComplete="current-password"
                      returnKeyType="done"
                      onSubmitEditing={handleSignIn}
                    />
                    {!!passwordError && (
                      <Text className="auth-error">{passwordError}</Text>
                    )}
                  </View>

                  {/* CTA */}
                  <Pressable
                    className={clsx(
                      "auth-button",
                      (loading || !email || !password) && "auth-button-disabled"
                    )}
                    onPress={handleSignIn}
                    disabled={loading || !email || !password}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in"
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff9e3" />
                    ) : (
                      <Text className="auth-button-text">Sign in</Text>
                    )}
                  </Pressable>

                  {/* Switch to sign-up */}
                  <View className="auth-link-row">
                    <Text className="auth-link-copy">New to Recurly?</Text>
                    <Link href="/(auth)/sign-up" asChild>
                      <Pressable accessibilityRole="link">
                        <Text className="auth-link">Create an account</Text>
                      </Pressable>
                    </Link>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
