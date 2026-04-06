


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."ActivityAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'REJECT',
    'LOGIN'
);


ALTER TYPE "public"."ActivityAction" OWNER TO "postgres";


CREATE TYPE "public"."ActivityEntity" AS ENUM (
    'CLIENT',
    'INVESTMENT',
    'COMMISSION',
    'PROFIT',
    'MEMBER',
    'BRANCH',
    'FINANCIAL_PLAN'
);


ALTER TYPE "public"."ActivityEntity" OWNER TO "postgres";


CREATE TYPE "public"."CommissionType" AS ENUM (
    'PERSONAL',
    'UPLINE'
);


ALTER TYPE "public"."CommissionType" OWNER TO "postgres";


CREATE TYPE "public"."EmployeeStatus" AS ENUM (
    'PROBATION',
    'PERMANENT',
    'MANAGEMENT'
);


ALTER TYPE "public"."EmployeeStatus" OWNER TO "postgres";


CREATE TYPE "public"."PositionType" AS ENUM (
    'PROBATION',
    'PERMANENT',
    'MANAGEMENT'
);


ALTER TYPE "public"."PositionType" OWNER TO "postgres";


CREATE TYPE "public"."QuotationFrequency" AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'SEMI_ANNUAL',
    'ANNUAL'
);


ALTER TYPE "public"."QuotationFrequency" OWNER TO "postgres";


CREATE TYPE "public"."QuotationPlanType" AS ENUM (
    'CHILD',
    'MARGE',
    'PENSION'
);


ALTER TYPE "public"."QuotationPlanType" OWNER TO "postgres";


CREATE TYPE "public"."ReturnFrequency" AS ENUM (
    'Monthly',
    'HalfYearly',
    'Yearly'
);


ALTER TYPE "public"."ReturnFrequency" OWNER TO "postgres";


CREATE TYPE "public"."Role" AS ENUM (
    'ADMIN',
    'HR',
    'DEV',
    'BRANCH_MANAGER',
    'REGIONAL_MANAGER',
    'AGM',
    'EMPLOYEE',
    'ZONAL_MANAGER'
);


ALTER TYPE "public"."Role" OWNER TO "postgres";


CREATE TYPE "public"."Status" AS ENUM (
    'Active',
    'Inactive'
);


ALTER TYPE "public"."Status" OWNER TO "postgres";


CREATE TYPE "public"."Title" AS ENUM (
    'ADMIN',
    'CHAIRMEN',
    'COO',
    'GM',
    'HR',
    'ACC',
    'IT',
    'ABM',
    'PRO',
    'OPM',
    'CLEANING',
    'FA',
    'TL',
    'BM',
    'RM',
    'ZM',
    'P_AGM',
    'TRAINEE_FA',
    'P_FA',
    'P_TL',
    'JBM',
    'SBM',
    'JRM',
    'SRM',
    'JZM',
    'SZM',
    'AGM',
    'SE'
);


ALTER TYPE "public"."Title" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ActivityLog" (
    "id" integer NOT NULL,
    "action" "public"."ActivityAction" NOT NULL,
    "entity" "public"."ActivityEntity" NOT NULL,
    "entityId" integer,
    "performedById" integer,
    "branchId" integer,
    "metadata" "jsonb",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."ActivityLog" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ActivityLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ActivityLog_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ActivityLog_id_seq" OWNED BY "public"."ActivityLog"."id";



CREATE TABLE IF NOT EXISTS "public"."Beneficiary" (
    "id" integer NOT NULL,
    "fullName" "text" NOT NULL,
    "nic" "text",
    "phone" "text" NOT NULL,
    "bankName" "text" NOT NULL,
    "bankBranch" "text" NOT NULL,
    "accountNo" "text" NOT NULL,
    "relationship" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientId" integer NOT NULL
);


ALTER TABLE "public"."Beneficiary" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Beneficiary_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Beneficiary_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Beneficiary_id_seq" OWNED BY "public"."Beneficiary"."id";



CREATE TABLE IF NOT EXISTS "public"."Branch" (
    "name" "text" NOT NULL,
    "location" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "id" integer NOT NULL,
    "status" "public"."Status" DEFAULT 'Active'::"public"."Status" NOT NULL
);


