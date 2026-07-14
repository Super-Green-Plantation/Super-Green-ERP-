
model ManagementBaseSalary {
  id         Int      @id @default(autoincrement())
  memberId   Int      @unique
  member     Member   @relation(fields: [memberId], references: [id])
  baseSalary Decimal
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())
}

model ManagementSalary {
  id                       Int       @id @default(autoincrement())
  memberId                 Int
  member                   Member    @relation(fields: [memberId], references: [id])
  month                    DateTime  // first-of-month, same convention as MonthlyPayroll
  baseSalary               Decimal   // snapshotted from ManagementBaseSalary at run time, editable per run
  personalCommissionEarned Decimal   @default(0) // 0 for HR/ACC, populated for RM/ZM/AGM
  orcEarned                Decimal   @default(0) // 0 for HR/ACC, populated for RM/ZM/AGM
  advanceDeduction         Decimal   @default(0)
  epfDeduction             Decimal   @default(0)
  grossPay                 Decimal
  netPay                   Decimal
  status                   String    @default("PENDING") // "PENDING" | "PAID"
  paidAt                   DateTime?
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt

  @@unique([memberId, month])
}