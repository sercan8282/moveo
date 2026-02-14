const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

let transporter = null;

async function getEmailSettings() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'email_smtp_host',
            'email_smtp_port',
            'email_smtp_user',
            'email_smtp_pass',
            'email_smtp_secure',
            'email_from_name',
            'email_from_address',
            'email_contact_recipient',
            'email_quote_recipient'
          ]
        }
      }
    });

    const config = {};
    settings.forEach(s => {
      // Settings are stored as JSON, unwrap the value
      config[s.key] = typeof s.value === 'string' ? s.value : s.value;
    });
    return config;
  } catch (error) {
    console.error('Failed to load email settings:', error);
    return {};
  }
}

async function createTransporter() {
  const settings = await getEmailSettings();

  const host = settings.email_smtp_host;
  const port = settings.email_smtp_port;
  const user = settings.email_smtp_user;
  const pass = settings.email_smtp_pass;

  if (!host || !port || !user || !pass) {
    console.warn('Email settings incomplete - email sending disabled');
    return null;
  }

  const secure = settings.email_smtp_secure === true || settings.email_smtp_secure === 'true';

  transporter = nodemailer.createTransport({
    host: String(host),
    port: parseInt(String(port), 10),
    secure,
    auth: {
      user: String(user),
      pass: String(pass)
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
}

async function getTransporter() {
  if (!transporter) {
    await createTransporter();
  }
  return transporter;
}

// Reset transporter when settings change
function resetTransporter() {
  transporter = null;
}

async function sendContactEmail(submission) {
  try {
    const t = await getTransporter();
    if (!t) {
      console.warn('No email transporter configured, skipping contact email');
      return false;
    }

    const settings = await getEmailSettings();
    const recipient = settings.email_contact_recipient;
    if (!recipient) {
      console.warn('No contact email recipient configured');
      return false;
    }

    const fromName = settings.email_from_name || 'Moveo Transport';
    const fromAddress = settings.email_from_address || settings.email_smtp_user;

    await t.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: String(recipient),
      subject: `Nieuw contactbericht: ${submission.subject || 'Geen onderwerp'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">📩 Nieuw Contactbericht</h2>
          </div>
          <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 120px; vertical-align: top;">Naam:</td>
                <td style="padding: 8px 0;">${submission.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">E-mail:</td>
                <td style="padding: 8px 0;"><a href="mailto:${submission.email}">${submission.email}</a></td>
              </tr>
              ${submission.phone ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Telefoon:</td>
                <td style="padding: 8px 0;">${submission.phone}</td>
              </tr>` : ''}
              ${submission.subject ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Onderwerp:</td>
                <td style="padding: 8px 0;">${submission.subject}</td>
              </tr>` : ''}
            </table>
            <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <strong>Bericht:</strong>
              <p style="margin-top: 8px; white-space: pre-wrap;">${submission.message}</p>
            </div>
          </div>
          <div style="padding: 12px 20px; background: #f1f5f9; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: 0; font-size: 12px; color: #64748b;">
            Verzonden via Moveo CMS — ${new Date().toLocaleString('nl-NL')}
          </div>
        </div>
      `
    });

    console.log('Contact email sent to', recipient);
    return true;
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return false;
  }
}

async function sendQuoteEmail(quote, vehicleTypeName) {
  try {
    const t = await getTransporter();
    if (!t) {
      console.warn('No email transporter configured, skipping quote email');
      return false;
    }

    const settings = await getEmailSettings();
    const recipient = settings.email_quote_recipient;
    if (!recipient) {
      console.warn('No quote email recipient configured');
      return false;
    }

    const fromName = settings.email_from_name || 'Moveo Transport';
    const fromAddress = settings.email_from_address || settings.email_smtp_user;

    const breakdown = quote.priceBreakdown || {};

    await t.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: String(recipient),
      subject: `Nieuwe offerte aanvraag: ${quote.customerName} — €${quote.calculatedPrice.toFixed(2)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🚛 Nieuwe Offerte Aanvraag</h2>
          </div>
          <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #1e40af;">Klantgegevens</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 140px;">Naam:</td>
                <td style="padding: 6px 0;">${quote.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">E-mail:</td>
                <td style="padding: 6px 0;"><a href="mailto:${quote.customerEmail}">${quote.customerEmail}</a></td>
              </tr>
              ${quote.customerPhone ? `
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Telefoon:</td>
                <td style="padding: 6px 0;">${quote.customerPhone}</td>
              </tr>` : ''}
            </table>

            <h3 style="color: #1e40af;">Transportgegevens</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 140px;">Van:</td>
                <td style="padding: 6px 0;">${quote.startAddress}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Naar:</td>
                <td style="padding: 6px 0;">${quote.endAddress}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Afstand:</td>
                <td style="padding: 6px 0;">${quote.distanceKm.toFixed(1)} km</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Voertuig:</td>
                <td style="padding: 6px 0;">${vehicleTypeName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Type:</td>
                <td style="padding: 6px 0;">${quote.isDomestic ? 'Binnenlands' : 'Internationaal'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Express:</td>
                <td style="padding: 6px 0;">${quote.isExpress ? 'Ja' : 'Nee'}</td>
              </tr>
            </table>

            <div style="margin-top: 16px; padding: 16px; background: #ecfdf5; border-radius: 6px; border: 1px solid #a7f3d0;">
              <h3 style="margin-top: 0; color: #059669;">Prijsoverzicht</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${breakdown.basePricePerKm ? `
                <tr>
                  <td style="padding: 4px 0;">Tarief per km:</td>
                  <td style="padding: 4px 0; text-align: right;">€${breakdown.basePricePerKm.toFixed(2)}</td>
                </tr>` : ''}
                ${breakdown.distanceKm ? `
                <tr>
                  <td style="padding: 4px 0;">Afstand (retour):</td>
                  <td style="padding: 4px 0; text-align: right;">${breakdown.distanceKm.toFixed(1)} km × 2</td>
                </tr>` : ''}
                ${breakdown.basePrice ? `
                <tr>
                  <td style="padding: 4px 0;">Basisprijs:</td>
                  <td style="padding: 4px 0; text-align: right;">€${breakdown.basePrice.toFixed(2)}</td>
                </tr>` : ''}
                ${breakdown.expressSurcharge ? `
                <tr>
                  <td style="padding: 4px 0;">Express toeslag:</td>
                  <td style="padding: 4px 0; text-align: right;">€${breakdown.expressSurcharge.toFixed(2)}</td>
                </tr>` : ''}
                ${breakdown.additionalCosts ? `
                <tr>
                  <td style="padding: 4px 0;">Extra kosten:</td>
                  <td style="padding: 4px 0; text-align: right;">€${breakdown.additionalCosts.toFixed(2)}</td>
                </tr>` : ''}
                <tr style="border-top: 2px solid #059669;">
                  <td style="padding: 8px 0; font-weight: bold; font-size: 18px;">Totaalprijs:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 18px; color: #059669;">€${quote.calculatedPrice.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            ${quote.notes ? `
            <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <strong>Opmerkingen:</strong>
              <p style="margin-top: 8px; white-space: pre-wrap;">${quote.notes}</p>
            </div>` : ''}
          </div>
          <div style="padding: 12px 20px; background: #f1f5f9; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: 0; font-size: 12px; color: #64748b;">
            Verzonden via Moveo CMS Transport Calculator — ${new Date().toLocaleString('nl-NL')}
          </div>
        </div>
      `
    });

    console.log('Quote email sent to', recipient);
    return true;
  } catch (error) {
    console.error('Failed to send quote email:', error);
    return false;
  }
}

