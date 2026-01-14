super-green-erp/
│
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App Router
│   │   ├── components/
│   │   ├── features/           # Feature-based UI
│   │   │   ├── auth/
│   │   │   ├── branches/
│   │   │   ├── commissions/
│   │   │   └── dashboard/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── styles/
│   │   ├── tests/
│   │   ├── vitest.config.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── api/                    # Backend (Next API / Node service)
│       ├── src/
│       │   ├── modules/        # Feature-based backend
│       │   │   ├── auth/
│       │   │   ├── branches/
│       │   │   ├── commissions/
│       │   │   ├── users/
│       │   │   └── clients/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── db/
│       │   │   ├── prisma/
│       │   │   └── migrations/
│       │   ├── utils/
│       │   ├── tests/
│       │   └── index.ts
│       │
│       ├── vitest.config.ts
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared logic (types, utils)
│   │   ├── types/
│   │   ├── constants/
│   │   └── validators/
│   │
│   └── config/                 # Shared configs
│       ├── eslint/
│       ├── tsconfig/
│       └── vitest/
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── postgres/
│   │   └── redis/
│   │
│   └── nginx/
│       └── nginx.conf
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── .env.example
├── turbo.json / pnpm-workspace.yaml
├── package.json
└── README.md