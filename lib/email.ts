import { Resend } from "resend";

import type { BookingAccess } from "@/lib/access";
import { CANCELLATION_POLICY_LINES } from "@/lib/cancellation";
import { formatNok } from "@/lib/utils";

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

/** Liten «avbestillingsregler»-boks for e-post. */
function policySection(): string {
  const items = CANCELLATION_POLICY_LINES.map(
    (line) => `<li style="margin:0 0 4px;">${line}</li>`,
  ).join("");
  return `
    <div style="margin:20px 0 0;padding:16px;border-radius:8px;background:#f5f7fa;">
      <p style="margin:0 0 6px;font-size:13px;color:#4b5563;">Avbestillingsregler</p>
      <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;color:#081b33;">
        ${items}
      </ul>
      <p style="margin:8px 0 0;font-size:13px;color:#4b5563;">
        Du kan avbestille fra oppholds-siden din (lenken over).
      </p>
    </div>`;
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
  guideToken?: string;
  remainingAmount?: number;
}): Promise<boolean> {
  const guideButton = opts.guideToken
    ? `<div style="text-align:center;margin:24px 0 0;">
        <a href="${SITE_URL}/gjest/${opts.guideToken}"
          style="display:inline-block;background:#d8a66a;color:#081b33;font-weight:600;
          font-size:15px;text-decoration:none;padding:12px 28px;border-radius:8px;">
          Se all info om oppholdet
        </a>
      </div>`
    : "";
  const intro =
    opts.remainingAmount && opts.remainingAmount > 0
      ? `Hei ${opts.guestName}, depositumet er mottatt og oppholdet ditt er bekreftet 🎉`
      : `Hei ${opts.guestName}, takk for bestillingen! Oppholdet ditt er bekreftet.`;
  const remainingLine =
    opts.remainingAmount && opts.remainingAmount > 0
      ? `<p style="font-size:14px;line-height:1.6;color:#4b5563;margin:16px 0 0;">
           Restbeløpet på <strong>${formatNok(opts.remainingAmount)}</strong>
           betales før innsjekk — du får en egen lenke i god tid.
         </p>`
      : "";
  const body = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${intro}</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 8px;">
      ${detailRow("Eiendom", opts.propertyName)}
      ${detailRow("Innsjekk", formatDate(opts.checkIn))}
      ${detailRow("Utsjekk", formatDate(opts.checkOut))}
      ${detailRow("Netter", String(opts.nights))}
    </table>
    ${remainingLine}
    ${accessSection(opts.access ?? null)}
    ${guideButton}
    ${policySection()}`;
  return send({
    to: opts.to,
    subject: `Bekreftet: ${opts.propertyName} – ${formatDate(opts.checkIn)}`,
    html: layout("Bookingen din er bekreftet 🎉", body),
  });
}

/**
 * Kanselleringsvarsel til både gjest og eier. Feiler aldri (stille no-op uten
 * Resend-nøkkel). `wasPaid` styrer om refusjonslinjen vises.
 */
export async function sendCancellationNotices(opts: {
  guestEmail?: string | null;
  ownerEmail?: string | null;
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  wasPaid: boolean;
  refundAmount: number;
  nonPayment?: boolean;
}): Promise<void> {
  const guestIntro = opts.nonPayment
    ? `Hei ${opts.guestName}, oppholdet ditt er avbestilt fordi restbeløpet ikke ble betalt innen fristen (7 dager før innsjekk).`
    : `Hei ${opts.guestName}, oppholdet ditt er nå avbestilt.`;
  const refundLine = opts.nonPayment
    ? `<p style="font-size:14px;line-height:1.6;color:#4b5563;margin:16px 0 0;">
         Depositumet refunderes ikke, jf. betingelsene for restbetaling.
       </p>`
    : opts.wasPaid
      ? opts.refundAmount > 0
        ? `<p style="font-size:15px;line-height:1.6;margin:16px 0 0;">
             Refundert beløp: <strong>${formatNok(opts.refundAmount)}</strong>.
             Pengene er på vei tilbake til betalingskortet ditt.
           </p>`
        : `<p style="font-size:14px;line-height:1.6;color:#4b5563;margin:16px 0 0;">
             Ifølge avbestillingsreglene refunderes ikke dette oppholdet.
           </p>`
      : "";

  const detailsTable = `
    <table style="width:100%;border-collapse:collapse;margin:0 0 8px;">
      ${detailRow("Eiendom", opts.propertyName)}
      ${detailRow("Innsjekk", formatDate(opts.checkIn))}
      ${detailRow("Utsjekk", formatDate(opts.checkOut))}
    </table>`;

  const tasks: Promise<boolean>[] = [];

  if (opts.guestEmail) {
    const body = `
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${guestIntro}</p>
      ${detailsTable}
      ${refundLine}`;
    tasks.push(
      send({
        to: opts.guestEmail,
        subject: `Avbestilt: ${opts.propertyName} – ${formatDate(opts.checkIn)}`,
        html: layout("Oppholdet er avbestilt", body),
      }),
    );
  }

  if (opts.ownerEmail) {
    const ownerRefund = opts.nonPayment
      ? `<p style="font-size:14px;line-height:1.6;color:#4b5563;margin:16px 0 0;">
           Gjesten betalte ikke restbeløpet innen fristen. Depositumet beholdes,
           og datoene er frigitt.
         </p>`
      : opts.wasPaid
        ? opts.refundAmount > 0
          ? `<p style="font-size:14px;line-height:1.6;color:#4b5563;margin:16px 0 0;">
               Gjesten er refundert ${formatNok(opts.refundAmount)}. Utbetalingen din
               er justert tilsvarende.
             </p>`
          : `<p style="font-size:14px;line-height:1.6;color:#4b5563;margin:16px 0 0;">
               Gjesten fikk ingen refusjon (avbestilte for tett på innsjekk).
             </p>`
        : "";
    const body = `
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
        En booking på <strong>${opts.propertyName}</strong> er avbestilt.
      </p>
      <table style="width:100%;border-collapse:collapse;">
        ${detailRow("Gjest", opts.guestName)}
        ${detailRow("Innsjekk", formatDate(opts.checkIn))}
        ${detailRow("Utsjekk", formatDate(opts.checkOut))}
      </table>
      ${ownerRefund}`;
    tasks.push(
      send({
        to: opts.ownerEmail,
        subject: `Avbestilt: ${opts.propertyName}`,
        html: layout("En booking ble avbestilt", body),
      }),
    );
  }

  await Promise.allSettled(tasks);
}

/**
 * Varsel til eieren om en bekreftet booking. Er `remainingAmount` satt, gjelder
 * det en godkjent forespørsel der gjesten nettopp betalte depositum.
 */
export async function sendOwnerBookingNotification(opts: {
  to: string;
  propertyName: string;
  guestName: string;
  guestEmail?: string | null;
  checkIn: string;
  checkOut: string;
  remainingAmount?: number;
}): Promise<boolean> {
  const isDeposit = !!opts.remainingAmount && opts.remainingAmount > 0;
  const intro = isDeposit
    ? `Gjesten har betalt depositum på <strong>${opts.propertyName}</strong> — bookingen er bekreftet og datoene er låst.`
    : `Du har fått en ny direkte booking på <strong>${opts.propertyName}</strong>.`;
  const remainingRow = isDeposit
    ? detailRow("Rest før innsjekk", formatNok(opts.remainingAmount!))
    : "";
  const body = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${intro}</p>
    <table style="width:100%;border-collapse:collapse;">
      ${detailRow("Gjest", opts.guestName)}
      ${opts.guestEmail ? detailRow("E-post", opts.guestEmail) : ""}
      ${detailRow("Innsjekk", formatDate(opts.checkIn))}
      ${detailRow("Utsjekk", formatDate(opts.checkOut))}
      ${remainingRow}
    </table>`;
  return send({
    to: opts.to,
    subject: isDeposit
      ? `Depositum betalt: ${opts.propertyName}`
      : `Ny booking: ${opts.propertyName}`,
    html: layout(
      isDeposit ? "Depositum betalt — bekreftet ✅" : "Ny direkte booking 📅",
      body,
    ),
  });
}

