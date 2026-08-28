# CivicChain

**A Sybil-Resistant DAO for Secure Civic Contribution Tracking**

CivicChain is a decentralized platform where volunteers register with a unique DID, submit contribution records, and have them verified by peer validators through DAO voting. Approved contributions are permanently recorded on-chain.

## Architecture

```
Frontend (React + TypeScript + Vite + Tailwind)
         |
Authentication (MetaMask Wallet + DID)
         |
REST API (Node.js + Express + TypeScript)
    |            |
PostgreSQL    Blockchain (Solidity + Hardhat)
    |            |
Contributions  Smart Contracts
    |
IPFS (Evidence Storage)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Blockchain | Solidity, Hardhat, Sepolia/Polygon Amoy |
| Storage | IPFS (Pinata/Web3.Storage) |
| Wallet | MetaMask, WalletConnect |
| Auth | DID + JWT + Wallet Signatures |
| Deployment | Vercel (FE), Render (BE), Neon (DB) |

## Project Structure

```
civicchain/
├── frontend/          # React + Vite + TypeScript
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       └── types/
├── backend/           # Express + TypeScript + Prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   └── prisma/
├── contracts/         # Solidity + Hardhat
│   ├── contracts/
│   ├── scripts/
│   └── test/
├── docs/              # Documentation
└── tests/             # Integration tests
```

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Smart Contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network sepolia
```

## Features

- **Wallet Auth** - MetaMask login with signature verification
- **DID Registration** - One decentralized identity per wallet
- **Role Management** - Volunteers, Organizations, Validators, Admin
- **Campaign Management** - Create and manage volunteer campaigns
- **Contribution Tracking** - Submit hours, descriptions, and evidence
- **IPFS Storage** - Evidence files stored on IPFS
- **DAO Voting** - Peer validation with 3/5 consensus
- **On-Chain Records** - Approved contributions stored on blockchain
- **Leaderboard** - Public rankings with verified hours
- **Governance** - Community proposals and voting
- **Admin Dashboard** - User management and system stats

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| DIDRegistry.sol | Wallet-to-DID mapping and verification |
| ContributionRegistry.sol | On-chain contribution records |
| Voting.sol | Validator assignment and consensus voting |
| Governance.sol | DAO proposal and voting system |

## API Endpoints

### Auth
- `POST /api/auth/connect-wallet` - Connect wallet and authenticate
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Contributions
- `POST /api/contributions` - Submit contribution
- `GET /api/contributions` - List contributions
- `GET /api/contributions/:id` - Get contribution details

### Voting
- `POST /api/votes` - Cast vote
- `GET /api/votes/pending` - Get pending votes

### Governance
- `POST /api/proposals` - Create proposal
- `GET /api/proposals` - List proposals
- `POST /api/proposals/:id/vote` - Vote on proposal
- `POST /api/proposals/:id/execute` - Execute proposal

### Leaderboard
- `GET /api/leaderboard` - Top volunteers
- `GET /api/leaderboard/organizations` - Organization rankings

## Consensus Logic

```
Volunteer submits proof
        ↓
Assign 5 validators (random)
        ↓
Minimum 3 approvals required
        ↓
Contribution accepted/rejected
        ↓
Blockchain updated
        ↓
Leaderboard updated
```

## License

MIT