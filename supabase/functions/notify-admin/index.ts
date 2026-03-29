import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "ahmetaltuntecim@gmail.com";
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://tatilrezervasyonum.vercel.app"; // Lütfen kendi URL'nizle güncelleyin
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function formatDate(dateStr: string) {
  if (!dateStr) return "Belirtilmemiş";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const dayName = DAYS[date.getDay()];
  return `${day}/${month}/${year} ${dayName}`;
}

const adminButton = (path: string) => `
  <div style="margin-top: 30px;">
    <a href="${FRONTEND_URL}${path}" 
       style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
       Admin Paneline Git
    </a>
  </div>
`;

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Payload received:", JSON.stringify(payload, null, 2));

    const { table, record, old_record, type } = payload;
    let subject = "";
    let html = "";
    let recipientEmail = ADMIN_EMAIL;

    // Handle Profiles (New User)
    if (table === "profiles" && type === "INSERT") {
      if (record.approved) return new Response("Skipping approved profile", { status: 200 });
      subject = "🔔 Yeni Üye Kayıt İsteği";
      html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #10b981;">Yeni Bir Kullanıcı Kayıt Oldu</h2>
          <p><strong>Ad Soyad:</strong> ${record.display_name || "Belirtilmemiş"}</p>
          <p>Bu kullanıcı şu an onay bekliyor. Admin panelinden "Kullanıcı Onayları" kısmından onaylayabilirsiniz.</p>
          ${adminButton("/admin")}
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Home Stay Buddy Bildirim Sistemi - Admin Bildirimi</p>
        </div>`;
    }

    // Handle Bookings
    if (table === "bookings") {
      const currentRecord = record || old_record;
      const userId = currentRecord?.user_id;
      const houseId = currentRecord?.house_id;
      
      let userEmail = "";
      let userName = "Müşteri";
      let houseTitle = "Bilinmeyen İlan";

      if (userId) {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const { data: profileData } = await supabase.from("profiles").select("display_name").eq("user_id", userId).single();
        userEmail = userData?.user?.email || "";
        userName = profileData?.display_name || "Müşteri";
      }
      
      if (houseId) {
        const { data: houseData } = await supabase.from("houses").select("title").eq("id", houseId).single();
        houseTitle = houseData?.title || "İlan Başlığı Bulunamadı";
      }

      const startDateFormatted = formatDate(currentRecord.start_date);
      const endDateFormatted = formatDate(currentRecord.end_date);

      if (type === "INSERT") {
        subject = "📅 Yeni Rezervasyon İsteği";
        html = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #3b82f6;">Yeni Bir Rezervasyon Talebi Alındı</h2>
            <p><strong>Müşteri:</strong> ${userName}</p>
            <p><strong>İlan:</strong> ${houseTitle}</p>
            <p><strong>Başlangıç Tarihi:</strong> ${startDateFormatted}</p>
            <p><strong>Bitiş Tarihi:</strong> ${endDateFormatted}</p>
            <p>Admin panelinden kontrol edip onaylayabilirsiniz.</p>
            ${adminButton("/admin")}
          </div>`;
          
        if (userEmail) {
          await sendEmail(userEmail, "Rezervasyon Talebiniz Alındı", `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2>Merhaba ${userName},</h2>
              <p>Rezervasyon talebiniz başarıyla alınmıştır. En kısa sürede admin ekibimiz tarafından incelenip onaylanacaktır.</p>
              <p><strong>İlan:</strong> ${houseTitle}</p>
              <p><strong>Başlangıç Tarihi:</strong> ${startDateFormatted}</p>
              <p><strong>Bitiş Tarihi:</strong> ${endDateFormatted}</p>
              <p>Teşekkür ederiz.</p>
            </div>`);
        }
      } 
      else if (type === "UPDATE") {
        const statusChanged = old_record?.status !== record?.status;
        if (statusChanged && userEmail) {
          recipientEmail = userEmail;
          if (record.status === "confirmed") {
            subject = "🟢 Rezervasyonunuz Onaylandı!";
            html = `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #10b981;">Harika Haber!</h2>
                <p>Merhaba ${userName}, aşağıdaki rezervasyonunuz <strong>onaylanmıştır</strong>.</p>
                <p><strong>İlan:</strong> ${houseTitle}</p>
                <p><strong>Başlangıç Tarihi:</strong> ${startDateFormatted}</p>
                <p><strong>Bitiş Tarihi:</strong> ${endDateFormatted}</p>
                <p>Şimdiden iyi tatiller dileriz!</p>
              </div>`;
          } else if (record.status === "rejected") {
            subject = "🔴 Rezervasyon Talebiniz Hakkında";
            html = `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2>Bilgilendirme</h2>
                <p>Merhaba ${userName}, aşağıdaki rezervasyon talebiniz maalesef <strong>reddedilmiştir</strong>.</p>
                <p><strong>İlan:</strong> ${houseTitle}</p>
                <p><strong>Başlangıç Tarihi:</strong> ${startDateFormatted}</p>
                <p><strong>Bitiş Tarihi:</strong> ${endDateFormatted}</p>
                <p>Farklı bir tarih veya hane seçerek tekrar talep oluşturabilirsiniz.</p>
              </div>`;
          }
        }
      } 
      else if (type === "DELETE") {
        subject = "❌ Rezervasyon İptal Edildi";
        html = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Rezervasyon İptali</h2>
            <p>${userName} adına ${houseTitle} ilanı için yapılan rezervasyon <strong>iptal edilmiştir</strong>.</p>
            <p><strong>Başlangıç Tarihi:</strong> ${startDateFormatted}</p>
            <p><strong>Bitiş Tarihi:</strong> ${endDateFormatted}</p>
            ${adminButton("/admin")}
          </div>`;
        if (userEmail) {
           await sendEmail(userEmail, "Rezervasyonunuz İptal Edildi", html);
        }
      }
    }

    if (!subject || !html) {
      return new Response("Event ignored", { status: 200 });
    }

    await sendEmail(recipientEmail, subject, html);
    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error("Error in notify function:", error);
    return new Response(error.message, { status: 500 });
  }
});

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Home Stay Buddy <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: html,
    }),
  });
  const data = await res.json();
  console.log(`Email sent to ${to}. Response:`, data);
  return data;
}
