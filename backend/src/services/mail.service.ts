import nodemailer, { type Transporter } from "nodemailer"

export interface TicketEmailItem {
  id: string
  ticketCode: string
  qrCode?: string | null // Data URL base64 hoặc raw base64
  price: number | string | any
  seat: {
    row: string
    number: number
    type: string
  }
  showtime: {
    startTime: Date | string
    endTime?: Date | string
    movie: {
      title: string
      poster?: string | null
      format?: string
    }
    room: {
      name: string
      cinema: {
        name: string
        address?: string | null
      }
    }
  }
}

export interface SendBookingConfirmationEmailParams {
  userEmail: string
  userName?: string
  booking: {
    id: string
    bookingCode: string
    totalAmount: number | string | any
  }
  payment?: {
    transactionCode?: string
    method?: string
    paidAt?: Date | string | null
  }
  tickets: Array<TicketEmailItem>
}

export type SendBookingTicketsEmailParams = SendBookingConfirmationEmailParams

export interface SendPasswordResetEmailParams {
  userEmail: string
  userName?: string
  otpCode: string
  expiresInMinutes?: number
}

export interface MailSendResult {
  success: boolean
  mocked?: boolean
  messageId?: string
  error?: string
}

/**
 * Khởi tạo transporter Nodemailer dựa trên cấu hình Gmail SMTP từ biến môi trường
 */
export function getMailTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST || "smtp.gmail.com"
  const port = Number(process.env.SMTP_PORT) || 465
  const secure = process.env.SMTP_SECURE === "true" || port === 465
  const user = process.env.SMTP_USER?.trim()
  // Loại bỏ khoảng trắng thường thấy trong App Password của Google (vd: "abcd efgh ijkl mnop")
  const rawPass = process.env.SMTP_PASS?.trim()
  const pass = rawPass ? rawPass.replace(/\s+/g, "") : ""

  if (!user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

/**
 * Kiểm tra kết nối tới máy chủ SMTP
 */
export async function verifyMailConnection(): Promise<boolean> {
  const transporter = getMailTransporter()
  if (!transporter) {
    console.warn("[MAIL-SERVICE] Cấu hình SMTP_USER hoặc SMTP_PASS chưa được thiết lập.")
    return false
  }

  try {
    await transporter.verify()
    console.log("[MAIL-SERVICE] Kết nối SMTP Gmail thành công.")
    return true
  } catch (error: any) {
    console.error("[MAIL-SERVICE] Kết nối SMTP thất bại:", error.message || error)
    return false
  }
}

function formatCurrency(amount: number | string | any): string {
  const num = Number(amount) || 0
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num)
}

function formatShowDateTime(dateInput: Date | string): {
  timeStr: string
  dateStr: string
} {
  try {
    const d = new Date(dateInput)
    const timeStr = d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    const dateStr = d.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    return { timeStr, dateStr }
  } catch {
    return { timeStr: "", dateStr: String(dateInput) }
  }
}

/**
 * Gửi email xác nhận đặt vé và vé điện tử kèm mã QR check-in qua Nodemailer (Gmail SMTP)
 */