/** Forespørsel mottatt: varsel til eier (med gjeste-info) + kvittering til gjest. */
export async function sendRequestNotices(opts: {
  ownerEmail?: string | null;
  guestEmail?: string | null;
  guestName: string;
  guestPhone?: string | null;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  numGuests?: number | null;
  message?: string | null;
  ownerToken?: string | null;
}): Promise<void> {
  const tasks: Promise<boolean>[] = [];

  if (opts.ownerEmail) {
    // Lenke til svar-siden om vi har token (godkjenn/avslå uten innlogging),
    // ellers til dashbordet.
    const actionUrl = opts.ownerToken
      ? `${SITE_URL}/godkjenn/${opts.ownerToken}`
      : `${SITE_URL}/dashboard/properties`;
    const body = `
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
        Du har fått en ny <strong>bookingforespørsel</strong> på
        ${opts.propertyName}. Godkjenn eller avslå den direkte under.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 8px;">
        ${detailRow("Gjest", opts.guestName)}
        ${opts.guestEmail ? detailRow("E-post", opts.guestEmail) : ""}
        ${opts.guestPhone ? detailRow("Telefon", opts.guestPhone) : ""}
        ${opts.numGuests ? detailRow("Antall gjester", String(opts.numGuests)) : ""}
        ${detailRow("Innsjekk", formatDate(opts.checkIn))}
        ${detailRow("Utsjekk", formatDate(opts.checkOut))}
      </table>
      ${
        opts.message
          ? `<div style="margin:16px 0 0;padding:16px;border-radius:8px;background:#f5f7fa;">
               <p style="margin:0 0 6px;font-size:13px;color:#4b5563;">Melding fra gjesten</p>
               <p style="margin:0;font-size:14px;line-height:1.6;color:#081b33;white-space:pre-line;">${opts.message}</p>
             </div>`
          : ""
      }
      <div style="text-align:center;margin:24px 0 0;">
        <a href="${actionUrl}"
          style="display:inline-block;background:#d8a66a;color:#081b33;font-weight:600;
          font-size:15px;text-decoration:none;padding:12px 28px;border-radius:8px;">
          Se og svar på forespørselen
        </a>
      </div>`;
    tasks.push(
      send({
        to: opts.ownerEmail,
        subject: `Ny forespørsel: ${opts.propertyName}`,
        html: layout("Ny bookingforespørsel 📩", body),
      }),
    );
  }

  if (opts.guestEmail) {
    const body = `
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hei ${opts.guestName}, vi har mottatt forespørselen din for
        <strong>${opts.propertyName}</strong>. Verten vurderer den og du får
        svar på e-post. Godkjennes den, betaler du et depositum for å låse
        oppholdet.
      </p>
      <table style="width:100%;border-collapse:collapse;">
        ${detailRow("Innsjekk", formatDate(opts.checkIn))}
        ${detailRow("Utsjekk", formatDate(opts.checkOut))}
      </table>`;
    tasks.push(
      send({
        to: opts.guestEmail,
        subject: `Forespørsel mottatt: ${opts.propertyName}`,
        html: layout("Forespørselen din er mottatt", body),
      }),
    );
  }

  await Promise.allSettled(tasks);
}

