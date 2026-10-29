# Hijjawi X EV Diagnostic API v1

Cloudflare Worker for development/pilot device enrollment, account control and live telemetry.

## Deploy
From repository root:

```bash
npx wrangler secret put OWNER_SETUP_KEY --config services/ev-diagnostic-api/wrangler.jsonc
npx wrangler secret put DEVICE_ENROLLMENT_CODE --config services/ev-diagnostic-api/wrangler.jsonc
npx wrangler secret put SESSION_PEPPER --config services/ev-diagnostic-api/wrangler.jsonc
npx wrangler deploy --config services/ev-diagnostic-api/wrangler.jsonc
```

The custom domain is `ev-api.hijjawix.com`.

## First owner
Open the Hijjawi X EV setup page after deploying the static branch and create the OWNER account with OWNER_SETUP_KEY. The endpoint refuses a second owner bootstrap.

## Pilot security boundary
This v1 is for the first read-only vehicle pilot:
- TLS is required at the server.
- Device enrollment uses a one-time/shared pilot enrollment code and a unique server-generated device token.
- Device actions remain CAN receive-only.
- OTA from the cloud is NOT enabled yet.

Before commercial release:
- per-device asymmetric key generated/stored in protected hardware,
- verified TLS trust store/pinning strategy,
- Secure Boot,
- Flash Encryption release mode,
- signed OTA,
- optional secure element on custom PCB,
- credential rotation and manufacturing provisioning flow.

Do not burn irreversible ESP32 production eFuses on the development board.