export async function sendBookingConfirmationEmail(
  params: SendBookingConfirmationEmailParams,
): Promise<MailSendResult> {
  const { userEmail, userName, booking, payment, tickets } = params

  if (!userEmail) {
    console.warn("[MAIL-SERVICE] Không thể gửi email: userEmail bị trống.")
    return { success: false, error: "userEmail is missing" }
  }

  if (!tickets || tickets.length === 0) {
    console.warn("[MAIL-SERVICE] Không có vé nào trong đơn hàng để gửi email.")
    return { success: false, error: "No tickets provided" }
  }

  const firstTicket = tickets[0]
  const showtime = firstTicket.showtime
  const movie = showtime.movie
  const room = showtime.room
  const cinema = room.cinema
  const { timeStr, dateStr } = formatShowDateTime(showtime.startTime)

  const seatNames = tickets
    .map((t) => `${t.seat.row}${t.seat.number}`)
    .join(", ")

  // Chuẩn bị danh sách QR Code đính kèm dạng inline CID để tất cả email client hiển thị ảnh sắc nét
  const attachments: any[] = []
  const ticketCardsHtml = tickets
    .map((ticket, index) => {
      const cid = `ticket_qr_${index}_${ticket.ticketCode}`
      let base64Content = ""

      if (ticket.qrCode && ticket.qrCode.includes("base64,")) {
        base64Content = ticket.qrCode.split("base64,")[1]
      } else if (ticket.qrCode) {
        base64Content = ticket.qrCode
      }

      if (base64Content) {
        attachments.push({
          filename: `ticket-${ticket.ticketCode}.png`,
          content: Buffer.from(base64Content, "base64"),
          cid: cid,
          contentType: "image/png",
        })
      }

      const seatTypeLabel =
        ticket.seat.type === "vip"
          ? '<span style="background-color:#EF4444;color:#FFFFFF;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold;">VIP</span>'
          : '<span style="background-color:#3B82F6;color:#FFFFFF;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold;">THƯỜNG</span>'

      return `
        <div style="background-color:#1E1E24;border:1px solid #33333F;border-radius:12px;padding:20px;margin-bottom:18px;text-align:center;">
          <div style="font-size:13px;color:#A1A1AA;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Vé Điện Tử #${index + 1}</div>
          <div style="font-size:22px;font-weight:bold;color:#FACC15;margin-bottom:4px;">
            Ghế: ${ticket.seat.row}${ticket.seat.number} &nbsp; ${seatTypeLabel}
          </div>
          <div style="font-size:14px;color:#E4E4E7;margin-bottom:14px;">
            Mã vé: <strong style="color:#FFFFFF;letter-spacing:1.5px;font-family:monospace;background:#27272A;padding:3px 8px;border-radius:4px;">${ticket.ticketCode}</strong>
          </div>
          
          <div style="background-color:#FFFFFF;display:inline-block;padding:12px;border-radius:10px;margin-bottom:12px;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
            ${
              base64Content
                ? `<img src="cid:${cid}" alt="QR Code ${ticket.ticketCode}" width="160" height="160" style="display:block;margin:0 auto;border:none;" />`
                : `<div style="width:160px;height:160px;line-height:160px;text-align:center;color:#000000;font-family:monospace;font-weight:bold;">${ticket.ticketCode}</div>`
            }
          </div>

          <div style="font-size:12px;color:#9CA3AF;">
            Quét mã này tại quầy vé hoặc máy soát vé tự động tại rạp.
          </div>
        </div>
      `
    })
    .join("")

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vé xem phim điện tử - CinemaHub</title>
    </head>
    <body style="margin:0;padding:0;background-color:#0D0D11;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E4E4E7;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0D0D11;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width:620px;background-color:#141419;border-radius:16px;border:1px solid #27272A;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.6);">
              
              <!-- HEADER -->
              <tr>
                <td style="background:linear-gradient(135deg, #18181B 0%, #27272A 100%);padding:28px 24px;text-align:center;border-bottom:2px solid #EAB308;">
                  <div style="font-size:26px;font-weight:900;letter-spacing:2px;color:#EAB308;text-transform:uppercase;margin-bottom:6px;">
                    CINEMAHUB • 5TOP CINEMA
                  </div>
                  <div style="font-size:15px;color:#A1A1AA;letter-spacing:0.5px;">
                    Xác nhận đặt vé thành công
                  </div>
                </td>
              </tr>

              <!-- GREETING -->
              <tr>
                <td style="padding:24px 28px 12px 28px;">
                  <p style="margin:0 0 10px 0;font-size:16px;color:#F4F4F5;">
                    Kính chào <strong style="color:#FACC15;">${userName || userEmail}</strong>,
                  </p>
                  <p style="margin:0;font-size:14px;color:#A1A1AA;line-height:1.6;">
                    Cảm ơn bạn đã lựa chọn CinemaHub! Giao dịch đặt vé của bạn đã được xác nhận thành công. Dưới đây là thông tin chi tiết vé xem phim của bạn:
                  </p>
                </td>
              </tr>

              <!-- MOVIE & SHOWTIME SUMMARY CARD -->
              <tr>
                <td style="padding:12px 28px;">
                  <div style="background-color:#1E1E24;border-radius:12px;border:1px solid #33333F;padding:20px;">
                    <div style="font-size:20px;font-weight:bold;color:#FFFFFF;margin-bottom:12px;">
                      🎬 ${movie.title}
                    </div>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6" border="0" style="font-size:14px;">
                      <tr>
                        <td width="30%" style="color:#9CA3AF;vertical-align:top;">Rạp chiếu:</td>
                        <td width="70%" style="color:#FFFFFF;font-weight:600;">
                          ${cinema.name}
                          ${cinema.address ? `<div style="font-size:12px;color:#A1A1AA;font-weight:normal;margin-top:2px;">${cinema.address}</div>` : ""}
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#9CA3AF;">Phòng chiếu:</td>
                        <td style="color:#FFFFFF;font-weight:600;">${room.name}</td>
                      </tr>
                      <tr>
                        <td style="color:#9CA3AF;">Suất chiếu:</td>
                        <td style="color:#FACC15;font-weight:bold;">
                          ${timeStr} • ${dateStr}
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#9CA3AF;">Vị trí ghế:</td>
                        <td style="color:#38BDF8;font-weight:bold;font-size:15px;">
                          ${seatNames} (${tickets.length} vé)
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#9CA3AF;">Mã đơn hàng:</td>
                        <td style="color:#FFFFFF;font-family:monospace;font-weight:bold;">
                          ${booking.bookingCode}
                        </td>
                      </tr>
                      ${
                        payment?.transactionCode
                          ? `<tr>
                              <td style="color:#9CA3AF;">Mã giao dịch:</td>
                              <td style="color:#A1A1AA;font-family:monospace;">
                                ${payment.transactionCode}
                              </td>
                            </tr>`
                          : ""
                      }
                      ${
                        payment?.method
                          ? `<tr>
                              <td style="color:#9CA3AF;">Phương thức:</td>
                              <td style="color:#E4E4E7;">
                                ${payment.method}
                              </td>
                            </tr>`
                          : ""
                      }
                      <tr>
                        <td style="color:#9CA3AF;border-top:1px solid #2E2E38;padding-top:10px;">Tổng thanh toán:</td>
                        <td style="color:#4ADE80;font-size:18px;font-weight:bold;border-top:1px solid #2E2E38;padding-top:10px;">
                          ${formatCurrency(booking.totalAmount)}
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- TICKETS QR SECTION -->
              <tr>
                <td style="padding:16px 28px 4px 28px;">
                  <div style="font-size:16px;font-weight:bold;color:#FFFFFF;margin-bottom:14px;border-left:4px solid #EAB308;padding-left:10px;">
                    MÃ VÉ ĐIỆN TỬ VÀ VÉ VÀO RẠP
                  </div>
                  ${ticketCardsHtml}
                </td>
              </tr>

              <!-- INSTRUCTIONS -->
              <tr>
                <td style="padding:12px 28px;">
                  <div style="background-color:#18181F;border-radius:10px;border-left:4px solid #3B82F6;padding:14px 16px;">
                    <div style="font-size:13px;font-weight:bold;color:#60A5FA;margin-bottom:6px;">
                      📌 LƯU Ý KHI ĐẾN XEM PHIM
                    </div>
                    <ul style="margin:0;padding-left:18px;font-size:12px;color:#D4D4D8;line-height:1.6;">
                      <li>Vui lòng có mặt tại rạp trước giờ chiếu ít nhất <strong>15 phút</strong>.</li>
                      <li>Bạn có thể mở email này hoặc chụp lại mã QR để quét vé vào phòng chiếu.</li>
                      <li>Vé đã mua không hỗ trợ hoàn tiền hoặc đổi suất chiếu sau khi thanh toán.</li>
                      <li>Không mang đồ ăn, thức uống từ bên ngoài vào phòng chiếu.</li>
                    </ul>
                  </div>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="padding:28px 24px;text-align:center;border-top:1px solid #27272A;margin-top:16px;">
                  <p style="margin:0 0 6px 0;font-size:13px;color:#A1A1AA;">
                    Nếu bạn cần hỗ trợ, vui lòng liên hệ hotline: <strong style="color:#FACC15;">1900 6868</strong> hoặc email: <a href="mailto:5topcinema.service@gmail.com" style="color:#38BDF8;text-decoration:none;">5topcinema.service@gmail.com</a>
                  </p>
                  <p style="margin:0;font-size:11px;color:#71717A;">
                    © ${new Date().getFullYear()} CinemaHub - 5TOP CINEMA. Mọi quyền được bảo lưu.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  const transporter = getMailTransporter()

  if (!transporter) {
    console.log("================================================================")
    console.log(`[MAIL-SIMULATION] Cấu hình SMTP_USER hoặc SMTP_PASS chưa được thiết lập.`)
    console.log(`[MAIL-SIMULATION] Mô phỏng gửi email vé thành công tới: ${userEmail}`)
    console.log(`[MAIL-SIMULATION] Khách hàng: ${userName || userEmail}`)
    console.log(`[MAIL-SIMULATION] Phim: ${movie.title} | Rạp: ${cinema.name} - ${room.name}`)
    console.log(`[MAIL-SIMULATION] Suất: ${timeStr} ${dateStr} | Ghế: ${seatNames}`)
    console.log(`[MAIL-SIMULATION] Mã đơn: ${booking.bookingCode} | Tổng tiền: ${formatCurrency(booking.totalAmount)}`)
    console.log(`[MAIL-SIMULATION] Số lượng vé đính kèm QR: ${tickets.length}`)
    console.log("================================================================")
    return {
      success: true,
      mocked: true,
      messageId: `mock-${Date.now()}`,
    }
  }

  try {
    const fromAddress =
      process.env.MAIL_FROM ||
      process.env.EMAIL_FROM ||
      `"5TOP CINEMA" <${process.env.SMTP_USER || "no-reply@cinemahub.vn"}>`

    const info = await transporter.sendMail({
      from: fromAddress,
      to: userEmail,
      subject: `[CinemaHub] Xác nhận đặt vé thành công: ${movie.title} - Mã đơn: ${booking.bookingCode}`,
      html,
      attachments,
    })

    console.log(
      `[MAIL-SERVICE] Gửi email xác nhận đặt vé thành công đến: ${userEmail} (Message ID: ${info.messageId})`,
    )
    return {
      success: true,
      mocked: false,
      messageId: info.messageId,
    }
  } catch (error: any) {
    console.error("[MAIL-SERVICE] Lỗi khi gửi email:", error.message || error)
    return {
      success: false,
      error: error.message || "Failed to send email",
    }
  }
}

