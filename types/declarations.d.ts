declare module 'speakeasy' {
  export function generateSecret(options: { name: string }): {
    base32: string;
    otpauth_url: string;
  };
  export namespace totp {
    export function verify(options: { secret: string; encoding: string; token: string }): boolean;
  }
}

declare module 'qrcode' {
  export function toDataURLSync(text: string): string;
}
