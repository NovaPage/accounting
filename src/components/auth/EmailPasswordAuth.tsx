"use client";

/**
 * Email & Password authentication (login + sign-up).
 * - After successful sign-up: switch to "login" tab, prefill email, focus password.
 * - Uses Supabase: signInWithPassword / signUp (with emailRedirectTo).
 * - Spanish UI; English code/comments. Strict TS (no any).
 */
import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function buildCallbackUrl(nextUrl: string): string {
  const envBase = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const browserBase = typeof window !== "undefined" ? window.location.origin : "";
  const base = envBase || browserBase;
  const u = new URL("/api/auth/callback", base);
  if (nextUrl) u.searchParams.set("next", nextUrl);
  return u.toString();
}

/** Schemas */
const signInSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type SignInValues = z.infer<typeof signInSchema>;

const signUpSchema = z
  .object({
    email: z.string().email("Correo inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
type SignUpValues = z.infer<typeof signUpSchema>;

export interface EmailPasswordAuthProps {
  nextUrl?: string;
}

export default function EmailPasswordAuth({ nextUrl = "/dashboard" }: EmailPasswordAuthProps) {
  const router = useRouter();
  const supabase = getBrowserClient();
  const [serverMsg, setServerMsg] = useState<string>("");
  const [active, setActive] = useState<"login" | "signup">("login");

  const emailRedirectTo = useMemo(() => buildCallbackUrl(nextUrl), [nextUrl]);

  /** Sign-in form */
  const {
    register: registerIn,
    handleSubmit: handleSubmitIn,
    formState: { errors: errorsIn, isSubmitting: submittingIn },
    setValue: setValueIn,
    setFocus: setFocusIn,
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmitSignIn = useCallback(
    async (values: SignInValues): Promise<void> => {
      setServerMsg("");
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        setServerMsg(error.message || "No se pudo iniciar sesión.");
        return;
      }
      router.push(nextUrl);
    },
    [router, nextUrl, supabase]
  );

  /** Sign-up form */
  const {
    register: registerUp,
    handleSubmit: handleSubmitUp,
    formState: { errors: errorsUp, isSubmitting: submittingUp },
    reset: resetUp,
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const onSubmitSignUp = useCallback(
    async (values: SignUpValues): Promise<void> => {
      setServerMsg("");
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo },
      });
      if (error) {
        setServerMsg(error.message || "No se pudo crear la cuenta.");
        return;
      }

      // Success: switch to login, prefill email, focus password, show guidance
      resetUp();
      setActive("login");
      setValueIn("email", values.email, { shouldValidate: true });
      setFocusIn("password");
      setServerMsg(
        "Te enviamos un correo de confirmación. Revisa tu bandeja y, cuando confirmes, inicia sesión aquí."
      );
    },
    [emailRedirectTo, resetUp, setActive, setFocusIn, setValueIn, supabase]
  );

  return (
    <div className="space-y-3">

      <Tabs
        value={active}
        onValueChange={(v: string) => setActive((v as "login" | "signup") ?? "login")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted p-1">
          <TabsTrigger
            value="login"
            className="rounded-lg cursor-pointer transition-colors
                       data-[state=active]:bg-primary/10 data-[state=active]:text-primary
                       hover:bg-accent hover:text-accent-foreground
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Iniciar sesión
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="rounded-lg cursor-pointer transition-colors
                       data-[state=active]:bg-primary/10 data-[state=active]:text-primary
                       hover:bg-accent hover:text-accent-foreground
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Crear cuenta
          </TabsTrigger>
        </TabsList>

        {/* Sign in */}
        <TabsContent value="login" className="space-y-4 pt-4">
          <form onSubmit={handleSubmitIn(onSubmitSignIn)} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email-in">Correo</Label>
              <Input
                id="email-in"
                type="email"
                autoComplete="email"
                className="cursor-text"
                {...registerIn("email")}
              />
              {errorsIn.email && (
                <p className="text-xs text-destructive">{errorsIn.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-in">Contraseña</Label>
              <Input
                id="password-in"
                type="password"
                autoComplete="current-password"
                className="cursor-text"
                {...registerIn("password")}
              />
              {errorsIn.password && (
                <p className="text-xs text-destructive">{errorsIn.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full cursor-pointer transition-transform active:scale-[.98]"
              disabled={submittingIn}
            >
              {submittingIn ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </TabsContent>

        {/* Sign up */}
        <TabsContent value="signup" className="space-y-4 pt-4">
          <form onSubmit={handleSubmitUp(onSubmitSignUp)} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email-up">Correo</Label>
              <Input
                id="email-up"
                type="email"
                autoComplete="email"
                className="cursor-text"
                {...registerUp("email")}
              />
              {errorsUp.email && (
                <p className="text-xs text-destructive">{errorsUp.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-up">Contraseña</Label>
              <Input
                id="password-up"
                type="password"
                autoComplete="new-password"
                className="cursor-text"
                {...registerUp("password")}
              />
              {errorsUp.password && (
                <p className="text-xs text-destructive">{errorsUp.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-up">Confirmar contraseña</Label>
              <Input
                id="confirm-up"
                type="password"
                autoComplete="new-password"
                className="cursor-text"
                {...registerUp("confirmPassword")}
              />
              {errorsUp.confirmPassword && (
                <p className="text-xs text-destructive">{errorsUp.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full cursor-pointer transition-transform active:scale-[.98]"
              disabled={submittingUp}
            >
              {submittingUp ? "Creando…" : "Crear cuenta"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {!!serverMsg && (
        <p aria-live="polite" className="pt-2 text-sm text-muted-foreground">
          {serverMsg}
        </p>
      )}
    </div>
  );
}
