"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { type FormEvent, useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

type InviteInfo = {
  churchName: string
  expiresAt: string
}

export default function InvitePage() {
  const params = useParams<{ token: string }>()
  const token = params.token

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let ignore = false

    async function fetchInvite() {
      setLoading(true)
      setError("")

      const res = await fetch(`/api/invites/${token}`)
      const data = await res.json()

      if (ignore) {
        return
      }

      if (res.ok) {
        setInvite(data)
      } else {
        setError(data?.message || "El enlace no está disponible")
      }

      setLoading(false)
    }

    if (token) {
      fetchInvite()
    }

    return () => {
      ignore = true
    }
  }, [token])

  function isPasswordValid(value: string) {
    return /(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(value)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!name.trim() || !email.trim() || !password) {
      setError("Completa todos los campos.")
      return
    }

    if (!isPasswordValid(password)) {
      setError("La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, letras y un número.")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setSubmitting(true)

    const res = await fetch(`/api/invites/${token}/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()

    setSubmitting(false)

    if (res.ok) {
      setSuccess(true)
      return
    }

    setError(data?.message || "No se pudo crear la cuenta.")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 text-slate-900">
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-semibold">CP</span>
            </div>
            <div>
              <CardTitle>Registro de miembro</CardTitle>
              <CardDescription>
                {invite ? `Invitación para ${invite.churchName}` : "Validando invitación..."}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : success ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  Tu cuenta fue creada correctamente.
                </div>
              </div>
            ) : invite ? (
              <form id="invite-form" onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                  <FieldLabel>Nombre</FieldLabel>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nombre completo"
                  />
                  </Field>

                  <Field>
                  <FieldLabel>Correo electrónico</FieldLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                  </Field>

                  <Field>
                  <FieldLabel>Contraseña</FieldLabel>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="********"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-1 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FieldDescription>
                    Mínimo 8 caracteres, una mayúscula y un número.
                  </FieldDescription>
                  </Field>

                  <Field>
                  <FieldLabel>Confirmación de contraseña</FieldLabel>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="********"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-1 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-label={
                        showConfirmPassword
                          ? "Ocultar confirmación"
                          : "Mostrar confirmación"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  </Field>

                  <FieldError>{error}</FieldError>
                </FieldGroup>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error || "El enlace no está disponible."}
                </div>
              </div>
            )}
          </CardContent>
          {!loading ? (
            <CardFooter className="flex-col gap-2">
              {success ? (
                <Button asChild className="w-full">
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
              ) : invite ? (
                <Button
                  type="submit"
                  form="invite-form"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              ) : (
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">Ir al inicio de sesión</Link>
                </Button>
              )}
            </CardFooter>
          ) : null}
        </Card>
      </section>
    </main>
  )
}
