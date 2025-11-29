export function welcomeTemplate({ planName, userName }) {
  return `
 <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f9;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;padding:40px;text-align:left;">
        
        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:25px;">
            <img src="https://worksheetzai.com/logo.png" alt="Worksheetz AI" width="80" style="display:block;">
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td style="font-size:24px;font-weight:600;color:#333;padding-bottom:10px;text-align:center;">
            🎉 Welcome to {{PLAN_NAME}}!
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="font-size:16px;color:#555;line-height:1.6;padding-bottom:20px;">
            Hi {{USER_NAME}},<br><br>
            Welcome to <strong>Worksheetz AI</strong> — we’re excited to have you on board!
            Your <strong>{{PLAN_NAME}}</strong> plan is now active and ready to use.
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="font-size:15px;color:#555;line-height:1.6;padding-bottom:25px;">
            You can now generate high-quality worksheets instantly for your classroom.
            Get started by visiting your dashboard:
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td align="center" style="padding-bottom:30px;">
            <a href="https://worksheetzai.com/dashboard"
              style="
                background:#7c3aed;
                color:#fff;
                padding:14px 28px;
                font-size:16px;
                text-decoration:none;
                border-radius:6px;
                display:inline-block;
              ">
              Go to Dashboard
            </a>
          </td>
        </tr>

        <!-- Tips Section -->
        <tr>
          <td style="background:#faf5ff;padding:20px;border-radius:6px;">
            <p style="margin:0;font-size:15px;color:#6b21a8;font-weight:600;">🔧 Quick Tips</p>
            <ul style="font-size:14px;color:#555;padding-left:20px;margin-top:10px;">
              <li>Create worksheets by choosing a topic + concept + grade level</li>
              <li>Review and edit using the Worksheet Editor</li>
              <li>Download clean, printable PDFs</li>
              <li>Track your monthly usage in the dashboard</li>
            </ul>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="font-size:13px;color:#999;text-align:center;padding-top:35px;line-height:1.6;">
            Need help? Send us an email.<br>
            ©️ ${new Date().getFullYear()} Worksheetz AI – All rights reserved.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

  `
    .replace(/{{PLAN_NAME}}/g, planName)
    .replace(/{{USER_NAME}}/g, userName);
}
