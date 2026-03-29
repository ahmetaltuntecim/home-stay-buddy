import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "ahmetaltuntecim@gmail.com";

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Payload received:", JSON.stringify(payload, null, 2));

    const { table, record, type } = payload;

    if (type !== "INSERT") {
      return new Response("Only INSERT events are handled.", { status: 200 });
    }

    let subject = "";
    let html = "";

    if (table === "profiles") {
      // New User Request
      subject = "🔔 Yeni Üye Kayıt İsteği";
      html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #10b981;">Yeni Bir Kullanıcı Kayıt Oldu</h2>
          <p><strong>Ad Soyad:</strong> ${record.display_name || "Belirtilmemiş"}</p>
          <p>Bu kullanıcı şu an onay bekliyor. Admin panelinden "Kullanıcı Onayları" kısmından onaylayabilirsiniz.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Home Stay Buddy Bildirim Sistemi</p>
        </div>
      `;
    } else if (table === "bookings") {
      // New Booking Request
      subject = "📅 Yeni Rezervasyon İsteği";
      html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #3b82f6;">Yeni Bir Rezervasyon Talebi Alındı</h2>
          <p><strong>Rezervasyon ID:</strong> ${record.id}</p>
          <p><strong>Hane:</strong> ${record.house_id}</p>
          <p><strong>Başlangıç Tarihi:</strong> ${record.start_date}</p>
          <p><strong>Bitiş Tarihi:</strong> ${record.end_date}</p>
          <p>Bu rezervasyon şu an 'onay bekliyor' durumundadır. Admin panelinden kontrol edebilirsiniz.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Home Stay Buddy Bildirim Sistemi</p>
        </div>
      `;
    }

    if (!subject) {
      return new Response("Unknown table or event.", { status: 200 });
    }

    if (!RESEND_API_KEY) {
      console.error("Missing environment variable: RESEND_API_KEY");
      return new Response("Server configuration error: RESEND_API_KEY is missing.", { status: 500 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Home Stay Buddy <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();
    console.log("Resend API response:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-admin function:", error);
    return new Response(error.message, { status: 500 });
  }
});