/**
 * Tương thích ngược với tên gọi hàm cũ
 */
export const sendBookingTicketEmail = sendBookingConfirmationEmail

/**
 * Gửi mã OTP đặt lại mật khẩu qua email
 */
export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams,
): Promise<MailSendResult> {
  const { userEmail, userName, otpCode, expiresInMinutes = 15 } = params

  if (!userEmail || !otpCode) {
    return { success: false, error: "Thiếu thông tin email hoặc mã OTP" }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mã đặt lại mật khẩu - CinemaHub</title>
    </head>
    <body style="margin:0;padding:0;background-color:#0D0D11;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E4E4E7;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0D0D11;padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width:540px;background-color:#141419;border-radius:16px;border:1px solid #27272A;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.6);">
              
              <!-- HEADER -->
              <tr>
                <td style="background:linear-gradient(135deg, #18181B 0%, #27272A 100%);padding:28px 24px;text-align:center;border-bottom:2px solid #EAB308;">
                  <div style="font-size:24px;font-weight:900;letter-spacing:2px;color:#EAB308;text-transform:uppercase;margin-bottom:6px;">
                    CINEMAHUB • 5TOP CINEMA
                  </div>
                  <div style="font-size:14px;color:#A1A1AA;">
                    Yêu cầu đặt lại mật khẩu
                  </div>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 12px 0;font-size:16px;color:#F4F4F5;">
                    Kính chào <strong style="color:#FACC15;">${userName || userEmail}</strong>,
                  </p>
                  <p style="margin:0 0 20px 0;font-size:14px;color:#A1A1AA;line-height:1.6;">
                    Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này. Vui lòng sử dụng mã xác thực (OTP) dưới đây để tiến hành tạo mật khẩu mới:
                  </p>

                  <!-- OTP BOX -->
                  <div style="background-color:#1E1E24;border:2px dashed #EAB308;border-radius:12px;padding:22px;text-align:center;margin-bottom:22px;">
                    <div style="font-size:12px;color:#A1A1AA;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                      MÃ XÁC THỰC CỦA BẠN (OTP)
                    </div>
                    <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#FACC15;font-family:monospace;margin-left:10px;">
                      ${otpCode}
                    </div>
                    <div style="font-size:12px;color:#F87171;margin-top:10px;">
                      ⏱️ Mã xác thực này có hiệu lực trong vòng <strong>${expiresInMinutes} phút</strong>.
                    </div>
                  </div>

                  <!-- SECURITY WARNING -->
                  <div style="background-color:#18181F;border-radius:10px;border-left:4px solid #F59E0B;padding:14px 16px;margin-bottom:16px;">
                    <div style="font-size:13px;font-weight:bold;color:#FBBF24;margin-bottom:4px;">
                      🛡️ Lưu ý bảo mật
                    </div>
                    <p style="margin:0;font-size:12px;color:#D4D4D8;line-height:1.6;">
                      Tuyệt đối không chia sẻ mã này với bất kỳ ai (kể cả nhân viên rạp chiếu). Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua thư này, tài khoản của bạn vẫn được bảo vệ an toàn.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="padding:20px 24px;text-align:center;border-top:1px solid #27272A;">
                  <p style="margin:0 0 6px 0;font-size:12px;color:#A1A1AA;">
                    Tổng đài hỗ trợ: <strong style="color:#FACC15;">1900 6868</strong> | Email: <a href="mailto:5topcinema.service@gmail.com" style="color:#38BDF8;text-decoration:none;">5topcinema.service@gmail.com</a>
                  </p>
                  <p style="margin:0;font-size:11px;color:#71717A;">
                    © ${new Date().getFullYear()} CinemaHub - 5TOP CINEMA. Mọi quyền được bảo lưu.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  const transporter = getMailTransporter()

  if (!transporter) {
    console.log("================================================================")
    console.log(`[MAIL-SIMULATION] Cấu hình SMTP chưa được thiết lập.`)
    console.log(`[MAIL-SIMULATION] Gửi OTP đặt lại mật khẩu cho: ${userEmail}`)
    console.log(`[MAIL-SIMULATION] MÃ OTP ĐẶT LẠI MẬT KHẨU LÀ: [ ${otpCode} ] (Hạn 15 phút)`)
    console.log("================================================================")
    return {
      success: true,
      mocked: true,
      messageId: `mock-otp-${Date.now()}`,
    }
  }

  try {
    const fromAddress =
      process.env.MAIL_FROM ||
      process.env.EMAIL_FROM ||
      `"5TOP CINEMA" <${process.env.SMTP_USER || "no-reply@cinemahub.vn"}>`

    const info = await transporter.sendMail({
      from: fromAddress,
      to: userEmail,
      subject: `[CinemaHub] Mã xác thực đặt lại mật khẩu: ${otpCode}`,
      html,
    })

    console.log(
      `[MAIL-SERVICE] Gửi OTP đặt lại mật khẩu thành công đến: ${userEmail} (Message ID: ${info.messageId})`,
    )
    return {
      success: true,
      mocked: false,
      messageId: info.messageId,
    }
  } catch (error: any) {
    console.error("[MAIL-SERVICE] Lỗi gửi email OTP:", error.message || error)
    return {
      success: false,
      error: error.message || "Failed to send reset password email",
    }
  }
}
