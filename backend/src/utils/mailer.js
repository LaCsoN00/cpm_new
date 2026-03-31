const nodemailer = require('nodemailer')

const createTransporter = async () => {
  // If SMTP configs are provided, use them for real emails
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // Fallback to Ethereal Email (fictional testing inbox) if no real credentials present
  const testAccount = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, 
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  })
}

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = await createTransporter()
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"CPM App" <notifications@cpm.local>',
      to,
      subject,
      html,
    })

    console.log(`✅ Email envoyé à ${to} : ${info.messageId}`)
    
    // Log preview URL if using Ethereal test account
    if (!process.env.SMTP_USER) {
      console.log('🔗 URL de prévisualisation (Test Email) :', nodemailer.getTestMessageUrl(info))
    }
    
    return info
  } catch (err) {
    console.error("❌ Erreur d'envoi d'email :", err)
  }
}

module.exports = { sendEmail }
