"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

type VerificationStatus = {
  email: string
  phone: string
  emailVerified: boolean
  phoneVerified: boolean
}

export default function VerifyPage() {
  const router = useRouter()
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [code, setCode] = useState("")
  const [manualCode, setManualCode] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/auth/verification/status")

    setLoading(false)

    if (res.ok) {
      const data = await res.json()
      setStatus(data)
    } else {
      router.replace("/login")
    }
  }, [router])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadStatus()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadStatus])

  async function sendCode() {
    setError("")
    setMessage("")
    setManualCode("")
    setSending(true)

    const res = await fetch("/api/auth/verification/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "email" }),
    })
    const data = await res.json()

    setSending(false)

    if (res.ok) {
      setMessage(data.message || "Código enviado")
      setManualCode(data.devCode || "")
    } else {
      setError(data?.message || "No se pudo enviar el código")
    }
  }

  async function confirmCode() {
    setError("")
    setMessage("")
    setConfirming(true)

    const res = await fetch("/api/auth/verification/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "email", code }),
    })
    const data = await res.json()

    setConfirming(false)

    if (res.ok) {
      setCode("")
      setManualCode("")
      setMessage(data.message || "Contacto verificado")
      await loadStatus()
    } else {
      setError(data?.message || "No se pudo confirmar el código")
    }
  }

  const emailDone = Boolean(status?.emailVerified)
  const currentDestination = status?.email

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <Card className="w-full sm:max-w-md">
          <CardHeader>
            <CardTitle>Verifica tu cuenta</CardTitle>
            <CardDescription>
              Confirma tu correo electrónico para continuar.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <FieldGroup>
                <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <Mail className="h-4 w-4" />
                    {status?.email}
                  </div>
                  <div className="text-muted-foreground">
                    {emailDone ? "Correo verificado" : "Correo pendiente"}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={sendCode}
                  disabled={sending || !currentDestination}
                >
                  {sending ? (
                    <>
                      <LoadingSpinner />
                      Enviando...
                    </>
                  ) : (
                    "Enviar código por correo"
                  )}
                </Button>

                {manualCode ? (
                  <div className="rounded-lg border border-dashed px-4 py-3 text-sm">
                    Código de prueba:{" "}
                    <span className="font-mono text-base font-semibold">
                      {manualCode}
                    </span>
                  </div>
                ) : null}

                <Field>
                  <FieldLabel>Código</FieldLabel>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                </Field>

                {message ? (
                  <p className="text-sm font-medium text-emerald-700">{message}</p>
                ) : null}
                <FieldError>{error}</FieldError>
              </FieldGroup>
            )}
          </CardContent>

          <CardFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.replace("/dashboard")}
              disabled={!emailDone}
            >
              Continuar
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={confirmCode}
              disabled={confirming || code.length !== 6}
            >
              {confirming ? (
                <>
                  <LoadingSpinner />
                  Confirmando...
                </>
              ) : (
                "Confirmar código"
              )}
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}
