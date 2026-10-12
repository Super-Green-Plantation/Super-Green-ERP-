import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Super Green ERP User Manual</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Sinhala:wght@400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page) " / " counter(pages);
      }
    }

    body {
      font-family: 'Inter', 'Noto Sans Sinhala', 'Nirmala UI', sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 13px;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    .cover {
      page-break-after: always;
      text-align: center;
      padding-top: 60px;
      padding-bottom: 60px;
    }

    .badge {
      display: inline-block;
      padding: 6px 16px;
      background: #e8f5e9;
      color: #1b4332;
      font-weight: 700;
      font-size: 12px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
      border: 1px solid #c8e6c9;
    }

    .cover h1 {
      color: #1b4332;
      font-size: 32px;
      font-weight: 800;
      margin: 10px 0 5px 0;
      letter-spacing: -0.5px;
    }

    .cover .subtitle-si {
      color: #2d6a4f;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 25px;
    }

    .cover .doc-title {
      color: #40916c;
      font-size: 20px;
      font-weight: 700;
      margin: 30px 0 10px 0;
    }

    .cover .doc-title-si {
      color: #334155;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 40px;
    }

    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      max-width: 480px;
      margin: 0 auto;
      text-align: left;
    }

    .meta-box div {
      margin-bottom: 8px;
      font-size: 12px;
    }

    .meta-box div:last-child {
      margin-bottom: 0;
    }

    .meta-label {
      font-weight: 700;
      color: #1b4332;
      display: inline-block;
      width: 140px;
    }

    /* Section Styling */
    h2.section-title {
      color: #1b4332;
      font-size: 19px;
      font-weight: 800;
      border-bottom: 2px solid #2d6a4f;
      padding-bottom: 6px;
      margin-top: 36px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      page-break-after: avoid;
    }

    h2.section-title span.si {
      color: #40916c;
      font-size: 16px;
      font-weight: 600;
    }

    h3.sub-title {
      color: #2d6a4f;
      font-size: 15px;
      font-weight: 700;
      margin-top: 20px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    p {
      margin-top: 0;
      margin-bottom: 10px;
      text-align: justify;
    }

    .si-text {
      color: #475569;
      font-size: 12.5px;
      display: block;
      margin-top: 3px;
    }

    /* Callout */
    .callout {
      background: #f0fdf4;
      border-left: 4px solid #2d6a4f;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin: 16px 0;
      page-break-inside: avoid;
    }

    .callout-title {
      font-weight: 700;
      color: #1b4332;
      margin-bottom: 4px;
      font-size: 13px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
      page-break-inside: avoid;
    }

    th {
      background: #1b4332;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 10px 12px;
      border: 1px solid #1b4332;
    }

    th span.th-si {
      display: block;
      font-size: 11px;
      color: #d8f3dc;
      font-weight: 500;
    }

    td {
      padding: 9px 12px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Lists */
    ul {
      margin-top: 6px;
      margin-bottom: 12px;
      padding-left: 20px;
    }

    li {
      margin-bottom: 6px;
    }

    .footer-note {
      text-align: center;
      margin-top: 50px;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }

    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover">
    <div class="badge">Official Documentation</div>
    <h1>SUPER GREEN PLANTATIONS (PVT) LTD</h1>
    <div class="subtitle-si">සුපර් ග්‍රීන් ප්ලාන්ටේෂන්ස් සමාගම</div>
    <div class="doc-title">ENTERPRISE RESOURCE PLANNING (ERP) SYSTEM</div>
    <div class="doc-title-si">පරිශීලක අත්පොත සහ සම්පූර්ණ මෙහෙයුම් මාර්ගෝපදේශය (User Manual)</div>

    <div class="meta-box">
      <div><span class="meta-label">System Version:</span> ERP v2.0 (Plantation Operations)</div>
      <div><span class="meta-label">Document:</span> Operations & Training Manual</div>
      <div><span class="meta-label">Language:</span> Bilingual (English & සිංහල)</div>
      <div><span class="meta-label">Release Date:</span> October 2026</div>
      <div><span class="meta-label">Audience:</span> All Management, HR, Branch Managers & Field Staff</div>
    </div>
  </div>

  <!-- SECTION 1 -->
  <h2 class="section-title">
    <span>1. System Overview & User Roles</span>
    <span class="si">පද්ධතිය පිළිබඳ හැඳින්වීම සහ නිලතල</span>
  </h2>
  <p>
    Super Green ERP is a mission-critical enterprise platform designed to automate and streamline investment management, multi-tier commission distribution (ORC), monthly proposal collections, staff performance tracking, and branch operations across all regional plantation offices.
    <span class="si-text">සුපර් ග්‍රීන් ERP යනු ආයෝජන ලියාපදිංචිය, බහු-ස්ථර කොමිස් බෙදාහැරීම (ORC), මාසික යෝජනා කළමනාකරණය, වැටුප් සැකසීම සහ දිවයින පුරා ශාඛා ජාලය පාලනය කරන ඒකාබද්ධ පරිගණක පද්ධතියකි.</span>
  </p>

  <h3 class="sub-title">System Role Permissions & Access Matrix (පද්ධති බලතල)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 18%;">Role Code<span class="th-si">නිලතල කේතය</span></th>
        <th style="width: 25%;">Designation<span class="th-si">තනතුර</span></th>
        <th style="width: 57%;">Scope & Key Responsibilities<span class="th-si">වගකීම් සහ ප්‍රවේශ බලතල</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>ADMIN / DEV</strong></td>
        <td>System Administrator<br>පද්ධති පරිපාලක</td>
        <td>Full unrestricted access across all branches, raw database logs, member credentials, and system settings.</td>
      </tr>
      <tr>
        <td><strong>HR</strong></td>
        <td>Human Resources Manager<br>මානව සම්පත් කළමනාකරු</td>
        <td>Employee management, salary structures, probation evaluation, monthly payroll calculation, and advance reconciliation.</td>
      </tr>
      <tr>
        <td><strong>AGM / ZM</strong></td>
        <td>Asst. General Manager / Zonal Manager<br>සහකාර සාමාන්‍යාධිකාරී / කලාප කළමනාකරු</td>
        <td>Multi-branch regional oversight, Zonal KPIs review, and high-level investment authorization.</td>
      </tr>
      <tr>
        <td><strong>RM</strong></td>
        <td>Regional Manager<br>ප්‍රාදේශීය කළමනාකරු</td>
        <td>Direct oversight of designated region and all subordinate child branches, tracking regional volume achievements.</td>
      </tr>
      <tr>
        <td><strong>BM</strong></td>
        <td>Branch Manager<br>ශාඛා කළමනාකරු</td>
        <td>Day-to-day branch supervision, investor proposal first-line approvals, and branch employee management.</td>
      </tr>
      <tr>
        <td><strong>FM / TL</strong></td>
        <td>Field Manager / Team Leader<br>ක්ෂේත්‍ර කළමනාකරු / කණ්ඩායම් නායක</td>
        <td>Mentors a team of Field Advisors (FAs), drives group targets, and earns Upline Overriding Commission (ORC).</td>
      </tr>
      <tr>
        <td><strong>FA</strong></td>
        <td>Field Advisor<br>ක්ෂේත්‍ර උපදේශක</td>
        <td>Direct investor onboarding, proposal collection, KYC submissions, and personal commission earners.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 2 -->
  <h2 class="section-title">
    <span>2. Authentication & Navigation</span>
    <span class="si">පද්ධතියට පිවිසීම සහ භාවිතය</span>
  </h2>
  <ul>
    <li>
      <strong>Web Portal Access:</strong> Open Google Chrome or Microsoft Edge and navigate to the ERP login page. Enter your company email and password.
      <span class="si-text">ERP වෙබ් පිටුවට පිවිස ඔබගේ ලියාපදිංචි Email ලිපිනය සහ මුරපදය ඇතුලත් කර Sign In වන්න.</span>
    </li>
    <li>
      <strong>Session Timeout & Security:</strong> For security, user sessions expire when inactive for an extended period. If prompted with an "Unauthorized" state, simply log out and sign in again.
      <span class="si-text">ආරක්ෂාව සඳහා, දිගු වේලාවක් භාවිත නොකළහොත් ගිණුමෙන් ස්වයංක්‍රීයව ඉවත් වේ (Session timeout). එවිට නැවත Sign In වන්න.</span>
    </li>
    <li>
      <strong>Role Redirection:</strong> After login, the system automatically redirects you to your permitted dashboard based on your role privileges.
      <span class="si-text">පිවිසි පසු ඔබගේ තනතුර අනුව අදාල Dashboard පිටුවට ස්වයංක්‍රීයව යොමු කරනු ඇත.</span>
    </li>
  </ul>

  <!-- SECTION 3 -->
  <h2 class="section-title">
    <span>3. Dashboard & Target Analytics</span>
    <span class="si">ප්‍රධාන පාලක පුවරුව සහ ඉලක්ක</span>
  </h2>
  <p>
    The Executive Dashboard consolidates real-time financial figures, volume hurdles, and team metrics:
    <span class="si-text">ප්‍රධාන පාලක පුවරුව මගින් ආයෝජන වටිනාකම, ශාඛා කාර්යසාධනය, සාක්ෂාත් කරගත් ඉලක්ක සහ කොමිස් වියදම් එකවර බලාගත හැක.</span>
  </p>

  <div class="callout">
    <div class="callout-title">📌 Incentive Forecast Status Guide (දිරිගැන්වීම් තත්ව විග්‍රහය)</div>
    <div>• <strong>Full Hit (>=100%):</strong> Achieved complete target -> Eligible for full monthly bonus/incentive.</div>
    <div>• <strong>Partial Hit (>=25% for FA):</strong> Met the 25% hurdle -> Eligible for Rs. 20,000 partial incentive.</div>
    <div>• <strong>Miss (&lt;75% / &lt;25%):</strong> Below the required threshold -> Incentive not earned.</div>
    <div>• <strong>No Target:</strong> Member's position does not have a performance target configured.</div>
    <div class="si-text">සම්පූර්ණ ඉලක්කය සාක්ෂාත් කළ විට Full Hit ද, FA නිලධාරීන්ට 25% සීමාව පසුකළ විට Partial Hit (රු. 20,000) ද හිමිවේ.</div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 4 -->
  <h2 class="section-title">
    <span>4. Client Registration & KYC Workflow</span>
    <span class="si">නව ගනුදෙනුකරුවන් ලියාපදිංචිය (KYC)</span>
  </h2>
  <p>
    Before creating any investment agreements or issuing certificates, all investors must be registered in the ERP:
    <span class="si-text">ආයෝජන ඇතුලත් කිරීමට පෙර සෑම ආයෝජකයෙකුම පද්ධතිය තුළ ලියාපදිංචි කළ යුතුය:</span>
  </p>
  <ul>
    <li><strong>Step 1:</strong> Navigate to <code>Clients</code> &rarr; Click <code>+ New Client</code>.</li>
    <li><strong>Step 2 (Applicant Details):</strong> Fill Full Name, Name with Initials, National Identity Card (NIC / Passport), Permanent Address, Contact Phone Numbers, and Email.</li>
    <li><strong>Step 3 (Nominee / Beneficiary):</strong> Record Nominee Name, Relationship, and NIC number. Crucial for plantation deed execution.
      <span class="si-text">ප්‍රතිලාභියාගේ (Nominee) සම්පූර්ණ නම, ඥාතිත්වය සහ හැඳුනුම්පත් අංකය නිවැරදිව සටහන් කරන්න.</span>
    </li>
    <li><strong>Step 4 (Bank Account):</strong> Record Bank Name, Branch, Account Number, and Account Holder Name for future dividend disbursements.</li>
    <li><strong>Step 5 (KYC Documents):</strong> Upload scanned NIC (Front & Back) and the signed proposal form &rarr; Click <code>Submit</code>.</li>
  </ul>

  <!-- SECTION 5 -->
  <h2 class="section-title">
    <span>5. Investments & Agreement Generation</span>
    <span class="si">ආයෝජන සහ ගිවිසුම් කළමනාකරණය</span>
  </h2>
  <p>
    The ERP manages the full lifecycle of plantation contracts (Green Gold, Vanilla, Coconut, Timber units):
  </p>
  <ul>
    <li><strong>1. Select Registered Client:</strong> Search the client by NIC or Name.</li>
    <li><strong>2. Select Plan & Units:</strong> Choose the investment package (e.g. Vanilla Vines, Green Gold units) and quantity.</li>
    <li><strong>3. Enter Investment Capital & Date:</strong> Enter the payment amount and deposit receipt date.</li>
    <li><strong>4. Assign Advisor & Upline:</strong> Select the Field Advisor (FA) who closed the deal. The system links their Upline FM, BM, RM, ZM, AGM, and CCO.
      <span class="si-text">ආයෝජනය ගෙන ආ ක්ෂේත්‍ර උපදේශකවරයා (FA) තෝරන්න. ඒ අනුව ඉහළ කණ්ඩායම් නායකයින් ස්වයංක්‍රීයව පෙළගැසේ.</span>
    </li>
    <li><strong>5. Approval Lifecycle:</strong> The investment enters <code>PENDING</code>. The Branch Manager (BM) inspects the payment receipt and clicks <code>APPROVED</code>.
      <span class="si-text">ශාඛා කළමනාකරු (BM) මුදල් රිසිට්පත පරීක්ෂා කර APPROVED කළ පසු එම පරිමාව උපදේශකයාගේ මාසික ප්‍රගතියට එක්වේ.</span>
    </li>
    <li><strong>6. Download Agreement:</strong> Click <code>Download Agreement</code> to export the legal Sinhala contract (.docx / PDF) with all pre-filled client, nominee, and plantation details.
      <span class="si-text">අනුමත වූ පසු 'Download Agreement' මගින් නිල සිංහල නීතිමය ගිවිසුම Word හෝ PDF ලෙස බාගත කර මුද්‍රණය කළ හැක.</span>
    </li>
  </ul>

  <!-- SECTION 6 -->
  <h2 class="section-title">
    <span>6. Commissions & ORC Distribution</span>
    <span class="si">කොමිස් සහ ORC බෙදාහැරීමේ ක්‍රමවේදය</span>
  </h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Commission Type<span class="th-si">කොමිස් වර්ගය</span></th>
        <th style="width: 25%;">Beneficiary<span class="th-si">හිමිවන නිලධාරියා</span></th>
        <th style="width: 50%;">Calculation Formula & Threshold<span class="th-si">ගණනය කිරීමේ සූත්‍රය සහ සීමාවන්</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Personal Commission</strong><br>(පුද්ගලික කොමිස්)</td>
        <td>Field Advisor (FA)</td>
        <td>
          • <strong>Probation:</strong> High Rate = 10%, Low Rate = 7%<br>
          • <strong>Permanent:</strong> High Rate = 8%, Low Rate = 5%<br>
          • <em>Threshold Hurdle:</em> LKR 500,000 monthly volume.
        </td>
      </tr>
      <tr>
        <td><strong>Upline ORC</strong><br>(Overriding Commission)</td>
        <td>FM, BM, RM, ZM, AGM, CCO</td>
        <td>Hierarchical percentage scale assigned in Position settings distributed to each management tier.</td>
      </tr>
      <tr>
        <td><strong>Excess Commission</strong><br>(අතිරේක කොමිස්)</td>
        <td>Marketing Staff exceeding targets</td>
        <td>0.5% (0.005) or after-6-month excess rate on every rupee achieved <em>above</em> the monthly target.</td>
      </tr>
      <tr>
        <td><strong>Chairman Fund</strong><br>(සභාපති අරමුදල)</td>
        <td>Company Executive Pool</td>
        <td>0.2% (0.002) company-wide allocation on approved total investment volume.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 7 -->
  <h2 class="section-title">
    <span>7. HR Operations, Payroll & Allowances</span>
    <span class="si">මානව සම්පත් සහ වැටුප් සැකසීම</span>
  </h2>
  <p>
    The ERP supports two payroll tracks: <strong>Marketing Track</strong> (Target & Performance-driven) and <strong>Head Office Track</strong> (Fixed Base Salary + Executive Allowances).
    <span class="si-text">අලෙවි අංශය (Marketing Track) සහ ප්‍රධාන කාර්යාල කාර්ය මණ්ඩලය (Head Office Track) සඳහා වෙන් වෙන්ව වැටුප් සකස් කෙරේ.</span>
  </p>

  <h3 class="sub-title">Monthly Payroll Execution Steps for HR:</h3>
  <ul>
    <li><strong>Step 1:</strong> Go to <code>HR</code> &rarr; <code>Payroll</code>.</li>
    <li><strong>Step 2:</strong> Select the Branch, Year, and Month.</li>
    <li><strong>Step 3:</strong> Click <code>Generate Preview</code> to review member targets, commissions, allowances, and advance deductions.</li>
    <li><strong>Step 4:</strong> Click <code>Run Monthly Payroll</code> to commit and lock the payroll records in the database.</li>
    <li><strong>Step 5:</strong> Export to Excel or print individual employee Pay Sheets.</li>
  </ul>

  <div class="callout">
    <div class="callout-title">📌 Marketing Allowances & Statutory Deductions (දීමනා සහ කැපීම්)</div>
    <div>• <strong>Vehicle Allowance (වාහන දීමනාව):</strong> Earned when volume reaches the configured threshold (e.g. 75% or 100% of target).</div>
    <div>• <strong>Team Activation (කණ්ඩායම් සක්‍රීය දීමනාව):</strong> Earned when managers maintain the minimum required active advisors with sales.</div>
    <div>• <strong>Salary Advance Deductions:</strong> Automatically deducted from net salary during monthly payroll.</div>
    <div>• <strong>Statutory Deductions:</strong> EPF Employee (8%), EPF Employer (12%), ETF Employer (3%).</div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 8 -->
  <h2 class="section-title">
    <span>8. Branch Network Hierarchy</span>
    <span class="si">ශාඛා ජාලය සහ කලාපීය ව්‍යුහය</span>
  </h2>
  <p>
    Branches are arranged in a hierarchical network: <strong>Head Office &rarr; Zones &rarr; Regions &rarr; Branches</strong>.
    Regional Managers (RMs) and Zonal Managers (ZMs) automatically view consolidated analytics across their primary branches and all child branches.
    <span class="si-text">ප්‍රාදේශීය කළමනාකරුවන්ට (RM) සහ කලාප කළමනාකරුවන්ට (ZM) තමන් යටතේ ඇති සියලුම උප ශාඛාවල ආයෝජන සහ කාර්යසාධනය එකවර බලාගත හැක.</span>
  </p>

  <!-- SECTION 9 -->
  <h2 class="section-title">
    <span>9. Automated Tasks & Background Crons</span>
    <span class="si">ස්වයංක්‍රීය පද්ධති කාර්යයන් (Crons)</span>
  </h2>
  <ul>
    <li>
      <strong>Investment Maturity Notifications:</strong> The system scans daily for maturing investments and delivers in-app notifications to HR and branch staff.
      <span class="si-text">කල්පිරෙන ආයෝජන පිළිබඳව HR සහ උපදේශකයින්ට ස්වයංක්‍රීයව දැනුම්දීම් (Notifications) ලැබේ.</span>
    </li>
    <li>
      <strong>Inactive Advisor Auto-Deactivation:</strong> Non-management advisors with zero investment deals for 2 consecutive months are automatically deactivated by the monthly cron to maintain an active sales roster.
      <span class="si-text">මාස 2 ක් පුරා කිසිදු අලෙවියක් සිදුනොකළ ක්ෂේත්‍ර උපදේශකයින් (FAs) ස්වයංක්‍රීයව අක්‍රීය (Deactivate) කරනු ලැබේ.</span>
    </li>
  </ul>

  <!-- SECTION 10 -->
  <h2 class="section-title">
    <span>10. Frequently Asked Questions (FAQs)</span>
    <span class="si">පොදු ගැටළු සහ විසඳුම් (FAQs)</span>
  </h2>

  <p><strong>Q1: Why did Dashboard targets show Rs. 0 previously?</strong></p>
  <p>
    <em>Answer:</em> Field advisors past their 6-month probation previously did not have their permanent target (LKR 2,500,000) mapped on uncalculated payroll rows. This has now been completely resolved: the system dynamically falls back to the Position Salary target and all historical database rows have been backfilled.
    <span class="si-text">පිළිතුර: මාස 6 අවසන් කළ උපදේශකයින්ගේ ස්ථීර ඉලක්කය (රු. 2,500,000) ස්වයංක්‍රීයව නොවැටීමේ දෝෂයක් පැවති අතර, එය සම්පූර්ණයෙන්ම නිවැරදි කර සියලුම වාර්තා යාවත්කාලීන කර ඇත.</span>
  </p>

  <p><strong>Q2: Why do I see an "Unauthorized" message when opening the dashboard?</strong></p>
  <p>
    <em>Answer:</em> This occurs when your browser login session has expired (e.g. left open overnight). Simply sign out and sign back in to refresh your authentication token.
    <span class="si-text">පිළිතුර: ඔබගේ ගිණුමේ කාලය (Session) අවසන් වී ඇති විට මෙය සිදුවේ. පද්ධතියෙන් ඉවත් වී (Sign Out) නැවත ඇතුල් වන්න.</span>
  </p>

  <p><strong>Q3: Can a deleted client or investment proposal be recovered?</strong></p>
  <p>
    <em>Answer:</em> For financial audit integrity, approved investments and active clients cannot be deleted by branch personnel. Only System Administrators (ADMIN) have permission to adjust or void approved records.
    <span class="si-text">පිළිතුර: මූල්‍ය විගණන ආරක්ෂාව සඳහා අනුමත කළ ආයෝජන සාමාන්‍ය පරිශීලකයින්ට මකා දැමිය නොහැක. ඒ සඳහා ප්‍රධාන පරිපාලක (ADMIN) අනුමැතිය අවශ්‍ය වේ.</span>
  </p>

  <div class="footer-note">
    Super Green Plantations (Pvt) Ltd — IT & Systems Engineering Team | Official Operations Manual 2026
  </div>

</body>
</html>
`;

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfPath = path.resolve(process.cwd(), "Super_Green_ERP_User_Manual.pdf");
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "15mm",
      bottom: "15mm",
      left: "12mm",
      right: "12mm",
    },
  });

  await browser.close();
  console.log(`Successfully generated PDF manual at: ${pdfPath}`);
}

main().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
