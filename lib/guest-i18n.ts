/**
 * Oversettelse av de FASTE etikettene på gjeste- og guide-siden (norsk,
 * engelsk, tysk). Eierens fritekst (husregler, tilkomst osv.) oversettes
 * separat med AI i lib/translate.ts. AI-konsierjen svarer allerede på gjestens
 * eget språk.
 */

import { formatNok } from "@/lib/utils";

export const GUEST_LANGS = ["nb", "en", "de"] as const;
export type GuestLang = (typeof GUEST_LANGS)[number];

export const GUEST_LANG_LABELS: Record<GuestLang, string> = {
  nb: "Norsk",
  en: "English",
  de: "Deutsch",
};

/** Locale for datoformatering per språk. */
export const GUEST_LOCALE: Record<GuestLang, string> = {
  nb: "nb-NO",
  en: "en-GB",
  de: "de-DE",
};

function isGuestLang(v: string): v is GuestLang {
  return (GUEST_LANGS as readonly string[]).includes(v);
}

/**
 * Finn språk: eksplisitt valg (?lang=) vinner, ellers nettleserens
 * Accept-Language, ellers norsk.
 */
export function resolveGuestLang(
  explicit?: string | null,
  acceptLanguage?: string | null,
): GuestLang {
  const e = (explicit ?? "").toLowerCase();
  if (isGuestLang(e)) return e;

  for (const part of (acceptLanguage ?? "").toLowerCase().split(",")) {
    const code = part.trim().slice(0, 2);
    if (code === "nb" || code === "nn" || code === "no") return "nb";
    if (code === "en") return "en";
    if (code === "de") return "de";
  }
  return "nb";
}