ALTER TABLE "public"."Branch" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Branch_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Branch_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Branch_id_seq" OWNED BY "public"."Branch"."id";



CREATE TABLE IF NOT EXISTS "public"."Client" (
    "id" integer NOT NULL,
    "email" "text",
    "address" "text" NOT NULL,
    "branchId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    "drivingLicense" "text",
    "fullName" "text" NOT NULL,
    "nic" "text",
    "occupation" "text",
    "passportNo" "text",
    "phoneLand" "text",
    "phoneMobile" "text",
    "status" "public"."Status" DEFAULT 'Active'::"public"."Status" NOT NULL,
    "investmentAmount" integer NOT NULL,
    "agreement" "text",
    "idBack" "text",
    "idFront" "text",
    "signature" "text",
    "proposal" "text",
    "paymentSlip" "text",
    "memberId" integer,
    "proposalFormNo" "text",
    "createdById" integer
);


ALTER TABLE "public"."Client" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ClientDocument" (
    "id" integer NOT NULL,
    "requestId" integer NOT NULL,
    "idFront" "text",
    "idBack" "text",
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "paymentSlip" "text"
);


ALTER TABLE "public"."ClientDocument" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ClientDocumentRequest" (
    "id" integer NOT NULL,
    "clientId" integer NOT NULL,
    "token" "text" NOT NULL,
    "createdById" "uuid" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "used" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."ClientDocumentRequest" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ClientDocumentRequest_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ClientDocumentRequest_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ClientDocumentRequest_id_seq" OWNED BY "public"."ClientDocumentRequest"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."ClientDocument_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ClientDocument_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ClientDocument_id_seq" OWNED BY "public"."ClientDocument"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."Client_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Client_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Client_id_seq" OWNED BY "public"."Client"."id";



CREATE TABLE IF NOT EXISTS "public"."Commission" (
    "id" integer NOT NULL,
    "investmentId" integer NOT NULL,
    "memberEmpNo" "text" NOT NULL,
    "amount" double precision NOT NULL,
    "type" "public"."CommissionType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "refNumber" "text",
    "branchId" integer NOT NULL
);


ALTER TABLE "public"."Commission" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."CommissionRate" (
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "id" integer NOT NULL,
    "positionId" integer NOT NULL,
    "rateNonPermanent" double precision DEFAULT 0 NOT NULL,
    "ratePermanent" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."CommissionRate" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."CommissionRate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."CommissionRate_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."CommissionRate_id_seq" OWNED BY "public"."CommissionRate"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."Commission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Commission_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Commission_id_seq" OWNED BY "public"."Commission"."id";



CREATE TABLE IF NOT EXISTS "public"."FinancialPlan" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "duration" integer NOT NULL,
    "rate" double precision NOT NULL,
    "description" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "status" "public"."Status" DEFAULT 'Active'::"public"."Status" NOT NULL,
    "investment" double precision
);


ALTER TABLE "public"."FinancialPlan" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."FinancialPlan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."FinancialPlan_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."FinancialPlan_id_seq" OWNED BY "public"."FinancialPlan"."id";