async function sendQuoteConfirmationToCustomer(quote, vehicleTypeName) {
  try {
    const t = await getTransporter();
    if (!t) return false;

    const settings = await getEmailSettings();
    const fromName = settings.email_from_name || 'Moveo Transport';
    const fromAddress = settings.email_from_address || settings.email_smtp_user;

    await t.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: quote.customerEmail,
      subject: `Uw offerte aanvraag — Moveo Transport`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🚛 Moveo Transport — Offerte Bevestiging</h2>
          </div>
          <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <p>Beste ${quote.customerName},</p>
            <p>Bedankt voor uw offerte aanvraag. Wij hebben deze ontvangen en nemen zo spoedig mogelijk contact met u op.</p>
            
            <div style="margin: 16px 0; padding: 16px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0;">Uw aanvraag</h3>
              <p><strong>Route:</strong> ${quote.startAddress} → ${quote.endAddress}</p>
              <p><strong>Afstand:</strong> ${quote.distanceKm.toFixed(1)} km</p>
              <p><strong>Voertuig:</strong> ${vehicleTypeName}</p>
              <p><strong>Geschatte prijs:</strong> <span style="font-size: 20px; color: #059669; font-weight: bold;">€${quote.calculatedPrice.toFixed(2)}</span></p>
            </div>

            <p style="color: #64748b; font-size: 14px;">Dit is een indicatieve prijs. De definitieve prijs kan afwijken op basis van specifieke omstandigheden.</p>
            <p>Met vriendelijke groet,<br><strong>Moveo Transport</strong></p>
          </div>
          <div style="padding: 12px 20px; background: #f1f5f9; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: 0; font-size: 12px; color: #64748b;">
            Dit is een automatisch verzonden bericht.
          </div>
        </div>
      `
    });

    return true;
  } catch (error) {
    console.error('Failed to send customer confirmation email:', error);
    return false;
  }
}

module.exports = {
  getEmailSettings,
  sendContactEmail,
  sendQuoteEmail,
  sendQuoteConfirmationToCustomer,
  resetTransporter
};