const S: Record<string, Record<GuestLang, string>> = {
  // Header + felles
  welcome: { nb: "Velkommen", en: "Welcome", de: "Willkommen" },
  poweredBy: {
    nb: "Levert av Verta",
    en: "Powered by Verta",
    de: "Bereitgestellt von Verta",
  },

  // Seksjonstitler
  yourStay: { nb: "Oppholdet ditt", en: "Your stay", de: "Ihr Aufenthalt" },
  yourRequest: {
    nb: "Forespørselen din",
    en: "Your request",
    de: "Ihre Anfrage",
  },
  remainingBalance: {
    nb: "Restbeløp",
    en: "Remaining balance",
    de: "Restbetrag",
  },
  improveStay: {
    nb: "Gjør oppholdet bedre",
    en: "Make your stay better",
    de: "Aufenthalt verbessern",
  },
  howToGetIn: {
    nb: "Slik kommer du inn",
    en: "How to get in",
    de: "So kommen Sie rein",
  },
  wifi: { nb: "WiFi", en: "WiFi", de: "WLAN" },
  houseRules: { nb: "Husregler", en: "House rules", de: "Hausregeln" },
  atCheckout: {
    nb: "Ved utsjekk",
    en: "At checkout",
    de: "Beim Auschecken",
  },
  travelGuide: {
    nb: "AI-reiseguide",
    en: "AI travel guide",
    de: "KI-Reiseführer",
  },
  askAnything: {
    nb: "Spør om alt",
    en: "Ask anything",
    de: "Fragen Sie alles",
  },
  reviewThanksTitle: {
    nb: "Takk for anmeldelsen!",
    en: "Thanks for your review!",
    de: "Danke für Ihre Bewertung!",
  },
  leaveReview: {
    nb: "Legg igjen en anmeldelse",
    en: "Leave a review",
    de: "Bewertung abgeben",
  },
  cancellation: {
    nb: "Avbestilling",
    en: "Cancellation",
    de: "Stornierung",
  },

  // Radetiketter
  guest: { nb: "Gjest", en: "Guest", de: "Gast" },
  checkIn: { nb: "Innsjekk", en: "Check-in", de: "Check-in" },
  checkOut: { nb: "Utsjekk", en: "Check-out", de: "Check-out" },
  network: { nb: "Nettverk", en: "Network", de: "Netzwerk" },
  password: { nb: "Passord", en: "Password", de: "Passwort" },
  lateCheckout: {
    nb: "Sen utsjekk",
    en: "Late check-out",
    de: "Später Check-out",
  },
  earlyCheckin: {
    nb: "Tidlig innsjekk",
    en: "Early check-in",
    de: "Früher Check-in",
  },
  toPayNow: { nb: "Å betale nå", en: "To pay now", de: "Jetzt zu zahlen" },
  depositNow: { nb: "Depositum nå", en: "Deposit now", de: "Kaution jetzt" },
  restBeforeCheckin: {
    nb: "Rest før innsjekk",
    en: "Rest before check-in",
    de: "Rest vor Check-in",
  },
  confirmed: { nb: "Bekreftet ✓", en: "Confirmed ✓", de: "Bestätigt ✓" },

  // Tilstands-overskrifter og -tekster
  cancelledTitle: {
    nb: "Oppholdet er avbestilt",
    en: "Your stay is cancelled",
    de: "Ihr Aufenthalt ist storniert",
  },
  cancelledBody: {
    nb: "Dette oppholdet er avbestilt. Har du spørsmål, ta kontakt med verten.",
    en: "This stay has been cancelled. If you have questions, contact your host.",
    de: "Dieser Aufenthalt wurde storniert. Bei Fragen wenden Sie sich an Ihren Gastgeber.",
  },
  requestedTitle: {
    nb: "Forespørsel under vurdering",
    en: "Request under review",
    de: "Anfrage wird geprüft",
  },
  requestedBody: {
    nb: "Verten vurderer forespørselen din. Godkjennes den, får du en e-post med lenke til å betale depositum og låse oppholdet.",
    en: "Your host is reviewing your request. If approved, you'll get an email with a link to pay the deposit and lock in your stay.",
    de: "Ihr Gastgeber prüft Ihre Anfrage. Bei Genehmigung erhalten Sie eine E-Mail mit einem Link zur Zahlung der Kaution und zur Bestätigung des Aufenthalts.",
  },
  approvedTitle: {
    nb: "Forespørselen er godkjent 🎉",
    en: "Your request is approved 🎉",
    de: "Ihre Anfrage ist genehmigt 🎉",
  },
  approvedExpired: {
    nb: "Fristen for å betale depositum har dessverre gått ut, og datoene er frigitt. Send gjerne en ny forespørsel.",
    en: "The deadline to pay the deposit has passed and the dates have been released. Feel free to send a new request.",
    de: "Die Frist zur Zahlung der Kaution ist leider abgelaufen und die Termine wurden freigegeben. Senden Sie gerne eine neue Anfrage.",
  },

  // Knapper
  payAndLock: {
    nb: "Betal og lås oppholdet",
    en: "Pay and lock in your stay",
    de: "Bezahlen und Aufenthalt sichern",
  },
  payDeposit: {
    nb: "Betal depositum",
    en: "Pay deposit",
    de: "Kaution zahlen",
  },
  payRemaining: {
    nb: "Betal restbeløp",
    en: "Pay remaining balance",
    de: "Restbetrag zahlen",
  },
  order: { nb: "Bestill", en: "Book", de: "Buchen" },
  sendReview: {
    nb: "Send anmeldelse",
    en: "Send review",
    de: "Bewertung senden",
  },

  // Hjelpetekster
  payWithin24Full: {
    nb: "Betal innen 24 timer for å låse oppholdet.",
    en: "Pay within 24 hours to lock in your stay.",
    de: "Zahlen Sie innerhalb von 24 Stunden, um Ihren Aufenthalt zu sichern.",
  },
  payWithin24Rest: {
    nb: "Betal innen 24 timer for å låse oppholdet. Resten ({amount}) betales før innsjekk.",
    en: "Pay within 24 hours to lock in your stay. The rest ({amount}) is paid before check-in.",
    de: "Zahlen Sie innerhalb von 24 Stunden, um Ihren Aufenthalt zu sichern. Der Rest ({amount}) wird vor dem Check-in bezahlt.",
  },
  remainingInfo: {
    nb: "Du har betalt depositum. Restbeløpet på {amount} må betales senest {date}.",
    en: "You've paid the deposit. The remaining balance of {amount} must be paid by {date} at the latest.",
    de: "Sie haben die Kaution bezahlt. Der Restbetrag von {amount} muss spätestens bis {date} bezahlt werden.",
  },
  accessCodeWorks: {
    nb: "Tast koden på smartlåsen. Den virker kun i løpet av oppholdet.",
    en: "Enter the code on the smart lock. It only works during your stay.",
    de: "Geben Sie den Code am Smart-Schloss ein. Er funktioniert nur während Ihres Aufenthalts.",
  },
  accessCodeHidden: {
    nb: "Dørkoden vises her fra 30 minutter før innsjekk, og er synlig ut oppholdet.",
    en: "The door code appears here from 30 minutes before check-in and stays visible through your stay.",
    de: "Der Türcode erscheint hier ab 30 Minuten vor dem Check-in und bleibt während Ihres Aufenthalts sichtbar.",
  },
  stayExtraNote: {
    nb: "Betales direkte til verten og bekreftes med en gang.",
    en: "Paid directly and confirmed instantly.",
    de: "Direkt bezahlt und sofort bestätigt.",
  },
  travelGuideDisclaimer: {
    nb: "Generert av AI som inspirasjon — dobbeltsjekk gjerne åpningstider og detaljer.",
    en: "AI-generated for inspiration — please double-check opening hours and details.",
    de: "KI-generiert als Inspiration — bitte Öffnungszeiten und Details überprüfen.",
  },
  askAnythingHint: {
    nb: "Lurer du på noe om hytta eller området? Spør assistenten — den svarer på ditt språk, døgnet rundt.",
    en: "Wondering about the place or the area? Ask the assistant — it answers in your language, around the clock.",
    de: "Fragen zur Unterkunft oder Umgebung? Fragen Sie den Assistenten — er antwortet rund um die Uhr in Ihrer Sprache.",
  },
  reviewThanksBody: {
    nb: "Anmeldelsen din er registrert. Takk for at du hjelper andre gjester. 🌟",
    en: "Your review has been saved. Thanks for helping other guests. 🌟",
    de: "Ihre Bewertung wurde gespeichert. Danke, dass Sie anderen Gästen helfen. 🌟",
  },
  reviewRatingLabel: {
    nb: "Din vurdering",
    en: "Your rating",
    de: "Ihre Bewertung",
  },
  ratingExcellent: {
    nb: "Utmerket",
    en: "Excellent",
    de: "Ausgezeichnet",
  },
  ratingVeryGood: {
    nb: "Veldig bra",
    en: "Very good",
    de: "Sehr gut",
  },
  ratingOk: { nb: "Grei", en: "Okay", de: "In Ordnung" },
  ratingBelow: {
    nb: "Under forventning",
    en: "Below expectation",
    de: "Unter den Erwartungen",
  },
  ratingPoor: { nb: "Dårlig", en: "Poor", de: "Schlecht" },
  reviewPlaceholder: {
    nb: "Hvordan var oppholdet?",
    en: "How was your stay?",
    de: "Wie war Ihr Aufenthalt?",
  },

  // Policy-tekster
  remainingPolicy: {
    nb: "Restbeløpet må betales senest 7 dager før innsjekk. Betales det ikke innen fristen, avbestilles oppholdet automatisk og depositumet beholdes.",
    en: "The remaining balance must be paid at least 7 days before check-in. If it isn't paid in time, the stay is automatically cancelled and the deposit is kept.",
    de: "Der Restbetrag muss mindestens 7 Tage vor dem Check-in bezahlt werden. Wird er nicht rechtzeitig bezahlt, wird der Aufenthalt automatisch storniert und die Kaution einbehalten.",
  },
  cancelPolicy14: {
    nb: "14 dager eller mer før innsjekk: full refusjon",
    en: "14 days or more before check-in: full refund",
    de: "14 Tage oder mehr vor dem Check-in: volle Rückerstattung",
  },
  cancelPolicy2to14: {
    nb: "2–14 dager før innsjekk: 50 % refusjon",
    en: "2–14 days before check-in: 50% refund",
    de: "2–14 Tage vor dem Check-in: 50 % Rückerstattung",
  },
  cancelPolicy48: {
    nb: "Mindre enn 48 timer før innsjekk: ingen refusjon",
    en: "Less than 48 hours before check-in: no refund",
    de: "Weniger als 48 Stunden vor dem Check-in: keine Rückerstattung",
  },

  // Refusjonsnotat (avbestilling)
  refundCanCancel: {
    nb: "Du kan avbestille oppholdet her.",
    en: "You can cancel your stay here.",
    de: "Sie können Ihren Aufenthalt hier stornieren.",
  },
  refundFull: {
    nb: "Avbestiller du nå, får du full refusjon.",
    en: "If you cancel now, you get a full refund.",
    de: "Wenn Sie jetzt stornieren, erhalten Sie eine volle Rückerstattung.",
  },
  refund50: {
    nb: "Avbestiller du nå, refunderes 50 % ({amount}).",
    en: "If you cancel now, 50% ({amount}) is refunded.",
    de: "Wenn Sie jetzt stornieren, werden 50 % ({amount}) erstattet.",
  },
  refundNone: {
    nb: "Avbestiller du nå, refunderes ikke beløpet — det er under 48 timer til innsjekk.",
    en: "If you cancel now, no amount is refunded — it's less than 48 hours until check-in.",
    de: "Wenn Sie jetzt stornieren, wird nichts erstattet — es sind weniger als 48 Stunden bis zum Check-in.",
  },

  // Avbestillings-komponent
  cancelConfirmQ: {
    nb: "Er du sikker på at du vil avbestille?",
    en: "Are you sure you want to cancel?",
    de: "Möchten Sie wirklich stornieren?",
  },
  cancelYes: {
    nb: "Ja, avbestill",
    en: "Yes, cancel",
    de: "Ja, stornieren",
  },
  cancelling: {
    nb: "Avbestiller…",
    en: "Cancelling…",
    de: "Storniere…",
  },
  cancelUndo: { nb: "Angre", en: "Undo", de: "Abbrechen" },
  cancelButton: {
    nb: "Avbestill oppholdet",
    en: "Cancel your stay",
    de: "Aufenthalt stornieren",
  },

  // AI-chat
  chatEmpty: {
    nb: "Spør om hva som helst — WiFi, hvordan ting funker, tips i området. Svar kommer på ditt språk.",
    en: "Ask anything — WiFi, how things work, tips nearby. Answers come in your language.",
    de: "Fragen Sie alles — WLAN, wie Dinge funktionieren, Tipps in der Umgebung. Antworten in Ihrer Sprache.",
  },
  chatPlaceholder: {
    nb: "Skriv et spørsmål…",
    en: "Type a question…",
    de: "Frage eingeben…",
  },
  chatRateLimit: {
    nb: "For mange meldinger akkurat nå. Prøv igjen om litt.",
    en: "Too many messages right now. Please try again shortly.",
    de: "Zu viele Nachrichten im Moment. Bitte versuchen Sie es gleich erneut.",
  },
  chatError: {
    nb: "Beklager, jeg fikk ikke svart nå. Prøv «Kontakt verten» under.",
    en: "Sorry, I couldn't answer just now. Try “Contact host” below.",
    de: "Entschuldigung, ich konnte gerade nicht antworten. Versuchen Sie unten „Gastgeber kontaktieren“.",
  },

  // === Guide-siden ===
  guideEyebrow: { nb: "Gjesteguide", en: "Guest guide", de: "Gästeführer" },
  guideAsk: {
    nb: "Spør om hva som helst",
    en: "Ask anything",
    de: "Fragen Sie alles",
  },
  howItWorks: {
    nb: "Slik funker det",
    en: "How things work",
    de: "So funktioniert's",
  },
  tipsArea: {
    nb: "Tips i området",
    en: "Tips nearby",
    de: "Tipps in der Umgebung",
  },
  nearby: { nb: "I nærheten", en: "Nearby", de: "In der Nähe" },
  services: { nb: "Tjenester", en: "Services", de: "Services" },
  serviceSent: {
    nb: "Takk! Forespørselen er sendt til verten. Du får svar så snart som mulig. ✅",
    en: "Thanks! Your request has been sent to the host. You'll hear back as soon as possible. ✅",
    de: "Danke! Ihre Anfrage wurde an den Gastgeber gesendet. Sie erhalten so schnell wie möglich eine Antwort. ✅",
  },
  serviceError: {
    nb: "Kunne ikke sende forespørselen. Prøv igjen, eller bruk «Kontakt verten».",
    en: "Couldn't send the request. Please try again, or use “Contact host”.",
    de: "Anfrage konnte nicht gesendet werden. Bitte erneut versuchen oder „Gastgeber kontaktieren“.",
  },
  scheduledPrefix: { nb: "Fast:", en: "Scheduled:", de: "Fest:" },
  requestBadge: { nb: "Be om", en: "Request", de: "Anfragen" },
  yourName: { nb: "Ditt navn", en: "Your name", de: "Ihr Name" },
  desiredDate: {
    nb: "Ønsket dato/tid (valgfritt)",
    en: "Preferred date/time (optional)",
    de: "Wunschtermin (optional)",
  },
  contactOptional: {
    nb: "E-post/telefon (valgfritt)",
    en: "Email/phone (optional)",
    de: "E-Mail/Telefon (optional)",
  },
  shortDesc: {
    nb: "Kort beskrivelse (valgfritt)",
    en: "Short description (optional)",
    de: "Kurze Beschreibung (optional)",
  },
  sendRequest: {
    nb: "Send forespørsel",
    en: "Send request",
    de: "Anfrage senden",
  },
  localDelivery: {
    nb: "Lokalt & levering",
    en: "Local & delivery",
    de: "Lokal & Lieferung",
  },
  deliveryDisclaimer: {
    nb: "Bestiller du levering (f.eks. matvarer), husk at varer kan bli satt igjen ved døren dersom du ikke er der ved leveringen — f.eks. ved forsinket fly, buss eller tog. Verten og Verta har ikke ansvar for varer som blir stående. Levering skjer på eget ansvar.",
    en: "If you order delivery (e.g. groceries), note that items may be left at the door if you're not there at delivery — for example due to a delayed flight, bus or train. The host and Verta are not responsible for items left unattended. Delivery is at your own risk.",
    de: "Wenn Sie eine Lieferung bestellen (z. B. Lebensmittel), beachten Sie, dass die Ware an der Tür abgestellt werden kann, falls Sie bei der Lieferung nicht da sind — etwa bei verspätetem Flug, Bus oder Zug. Gastgeber und Verta haften nicht für abgestellte Ware. Die Lieferung erfolgt auf eigenes Risiko.",
  },
  rentEquipment: {
    nb: "Lei utstyr",
    en: "Rent equipment",
    de: "Ausrüstung mieten",
  },
  rentSuccess: {
    nb: "Takk! Utstyret er leid. Verten er varslet. 🎉",
    en: "Thanks! The equipment is rented. The host has been notified. 🎉",
    de: "Danke! Die Ausrüstung ist gemietet. Der Gastgeber wurde benachrichtigt. 🎉",
  },
  rentError: {
    nb: "Beklager, leien kunne ikke fullføres. Prøv igjen, eller kontakt verten.",
    en: "Sorry, the rental couldn't be completed. Please try again, or contact the host.",
    de: "Entschuldigung, die Miete konnte nicht abgeschlossen werden. Bitte erneut versuchen oder den Gastgeber kontaktieren.",
  },
  perNight: { nb: "/døgn", en: "/night", de: "/Nacht" },
  perExtraDay: {
    nb: "per ekstra døgn",
    en: "per extra night",
    de: "pro zusätzliche Nacht",
  },
  numDays: { nb: "Antall døgn", en: "Nights", de: "Nächte" },
  numQty: { nb: "Antall stk", en: "Quantity", de: "Anzahl" },
  rentContactOptional: {
    nb: "E-post eller telefon (valgfritt)",
    en: "Email or phone (optional)",
    de: "E-Mail oder Telefon (optional)",
  },
  totalLabel: { nb: "Totalt:", en: "Total:", de: "Gesamt:" },
  rentAndPay: { nb: "Lei og betal", en: "Rent and pay", de: "Mieten und zahlen" },
  contactHostTitle: {
    nb: "Kontakt verten",
    en: "Contact host",
    de: "Gastgeber kontaktieren",
  },
  contactSent: {
    nb: "Meldingen er sendt til verten. Du får svar så snart som mulig. ✅",
    en: "Your message has been sent to the host. You'll hear back as soon as possible. ✅",
    de: "Ihre Nachricht wurde an den Gastgeber gesendet. Sie erhalten so schnell wie möglich eine Antwort. ✅",
  },
  contactPrompt: {
    nb: "Får du ikke hjelp av assistenten over? Send verten en melding.",
    en: "Not getting help from the assistant above? Send the host a message.",
    de: "Der Assistent oben konnte nicht helfen? Senden Sie dem Gastgeber eine Nachricht.",
  },
  contactMsgPlaceholder: {
    nb: "F.eks: Varmepumpen virker ikke selv om jeg har prøvd alt.",
    en: "E.g.: The heat pump isn't working even though I've tried everything.",
    de: "z. B.: Die Wärmepumpe funktioniert nicht, obwohl ich alles versucht habe.",
  },
  contactReplyPlaceholder: {
    nb: "Din e-post eller telefon (så verten kan svare)",
    en: "Your email or phone (so the host can reply)",
    de: "Ihre E-Mail oder Telefon (damit der Gastgeber antworten kann)",
  },
  sendToHost: {
    nb: "Send til verten",
    en: "Send to host",
    de: "An Gastgeber senden",
  },
  stayUpdated: {
    nb: "Hold deg oppdatert",
    en: "Stay updated",
    de: "Bleiben Sie informiert",
  },
  newsletterThanks: {
    nb: "Takk! Du er meldt på. Du kan melde deg av når som helst via lenken i e-posten. ✅",
    en: "Thanks! You're subscribed. You can unsubscribe anytime via the link in the email. ✅",
    de: "Danke! Sie sind angemeldet. Sie können sich jederzeit über den Link in der E-Mail abmelden. ✅",
  },
  newsletterPrompt: {
    nb: "Få tips og tilbud fra Verta på e-post. Meld deg av når som helst.",
    en: "Get tips and offers from Verta by email. Unsubscribe anytime.",
    de: "Erhalten Sie Tipps und Angebote von Verta per E-Mail. Jederzeit abbestellbar.",
  },
  namePlaceholder: {
    nb: "Navn (valgfritt)",
    en: "Name (optional)",
    de: "Name (optional)",
  },
  emailPlaceholder: {
    nb: "Din e-post",
    en: "Your email",
    de: "Ihre E-Mail",
  },
  newsletterConsent: {
    nb: "Ja, Verta kan sende meg nyhetsbrev på e-post. Jeg kan melde meg av når som helst.",
    en: "Yes, Verta may send me newsletters by email. I can unsubscribe anytime.",
    de: "Ja, Verta darf mir Newsletter per E-Mail senden. Ich kann mich jederzeit abmelden.",
  },
  subscribe: { nb: "Meld meg på", en: "Subscribe", de: "Anmelden" },

  // POI-kategorier (nærliggende steder)
  poiGrocery: { nb: "Dagligvare", en: "Groceries", de: "Lebensmittel" },
  poiDining: { nb: "Servering", en: "Dining", de: "Gastronomie" },
  poiCharging: { nb: "Lading", en: "Charging", de: "Laden" },
  poiView: { nb: "Utsikt", en: "Views", de: "Aussicht" },
};

export type GuestT = (key: string, vars?: Record<string, string>) => string;

/** Returnerer en oversetter for valgt språk (faller tilbake til norsk). */
export function guestT(lang: GuestLang): GuestT {
  return (key, vars) => {
    let s = S[key]?.[lang] ?? S[key]?.nb ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, v);
      }
    }
    return s;
  };
}

/**
 * Beløp i norsk format (alltid NOK — det er valutaen kortet belastes i).
 * For ikke-norske språk legges «(NOK)» til så «kr» ikke forvirrer.
 */
export function formatMoneyLang(amount: number, lang: GuestLang): string {
  const s = formatNok(amount);
  return lang === "nb" ? s : `${s} (NOK)`;
}

/** Bare valuta-suffikset («» for norsk, « (NOK)» ellers) — for live-beregning i klient. */
export function nokSuffix(lang: GuestLang): string {
  return lang === "nb" ? "" : " (NOK)";
}
