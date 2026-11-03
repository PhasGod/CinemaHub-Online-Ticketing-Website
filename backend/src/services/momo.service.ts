import crypto from "node:crypto"

export interface MomoConfig {
  partnerCode: string
  accessKey: string
  secretKey: string
  endpoint: string
  redirectUrl: string
  ipnUrl: string
}

export interface MomoCreatePaymentParams {
  bookingId: string
  bookingCode: string
  amount: number
  orderInfo?: string
}

export interface MomoCreatePaymentResult {
  success: boolean
  orderId: string
  requestId: string
  amount: number
  payUrl: string
  deeplink?: string
  qrCodeUrl: string
  message: string
  isSimulation?: boolean
}

export interface MomoIpnBody {
  partnerCode: string
  orderId: string
  requestId: string
  amount: number | string
  orderInfo: string
  orderType: string
  transId: number | string
  resultCode: number | string
  message: string
  payType: string
  responseTime: number | string
  extraData: string
  signature: string
}

export interface MomoQueryResult {
  partnerCode: string
  orderId: string
  requestId: string
  extraData?: string
  amount: number
  transId?: number | string
  payType?: string
  resultCode: number
  message: string
  responseTime: number
}

/**
 * Lấy cấu hình MoMo từ biến môi trường
 */
export function getMomoConfig(): MomoConfig {
  return {
    partnerCode: process.env.MOMO_PARTNER_CODE?.trim() || "",
    accessKey: process.env.MOMO_ACCESS_KEY?.trim() || "",
    secretKey: process.env.MOMO_SECRET_KEY?.trim() || "",
    endpoint:
      process.env.MOMO_ENDPOINT?.trim() ||
      "https://test-payment.momo.vn/v2/gateway/api/create",
    redirectUrl:
      process.env.MOMO_REDIRECT_URL?.trim() ||
      `${process.env.CLIENT_URL || "http://localhost:8443"}/booking/success`,
    ipnUrl:
      process.env.MOMO_IPN_URL?.trim() ||
      `http://localhost:${process.env.PORT || 3000}/api/payments/momo/ipn`,
  }
}

/**
 * Kiểm tra xem thông tin MoMo Sandbox đã được cấu hình đầy đủ chưa
 */
export function isMomoConfigured(): boolean {
  const config = getMomoConfig()
  return Boolean(config.partnerCode && config.accessKey && config.secretKey)
}

/**
 * Khởi tạo giao dịch thanh toán MoMo Sandbox (Create Payment)
 */
export async function createMomoPayment(
  params: MomoCreatePaymentParams,
): Promise<MomoCreatePaymentResult> {
  const config = getMomoConfig()
  const { bookingId, bookingCode, amount } = params

  const roundedAmount = Math.round(Number(amount))
  const orderId = `MOMO_${bookingCode}_${Date.now()}`
  const requestId = `REQ_${bookingId.substring(0, 8)}_${Date.now()}`
  const orderInfo =
    params.orderInfo || `Thanh toán vé xem phim CinemaHub #${bookingCode}`
  const requestType = "captureWallet"

  // extraData lưu bookingId dạng base64 để phục hồi trong IPN
  const extraData = Buffer.from(JSON.stringify({ bookingId, bookingCode })).toString(
    "base64",
  )

  // Nếu chưa cấu hình MoMo credentials trong .env:
  if (!isMomoConfigured()) {
    console.warn("================================================================")
    console.warn("[MOMO-WARNING] Cấu hình MoMo Sandbox chưa được thiết lập đầy đủ trong backend/.env:")
    console.warn("  - MOMO_PARTNER_CODE:", config.partnerCode || "(chưa có)")
    console.warn("  - MOMO_ACCESS_KEY:", config.accessKey || "(chưa có)")
    console.warn("  - MOMO_SECRET_KEY:", config.secretKey ? "***" : "(chưa có)")
    console.warn("[MOMO-WARNING] Hệ thống đang trả về URL thử nghiệm MoMo để kiểm thử giao diện.")
    console.warn("================================================================")

    const simulatedPayUrl = `https://test-payment.momo.vn/v2/gateway/pay?orderId=${orderId}&amount=${roundedAmount}&simulated=true`
    return {
      success: true,
      orderId,
      requestId,
      amount: roundedAmount,
      payUrl: simulatedPayUrl,
      deeplink: `momo://app?action=payWithApp&orderId=${orderId}`,
      qrCodeUrl: simulatedPayUrl,
      message: "Khởi tạo thanh toán MoMo Sandbox (Chế độ mô phỏng - Chưa cấu hình Secret Key)",
      isSimulation: true,
    }
  }

  // Chuỗi chữ ký chuẩn MoMo v2 (thứ tự chữ cái của các key):
  // accessKey, amount, extraData, ipnUrl, orderId, orderInfo, partnerCode, redirectUrl, requestId, requestType
  const rawSignature =
    `accessKey=${config.accessKey}` +
    `&amount=${roundedAmount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${config.ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${config.partnerCode}` +
    `&redirectUrl=${config.redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`

  const signature = crypto
    .createHmac("sha256", config.secretKey)
    .update(rawSignature)
    .digest("hex")

  const requestBody = {
    partnerCode: config.partnerCode,
    partnerName: "CinemaHub",
    storeId: "CinemaHubStore",
    requestId,
    amount: roundedAmount,
    orderId,
    orderInfo,
    redirectUrl: config.redirectUrl,
    ipnUrl: config.ipnUrl,
    lang: "vi",
    extraData,
    requestType,
    signature,
  }

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const data = (await response.json()) as any

    if (data.resultCode !== 0) {
      console.error("[MOMO-SERVICE] Lỗi tạo thanh toán từ MoMo Gateway:", data)
      throw new Error(data.message || `Lỗi cổng MoMo (mã: ${data.resultCode})`)
    }

    return {
      success: true,
      orderId: data.orderId || orderId,
      requestId: data.requestId || requestId,
      amount: Number(data.amount) || roundedAmount,
      payUrl: data.payUrl,
      deeplink: data.deeplink,
      qrCodeUrl: data.qrCodeUrl || data.payUrl,
      message: data.message || "Tạo thanh toán MoMo thành công",
      isSimulation: false,
    }
  } catch (error: any) {
    console.error("[MOMO-SERVICE] Lỗi kết nối MoMo Gateway:", error.message || error)
    throw error
  }
}