/** Forespørsel godkjent: gjesten må betale depositum innen 24t. */
export async function sendBookingApproved(opts: {
  to: string;
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  depositAmount: number;
  payToken: string;
  /** Kortvarsel-booking: hele beløpet betales nå (ingen depositum/rest-splitt). */
  fullUpfront?: boolean;
}): Promise<boolean> {
  const amount = formatNok(opts.depositAmount);
  const intro = opts.fullUpfront
    ? `For å låse oppholdet betaler du <strong>hele beløpet på ${amount}</strong> innen 24 timer. Betaler du ikke i tide, frigis datoene.`
    : `For å låse oppholdet betaler du et depositum på <strong>${amount}</strong> innen 24 timer. Betaler du ikke i tide, frigis datoene.`;
  const rowLabel = opts.fullUpfront ? "Å betale nå" : "Depositum nå";
  const cta = opts.fullUpfront
    ? "Betal og lås oppholdet"
    : "Betal depositum og lås oppholdet";

  const body = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Hei ${opts.guestName}, gode nyheter — forespørselen din for
      <strong>${opts.propertyName}</strong> er godkjent! ${intro}
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 8px;">
      ${detailRow("Innsjekk", formatDate(opts.checkIn))}
      ${detailRow("Utsjekk", formatDate(opts.checkOut))}
      ${detailRow(rowLabel, amount)}
    </table>
    <div style="text-align:center;margin:24px 0 0;">
      <a href="${SITE_URL}/gjest/${opts.payToken}"
        style="display:inline-block;background:#d8a66a;color:#081b33;font-weight:600;
        font-size:15px;text-decoration:none;padding:12px 28px;border-radius:8px;">
        ${cta}
      </a>
    </div>`;
  return send({
    to: opts.to,
    subject: opts.fullUpfront
      ? `Godkjent: ${opts.propertyName} – betal og lås oppholdet`
      : `Godkjent: ${opts.propertyName} – betal depositum`,
    html: layout("Forespørselen er godkjent 🎉", body),
  });
}

/** Forespørsel avslått. */
export async function sendBookingRejected(opts: {
  to: string;
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
}): Promise<boolean> {
  const body = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Hei ${opts.guestName}, dessverre kunne ikke verten ta imot forespørselen
      din for <strong>${opts.propertyName}</strong> (${formatDate(opts.checkIn)}
      – ${formatDate(opts.checkOut)}) denne gangen. Du er ikke belastet noe.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0;">
      Prøv gjerne andre datoer, eller se etter en annen eiendom.
    </p>`;
  return send({
    to: opts.to,
    subject: `Forespørsel: ${opts.propertyName}`,
    html: layout("Forespørselen ble ikke godkjent", body),
  });
}

