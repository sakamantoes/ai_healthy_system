const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const axios = require("axios");
const { Sequelize, Op } = require("sequelize");
require("dotenv").config();

const {
  sequelize,
  User,
  Preference,
  Medication,
  Symptom,
  HealthGoal,
  Reminder,
  HealthMetric,
} = require("./models");
const { RAW } = require("sequelize/lib/query-types");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Email Transporter Configuration
const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify email configuration
emailTransporter.verify((error) => {
  if (error) {
    console.error("Email configuration error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// DeepSeek API Service
class DeepSeekAIService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseURL = "https://api.deepseek.com/v1/chat/completions";
    this.monthlyUsage = 0;
    this.usageLimit = process.env.DEEPSEEK_USAGE_LIMIT || 1000;
    this.lastBalanceCheck = null;
  }

  // Verify API configuration
  verifyConfiguration() {
    const issues = [];

    if (!this.apiKey) {
      issues.push("DEEPSEEK_API_KEY environment variable not set");
    }

    if (this.apiKey && this.apiKey.length < 20) {
      issues.push("API key appears invalid (too short)");
    }

    return {
      configured: issues.length === 0,
      issues,
      apiKeyPresent: !!this.apiKey,
      usage: {
        current: this.monthlyUsage,
        limit: this.usageLimit,
        remaining: this.usageLimit - this.monthlyUsage,
      },
    };
  }

  // Check API status and balance
  async checkAPIStatus() {
    try {
      const response = await axios.get("https://api.deepseek.com/v1/models", {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      });

      this.lastBalanceCheck = new Date();
      return {
        status: "active",
        models: response.data,
        lastChecked: this.lastBalanceCheck,
      };
    } catch (error) {
      const errorDetails = this.parseAPIError(error);
      return {
        status: "error",
        message: errorDetails.message,
        type: errorDetails.type,
        shouldUseFallback: errorDetails.shouldUseFallback,
      };
    }
  }

  // Parse API errors and determine appropriate action
  parseAPIError(error) {
    const errorData = error.response?.data;

    if (!errorData) {
      return {
        message: error.message,
        type: "network_error",
        shouldUseFallback: true,
      };
    }

    const errorMessage = errorData.error?.message || "Unknown API error";
    const errorType = errorData.error?.type || "unknown_error";
    const errorCode = errorData.error?.code || "unknown";

    // Determine if we should use fallback based on error type
    const balanceErrors = [
      "insufficient_balance",
      "invalid_request_error",
      "billing_error",
    ];
    const authErrors = ["invalid_api_key", "authentication_error"];
    const quotaErrors = ["quota_exceeded", "rate_limit_exceeded"];

    const shouldUseFallback =
      balanceErrors.some((e) => errorMessage.toLowerCase().includes(e)) ||
      authErrors.includes(errorType) ||
      quotaErrors.includes(errorType) ||
      balanceErrors.includes(errorCode);

    return {
      message: errorMessage,
      type: errorType,
      code: errorCode,
      shouldUseFallback,
    };
  }

  async generateHealthRecommendation(userData, healthData) {
    // Check usage limits before making API call
    if (this.monthlyUsage >= this.usageLimit) {
      console.warn(
        "Monthly usage limit reached, using fallback recommendation"
      );
      return this.getFallbackRecommendation(healthData);
    }

    try {
      if (!this.apiKey) {
        throw new Error("DeepSeek API key not configured");
      }

      const prompt = this.createHealthAnalysisPrompt(userData, healthData);

      const response = await axios.post(
        this.baseURL,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are a compassionate, knowledgeable health advisor specializing in chronic disease management. 
            Provide personalized, practical, and motivational health recommendations. Always maintain a supportive tone 
            and focus on actionable advice. Be specific and relevant to the user's condition.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 800,
          temperature: 0.7,
          top_p: 0.9,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      if (response.data.choices && response.data.choices[0]) {
        this.monthlyUsage++; // Only count successful calls
        return response.data.choices[0].message.content;
      } else {
        throw new Error("Invalid response format from DeepSeek API");
      }
    } catch (error) {
      const errorDetails = this.parseAPIError(error);

      console.error("DeepSeek API Error:", {
        message: errorDetails.message,
        type: errorDetails.type,
        code: errorDetails.code,
        timestamp: new Date().toISOString(),
      });

      // Log balance issues for admin monitoring
      if (errorDetails.shouldUseFallback) {
        console.error(
          "API Balance/Quota issue detected. Using fallback recommendation."
        );
        // Here you could add alerting to notify administrators
        this.notifyAdmins(errorDetails);
      }

      return this.getFallbackRecommendation(healthData);
    }
  }

  // Notify administrators of API issues (implement based on your notification system)
  notifyAdmins(errorDetails) {
    // Example: Send email, Slack message, or log to monitoring service
    console.warn("ADMIN ALERT: DeepSeek API Issue -", errorDetails.message);

    // Implement your preferred notification method:
    // - Send email
    // - Slack webhook
    // - Discord notification
    // - Log to external monitoring service
  }

  createHealthAnalysisPrompt(userData, healthData) {
    return `
PATIENT HEALTH ANALYSIS REQUEST

Patient Information:
- Name: ${userData.name}
- Age: ${userData.age}
- Chronic Condition: ${userData.condition}
- Days since registration: ${Math.floor(
      (new Date() - new Date(userData.createdAt)) / (1000 * 60 * 60 * 24)
    )}

Current Health Status:
- Medication Adherence: ${healthData.adherenceRate}%
- Active Medications: ${healthData.medicationsCount}
- Recent Symptoms Recorded: ${healthData.recentSymptomsCount}
- Health Goals: ${healthData.activeGoalsCount} active, ${
      healthData.completedGoalsCount
    } completed
- Upcoming Reminders: ${healthData.todayRemindersCount}

Recent Symptoms: ${
      healthData.recentSymptoms
        ?.map((s) => `${s.type} (severity ${s.severity}/10)`)
        .join(", ") || "None"
    }

Please provide a comprehensive health recommendation including:
1. A personalized motivational message based on their adherence and progress
2. 3-4 specific, actionable health tips relevant to their condition
3. Advice on medication management and symptom monitoring
4. One positive affirmation about their health journey
5. Any important reminders or warnings based on their symptoms

Keep the response under 300 words, compassionate, and practical. Focus on empowerment and realistic steps.
    `;
  }

  getFallbackRecommendation(healthData) {
    const adherence = healthData.adherenceRate;

    if (adherence >= 80) {
      return `Excellent work! Your ${adherence}% adherence rate shows incredible commitment to your health journey. 

Key Recommendations:
1. Continue your excellent medication routine - consistency is key for managing chronic conditions
2. Maintain your symptom tracking - this helps identify patterns early
3. Consider adding light physical activity if approved by your doctor
4. Stay hydrated and maintain a balanced diet

Remember: "Your dedication today builds a healthier tomorrow." Keep up the amazing work!`;
    } else if (adherence >= 50) {
      return `You're making good progress with your health management! 

To improve further:
1. Try setting medication reminders to boost your ${adherence}% adherence rate
2. Record symptoms daily to better understand your condition patterns
3. Break down health goals into smaller, achievable steps
4. Celebrate small victories - each dose taken is a success

You're building lasting healthy habits. Every step forward counts!`;
    } else {
      return `We understand managing health can be challenging sometimes. Let's focus on fresh starts:

Today's Simple Steps:
1. Take your next scheduled medication - set a phone reminder if needed
2. Drink a glass of water and take 5 deep breaths
3. Record any symptoms you're experiencing
4. Remember why you started - your health matters

"You don't have to be perfect, just persistent." Let's take this one step at a time together.`;
    }
  }

  async analyzeSymptoms(symptoms, userCondition) {
    // Check usage limits
    if (this.monthlyUsage >= this.usageLimit) {
      console.warn(
        "Monthly usage limit reached, using fallback symptom analysis"
      );
      return this.analyzeSymptomsFallback(symptoms);
    }

    try {
      if (!this.apiKey) {
        return this.analyzeSymptomsFallback(symptoms);
      }

      const symptomDetails = symptoms
        .map(
          (s) =>
            `${s.type}: severity ${s.severity}/10, ${
              s.description || "No additional details"
            }`
        )
        .join("\n");

      const response = await axios.post(
        this.baseURL,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are a medical assistant analyzing symptoms for chronic disease management. 
            Provide risk assessment and practical recommendations. Always emphasize consulting healthcare 
            providers for serious symptoms. Be cautious and supportive.`,
            },
            {
              role: "user",
              content: `Patient with ${userCondition} reports these symptoms:\n${symptomDetails}\n\nPlease analyze potential risks and provide recommendations.`,
            },
          ],
          max_tokens: 500,
          temperature: 0.5,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const analysis = response.data.choices[0].message.content;
      const riskLevel = this.calculateRiskLevel(symptoms);

      this.monthlyUsage++; // Only count successful calls

      return { analysis, riskLevel };
    } catch (error) {
      const errorDetails = this.parseAPIError(error);

      console.error("DeepSeek Symptom Analysis Error:", {
        message: errorDetails.message,
        type: errorDetails.type,
        timestamp: new Date().toISOString(),
      });

      if (errorDetails.shouldUseFallback) {
        this.notifyAdmins(errorDetails);
      }

      return this.analyzeSymptomsFallback(symptoms);
    }
  }

  calculateRiskLevel(symptoms) {
    const severeCount = symptoms.filter((s) => s.severity >= 8).length;
    const moderateCount = symptoms.filter(
      (s) => s.severity >= 5 && s.severity < 8
    ).length;

    if (severeCount > 0) return "high";
    if (moderateCount >= 2 || symptoms.length >= 3) return "medium";
    return "low";
  }

  analyzeSymptomsFallback(symptoms) {
    const riskLevel = this.calculateRiskLevel(symptoms);

    const recommendations = {
      high: `URGENT: We've detected severe symptoms that require immediate medical attention. Please contact your healthcare provider or visit urgent care right away. Do not delay seeking medical help for these symptoms.`,
      medium: `CAUTION: Your symptoms suggest you should monitor closely and consider contacting your healthcare provider if they persist or worsen. Keep tracking your symptoms and rest adequately.`,
      low: `Your symptoms appear manageable with self-care. Continue monitoring and maintain your regular health routines. Contact your doctor if symptoms change or concern you.`,
    };

    return {
      analysis: `Based on your reported symptoms, our assessment indicates ${riskLevel} risk. ${recommendations[riskLevel]}`,
      riskLevel,
    };
  }

  // Reset monthly usage (call this at the beginning of each month)
  resetUsage() {
    this.monthlyUsage = 0;
    console.log("Monthly usage counter reset");
  }

  // Get current usage statistics
  getUsageStats() {
    return {
      monthlyUsage: this.monthlyUsage,
      usageLimit: this.usageLimit,
      remainingCalls: this.usageLimit - this.monthlyUsage,
      usagePercentage: ((this.monthlyUsage / this.usageLimit) * 100).toFixed(2),
    };
  }
}

const deepSeekService = new DeepSeekAIService();

// Export for use in other files
module.exports = deepSeekService;

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// ============================================================================
// CRON JOBS - TESTING & PRODUCTION
// ============================================================================

/**
 * TEST CRON JOB - Sends emails every 60 seconds for testing
 */
const startTestCronJob = () => {
  console.log("🧪 Starting TEST cron job - Emails every 60 seconds");

  cron.schedule("*/60 * * * * *", async () => {
    try {
      console.log("🔄 TEST CRON: Running every 60 seconds...");

      const users = await User.findAll({
        include: [
          {
            model: Preference,
            where: {
              dailyHealthAlerts: true,
            },
          },
        ],
        limit: 5,
      });

      console.log(`🔄 TEST CRON: Found ${users.length} users for test alerts`);

      for (const user of users) {
        try {
          if (
            process.env.ENABLE_EMAIL_SENDING &&
            process.env.NODE_ENV === "production"
          ) {
            await sendTestReminderEmail(user);
          }
          console.log(`✅ TEST CRON: Test email sent to ${user.email}`);

          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(
            `❌ TEST CRON: Failed to send test email to ${user.email}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error("❌ TEST CRON: Error in test cron job:", error);
    }
  });
};

/**
 * PRODUCTION CRON JOB - Sends emails based on user's preferred time
 */
const startProductionCronJob = () => {
  console.log("🚀 Starting PRODUCTION cron job - User preferred email times");

  // Schedule 1: Daily Health Alerts at user's preferred time
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("🔄 PRODUCTION CRON: Checking for scheduled daily alerts...");

      const currentHour = new Date().getHours();
      const currentTime = `${currentHour.toString().padStart(2, "0")}:00:00`;

      const users = await User.findAll({
        include: [
          {
            model: Preference,
            where: {
              dailyHealthAlerts: true,
              preferredEmailTime: currentTime,
            },
          },
        ],
      });

      console.log(
        `🔄 PRODUCTION CRON: Found ${users.length} users for daily alerts at ${currentTime}`
      );

      for (const user of users) {
        try {
          await sendDailyAlertToUser(user);
          console.log(`✅ PRODUCTION CRON: Daily alert sent to ${user.email}`);

          await user.update({ lastAlertSent: new Date() });
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(
            `❌ PRODUCTION CRON: Failed to send daily alert to ${user.email}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error("❌ PRODUCTION CRON: Error in daily alerts:", error);
    }
  });

  // Schedule 2: Medication Reminders - Check every minute
  cron.schedule("*/2 * * * *", async () => {
    try {
      console.log("🔄 PRODUCTION CRON: Checking for medication reminders...");

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}:00`;

      const medications = await Medication.findAll({
        where: {
          isActive: true,
          sendEmailReminders: true,
        },
        include: [
          {
            model: User,
            include: [
              {
                model: Preference,
                where: {
                  medicationReminders: true,
                },
              },
            ],
          },
        ],
      });

      for (let i = 0; i < medications.length; ++i) {
        let medication = medications[i];
        try {
          await sendMedicationReminderEmail(medication.User, medication);
          console.log(
            `✅ PRODUCTION CRON: Medication reminder sent for ${medication.name}`
          );

          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(
            `❌ PRODUCTION CRON: Failed to send medication reminder:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error(
        "❌ PRODUCTION CRON: Error in medication reminders:",
        error
      );
    }
  });

  // Schedule 3: General Reminders - Check every minute
  cron.schedule("* * * * *", async () => {
    try {
      console.log("🔄 PRODUCTION CRON: Checking for general reminders...");

      const reminders = await Reminder.findAll({
        where: {
          isCompleted: false,
          sendEmail: true,
          emailSent: false,
        },
        include: [
          {
            model: User,
            include: [
              {
                model: Preference,
                where: {
                  appointmentReminders: true,
                },
              },
            ],
          },
        ],
      });

      console.log(
        `🔄 PRODUCTION CRON: Found ${reminders.length} reminders due soon`
      );

      for (const reminder of reminders) {
        try {
          await sendGeneralReminderEmail(reminder.User, reminder);
          await reminder.update({
            emailSent: true,
            emailSentAt: new Date(),
          });
          console.log(`✅ PRODUCTION CRON: Reminder sent: ${reminder.title}`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(
            `❌ PRODUCTION CRON: Failed to send reminder:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error("❌ PRODUCTION CRON: Error in general reminders:", error);
    }
  });
};

// ============================================================================
// EMAIL TEMPLATES AND FUNCTIONS
// ============================================================================

async function sendTestReminderEmail(user) {
  const mailOptions = {
    from: `"Health Management System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `🧪 Test Reminder - ${new Date().toLocaleTimeString()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
          .header { background: #4CAF50; color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧪 Test Email</h1>
          </div>
          <h2>Hello ${user.name}!</h2>
          <p>This is a <strong>test email</strong> sent by the Health Management System.</p>
          <p>Current time: ${new Date().toLocaleString()}</p>
          <p>If you're receiving this, the email system is working correctly! 🎉</p>
          <p><em>This test email is sent every 60 seconds during development.</em></p>
        </div>
      </body>
      </html>
    `,
  };

  await emailTransporter.sendMail(mailOptions);
}

async function sendMedicationReminderEmail(user, medication) {
  const mailOptions = {
    from: `"Health Management System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `💊 Medication Reminder: ${medication.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
          .header { background: #ff6b6b; color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
          .medication-info { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💊 Medication Reminder</h1>
          </div>
          <h2>Hello ${user.name}!</h2>
          <p>It's time to take your medication:</p>
          
          <div class="medication-info">
            <h3>${medication.name}</h3>
            <p><strong>Dosage:</strong> ${medication.dosage}</p>
            <p><strong>Instructions:</strong> ${
              medication.instructions || "Take as prescribed"
            }</p>
            <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <p>Please take your medication as directed by your healthcare provider.</p>
          <p><em>This is an automated reminder from your Health Management System.</em></p>
        </div>
      </body>
      </html>
    `,
  };

  await emailTransporter.sendMail(mailOptions);
}

async function sendGeneralReminderEmail(user, reminder) {
  const mailOptions = {
    from: `"Health Management System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `⏰ Reminder: ${reminder.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
          .header { background: #4e73df; color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -30px -30px 20px -30px; }
          .reminder-info { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Reminder</h1>
          </div>
          <h2>Hello ${user.name}!</h2>
          
          <div class="reminder-info">
            <h3>${reminder.title}</h3>
            <p><strong>Type:</strong> ${reminder.type}</p>
            <p><strong>Message:</strong> ${reminder.message}</p>
            <p><strong>Scheduled Time:</strong> ${new Date(
              reminder.scheduledTime
            ).toLocaleString()}</p>
            ${
              reminder.isRecurring
                ? `<p><strong>Recurring:</strong> ${reminder.recurrencePattern}</p>`
                : ""
            }
          </div>
          
          <p><em>This is an automated reminder from your Health Management System.</em></p>
        </div>
      </body>
      </html>
    `,
  };

  await emailTransporter.sendMail(mailOptions);
}

async function sendDailyAlertToUser(user) {
  const preference = await Preference.findOne({ where: { UserId: user.id } });

  const goals = await HealthGoal.findAll({
    where: { UserId: user.id },
  });
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.isCompleted).length;
  const adherenceRate =
    totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  const recentSymptoms = await Symptom.findAll({
    where: { UserId: user.id },
    order: [["recordedAt", "DESC"]],
    limit: 5,
  });

  const healthData = {
    adherenceRate,
    medicationsCount: await Medication.count({
      where: { UserId: user.id, isActive: true },
    }),
    recentSymptomsCount: recentSymptoms.length,
    activeGoalsCount: totalGoals - completedGoals,
    completedGoalsCount: completedGoals,
    todayRemindersCount: await Reminder.count({
      where: {
        UserId: user.id,
        scheduledTime: {
          [sequelize.Op.between]: [
            new Date().setHours(0, 0, 0, 0),
            new Date().setHours(23, 59, 59, 999),
          ],
        },
        isCompleted: false,
      },
    }),
    recentSymptoms: recentSymptoms,
  };

  const aiRecommendation = await deepSeekService.generateHealthRecommendation(
    user,
    healthData
  );

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white; 
          border-radius: 15px; 
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 300;
        }
        .content { 
          padding: 30px; 
        }
        .ai-section { 
          background: #e8f5e8; 
          padding: 20px; 
          margin: 20px 0; 
          border-radius: 10px; 
          border-left: 5px solid #4CAF50;
        }
        .medication-card, .reminder-card { 
          background: white; 
          padding: 15px; 
          margin: 15px 0; 
          border-radius: 8px; 
          border: 1px solid #e0e0e0;
        }
        .stats-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 15px; 
          margin: 20px 0; 
        }
        .stat-item { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          text-align: center;
        }
        .stat-number { 
          font-size: 24px; 
          font-weight: bold; 
          color: #4CAF50; 
        }
        .cta-button { 
          display: block; 
          width: 200px; 
          margin: 30px auto; 
          padding: 15px 20px; 
          background: #4CAF50; 
          color: white; 
          text-align: center; 
          text-decoration: none; 
          border-radius: 25px; 
          font-weight: bold;
          transition: background 0.3s;
        }
        .cta-button:hover { 
          background: #45a049; 
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          background: #f8f9fa; 
          color: #666; 
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌞 Good Morning, ${user.name}!</h1>
          <p>Your Personalized Health Update for ${new Date().toDateString()}</p>
        </div>
        
        <div class="content">
          <div class="ai-section">
            <h3 style="margin-top: 0; color: #2e7d32;">🤖 AI Health Advisor</h3>
            <div style="white-space: pre-line;">${aiRecommendation}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">${healthData.adherenceRate.toFixed(
                0
              )}%</div>
              <div>Adherence Rate</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${healthData.medicationsCount}</div>
              <div>Active Medications</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${healthData.activeGoalsCount}</div>
              <div>Active Goals</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${healthData.todayRemindersCount}</div>
              <div>Today's Reminders</div>
            </div>
          </div>

          <a href="${process.env.APP_URL}/dashboard" class="cta-button">
            Update Health Log
          </a>
        </div>

        <div class="footer">
          <p>This is an automated health alert from your Health Management System.</p>
          <p>You can adjust your notification preferences in your account settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Health Management System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Your Daily Health Update - ${new Date().toDateString()}`,
    html: emailContent,
    headers: {
      "X-Priority": "1",
      "X-MSMail-Priority": "High",
      Importance: "high",
    },
  };

  await emailTransporter.sendMail(mailOptions);
}

// ============================================================================
// ROUTES - UPDATED FOR NEW MODELS
// ============================================================================

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, age, condition, preferences } = req.body;

    if (!name || !email || !password || !condition) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      age,
      condition,
    });

    const userPreferences = await Preference.create({
      UserId: user.id,
      dailyHealthAlerts: preferences?.dailyHealthAlerts ?? true,
      medicationReminders: preferences?.medicationReminders ?? true,
      appointmentReminders: preferences?.appointmentReminders ?? true,
      symptomTrackingReminders: preferences?.symptomTrackingReminders ?? true,
      goalProgressUpdates: preferences?.goalProgressUpdates ?? true,
      motivationalMessages: preferences?.motivationalMessages ?? true,
      emailFrequency: preferences?.emailFrequency ?? "instant",
      preferredEmailTime: preferences?.preferredEmailTime ?? "09:00:00",
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          age: user.age,
          condition: user.condition,
        },
        preferences: userPreferences,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const preferences = await Preference.findOne({
      where: { UserId: user.id },
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          age: user.age,
          condition: user.condition,
        },
        preferences,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
});

// Medication Routes
app.get("/api/medications", authenticateToken, async (req, res) => {
  try {
    const medications = await Medication.findAll({
      where: { UserId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: medications,
    });
  } catch (error) {
    console.error("Get medications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medications",
    });
  }
});

app.post("/api/medications", authenticateToken, async (req, res) => {
  try {
    const { name, dosage, frequency, times, instructions, sendEmailReminders } =
      req.body;

    if (!name || !dosage || !frequency || !times) {
      return res.status(400).json({
        success: false,
        message: "All required medication fields must be provided",
      });
    }

    const medication = await Medication.create({
      name,
      dosage,
      frequency,
      times,
      instructions,
      sendEmailReminders: sendEmailReminders ?? true,
      UserId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Medication added successfully",
      data: medication,
    });
  } catch (error) {
    console.error("Add medication error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add medication",
    });
  }
});

app.put("/api/medications/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      dosage,
      frequency,
      times,
      instructions,
      sendEmailReminders,
      isActive,
    } = req.body;

    const medication = await Medication.findOne({
      where: { id, UserId: req.user.id },
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    await medication.update({
      name: name || medication.name,
      dosage: dosage || medication.dosage,
      frequency: frequency || medication.frequency,
      times: times || medication.times,
      instructions:
        instructions !== undefined ? instructions : medication.instructions,
      sendEmailReminders:
        sendEmailReminders !== undefined
          ? sendEmailReminders
          : medication.sendEmailReminders,
      isActive: isActive !== undefined ? isActive : medication.isActive,
    });

    res.json({
      success: true,
      message: "Medication updated successfully",
      data: medication,
    });
  } catch (error) {
    console.error("Update medication error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update medication",
    });
  }
});

app.delete("/api/medications/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const medication = await Medication.findOne({
      where: { id, UserId: req.user.id },
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    await medication.destroy();

    res.json({
      success: true,
      message: "Medication deleted successfully",
    });
  } catch (error) {
    console.error("Delete medication error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete medication",
    });
  }
});

// Symptom Routes
app.post("/api/symptoms", authenticateToken, async (req, res) => {
  try {
    const { type, severity, description, duration, triggers } = req.body;

    if (!type || !severity) {
      return res.status(400).json({
        success: false,
        message: "Symptom type and severity are required",
      });
    }

    const symptom = await Symptom.create({
      type,
      severity,
      description,
      duration,
      triggers,
      UserId: req.user.id,
    });

    const recentSymptoms = await Symptom.findAll({
      where: { UserId: req.user.id },
      order: [["recordedAt", "DESC"]],
      limit: 10,
    });

    const analysis = await deepSeekService.analyzeSymptoms(
      recentSymptoms,
      req.user.condition
    );

    res.status(201).json({
      success: true,
      message: "Symptom recorded successfully",
      data: {
        symptom,
        analysis,
      },
    });
  } catch (error) {
    console.error("Record symptom error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record symptom",
    });
  }
});

app.get("/api/symptoms", authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const symptoms = await Symptom.findAll({
      where: { UserId: req.user.id },
      order: [["recordedAt", "DESC"]],
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: symptoms,
    });
  } catch (error) {
    console.error("Get symptoms error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch symptoms",
    });
  }
});

// Health Goals Routes
app.get("/api/goals", authenticateToken, async (req, res) => {
  try {
    const goals = await HealthGoal.findAll({
      where: { UserId: req.user.id },
      order: [
        ["priority", "DESC"],
        ["deadline", "ASC"],
      ],
    });

    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.isCompleted).length;
    const adherenceRate =
      totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    const healthData = {
      adherenceRate,
      activeGoalsCount: totalGoals - completedGoals,
      completedGoalsCount: completedGoals,
      recentSymptomsCount: 0,
    };

    const aiRecommendation = await deepSeekService.generateHealthRecommendation(
      req.user,
      healthData
    );

    res.json({
      success: true,
      data: {
        goals,
        adherenceRate,
        aiRecommendation,
      },
    });
  } catch (error) {
    console.error("Get goals error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch goals",
    });
  }
});

app.post("/api/goals", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      targetValue,
      unit,
      deadline,
      priority,
      sendProgressEmails,
    } = req.body;

    if (!title || !category || !targetValue) {
      return res.status(400).json({
        success: false,
        message: "Title, category, and target value are required",
      });
    }

    const goal = await HealthGoal.create({
      title,
      description,
      category,
      targetValue,
      unit,
      deadline,
      priority,
      sendProgressEmails: sendProgressEmails ?? true,
      UserId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Health goal created successfully",
      data: goal,
    });
  } catch (error) {
    console.error("Create goal error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create health goal",
    });
  }
});