/**
 * Xác thực chữ ký IPN Callback từ MoMo
 */
export function verifyMomoIpnSignature(body: MomoIpnBody): boolean {
  const config = getMomoConfig()

  if (!config.secretKey || !config.accessKey) {
    console.warn("[MOMO-IPN] Không thể xác thực chữ ký: thiếu MOMO_SECRET_KEY hoặc MOMO_ACCESS_KEY.")
    return false
  }

  // Thứ tự trường chữ ký IPN chuẩn MoMo:
  // accessKey, amount, extraData, message, orderId, orderInfo, orderType, partnerCode, payType, requestId, responseTime, resultCode, transId
  const rawSignature =
    `accessKey=${config.accessKey}` +
    `&amount=${body.amount}` +
    `&extraData=${body.extraData || ""}` +
    `&message=${body.message}` +
    `&orderId=${body.orderId}` +
    `&orderInfo=${body.orderInfo}` +
    `&orderType=${body.orderType}` +
    `&partnerCode=${body.partnerCode}` +
    `&payType=${body.payType}` +
    `&requestId=${body.requestId}` +
    `&responseTime=${body.responseTime}` +
    `&resultCode=${body.resultCode}` +
    `&transId=${body.transId}`

  const expectedSignature = crypto
    .createHmac("sha256", config.secretKey)
    .update(rawSignature)
    .digest("hex")

  return (
    expectedSignature.toLowerCase() === (body.signature || "").toLowerCase()
  )
}

/**
 * Tra cứu trạng thái giao dịch từ MoMo (Query Transaction Status)
 */
export async function queryMomoTransactionStatus(params: {
  orderId: string
  requestId: string
}): Promise<MomoQueryResult | null> {
  const config = getMomoConfig()

  if (!isMomoConfigured()) {
    return null
  }

  const queryEndpoint = "https://test-payment.momo.vn/v2/gateway/api/query"
  const rawSignature =
    `accessKey=${config.accessKey}` +
    `&orderId=${params.orderId}` +
    `&partnerCode=${config.partnerCode}` +
    `&requestId=${params.requestId}`

  const signature = crypto
    .createHmac("sha256", config.secretKey)
    .update(rawSignature)
    .digest("hex")

  const requestBody = {
    partnerCode: config.partnerCode,
    requestId: params.requestId,
    orderId: params.orderId,
    lang: "vi",
    signature,
  }

  try {
    const res = await fetch(queryEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })
    return (await res.json()) as MomoQueryResult
  } catch (err: any) {
    console.error("[MOMO-QUERY] Lỗi khi tra cứu giao dịch MoMo:", err.message || err)
    return null
  }
}
