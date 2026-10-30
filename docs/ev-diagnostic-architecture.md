# Hijjawi X EV Diagnostic — Architecture v1

Status: foundation branch, Tesla battery-first, multi-brand ready.

## Product direction
Hijjawi X EV Diagnostic is a server-connected vehicle diagnostics platform. Version 1 focuses on Tesla Model 3/Y battery monitoring through a T-CAN485 gateway in listen-only mode. The architecture deliberately separates:
- Device firmware and hardware identity.
- Cloud API and authorization.
- Vehicle/CAN profiles.
- User-facing bilingual web application.
- Owner-only administration.

The device is not trusted merely because it knows an ID, MAC address, or serial number.

## Roles
- OWNER: platform owner only. Creates accounts, garages, devices, assignments, firmware releases, CAN profiles and revokes access.
- GARAGE_ADMIN: manages technicians and vehicles belonging to one garage, subject to owner policy.
- TECHNICIAN: uses assigned devices and diagnostic features.
- VEHICLE_OWNER: future restricted owner experience.
No public self-registration in v1.

## Device identity and non-transferable licensing
Each manufactured/provisioned device receives:
1. Human serial, e.g. HXD-000001.
2. ESP hardware identifiers recorded for inventory.
3. A unique asymmetric device key pair.
4. Only the public key is registered on the server.
5. The device private key is stored only on-device and protected by the production security profile.
6. Device is assigned by OWNER to exactly one account or garage at a time.

Authentication:
1. Device opens TLS connection.
2. Device requests a random one-time server challenge.
3. Device signs challenge + device ID + firmware version.
4. Server verifies signature against the registered public key.
5. Server issues a short-lived session credential.
6. Every realtime connection is authorized against current device/account assignment and revocation status.

Copying application firmware is not sufficient to clone a licensed device. Production units must also use unique flash-encryption keys and Secure Boot. A copied encrypted flash image should not be portable to another device when per-device encryption keys are used.

Absolute "impossible to clone" is not a realistic security guarantee for arbitrary physical attackers. For the commercial custom PCB, add a hardware secure element so the per-device identity private key is generated and remains inside tamper-resistant hardware.

## ESP security profiles
### DEVELOPMENT
- UART flashing enabled.
- Secure Boot/production eFuses NOT permanently burned.
- Used only for lab devices.

### PRODUCTION
- Verify ESP32 silicon revision supports the selected secure boot scheme.
- Secure Boot enabled.
- Flash Encryption enabled in Release mode.
- Unique encryption key per device.
- NVS secrets encrypted.
- Debug/JTAG and unnecessary download paths disabled where supported.
- Signed OTA firmware only.
- Rollback-capable A/B OTA.
- Recovery/provisioning process tested before irreversible eFuse operations.

Never burn production eFuses on the development unit until the complete update/recovery workflow is proven.

## Cloud architecture
- Hijjawi X main UI: hijjawix.com.
- Diagnostic web app: /ev-diagnostic/.
- Dedicated diagnostic API Worker: separate deployment.
- Durable Object per device for realtime WebSocket coordination.
- D1 for relational data: users, garages, devices, assignments, profiles, audits, feedback.
- R2 later for firmware binaries, signed profile packages and optional reports/log archives.

Device opens an outbound WSS connection, so it works behind normal garage/home NAT. Web clients open their own authenticated realtime connection. The server never needs an inbound port on the garage router.

## Data strategy
Do not stream every raw CAN frame continuously to the cloud by default.
The gateway:
- Receives CAN in LISTEN-ONLY.
- Loads a signed vehicle profile.
- Decodes selected signals locally.
- Sends batched structured telemetry at an appropriate rate.
- Maintains a bounded raw-frame ring buffer.
- Uploads raw CAN only during an explicit, time-limited development capture.

This keeps bandwidth and cloud cost controlled and allows future offline operation.

## Vehicle profile abstraction
Profiles are data, not hard-coded Tesla UI logic.

VehicleProfile:
- manufacturer
- family/model
- model years / region
- transports required
- buses and bitrates
- CAN signal definitions
- multiplexing definitions
- invalid/stale rules
- module maps
- thresholds
- UI feature flags
- diagnostic capabilities
- minimum firmware/profile-engine version

First profile:
tesla.model3y.battery.v1

Future hardware capability tags:
- can.classic
- canfd
- doip
- lin
- kline
- rs485

T-CAN485 v1 only satisfies a subset (principally one Classic CAN channel). The backend and UI must never assume all future vehicles can be fully diagnosed using this board.

## Tesla battery v1 scope
Read-only first:
- Pack voltage/current/power.
- SOC.
- Brick/cell-group voltages.
- Module grouping once verified for the actual pack.
- Min/max/delta voltage.
- >20 mV balance-review highlighting (configurable, not an automatic repair command).
- Temperatures.
- HV/BMS state where present.
- Contactors/HVIL/isolation where present.
- Energy counters.
- Energy-based SOH estimate with source and formula shown.
- Logging, charts, CSV/XLSX/PDF reports.

## Account model
Owner creates all accounts. No Signup button.

Account -> Garage(optional) -> Device assignments -> Permissions.

Device transfer requires OWNER action:
- revoke old assignment
- optionally rotate device credential
- assign to new account/garage
- create immutable audit entry

## Owner dashboard
- Accounts.
- Garages.
- Devices and online/offline state.
- Provision / assign / suspend / revoke.
- Firmware releases.
- CAN/vehicle profile releases.
- Live sessions and usage.
- Audit log.
- Suggestions/feedback.
- Security events.

## User dashboard
Arabic and English:
- My devices.
- Live diagnostics.
- Battery Lab.
- Modules.
- Trends.
- Reports.
- Session history.
- Feedback/suggestions.
- Profile/account.
No access to CAN-definition development tools unless owner explicitly grants a developer role.

## Feedback
Each feedback item stores:
- account
- garage
- optional device
- category
- message
- language
- created_at
- status: new / reviewing / planned / done / rejected
- admin notes

## Safety boundary
The first commercial profile is receive-only.
Future active diagnostic/service actions must be separately permissioned, logged, vehicle/profile-specific, and reviewed. Never make arbitrary CSV imports capable of unrestricted CAN transmission.

## Next deployment steps
1. Deploy diagnostic API Worker separately.
2. Create D1 database and apply schema.sql.
3. Bind DEVICE_HUB Durable Object and D1.
4. Configure secrets in Cloudflare, never in Git.
5. Bootstrap OWNER account via a controlled setup path.
6. Provision one development device.
7. Verify device challenge authentication.
8. Verify live WSS telemetry.
9. Only then merge the /ev-diagnostic UI into production.
