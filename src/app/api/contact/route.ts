import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Cliente Supabase Admin (para escribir sin restricciones RLS en el backend)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, zip, privacyAccepted } = body;

    // 1. Validación Básica
    if (!name || !phone || !privacyAccepted) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // 2. PERSISTENCIA: Guardar en Supabase
    const { error: dbError } = await supabase
      .from('leads')
      .insert([{ 
        full_name: name, 
        phone, 
        email, 
        zip_code: zip,
        birth_dates: [], // Se llenaría si viene del calculador
        status: 'new' 
      }]);

    if (dbError) {
      console.error('Supabase Error:', dbError);
      // No detenemos el proceso, intentamos notificar igual
    }

    // 3. INMEDIATEZ: Notificación Telegram
    try {
      const telegramMsg = `🔔 *NUEVO LEAD DKV*\n\n👤: ${name}\n📞: \`${phone}\`\n📍: ${zip || 'N/A'}`;
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: '650320247', // ID especificado en prompt
          text: telegramMsg,
          parse_mode: 'Markdown'
        })
      });
    } catch (telegramError) {
      console.error('Telegram Error:', telegramError); // Fallo silencioso para no afectar al usuario
    }

    // 4. RESPALDO: Email con Nodemailer
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_EMAIL, // Tu gmail para enviar
          pass: process.env.SMTP_PASSWORD // App Password de Google
        }
      });

      await transporter.sendMail({
        from: '"DKV Bot" <no-reply@dkv-dentisalud.com>',
        to: 'bernardino231243@gmail.com',
        subject: `Nuevo Lead Web: ${name}`,
        html: `<p>Nuevo contacto recibido:</p>
               <ul>
                 <li>Nombre: <strong>${name}</strong></li>
                 <li>Teléfono: <a href="tel:${phone}">${phone}</a></li>
                 <li>Email: ${email}</li>
                 <li>CP: ${zip}</li>
               </ul>`
      });
    } catch (mailError) {
      console.error('Email Error:', mailError);
    }

    return NextResponse.json({ success: true, message: 'Lead procesado correctamente' });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}