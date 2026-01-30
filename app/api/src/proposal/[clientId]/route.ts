import puppeteer from "puppeteer";
import { NextResponse } from "next/server";
import {proposalTemplate}  from "../../../../components/templates/proposalTemplate";

export async function GET(
  _: Request,
  { params }: { params: { clientId: string } }
) {
  const proposalData = {
    fullName: "Dev Sanjana",
    nic: "200012345678",
    address: "Colombo, Sri Lanka",
    phone: "0771234567",
    planName: "Super Green Plan",
    investmentAmount: 500000,
    startDate: "2026-02-01",
    signatureUrl: "https://dummyimage.com/300x100/000/fff&text=Signature",
    clientPhoto: "https://dummyimage.com/300x400/ccc/000&text=Photo",
  };

  const html = proposalTemplate(proposalData);

  const browser = await puppeteer.launch({
    headless: "new" as any
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  const pdfBuffer = Buffer.from(pdf); // Convert Uint8Array → Buffer


  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=proposal.pdf",
    },
  });
}
