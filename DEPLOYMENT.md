# Dr.Nearby Production Deployment Guide (Oracle Cloud Free Tier)

This guide helps you set up the production-grade signaling and TURN servers for secure video calls.

## 1. Get Your VPS (Oracle Cloud Always Free)
1. Sign up at [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Create an instance:
   - **Image**: Ubuntu 22.04
   - **Shape**: VM.Standard.A1.Flex (Ampere ARM)
   - **OCPUs**: 2, **RAM**: 12GB
   - **SSH Keys**: Download and save your `.key` files securely!

## 2. Configure Oracle Network (Security List)
You must open these ports in the Oracle Cloud Console (Subnet -> Security List):
- **TCP/UDP 3478**: For TURN server (handshake)
- **TCP 5506**: For Signaling server (Socket.io)
- **TCP 80/443**: For SSL (Let's Encrypt)

## 3. Server Setup
Once you have your **Public IP**, SSH into your server:
```bash
ssh -i your-key-file.key ubuntu@YOUR_VPS_IP
```

## 4. One-Click Setup (Coming Soon)
After providing the IP to the assistant, you will receive a script to:
- Install Docker & Nginx
- Setup Coturn (TURN Server)
- Setup SSL via Let's Encrypt
- Deploy the Signaling Service

## 5. Configuration Update
Once the server is live, update `apps/js/config.js` with your new production values:
```javascript
const SIGNALING_SERVER_URL = 'https://your-domain-or-ip';
const TURN_SERVER_URL = 'turn:your-domain-or-ip:3478';
```
