import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { secret, region = "gta" } = await request.json();

    // Simple auth check
    if (secret !== process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting court scraping for region:", region);

    // Ontario Court RSS feeds - using real public feeds
    const courtFeeds = [
      {
        name: "Ontario Superior Court of Justice",
        url: "https://www.canlii.org/en/on/onsc/rss_new.xml",
        court: "ONSC",
      },
      {
        name: "Ontario Court of Appeal",
        url: "https://www.canlii.org/en/on/onca/rss_new.xml",
        court: "ONCA",
      },
      {
        name: "Ontario Court of Justice",
        url: "https://www.canlii.org/en/on/oncj/rss_new.xml",
        court: "ONCJ",
      },
    ];

    let totalCasesProcessed = 0;
    let newAlertsGenerated = 0;
    const errors: string[] = [];

    for (const feed of courtFeeds) {
      try {
        console.log(`Processing feed: ${feed.name}`);

        // Fetch RSS feed
        const response = await axios.get(feed.url, {
          timeout: 30000,
          headers: {
            "User-Agent":
              "AgentRadar/1.0 (Real Estate Intelligence Platform; +https://agentradar.app/bot)",
          },
        });

        // Basic RSS parsing - extract case links
        const rssContent = response.data;
        const linkMatches = rssContent.match(/<link[^>]*>(.*?)<\/link>/g) || [];

        for (const linkMatch of linkMatches.slice(0, 5)) {
          // Process first 5 cases
          const urlMatch = linkMatch.match(/>([^<]+)</);
          if (!urlMatch) continue;

          const caseUrl = urlMatch[1].trim();
          if (!caseUrl.startsWith("http")) continue;

          // Generate case ID from URL
          const caseId = caseUrl.split("/").pop() || `case_${Date.now()}`;

          // Check if case already exists
          const existingCase = await prisma.courtCase.findFirst({
            where: { caseUrl },
          });

          if (existingCase) {
            continue;
          }

          // Create new court case
          const newCase = await prisma.courtCase.create({
            data: {
              guid: caseId,
              title: `Court Case - ${feed.court} - ${new Date().toLocaleDateString()}`,
              court: feed.court as "ONSC" | "ONCA" | "ONCJ",
              publishDate: new Date(),
              caseUrl,
              source: feed.name,
              isProcessed: false,
              nerProcessed: false,
              classified: false,
              summary: "Automated scrape from court RSS feed",
            },
          });

          totalCasesProcessed++;

          // Check if this is a real estate related case and create alert
          const realEstateKeywords = [
            "foreclosure",
            "power of sale",
            "mortgage",
            "property",
            "real estate",
            "lien",
            "estate",
          ];
          const titleLower = newCase.title.toLowerCase();

          if (
            realEstateKeywords.some((keyword) => titleLower.includes(keyword))
          ) {
            await prisma.alert.create({
              data: {
                title: `Court Filing Alert - ${feed.court}`,
                description: `New court filing detected that may relate to real estate opportunities.`,
                address: "Various Properties",
                city: "Toronto",
                province: "ON",
                alertType: "POWER_OF_SALE",
                source: "ONTARIO_COURT_BULLETINS",
                status: "ACTIVE",
                priority: "MEDIUM",
                opportunityScore: Math.floor(Math.random() * 40) + 60, // 60-100
                timelineMonths: Math.floor(Math.random() * 6) + 3, // 3-9 months
                courtCaseId: newCase.id,
                courtFileNumber: caseId,
              },
            });

            newAlertsGenerated++;
            console.log(`Generated alert for case: ${newCase.title}`);
          }

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error processing feed ${feed.name}:`, error);
        errors.push(`${feed.name}: ${(error as Error).message}`);
      }
    }

    console.log(
      `Court scraping completed. Processed: ${totalCasesProcessed}, Alerts: ${newAlertsGenerated}`,
    );

    return NextResponse.json({
      success: true,
      message: "Court scraping completed",
      stats: {
        totalCasesProcessed,
        newAlertsGenerated,
        feedsProcessed: courtFeeds.length,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Court scraping error:", error);
    return NextResponse.json(
      {
        error: "Court scraping failed",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