CREATE TABLE IF NOT EXISTS "public"."Investment" (
    "id" integer NOT NULL,
    "investmentDate" timestamp(3) without time zone NOT NULL,
    "amount" double precision NOT NULL,
    "clientId" integer NOT NULL,
    "planId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "advisorId" integer,
    "commissionsProcessed" boolean DEFAULT false NOT NULL,
    "refNumber" "text",
    "branchId" integer NOT NULL,
    "beneficiaryId" integer,
    "nomineeId" integer,
    "isMatured" boolean DEFAULT false NOT NULL,
    "maturityDate" timestamp(3) without time zone,
    "maturityNotified" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."Investment" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Investment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Investment_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Investment_id_seq" OWNED BY "public"."Investment"."id";



CREATE TABLE IF NOT EXISTS "public"."Member" (
    "totalCommission" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone,
    "id" integer NOT NULL,
    "positionId" integer NOT NULL,
    "empNo" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "userId" "uuid",
    "accNo" "text",
    "address" "text",
    "appointmentLetter" "text",
    "bank" "text",
    "bankBranch" "text",
    "civilStatus" "text",
    "confirmation" "text",
    "dateOfJoin" timestamp(3) without time zone,
    "dob" timestamp(3) without time zone,
    "gender" "text",
    "nameWithInitials" "text",
    "nic" "text",
    "remark" "text",
    "probationStartDate" "text",
    "profilePic" "text",
    "status" "public"."EmployeeStatus" DEFAULT 'PROBATION'::"public"."EmployeeStatus" NOT NULL,
    "epfNo" "text",
    "phone2" "text",
    "lastClientRegisteredAt" timestamp(3) without time zone,
    "reportingPersons" "text"[],
    "etfNo" "text",
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."Member" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."MemberBranch" (
    "id" integer NOT NULL,
    "memberId" integer NOT NULL,
    "branchId" integer NOT NULL
);


ALTER TABLE "public"."MemberBranch" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."MemberBranch_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."MemberBranch_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."MemberBranch_id_seq" OWNED BY "public"."MemberBranch"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."Member_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Member_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Member_id_seq" OWNED BY "public"."Member"."id";



CREATE TABLE IF NOT EXISTS "public"."MonthlyEvaluation" (
    "id" integer NOT NULL,
    "memberId" integer NOT NULL,
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    "periodNumber" integer,
    "monthInPeriod" integer,
    "volumeAchieved" double precision NOT NULL,
    "targetAmount" double precision NOT NULL,
    "bonusEarned" double precision DEFAULT 0 NOT NULL,
    "excessBonus" double precision DEFAULT 0 NOT NULL,
    "targetHit" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."MonthlyEvaluation" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."MonthlyEvaluation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."MonthlyEvaluation_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."MonthlyEvaluation_id_seq" OWNED BY "public"."MonthlyEvaluation"."id";



CREATE TABLE IF NOT EXISTS "public"."MonthlyPayroll" (
    "id" integer NOT NULL,
    "memberId" integer NOT NULL,
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    "volumeAchieved" double precision DEFAULT 0 NOT NULL,
    "monthlyTarget" double precision NOT NULL,
    "incentiveEarned" double precision DEFAULT 0 NOT NULL,
    "allowanceEarned" double precision DEFAULT 0 NOT NULL,
    "orcEarned" double precision DEFAULT 0 NOT NULL,
    "commissionEarned" double precision DEFAULT 0 NOT NULL,
    "epfDeduction" double precision DEFAULT 0 NOT NULL,
    "epfEmployer" double precision DEFAULT 0 NOT NULL,
    "etfEmployer" double precision DEFAULT 0 NOT NULL,
    "incentiveHit" boolean DEFAULT false NOT NULL,
    "allowanceHit" boolean DEFAULT false NOT NULL,
    "grossPay" double precision DEFAULT 0 NOT NULL,
    "netPay" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "basicSalaryPermanent" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."MonthlyPayroll" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."MonthlyPayroll_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."MonthlyPayroll_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."MonthlyPayroll_id_seq" OWNED BY "public"."MonthlyPayroll"."id";



CREATE TABLE IF NOT EXISTS "public"."Nominee" (
    "id" integer NOT NULL,
    "fullName" "text" NOT NULL,
    "permanentAddress" "text" NOT NULL,
    "postalAddress" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientId" integer NOT NULL
);


ALTER TABLE "public"."Nominee" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Nominee_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Nominee_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Nominee_id_seq" OWNED BY "public"."Nominee"."id";



CREATE TABLE IF NOT EXISTS "public"."PermanentEvaluation" (
    "id" integer NOT NULL,
    "memberId" integer NOT NULL,
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    "volumeAchieved" double precision NOT NULL,
    "monthlyTarget" double precision NOT NULL,
    "incentiveEarned" double precision DEFAULT 0 NOT NULL,
    "allowanceEarned" double precision DEFAULT 0 NOT NULL,
    "incentiveHit" boolean DEFAULT false NOT NULL,
    "allowanceHit" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."PermanentEvaluation" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."PermanentEvaluation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."PermanentEvaluation_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."PermanentEvaluation_id_seq" OWNED BY "public"."PermanentEvaluation"."id";



CREATE TABLE IF NOT EXISTS "public"."Position" (
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "id" integer NOT NULL,
    "title" "public"."Title" NOT NULL,
    "rank" integer NOT NULL,
    "isManagement" boolean DEFAULT false NOT NULL,
    "isProbation" boolean DEFAULT false NOT NULL,
    "type" "public"."PositionType" DEFAULT 'PROBATION'::"public"."PositionType" NOT NULL
);


ALTER TABLE "public"."Position" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PositionSalary" (
    "id" integer NOT NULL,
    "positionId" integer NOT NULL,
    "monthlyTarget" double precision NOT NULL,
    "incentiveAmount" double precision NOT NULL,
    "allowanceAmount" double precision NOT NULL,
    "commRateLow" double precision NOT NULL,
    "commRateHigh" double precision NOT NULL,
    "commThreshold" double precision DEFAULT 500000 NOT NULL,
    "epfEmployee" double precision DEFAULT 0.08 NOT NULL,
    "epfEmployer" double precision DEFAULT 0.12 NOT NULL,
    "etfEmployer" double precision DEFAULT 0.03 NOT NULL,
    "allowanceThresholdPermanent" double precision DEFAULT 1.0 NOT NULL,
    "allowanceThresholdProbation" double precision DEFAULT 0.75 NOT NULL,
    "basicSalaryPermanent" double precision DEFAULT 0 NOT NULL,
    "basicSalaryProbation" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."PositionSalary" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."PositionSalary_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."PositionSalary_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."PositionSalary_id_seq" OWNED BY "public"."PositionSalary"."id";



CREATE TABLE IF NOT EXISTS "public"."PositionTarget" (
    "id" integer NOT NULL,
    "positionId" integer NOT NULL,
    "periodNumber" integer NOT NULL,
    "monthNumber" integer NOT NULL,
    "targetAmount" double precision NOT NULL,
    "bonusAmount" double precision NOT NULL,
    "excessRate" double precision DEFAULT 0 NOT NULL,
    "partialBonus" double precision DEFAULT 0 NOT NULL,
    "partialThreshold" double precision DEFAULT 0 NOT NULL,
    "bonusThresholdPct" double precision DEFAULT 1.0 NOT NULL,
    "minActiveAdvisors" integer DEFAULT 0 NOT NULL,
    "minActiveBMs" integer DEFAULT 0 NOT NULL,
    "minActiveFMs" integer DEFAULT 0 NOT NULL,
    "teamActiveAmount" double precision DEFAULT 0 NOT NULL,
    "teamActiveThresholdPct" double precision DEFAULT 0 NOT NULL,
    "vehicleAmount" double precision DEFAULT 0 NOT NULL,
    "vehicleThresholdPct" double precision DEFAULT 0 NOT NULL,
    "after6MonthTarget" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."PositionTarget" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."PositionTarget_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."PositionTarget_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."PositionTarget_id_seq" OWNED BY "public"."PositionTarget"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."Position_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Position_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Position_id_seq" OWNED BY "public"."Position"."id";



CREATE TABLE IF NOT EXISTS "public"."Profit" (
    "id" integer NOT NULL,
    "investmentId" integer NOT NULL,
    "investmentAmount" double precision DEFAULT 0 NOT NULL,
    "commissionPayout" double precision DEFAULT 0 NOT NULL,
    "totalProfit" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."Profit" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Profit_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Profit_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Profit_id_seq" OWNED BY "public"."Profit"."id";



CREATE TABLE IF NOT EXISTS "public"."Quotation" (
    "id" "text" NOT NULL,
    "clientName" "text" NOT NULL,
    "clientNic" "text",
    "clientAge" integer,
    "planType" "public"."QuotationPlanType" NOT NULL,
    "frequency" "public"."QuotationFrequency" NOT NULL,
    "duration" integer NOT NULL,
    "premium" double precision NOT NULL,
    "retirementAge" integer,
    "totalInvested" double precision NOT NULL,
    "interestRate" double precision NOT NULL,
    "interestEarned" double precision NOT NULL,
    "maturityAmount" double precision NOT NULL,
    "notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" "uuid" NOT NULL
);


ALTER TABLE "public"."Quotation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."User" (
    "role" "public"."Role" DEFAULT 'EMPLOYEE'::"public"."Role" NOT NULL,
    "branchId" integer,
    "status" boolean DEFAULT true NOT NULL,
    "email" "text",
    "name" "text",
    "id" "uuid" NOT NULL
);


ALTER TABLE "public"."User" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ActivityLog" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ActivityLog_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Beneficiary" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Beneficiary_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Branch" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Branch_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Client" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Client_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ClientDocument" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ClientDocument_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ClientDocumentRequest" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ClientDocumentRequest_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Commission" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Commission_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."CommissionRate" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."CommissionRate_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."FinancialPlan" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."FinancialPlan_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Investment" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Investment_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Member" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Member_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."MemberBranch" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."MemberBranch_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."MonthlyEvaluation" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."MonthlyEvaluation_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."MonthlyPayroll" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."MonthlyPayroll_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Nominee" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Nominee_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."PermanentEvaluation" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."PermanentEvaluation_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Position" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Position_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."PositionSalary" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."PositionSalary_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."PositionTarget" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."PositionTarget_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Profit" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Profit_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ActivityLog"
    ADD CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Beneficiary"
    ADD CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Branch"
    ADD CONSTRAINT "Branch_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ClientDocumentRequest"
    ADD CONSTRAINT "ClientDocumentRequest_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ClientDocument"
    ADD CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Client"
    ADD CONSTRAINT "Client_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."CommissionRate"
    ADD CONSTRAINT "CommissionRate_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Commission"
    ADD CONSTRAINT "Commission_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."FinancialPlan"
    ADD CONSTRAINT "FinancialPlan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Investment"
    ADD CONSTRAINT "Investment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."MemberBranch"
    ADD CONSTRAINT "MemberBranch_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Member"
    ADD CONSTRAINT "Member_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."MonthlyEvaluation"
    ADD CONSTRAINT "MonthlyEvaluation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."MonthlyPayroll"
    ADD CONSTRAINT "MonthlyPayroll_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Nominee"
    ADD CONSTRAINT "Nominee_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PermanentEvaluation"
    ADD CONSTRAINT "PermanentEvaluation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PositionSalary"
    ADD CONSTRAINT "PositionSalary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PositionTarget"
    ADD CONSTRAINT "PositionTarget_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Position"
    ADD CONSTRAINT "Position_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Profit"
    ADD CONSTRAINT "Profit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Quotation"
    ADD CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



CREATE INDEX "ActivityLog_branchId_idx" ON "public"."ActivityLog" USING "btree" ("branchId");



CREATE INDEX "ActivityLog_entity_entityId_idx" ON "public"."ActivityLog" USING "btree" ("entity", "entityId");



CREATE INDEX "ActivityLog_performedById_idx" ON "public"."ActivityLog" USING "btree" ("performedById");



CREATE UNIQUE INDEX "ClientDocumentRequest_token_key" ON "public"."ClientDocumentRequest" USING "btree" ("token");



CREATE UNIQUE INDEX "Client_drivingLicense_key" ON "public"."Client" USING "btree" ("drivingLicense");



CREATE UNIQUE INDEX "Client_email_key" ON "public"."Client" USING "btree" ("email");



CREATE UNIQUE INDEX "Client_nic_key" ON "public"."Client" USING "btree" ("nic");



CREATE UNIQUE INDEX "Client_passportNo_key" ON "public"."Client" USING "btree" ("passportNo");



CREATE UNIQUE INDEX "Client_proposalFormNo_key" ON "public"."Client" USING "btree" ("proposalFormNo");



CREATE UNIQUE INDEX "CommissionRate_positionId_key" ON "public"."CommissionRate" USING "btree" ("positionId");



CREATE INDEX "Commission_investmentId_idx" ON "public"."Commission" USING "btree" ("investmentId");



CREATE INDEX "Commission_memberEmpNo_idx" ON "public"."Commission" USING "btree" ("memberEmpNo");



CREATE UNIQUE INDEX "Commission_refNumber_key" ON "public"."Commission" USING "btree" ("refNumber");



CREATE UNIQUE INDEX "MemberBranch_memberId_branchId_key" ON "public"."MemberBranch" USING "btree" ("memberId", "branchId");



CREATE UNIQUE INDEX "Member_email_key" ON "public"."Member" USING "btree" ("email");



CREATE UNIQUE INDEX "Member_empNo_key" ON "public"."Member" USING "btree" ("empNo");



CREATE UNIQUE INDEX "Member_userId_key" ON "public"."Member" USING "btree" ("userId");



CREATE UNIQUE INDEX "MonthlyEvaluation_memberId_year_month_key" ON "public"."MonthlyEvaluation" USING "btree" ("memberId", "year", "month");



CREATE UNIQUE INDEX "MonthlyPayroll_memberId_year_month_key" ON "public"."MonthlyPayroll" USING "btree" ("memberId", "year", "month");



CREATE UNIQUE INDEX "PermanentEvaluation_memberId_year_month_key" ON "public"."PermanentEvaluation" USING "btree" ("memberId", "year", "month");



CREATE UNIQUE INDEX "PositionSalary_positionId_key" ON "public"."PositionSalary" USING "btree" ("positionId");



CREATE UNIQUE INDEX "PositionTarget_positionId_periodNumber_monthNumber_key" ON "public"."PositionTarget" USING "btree" ("positionId", "periodNumber", "monthNumber");



CREATE UNIQUE INDEX "Position_rank_key" ON "public"."Position" USING "btree" ("rank");



CREATE UNIQUE INDEX "Profit_investmentId_key" ON "public"."Profit" USING "btree" ("investmentId");



CREATE INDEX "Quotation_createdAt_idx" ON "public"."Quotation" USING "btree" ("createdAt");



CREATE INDEX "Quotation_createdById_idx" ON "public"."Quotation" USING "btree" ("createdById");



CREATE INDEX "Quotation_planType_idx" ON "public"."Quotation" USING "btree" ("planType");



CREATE UNIQUE INDEX "User_email_key" ON "public"."User" USING "btree" ("email");



ALTER TABLE ONLY "public"."ActivityLog"
    ADD CONSTRAINT "ActivityLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ActivityLog"
    ADD CONSTRAINT "ActivityLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."Member"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Beneficiary"
    ADD CONSTRAINT "Beneficiary_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ClientDocumentRequest"
    ADD CONSTRAINT "ClientDocumentRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ClientDocumentRequest"
    ADD CONSTRAINT "ClientDocumentRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ClientDocument"
    ADD CONSTRAINT "ClientDocument_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."ClientDocumentRequest"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Client"
    ADD CONSTRAINT "Client_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Client"
    ADD CONSTRAINT "Client_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Member"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Client"
    ADD CONSTRAINT "Client_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."CommissionRate"
    ADD CONSTRAINT "CommissionRate_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."Position"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Commission"
    ADD CONSTRAINT "Commission_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Commission"
    ADD CONSTRAINT "Commission_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "public"."Investment"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Commission"
    ADD CONSTRAINT "Commission_memberEmpNo_fkey" FOREIGN KEY ("memberEmpNo") REFERENCES "public"."Member"("empNo") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Investment"
    ADD CONSTRAINT "Investment_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "public"."Member"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Investment"
    ADD CONSTRAINT "Investment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "public"."Beneficiary"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Investment"
    ADD CONSTRAINT "Investment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Investment"
    ADD CONSTRAINT "Investment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Investment"
    ADD CONSTRAINT "Investment_nomineeId_fkey" FOREIGN KEY ("nomineeId") REFERENCES "public"."Nominee"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Investment"
    ADD CONSTRAINT "Investment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."FinancialPlan"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."MemberBranch"
    ADD CONSTRAINT "MemberBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."MemberBranch"
    ADD CONSTRAINT "MemberBranch_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Member"
    ADD CONSTRAINT "Member_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."Position"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Member"
    ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."MonthlyEvaluation"
    ADD CONSTRAINT "MonthlyEvaluation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."MonthlyPayroll"
    ADD CONSTRAINT "MonthlyPayroll_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Nominee"
    ADD CONSTRAINT "Nominee_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PermanentEvaluation"
    ADD CONSTRAINT "PermanentEvaluation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PositionSalary"
    ADD CONSTRAINT "PositionSalary_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."Position"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."PositionTarget"
    ADD CONSTRAINT "PositionTarget_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."Position"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Profit"
    ADD CONSTRAINT "Profit_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "public"."Investment"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Quotation"
    ADD CONSTRAINT "Quotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;







































































































































































































