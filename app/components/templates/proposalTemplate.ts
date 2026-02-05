type ProposalData = {
  fullName: string;
  nic: string;
  address: string;
  phone: string;
  planName: string;
  investmentAmount: number;
  startDate: string;
  clientPhoto?: string;
  signatureUrl?: string;
};

export function proposalTemplate(data: ProposalData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #000;
    }

    h1 {
      text-align: center;
      font-size: 20px;
      margin-bottom: 10px;
    }

    .section {
      margin-top: 15px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .label {
      font-weight: bold;
      width: 35%;
    }

    .value {
      width: 65%;
      border-bottom: 1px dotted #000;
    }

    .photo {
      width: 120px;
      height: 150px;
      border: 1px solid #000;
      object-fit: cover;
    }

    .signature-box {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .signature img {
      width: 180px;
      height: auto;
      border-bottom: 1px solid #000;
    }

    .footer {
      position: fixed;
      bottom: 15mm;
      left: 20mm;
      right: 20mm;
      font-size: 10px;
      text-align: center;
    }
  </style>
</head>

<body>

  <h1>Client Proposal Form</h1>

  <div class="section">
    <div class="row">
      <div class="label">Full Name</div>
      <div class="value">${data.fullName}</div>
    </div>

    <div class="row">
      <div class="label">NIC / Passport</div>
      <div class="value">${data.nic}</div>
    </div>

    <div class="row">
      <div class="label">Address</div>
      <div class="value">${data.address}</div>
    </div>

    <div class="row">
      <div class="label">Contact No</div>
      <div class="value">${data.phone}</div>
    </div>
  </div>

  <div class="section">
    <h3>Investment Details</h3>

    <div class="row">
      <div class="label">Plan Name</div>
      <div class="value">${data.planName}</div>
    </div>

    <div class="row">
      <div class="label">Investment Amount</div>
      <div class="value">LKR ${data.investmentAmount.toLocaleString()}</div>
    </div>

    <div class="row">
      <div class="label">Start Date</div>
      <div class="value">${data.startDate}</div>
    </div>
  </div>

  <div class="section signature-box">
    <div>
      <p><strong>Client Signature</strong></p>
      <div class="signature">
        ${
          data.signatureUrl
            ? `<img src="${data.signatureUrl}" />`
            : `<p>________________________</p>`
        }
      </div>
    </div>

    ${
      data.clientPhoto
        ? `<img class="photo" src="${data.clientPhoto}" />`
        : `<div class="photo"></div>`
    }
  </div>

  <div class="footer">
    This is a system generated document. Signed digitally on ${new Date().toLocaleDateString()}
  </div>

</body>
</html>
`;
}
