import { useSignUp } from "@clerk/expo";
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

const checkPassword = (v: string): string => {
  if (v.length < 8) return "At least 8 characters required.";
  if (!/[A-Z]/.test(v)) return "Include at least one uppercase letter.";
  if (!/[0-9]/.test(v)) return "Include at least one number.";
  return "";
};

// ─── OTP verification step ────────────────────────────────────────────────────

interface VerifyStepProps {
  email: string;
  code: string;
  setCode: (v: string) => void;
  onVerify: () => Promise<void>;
  onResend: () => Promise<void>;
  loading: boolean;
  error: string;
}

function VerifyStep({
  email,
  code,
  setCode,
  onVerify,
  onResend,
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
            We sent a code to{" "}
            <Text className="font-sans-semibold text-primary">{email}</Text>
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
          accessibilityLabel="Verify email"
        >
          {loading ? (
            <ActivityIndicator color="#fff9e3" />
          ) : (
            <Text className="auth-button-text">Verify email</Text>
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
      </View>
    </View>
  );
}

// ─── Sign-up screen ───────────────────────────────────────────────────────────

export default function SignUp() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showVerify, setShowVerify] = useState(false);

  const [firstNameError, setFirstNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [globalError, setGlobalError] = useState("");

  const loading = fetchStatus === "fetching";

  // ── Helpers ────────────────────────────────────────────────────────────────

  const clearErrors = () => {
    setFirstNameError("");
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
      if (code.includes("first_name") || code.includes("name")) {
        setFirstNameError(msg);
        handled = true;
      } else if (code.includes("email")) {
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
        errors[0]?.longMessage ??
          errors[0]?.message ??
          "Something went wrong. Please try again."
      );
    }
  };

  const handleNavigateHome = () => router.replace("/(tabs)");

  // ── Sign-up submit ─────────────────────────────────────────────────────────

  const handleSignUp = async () => {
    if (!signUp) return;
    clearErrors();

    let valid = true;
    if (!firstName.trim()) {
      setFirstNameError("First name is required.");
      valid = false;
    }
    if (!email.trim()) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }
    const pwMsg = checkPassword(password);
    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (pwMsg) {
      setPasswordError(pwMsg);
      valid = false;
    }
    if (!valid) return;

    try {
      const { error } = await signUp.password({
        emailAddress: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
      });

      if (error) {
        parseClerkError(error);
        return;
      }

      // Send email verification code
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        parseClerkError(sendError);
        return;
      }

      setShowVerify(true);
    } catch (err) {
      parseClerkError(err);
    }
  };

  // ── OTP verify ─────────────────────────────────────────────────────────────

  const handleVerify = async () => {
    if (!signUp) return;
    clearErrors();

    if (code.trim().length < 6) {
      setCodeError("Please enter the full 6-digit code.");
      return;
    }

    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });

      if (error) {
        parseClerkError(error);
        return;
      }

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: () => handleNavigateHome(),
        });
      } else {
        setCodeError("Verification failed. Please check the code and try again.");
      }
    } catch (err) {
      parseClerkError(err);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (!signUp) return;
    clearErrors();
    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) parseClerkError(error);
    } catch (err) {
      parseClerkError(err);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const canSubmit =
    firstName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8;

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
                {showVerify ? "Verify your email" : "Create your account"}
              </Text>
              <Text className="auth-subtitle">
                {showVerify
                  ? "Enter the code we sent to confirm your email."
                  : "Start tracking your subscriptions in seconds."}
              </Text>
            </View>

            {/* Card */}
            {showVerify ? (
              <VerifyStep
                email={email}
                code={code}
                setCode={setCode}
                onVerify={handleVerify}
                onResend={handleResend}
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

                  {/* First name */}
                  <View className="auth-field">
                    <Text className="auth-label">First name</Text>
                    <TextInput
                      className={clsx(
                        "auth-input",
                        firstNameError && "auth-input-error"
                      )}
                      placeholder="Enter your first name"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      value={firstName}
                      onChangeText={(v) => {
                        setFirstName(v);
                        if (firstNameError) setFirstNameError("");
                      }}
                      autoCapitalize="words"
                      autoCorrect={false}
                      autoComplete="given-name"
                      returnKeyType="next"
                    />
                    {!!firstNameError && (
                      <Text className="auth-error">{firstNameError}</Text>
                    )}
                  </View>

                  {/* Email */}
                  <View className="auth-field">
                    <Text className="auth-label">Email</Text>
                    <TextInput
                      className={clsx(
                        "auth-input",
                        emailError && "auth-input-error"
                      )}
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
                      className={clsx(
                        "auth-input",
                        passwordError && "auth-input-error"
                      )}
                      placeholder="Create a password"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      value={password}
                      onChangeText={(v) => {
                        setPassword(v);
                        if (passwordError) setPasswordError("");
                      }}
                      secureTextEntry
                      autoComplete="new-password"
                      returnKeyType="done"
                      onSubmitEditing={handleSignUp}
                    />
                    {!!passwordError ? (
                      <Text className="auth-error">{passwordError}</Text>
                    ) : (
                      <Text className="auth-helper">
                        8+ characters, one uppercase, one number.
                      </Text>
                    )}
                  </View>

                  {/* CTA */}
                  <Pressable
                    className={clsx(
                      "auth-button",
                      (loading || !canSubmit) && "auth-button-disabled"
                    )}
                    onPress={handleSignUp}
                    disabled={loading || !canSubmit}
                    accessibilityRole="button"
                    accessibilityLabel="Create account"
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff9e3" />
                    ) : (
                      <Text className="auth-button-text">Create account</Text>
                    )}
                  </Pressable>

                  {/* Switch to sign-in */}
                  <View className="auth-link-row">
                    <Text className="auth-link-copy">Already have an account?</Text>
                    <Link href="/(auth)/sign-in" asChild>
                      <Pressable accessibilityRole="link">
                        <Text className="auth-link">Sign in</Text>
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
