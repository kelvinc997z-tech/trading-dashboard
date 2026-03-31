import speakeasy from "speakeasy";
import QRCode from "qrcode";

export function generate2FASecret(userId: string): { secret: string; qrCodeDataUrl: string } {
  const secret = speakeasy.generateSecret({
    name: `Trading Dashboard (${userId})`,
  });

  const qrCodeDataUrl = QRCode.toDataURLSync(
    secret.otpauth_url as string
  );

  return {
    secret: secret.base32,
    qrCodeDataUrl,
  };
}

export function verify2FACode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
  });
}
