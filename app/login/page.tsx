"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SubmittingOverlay } from "@/components/ui/submitting-overlay"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (!email.trim() || !password) {
      setError("Ingresa tu correo electrónico y contraseña.")
      return
    }

    setLoading(true)

    const res = await fetch("/api/auth/login", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })

    setLoading(false)

    const data = await res.json().catch(() => null)

    if (res.ok) {
      router.replace(data?.needsVerification ? "/verify" : "/dashboard")
      router.refresh()
    } else {
      setError("Credenciales incorrectas.")
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <Card className="relative w-full sm:max-w-md">
          <SubmittingOverlay show={loading} label="Ingresando..." />

          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-semibold">CP</span>
            </div>
            <CardTitle>Churches Planner</CardTitle>
            <CardDescription>
              Inicia sesión para administrar tu iglesia.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form id="login-form" onSubmit={handleLogin} aria-busy={loading}>
              <FieldGroup>
                <Field data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor="login-email">
                    Correo electrónico
                  </FieldLabel>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(error)}
                  />
                </Field>

                <Field data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      aria-invalid={Boolean(error)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-1 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FieldDescription>
                    Usa las credenciales de la cuenta administrativa de tu
                    iglesia.
                  </FieldDescription>
                  <FieldError>{error}</FieldError>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>

          <CardFooter>
            <Field className="w-full gap-3" data-orientation="horizontal">
              <Button variant="outline" asChild>
                <Link href="/register">Registrarse</Link>
              </Button>
              <Button
                type="submit"
                form="login-form"
                className="flex-1"
              disabled={loading}
            >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    Ingresando...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </Field>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}
