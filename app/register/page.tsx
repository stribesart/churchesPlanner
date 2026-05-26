"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [churchName, setChurchName] = useState("")
  const [location, setLocation] = useState("")
  const [generalServiceDay, setGeneralServiceDay] = useState("")
  const [generalServiceStartTime, setGeneralServiceStartTime] = useState("")
  const [serviceFrequency, setServiceFrequency] = useState("weekly")
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [age, setAge] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const serviceDays = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ]
  const serviceFrequencies = [
    {
      value: "weekly",
      label: "Semanal",
      description: "La reunión principal ocurre cada semana.",
    },
    {
      value: "biweekly",
      label: "Quincenal",
      description: "La reunión principal ocurre cada dos semanas.",
    },
    {
      value: "monthly",
      label: "Mensual",
      description: "La reunión principal ocurre una vez al mes.",
    },
  ]

  function isPasswordValid(password: string) {
    return /(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(password)
  }

  function validateStep(stepToValidate: number) {
    if (stepToValidate === 1) {
      if (!churchName.trim()) return "El nombre de la iglesia es obligatorio"
      if (!generalServiceDay.trim()) return "Selecciona el día de servicio general"
      if (!generalServiceStartTime.trim()) return "Selecciona la hora de inicio del servicio"
      return null
    }

    if (stepToValidate === 2) {
      if (!adminName.trim()) return "El nombre del administrador es obligatorio"
      if (!adminEmail.trim()) return "El correo del administrador es obligatorio"
      if (!password) return "La contraseña es obligatoria"
      if (!isPasswordValid(password)) return "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, letras y un número"
      if (!confirmPassword) return "Confirma tu contraseña"
      if (password !== confirmPassword) return "Las contraseñas no coinciden"
      if (!age.trim()) return "La edad es obligatoria"
      const ageNumber = Number(age)
      if (!Number.isInteger(ageNumber) || ageNumber <= 0) return "Ingresa una edad válida"
      return null
    }

    return null
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const validationError = validateStep(step)
    if (validationError) {
      setError(validationError)
      return
    }

    if (step < 2) {
      setStep(step + 1)
      return
    }

    setLoading(true)

    const res = await fetch("/api/auth/register", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        churchName,
        location,
        generalServiceDay,
        generalServiceStartTime,
        serviceFrequency,
        adminName,
        adminEmail,
        password,
        age,
      }),
    })

    setLoading(false)

    if (res.ok) {
      router.push("/login")
    } else {
      const data = await res.json()
      setError(data?.message || "Error al registrar la iglesia")
    }
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
              <CardTitle>Registra tu iglesia</CardTitle>
              <CardDescription>
                Separa los datos de tu iglesia de la cuenta administradora.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form id="register-form" onSubmit={handleRegister} className="space-y-5">
              {step === 1 ? (
                <FieldGroup>
                  <Field>
                    <FieldLabel>
                      Nombre de la iglesia
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Nombre de la iglesia"
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>
                      Ubicación
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Ciudad, colonia o dirección"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                    <FieldDescription>
                      Opcional. Se usará solo como información del perfil de la iglesia.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>
                      Día de servicio general
                    </FieldLabel>
                    <Select
                      value={generalServiceDay}
                      onValueChange={setGeneralServiceDay}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un día" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceDays.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>
                      Hora de inicio del servicio
                    </FieldLabel>
                    <Input
                      type="time"
                      value={generalServiceStartTime}
                      onChange={(e) => setGeneralServiceStartTime(e.target.value)}
                    />
                  </Field>

                  <Accordion type="single" collapsible className="rounded-lg border px-3">
                    <AccordionItem value="frequency" className="border-0">
                      <AccordionTrigger className="py-3 hover:no-underline">
                        Frecuencia
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pb-4">
                        <Field>
                          <FieldLabel>Frecuencia de la reunión</FieldLabel>
                          <Select
                            value={serviceFrequency}
                            onValueChange={setServiceFrequency}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {serviceFrequencies.map((frequency) => (
                                <SelectItem
                                  key={frequency.value}
                                  value={frequency.value}
                                >
                                  {frequency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldDescription>
                            {
                              serviceFrequencies.find(
                                (frequency) => frequency.value === serviceFrequency
                              )?.description
                            }
                          </FieldDescription>
                        </Field>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </FieldGroup>
              ) : (
                <FieldGroup>
                  <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                    Esta cuenta será el administrador principal de la iglesia.
                  </div>

                  <Field>
                    <FieldLabel>
                      Nombre del administrador o pastor
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Nombre completo"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>
                      Correo del administrador
                    </FieldLabel>
                    <Input
                      type="email"
                      placeholder="admin@ejemplo.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>
                      Edad
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder="Edad"
                      min={1}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>
                      Contraseña
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-1 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FieldDescription>
                      La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, letras y un número.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>
                      Confirmación de contraseña
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="********"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-1 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                </FieldGroup>
              )}

              <FieldError>{error}</FieldError>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-3 sm:flex-row">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError("")
                  setStep(step - 1)
                }}
              >
                Regresar
              </Button>
            ) : null}

            <Button
              type="submit"
              form="register-form"
              className="w-full sm:flex-1"
              disabled={loading}
            >
              {step < 2 ? "Siguiente" : loading ? "Registrando..." : "Finalizar registro"}
            </Button>

            <Button variant="ghost" asChild className="w-full sm:w-auto">
              <a href="/login">Iniciar sesión</a>
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}