/** Skadekrav til gjesten etter oppholdet — med bilder og betalingslenke. */
export async function sendIncidentClaim(opts: {
  to: string;
  guestName: string;
  propertyName: string;
  amount: number;
  description?: string | null;
  photoUrls: string[];
  claimToken: string;
}): Promise<boolean> {
  const photos = opts.photoUrls
    .slice(0, 4)
    .map(
      (u) =>
        `<img src="${u}" alt="Skadebilde" style="width:120px;height:120px;object-fit:cover;border-radius:8px;margin:0 6px 6px 0;" />`,
    )
    .join("");
  const body = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Hei ${opts.guestName}, etter oppholdet på
      <strong>${opts.propertyName}</strong> har verten meldt en skade og sendt
      deg et krav på <strong>${formatNok(opts.amount)}</strong>.
    </p>
    ${
      opts.description
        ? `<div style="margin:0 0 16px;padding:16px;border-radius:8px;background:#f5f7fa;">
             <p style="margin:0 0 6px;font-size:13px;color:#4b5563;">Beskrivelse</p>
             <p style="margin:0;font-size:14px;line-height:1.6;color:#081b33;white-space:pre-line;">${opts.description}</p>
           </div>`
        : ""
    }
    ${photos ? `<div style="margin:0 0 16px;">${photos}</div>` : ""}
    <div style="text-align:center;margin:24px 0 0;">
      <a href="${SITE_URL}/krav/${opts.claimToken}"
        style="display:inline-block;background:#d8a66a;color:#081b33;font-weight:600;
        font-size:15px;text-decoration:none;padding:12px 28px;border-radius:8px;">
        Se kravet og betal
      </a>
    </div>`;
  return send({
    to: opts.to,
    subject: `Skadekrav: ${opts.propertyName}`,
    html: layout("Du har fått et skadekrav", body),
  });
}

/** Varsel til eier når et skadekrav er betalt. */
export async function sendClaimPaid(opts: {
  to: string;
  propertyName: string;
  guestName: string;
  amount: number;
}): Promise<boolean> {
  const body = `
    <p style="font-size:15px;line-height:1.6;margin:0;">
      ${opts.guestName} har betalt skadekravet på
      <strong>${formatNok(opts.amount)}</strong> for
      <strong>${opts.propertyName}</strong>. Beløpet utbetales til deg.
    </p>`;
  return send({
    to: opts.to,
    subject: `Skadekrav betalt: ${opts.propertyName}`,
    html: layout("Skadekrav betalt ✅", body),
  });
}

/** Påminnelse til gjesten om å betale restbeløpet innen fristen. */
export async function sendRemainingDue(opts: {
  to: string;
  guestName: string;
  propertyName: string;
  dueDate: string;
  remainingAmount: number;
  payToken: string;
}): Promise<boolean> {
  const body = `
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hei ${opts.guestName}, restbeløpet på
      <strong>${formatNok(opts.remainingAmount)}</strong> for
      <strong>${opts.propertyName}</strong> må betales senest
      <strong>${formatDate(opts.dueDate)}</strong>.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#b91c1c;margin:0 0 8px;">
      Betales det ikke innen fristen, avbestilles oppholdet automatisk og
      depositumet beholdes.
    </p>
    <div style="text-align:center;margin:24px 0 0;">
      <a href="${SITE_URL}/gjest/${opts.payToken}"
        style="display:inline-block;background:#d8a66a;color:#081b33;font-weight:600;
        font-size:15px;text-decoration:none;padding:12px 28px;border-radius:8px;">
        Betal restbeløp ${formatNok(opts.remainingAmount)}
      </a>
    </div>`;
  return send({
    to: opts.to,
    subject: `Restbeløp forfaller ${formatDate(opts.dueDate)}: ${opts.propertyName}`,
    html: layout("Betal restbeløpet innen fristen", body),
  });
}

/** Kvittering når restbeløpet er betalt: til gjest + eier. */
export async function sendRemainingReceipt(opts: {
  guestEmail?: string | null;
  ownerEmail?: string | null;
  guestName: string;
  propertyName: string;
  amount: number;
}): Promise<void> {
  const tasks: Promise<boolean>[] = [];
  if (opts.guestEmail) {
    tasks.push(
      send({
        to: opts.guestEmail,
        subject: `Betalt i sin helhet: ${opts.propertyName}`,
        html: layout(
          "Alt er gjort opp ✅",
          `<p style="font-size:15px;line-height:1.6;margin:0;">
             Hei ${opts.guestName}, restbeløpet på
             <strong>${formatNok(opts.amount)}</strong> er mottatt. Oppholdet er
             fullt betalt — gleder oss til å se deg!
           </p>`,
        ),
      }),
    );
  }
  if (opts.ownerEmail) {
    tasks.push(
      send({
        to: opts.ownerEmail,
        subject: `Restbeløp betalt: ${opts.propertyName}`,
        html: layout(
          "Restbeløp betalt ✅",
          `<p style="font-size:15px;line-height:1.6;margin:0;">
             Gjesten har betalt restbeløpet på
             <strong>${formatNok(opts.amount)}</strong> for
             ${opts.propertyName}. Oppholdet er nå fullt betalt.
           </p>`,
        ),
      }),
    );
  }
  await Promise.allSettled(tasks);
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