app.put("/api/goals/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentValue, isCompleted, sendProgressEmails } = req.body;

    const goal = await HealthGoal.findOne({
      where: { id, UserId: req.user.id },
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    await goal.update({
      currentValue:
        currentValue !== undefined ? currentValue : goal.currentValue,
      isCompleted: isCompleted !== undefined ? isCompleted : goal.isCompleted,
      sendProgressEmails:
        sendProgressEmails !== undefined
          ? sendProgressEmails
          : goal.sendProgressEmails,
    });

    res.json({
      success: true,
      message: "Goal updated successfully",
      data: goal,
    });
  } catch (error) {
    console.error("Update goal error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update goal",
    });
  }
});

// Reminder Routes
app.get("/api/reminders", authenticateToken, async (req, res) => {
  try {
    const { upcoming = false } = req.query;

    let whereClause = { UserId: req.user.id };

    if (upcoming) {
      whereClause.scheduledTime = {
        [sequelize.Op.gte]: new Date(),
      };
    }

    const reminders = await Reminder.findAll({
      where: whereClause,
      order: [["scheduledTime", "ASC"]],
    });

    res.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error("Get reminders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reminders",
    });
  }
});

app.post("/api/reminders", authenticateToken, async (req, res) => {
  try {
    const {
      type,
      title,
      message,
      scheduledTime,
      isRecurring,
      recurrencePattern,
      priority,
      sendEmail,
    } = req.body;

    if (!type || !title || !message || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: "All required reminder fields must be provided",
      });
    }

    const reminder = await Reminder.create({
      type,
      title,
      message,
      scheduledTime: new Date(scheduledTime),
      isRecurring,
      recurrencePattern,
      priority,
      sendEmail: sendEmail ?? true,
      UserId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Reminder created successfully",
      data: reminder,
    });
  } catch (error) {
    console.error("Create reminder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create reminder",
    });
  }
});

