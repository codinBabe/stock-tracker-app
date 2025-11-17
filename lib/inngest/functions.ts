import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "../nodemailer";
import { inngest } from "./client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "./prompt";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "../utils";

export const sendSignupEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
        - Country: ${event.data.country}
        - Investment goals: ${event.data.investmentGoals}
        - Risk tolerance: ${event.data.riskTolerance}
        - Preferred industry: ${event.data.preferredIndustry}
        `;
    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{user_profile}}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0].content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.";

      const {
        data: { email, name },
      } = event;
      return await sendWelcomeEmail({
        email,
        name,
        intro: introText,
      });
    });
    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],

  async ({ step }) => {
    // Get all users with email and name
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0) {
      return {
        success: false,
        message: "No users found for news email",
      };
    }
    // For each user, get their watchlist symbols and fetch news (max 6 articles)
    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{ user: User; articles: MarketNewsArticle[] }> = [];
      for (const user of users as User[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = await getNews(symbols);

          articles = (articles || []).slice(0, 6);

          if (!articles || articles.length === 0) {
            // If no articles found for user's symbols, get general news
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          perUser.push({ user, articles });
        } catch (e) {
          console.error("Error processing user for daily news", e);
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });

    // summarize news via AI
    const userNewsSummaries: { user: User; newsContent: string | null }[] = [];
    for (const { user, articles } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(articles, null, 2)
        );
        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
          body: {
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
          },
        });

        const part = response.candidates?.[0].content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) ||
          "Here is your daily market news summary.";
        userNewsSummaries.push({ user, newsContent });
      } catch (e) {
        console.error("Error summarizing news for user", e);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Send emails
    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent,
          });
        })
      );
    });
    return {
      success: true,
      message: "Daily news summary emails sent successfully",
    };
  }
);
