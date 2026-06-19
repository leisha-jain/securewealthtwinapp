# Quantum Security — Judge Q&A Cheat Sheet
**Team 51 | PSBs Hackathon 2026 | Read this. Know it cold.**

---

## 1. What is the quantum threat to banking?
**"Harvest Now, Decrypt Later" attacks.**

Nation-state attackers are recording encrypted banking traffic *today* — even though they can't break it yet. When quantum computers mature (~2030–2035), they'll use Shor's algorithm to break RSA-2048 and ECC encryption retroactively.

Banks are uniquely exposed because:
- Loan agreements, KYC records, and transaction histories must be kept for **10+ years**
- Data encrypted today will still be sensitive when quantum arrives
- A bank that doesn't act now is already compromised — they just don't know it yet

---

## 2. What is Post-Quantum TLS 1.3?
The NIST-standardised fix, finalised in 2024.

Instead of RSA or ECC for key exchange, we use **CRYSTALS-Kyber** (now called ML-KEM):
- A lattice-based algorithm — hard for *both* classical and quantum computers
- Runs as a **hybrid**: Kyber + X25519 together, so security holds even if one breaks
- Already supported in Chrome 124+, AWS, Cloudflare, and BoringSSL

**What we implemented:** Our API gateway is architected to use TLS 1.3. In production, swapping to Kyber-hybrid requires one nginx config line — the architecture supports it.

---

## 3. What is Crypto-Agility?
The ability to swap cryptographic algorithms without rebuilding the system.

We built SecureWealth Twin with crypto-agility by:
- Isolating all crypto config in environment variables (`ENCRYPTION_ALGO`, `KEY_SIZE`)
- Never hardcoding cipher suites in application code
- All inter-service calls use the gateway as a single TLS termination point — update one place, update everything

**Analogy for judges:** "Think of it like changing tyres on a moving car — crypto-agility means we can do it without stopping the bank."

---

## 4. Why do banks specifically need this?
Three reasons regulators already care about:

| Reason | Detail |
|--------|--------|
| **Long data retention** | RBI mandates 10-year record retention — quantum will exist before records expire |
| **Systemic risk** | A bank breach affects millions of customers simultaneously |
| **SEBI / RBI forward guidance** | SEBI's 2024 cybersecurity framework explicitly mentions quantum preparedness for FMIs |

---

## 5. What did we implement vs. what's on the roadmap?

| Feature | Status |
|---------|--------|
| Zero-Trust inter-service authentication (X-Internal-Token) | ✅ Implemented |
| TLS 1.3 on API gateway | ✅ Architecture ready |
| Honeypot cyber deception layer | ✅ Implemented |
| Velocity-based fraud detection | ✅ Implemented |
| Kyber-hybrid key exchange (Post-Quantum TLS) | 🗺 Roadmap — needs HSM |
| Quantum-safe JWT signing (CRYSTALS-Dilithium) | 🗺 Roadmap |
| Full NIST PQC suite migration | 🗺 Roadmap — 2026 standard finalised |

**Key message:** "We've built the architecture to be quantum-ready. The swap from classical to post-quantum crypto is a configuration change, not a rewrite."

---

## If a judge pushes deeper — say this:

> "The real innovation isn't implementing Kyber today — it's designing the system so we *can* implement it tomorrow without downtime. That's crypto-agility, and most banks don't have it."