app.put("/api/reminders/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted, sendEmail } = req.body;

    const reminder = await Reminder.findOne({
      where: { id, UserId: req.user.id },
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    await reminder.update({
      isCompleted:
        isCompleted !== undefined ? isCompleted : reminder.isCompleted,
      sendEmail: sendEmail !== undefined ? sendEmail : reminder.sendEmail,
    });

    res.json({
      success: true,
      message: "Reminder updated successfully",
      data: reminder,
    });
  } catch (error) {
    console.error("Update reminder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update reminder",
    });
  }
});

// Health Metrics Routes
app.post("/api/health-metrics", authenticateToken, async (req, res) => {
  try {
    const { type, value, unit, notes } = req.body;

    if (!type || value === undefined) {
      return res.status(400).json({
        success: false,
        message: "Metric type and value are required",
      });
    }

    const metric = await HealthMetric.create({
      type,
      value,
      unit,
      notes,
      UserId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Health metric recorded successfully",
      data: metric,
    });
  } catch (error) {
    console.error("Record health metric error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record health metric",
    });
  }
});

app.get("/api/health-metrics", authenticateToken, async (req, res) => {
  try {
    const { type, limit = 30 } = req.query;

    let whereClause = { UserId: req.user.id };
    if (type) {
      whereClause.type = type;
    }

    const metrics = await HealthMetric.findAll({
      where: whereClause,
      order: [["recordedAt", "DESC"]],
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Get health metrics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch health metrics",
    });
  }
});

