"use server"

import puppeteer from "puppeteer";
import { proposalTemplate } from "@/app/components/templates/proposalTemplate";
import { prisma } from "@/lib/prisma";

export async function generateProposalPDF(clientId: number) {
  try {
    // Fetch client data for the proposal
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        investments: {
          include: { plan: true },
          orderBy: { investmentDate: "desc" },
          take: 1,
        },
      },
    });

    if (!client) {
      throw new Error("Client not found");
    }

    const investment = client.investments[0];

    const proposalData = {
      fullName: client.fullName,
      nic: client.nic || "N/A",
      address: client.address,
      phone: client.phoneMobile || client.phoneLand || "N/A",
      planName: investment?.plan?.name || "N/A",
      investmentAmount: investment?.amount || 0,
      startDate: investment?.investmentDate
        ? new Date(investment.investmentDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      signatureUrl: client.signature || "",
      clientPhoto: "", // Add if available
    };

    const html = proposalTemplate(proposalData);

    const browser = await puppeteer.launch({
      headless: "new" as any,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // Convert to base64 to send to client
    const base64Pdf = Buffer.from(pdf).toString("base64");
    return base64Pdf;
  } catch (err) {
    console.error("PDF generation failed:", err);
    throw new Error("Failed to generate proposal PDF");
  }
}
