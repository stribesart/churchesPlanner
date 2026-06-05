type SendVerificationEmailInput = {
  to: string
  code: string
  name?: string
}

function getEmailFrom() {
  return process.env.EMAIL_FROM || "Churches Planner <onboarding@resend.dev>"
}

export function canSendRealEmail() {
  return Boolean(process.env.RESEND_API_KEY)
}

export async function sendVerificationEmail({
  to,
  code,
  name,
}: SendVerificationEmailInput) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false as const, mode: "manual" as const }
  }

  const displayName = name?.trim() || "usuario"
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "churches-planner",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [to],
      subject: "Código de verificación - Churches Planner",
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
          <p>Hola ${displayName},</p>
          <p>Tu código de verificación es:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
          <p>Este código vence en 10 minutos.</p>
          <p>Si no solicitaste este código, puedes ignorar este correo.</p>
        </div>
      `,
      text: `Hola ${displayName}, tu código de verificación es ${code}. Este código vence en 10 minutos.`,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()

    return {
      ok: false as const,
      mode: "email" as const,
      status: response.status,
      error: errorText,
    }
  }

  return {
    ok: true as const,
    mode: "email" as const,
    data: await response.json(),
  }
}
