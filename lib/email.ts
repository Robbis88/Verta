import { Resend } from "resend";

import type { BookingAccess } from "@/lib/access";

/**
 * Transaksjons-e-post via Resend. Av uten RESEND_API_KEY (da blir hver
 * send en stille no-op, så booking-flyten aldri feiler pga. e-post).
 */
export const emailEnabled = Boolean(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "Verta <noreply@verta.no>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

let _resend: Resend | null = null;
function resend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/** Sender e-post. Feiler aldri — logger og returnerer false ved problem. */
async function send(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const client = resend();
  if (!client) return false;
  try {
    const { error } = await client.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) {
      console.error("E-post-feil:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("E-post-unntak:", err);
    return false;
  }
}

/** Norsk datoformat for e-post (f.eks. «5. juni 2026»). */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Felles e-postramme med Verta-farger (inline-stiler for e-postklienter). */
function layout(heading: string, body: string): string {
  return `
  <div style="margin:0;padding:0;background:#f5f7fa;">
    <div style="max-width:520px;margin:0 auto;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;color:#081b33;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:24px;font-weight:700;letter-spacing:-0.5px;color:#081b33;">Verta</span>
      </div>
      <div style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e0e7ff;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#081b33;">${heading}</h1>
        ${body}
      </div>
      <p style="text-align:center;margin-top:24px;font-size:12px;color:#4b5563;">
        Sendt fra Verta · Full kontroll over dine utleieeiendommer
      </p>
    </div>
  </div>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#4b5563;font-size:14px;">${label}</td>
    <td style="padding:6px 0;text-align:right;font-weight:600;font-size:14px;">${value}</td>
  </tr>`;
}

/** «Slik kommer du inn»-seksjon: smartlås-kode, manuell info, eller fallback. */
function accessSection(access: BookingAccess): string {
  if (access?.type === "smartlock") {
    return `
    <div style="margin:20px 0 0;padding:16px;border-radius:8px;background:#f5f7fa;">
      <p style="margin:0 0 6px;font-size:13px;color:#4b5563;">Slik kommer du inn</p>
      <p style="margin:0 0 4px;font-size:28px;font-weight:700;letter-spacing:4px;color:#081b33;">
        ${access.code}
      </p>
      <p style="margin:0;font-size:13px;color:#4b5563;">
        Tast koden på smartlåsen. Den virker kun i løpet av oppholdet ditt.
      </p>
    </div>`;
  }
  if (access?.type === "manual") {
    return `
    <div style="margin:20px 0 0;padding:16px;border-radius:8px;background:#f5f7fa;">
      <p style="margin:0 0 6px;font-size:13px;color:#4b5563;">Slik kommer du inn</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#081b33;white-space:pre-line;">${access.info}</p>
    </div>`;
  }
  return `
    <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:16px 0 0;">
      Du får tilkomstinformasjon fra verten før innsjekk. Gleder oss til å se deg!
    </p>`;
}

/** Bookingbekreftelse til gjesten etter en direkte booking. */
export async function sendBookingConfirmation(opts: {
  to: string;
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  access?: BookingAccess;
}): Promise<boolean> {
  const body = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Hei ${opts.guestName}, takk for bestillingen! Oppholdet ditt er bekreftet.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 8px;">
      ${detailRow("Eiendom", opts.propertyName)}
      ${detailRow("Innsjekk", formatDate(opts.checkIn))}
      ${detailRow("Utsjekk", formatDate(opts.checkOut))}
      ${detailRow("Netter", String(opts.nights))}
    </table>
    ${accessSection(opts.access ?? null)}`;
  return send({
    to: opts.to,
    subject: `Bekreftet: ${opts.propertyName} – ${formatDate(opts.checkIn)}`,
    html: layout("Bookingen din er bekreftet 🎉", body),
  });
}

/** Varsel til eieren om en ny direkte booking. */
export async function sendOwnerBookingNotification(opts: {
  to: string;
  propertyName: string;
  guestName: string;
  guestEmail?: string | null;
  checkIn: string;
  checkOut: string;
}): Promise<boolean> {
  const body = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Du har fått en ny direkte booking på <strong>${opts.propertyName}</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;">
      ${detailRow("Gjest", opts.guestName)}
      ${opts.guestEmail ? detailRow("E-post", opts.guestEmail) : ""}
      ${detailRow("Innsjekk", formatDate(opts.checkIn))}
      ${detailRow("Utsjekk", formatDate(opts.checkOut))}
    </table>`;
  return send({
    to: opts.to,
    subject: `Ny booking: ${opts.propertyName}`,
    html: layout("Ny direkte booking 📅", body),
  });
}

/** Velkomst-e-post til nye brukere (sendes én gang ved første innlogging). */
export async function sendWelcomeEmail(opts: {
  to: string;
  name?: string | null;
}): Promise<boolean> {
  const greeting = opts.name ? `Hei ${opts.name}!` : "Hei og velkommen!";
  const body = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${greeting} Så hyggelig at du er i gang med Verta. Nå har du alt på ett
      sted for å leie ut hytta eller leiligheten din med full kontroll.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0 0 8px;">
      Slik kommer du i gang:
    </p>
    <ul style="font-size:14px;line-height:1.7;color:#081b33;margin:0 0 24px;padding-left:18px;">
      <li>Legg til din første eiendom</li>
      <li>Del din egen bookingside og ta imot direkte bookinger</li>
      <li>Synk kalenderen med Airbnb og Booking.com</li>
      <li>La skatterapporten fylles ut automatisk</li>
    </ul>
    <div style="text-align:center;margin:0 0 8px;">
      <a href="${SITE_URL}/dashboard"
        style="display:inline-block;background:#d8a66a;color:#081b33;font-weight:600;
        font-size:15px;text-decoration:none;padding:12px 28px;border-radius:8px;">
        Gå til dashbordet
      </a>
    </div>`;
  return send({
    to: opts.to,
    subject: "Velkommen til Verta 🎉",
    html: layout("Velkommen til Verta", body),
  });
}