// Preference Routes
app.get("/api/preferences", authenticateToken, async (req, res) => {
  try {
    const preferences = await Preference.findOne({
      where: { UserId: req.user.id },
    });

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch preferences",
    });
  }
});

app.put("/api/preferences", authenticateToken, async (req, res) => {
  try {
    const preferences = await Preference.findOne({
      where: { UserId: req.user.id },
    });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: "Preferences not found",
      });
    }

    await preferences.update(req.body);

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: preferences,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update preferences",
    });
  }
});

// User Profile Routes
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const preferences = await Preference.findOne({
      where: { UserId: user.id },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          age: user.age,
          condition: user.condition,
          lastAlertSent: user.lastAlertSent,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        preferences,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
});

app.put("/api/profile", authenticateToken, async (req, res) => {
  try {
    const { name, age, condition } = req.body;

    await req.user.update({
      name: name || req.user.name,
      age: age !== undefined ? age : req.user.age,
      condition: condition || req.user.condition,
    });

    const preferences = await Preference.findOne({
      where: { UserId: req.user.id },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          age: req.user.age,
          condition: req.user.condition,
        },
        preferences,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// AI Insights Route
// Change from app.get to app.post
app.get("/api/ai-insights", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    const [medications, symptoms, goals, reminders] = await Promise.all([
      Medication.findAll({ where: { UserId: user.id, isActive: true } }),
      Symptom.findAll({
        where: { UserId: user.id },
        order: [["recordedAt", "DESC"]],
        limit: 5,
      }),
      HealthGoal.findAll({ where: { UserId: user.id } }),
      Reminder.findAll({
        where: {
          UserId: user.id,
          scheduledTime: {
            [sequelize.Op.between]: [
              new Date().setHours(0, 0, 0, 0),
              new Date().setHours(23, 59, 59, 999),
            ],
          },
          isCompleted: false,
        },
      }),
    ]);

    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.isCompleted).length;
    const adherenceRate =
      totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    const healthData = {
      adherenceRate,
      medicationsCount: medications.length,
      recentSymptomsCount: symptoms.length,
      activeGoalsCount: totalGoals - completedGoals,
      completedGoalsCount: completedGoals,
      todayRemindersCount: reminders.length,
      recentSymptoms: symptoms,
    };

    const aiInsights = await deepSeekService.generateHealthRecommendation(
      user,
      healthData
    );

    res.json({
      success: true,
      data: {
        aiInsights,
        healthData,
      },
    });
  } catch (error) {
    console.error("AI insights error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate AI insights",
      error: error.message, // Include error message for debugging
    });
  }
});

// Manual trigger endpoint for testing
app.post("/api/send-test-alert", authenticateToken, async (req, res) => {
  try {
    if (
      process.env.ENABLE_EMAIL_SENDING &&
      process.env.NODE_ENV === "production"
    ) {
      await sendTestReminderEmail(req.user);
    }
    res.json({
      success: true,
      message: "Test alert sent successfully to your email",
    });
  } catch (error) {
    console.error("Test alert error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test alert: " + error.message,
    });
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const initializeCronJobs = () => {
  if (process.env.TEST_CRON) {
    startTestCronJob();
    console.log("🎯 TEST cron job activated - Emails every 60 seconds");
  } else {
    startProductionCronJob();
    console.log("🎯 PRODUCTION cron job activated - User preferred times");
  }
};

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");

    await sequelize.sync({ alter: true });
    console.log("✅ Database synchronized successfully");

    initializeCronJobs();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `📧 Email system: ${
          process.env.ENABLE_TEST_CRON === "true"
            ? "TEST MODE (60s)"
            : "PRODUCTION MODE (user times)"
        }`
      );
      console.log(
        `🌐 Frontend URL: ${process.env.APP_URL || "http://localhost:3000"}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
