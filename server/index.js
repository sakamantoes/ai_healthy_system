const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const axios = require("axios");
const { Op } = require("sequelize");
require("dotenv").config();

const {
  sequelize,
  User,
  Medication,
  Symptom,
  HealthGoal,
  Reminder,
  HealthMetric,
} = require("./models");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:5173",
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

    // Debug: Check if API key is loaded
    console.log(
      "🔑 DeepSeek API Key Status:",
      this.apiKey ? "✅ Loaded" : "❌ Missing"
    );
    if (this.apiKey && this.apiKey.startsWith("sk-")) {
      console.log("✅ API Key format looks correct");
    } else {
      console.warn("⚠️  API Key may be invalid or missing");
    }
  }

  async generateHealthRecommendation(userData, healthData) {
    try {
      // Enhanced API key validation
      if (!this.apiKey || this.apiKey === "your_deepseek_key_here") {
        console.log(
          "🔧 Using fallback recommendations (API key not configured)"
        );
        return this.getFallbackRecommendation(healthData);
      }

      if (!this.apiKey.startsWith("sk-")) {
        console.warn("⚠️  API Key format may be invalid");
        return this.getFallbackRecommendation(healthData);
      }

      const prompt = this.createHealthAnalysisPrompt(userData, healthData);

      console.log("🔄 Calling DeepSeek API...");
      console.log("📊 User condition:", userData.condition);
      console.log("📈 Adherence rate:", healthData.adherenceRate + "%");

      const response = await axios.post(
        this.baseURL,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are a compassionate, knowledgeable health advisor specializing in chronic disease management. 
              Provide personalized, practical, and motivational health recommendations. Include specific food suggestions to stay healthy. 
              Always maintain a supportive tone and focus on actionable advice. Be specific and relevant to the user's condition.`,
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

      console.log("✅ DeepSeek API Response Status:", response.status);

      if (response.data.choices && response.data.choices[0]) {
        const content = response.data.choices[0].message.content;
        console.log("📝 AI Response length:", content.length, "characters");
        return content;
      } else {
        console.error("❌ Invalid response format from DeepSeek API");
        throw new Error("Invalid response format from DeepSeek API");
      }
    } catch (error) {
      console.error("❌ DeepSeek API Error:");
      console.error("   Message:", error.message);
      console.error("   Code:", error.code);
      if (error.response) {
        console.error("   Status:", error.response.status);
        console.error("   Data:", error.response.data);
      }

      // Provide helpful error messages based on the error type
      if (error.code === "ENOTFOUND") {
        console.log("🌐 Network error - check internet connection");
      } else if (error.response?.status === 401) {
        console.log("🔑 API key may be invalid or expired");
      } else if (error.response?.status === 429) {
        console.log("⏰ Rate limit exceeded - try again later");
      }

      return this.getFallbackRecommendation(healthData);
    }
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
6. Specific foods to eat to stay healthy with ${userData.condition}

Keep the response under 300 words, compassionate, and practical. Focus on empowerment and realistic steps.
    `;
  }

  getFallbackRecommendation(healthData) {
    const adherence = healthData.adherenceRate;
    const condition = healthData.condition || "your condition";

    if (adherence >= 80) {
      return `🌟 Excellent work! Your ${adherence}% adherence rate shows incredible commitment to your health journey with ${condition}. 

Key Recommendations:
1. Continue your excellent medication routine - consistency is key
2. Maintain your symptom tracking - this helps identify patterns early
3. Consider adding light physical activity if approved by your doctor
4. Stay hydrated and maintain a balanced diet rich in fruits and vegetables

Healthy Foods to Focus On:
• Leafy greens and colorful vegetables
• Lean proteins like fish and chicken
• Whole grains and fiber-rich foods
• Plenty of water throughout the day

Remember: "Your dedication today builds a healthier tomorrow." Keep up the amazing work!`;
    } else if (adherence >= 50) {
      return `📊 You're making good progress with your ${adherence}% adherence rate in managing ${condition}. 

To improve further:
1. Try setting medication reminders to boost your consistency
2. Record symptoms daily to better understand your condition patterns
3. Break down health goals into smaller, achievable steps
4. Celebrate small victories - each dose taken is a success

Nutrition Tips:
• Eat regular, balanced meals
• Include anti-inflammatory foods
• Stay hydrated with water and herbal teas
• Limit processed foods and sugars

You're building lasting healthy habits. Every step forward counts!`;
    } else {
      return `🤗 We understand managing ${condition} can be challenging sometimes. Let's focus on fresh starts:

Today's Simple Steps:
1. Take your next scheduled medication - set a phone reminder if needed
2. Drink a glass of water and take 5 deep breaths
3. Record any symptoms you're experiencing
4. Remember why you started - your health matters

Quick Healthy Eating:
• Start with a nutritious breakfast
• Snack on fruits and nuts
• Choose whole foods over processed
• Listen to your body's hunger cues

"You don't have to be perfect, just persistent." Let's take this one step at a time together.`;
    }
  }

  // ... keep the rest of your existing methods (analyzeSymptoms, calculateRiskLevel, etc.)
}

const deepSeekService = new DeepSeekAIService();

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

// Daily Alert System
async function sendDailyHealthAlerts() {
  try {
    console.log("🔄 Starting daily health alerts...");

    const users = await User.findAll({
      where: {
        "$preferences.dailyAlerts$": true,
      },
      include: [
        { model: Medication, where: { isActive: true }, required: false },
        {
          model: Reminder,
          where: {
            scheduledTime: {
              [sequelize.Op.between]: [
                new Date().setHours(0, 0, 0, 0),
                new Date().setHours(23, 59, 59, 999),
              ],
            },
            isCompleted: false,
          },
          required: false,
        },
        {
          model: HealthGoal,
          where: { isCompleted: false },
          required: false,
        },
      ],
    });

    let sentCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        await sendDailyAlertToUser(user);
        sentCount++;

        // Update last alert sent time
        await user.update({ lastAlertSent: new Date() });

        // Delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(
          `❌ Error sending alert to ${user.email}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log(
      `✅ Daily health alerts completed: ${sentCount} sent, ${errorCount} failed`
    );
  } catch (error) {
    console.error("❌ Error in daily health alerts:", error);
  }
}

async function sendDailyAlertToUser(user) {
  // Calculate adherence rate from goals
  const goals = await HealthGoal.findAll({
    where: { UserId: user.id },
  });
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.isCompleted).length;
  const adherenceRate =
    totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  // Get health data for AI recommendation
  const recentSymptoms = await Symptom.findAll({
    where: { UserId: user.id },
    order: [["recordedAt", "DESC"]],
    limit: 5,
    attributes: ["type", "severity", "recordedAt"],
  });

  const healthData = {
    adherenceRate,
    medicationsCount: user.Medications ? user.Medications.length : 0,
    recentSymptomsCount: recentSymptoms.length,
    activeGoalsCount: user.HealthGoals ? user.HealthGoals.length : 0,
    completedGoalsCount: completedGoals,
    todayRemindersCount: user.Reminders ? user.Reminders.length : 0,
    recentSymptoms: recentSymptoms,
  };

  // Generate AI-powered recommendation
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

          ${
            user.Medications && user.Medications.length > 0
              ? `
            <div class="medication-card">
              <h3 style="color: #d32f2f;">💊 Today's Medications</h3>
              ${user.Medications.map(
                (med) => `
                <div style="margin: 10px 0; padding: 10px; background: #ffebee; border-radius: 5px;">
                  <strong>${med.name}</strong> - ${med.dosage}<br>
                  <small>Times: ${med.times.join(", ")}</small>
                </div>
              `
              ).join("")}
            </div>
          `
              : ""
          }

          ${
            user.Reminders && user.Reminders.length > 0
              ? `
            <div class="reminder-card">
              <h3 style="color: #ff9800;">⏰ Today's Reminders</h3>
              ${user.Reminders.map(
                (reminder) => `
                <div style="margin: 8px 0; padding: 8px; background: #fff3e0; border-radius: 5px;">
                  <strong>${reminder.title}</strong><br>
                  <small>${new Date(
                    reminder.scheduledTime
                  ).toLocaleTimeString()} - ${reminder.message}</small>
                </div>
              `
              ).join("")}
            </div>
          `
              : ""
          }

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
  console.log(`✅ Daily alert sent to ${user.email}`);
}

// Schedule daily alerts at 8:00 AM
cron.schedule(
  process.env.DAILY_ALERT_TIME || "0 8 * * *",
  sendDailyHealthAlerts
);

// Manual trigger endpoint for testing
app.post("/api/send-test-alert", authenticateToken, async (req, res) => {
  try {
    await sendDailyAlertToUser(req.user);
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

// Auth Routes
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, age, condition, preferences } = req.body;

    // Validation
    if (!name || !email || !password || !condition) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      age,
      condition,
      preferences: preferences || {
        dailyAlerts: true,
        medicationReminders: true,
        motivationalMessages: true,
      },
    });

    // Generate token
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
          preferences: user.preferences,
        },
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

app.post("/api/login", async (req, res) => {
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
          preferences: user.preferences,
        },
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
    const { name, dosage, frequency, times, instructions } = req.body;

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

    // Get recent symptoms for AI analysis
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

    // Generate AI recommendation based on goals progress
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

// AI Insights Route
// AI Insights Route - FIXED VERSION
app.get("/api/ai-insights", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log(
      `🔍 Generating AI insights for user: ${user.name} (${user.id})`
    );

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
      condition: user.condition,
    };

    console.log("📊 Health data for AI:", {
      user: user.name,
      condition: user.condition,
      adherence: `${adherenceRate}%`,
      medications: medications.length,
      symptoms: symptoms.length,
      goals: `${completedGoals}/${totalGoals} completed`,
    });

    // Generate AI insights with timeout and better error handling
    console.log("🔄 Calling DeepSeek API for personalized insights...");

    const aiInsights = await Promise.race([
      deepSeekService.generateHealthRecommendation(user, healthData),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("AI service timeout after 15 seconds")),
          15000
        )
      ),
    ]);

    console.log("✅ AI insights generated successfully");
    console.log("📝 Insights length:", aiInsights.length, "characters");

    res.json({
      success: true,
      message: "AI insights generated successfully",
      data: {
        aiInsights,
        healthData: {
          ...healthData,
          totalGoals,
          completedGoals,
          medications: medications.map((med) => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
          })),
          recentSymptoms: symptoms.map((symptom) => ({
            type: symptom.type,
            severity: symptom.severity,
            recordedAt: symptom.recordedAt,
          })),
          upcomingReminders: reminders.map((reminder) => ({
            title: reminder.title,
            scheduledTime: reminder.scheduledTime,
            type: reminder.type,
          })),
        },
        generatedAt: new Date().toISOString(),
        source: "deepseek-ai",
      },
    });
  } catch (error) {
    console.error("❌ AI insights error:", error.message);

    // More detailed fallback based on available user data
    const user = req.user;
    const fallbackInsights = `Hello ${user.name}! I'm here to support your journey with ${user.condition}. 

While we're optimizing your AI experience, here are some general wellness tips:

🌱 Daily Wellness Foundation:
• Maintain consistent medication routines
• Track symptoms to identify patterns
• Stay hydrated and eat balanced meals
• Get adequate rest and gentle movement

📊 Your Health Management:
Keep up with your medication schedule and regular check-ins. Remember that consistency is key to managing ${user.condition} effectively.

💡 Personalized Tip: 
Consider keeping a health journal to track what works best for you. Every small step forward is progress worth celebrating!

"Your health journey is unique - celebrate every victory along the way!"`;

    res.json({
      success: true,
      message: "AI insights generated with fallback content",
      data: {
        aiInsights: fallbackInsights,
        healthData: {},
        note: "Using enhanced fallback insights - AI service temporarily unavailable",
        fallbackReason: error.message,
        generatedAt: new Date().toISOString(),
        source: "fallback-system",
      },
    });
  }
});

// Reminder Routes
app.get("/api/reminders", authenticateToken, async (req, res) => {
  try {
    const { upcoming } = req.query;

    let whereClause = { UserId: req.user.id };

    // Query parameters come as strings, so check for "true"
    if (upcoming === "true") {
      whereClause.scheduledTime = {
        [Op.gte]: new Date(), // ✅ FIXED: Use Op instead of sequelize.Op
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

// User Profile Route
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          age: user.age,
          condition: user.condition,
          preferences: user.preferences,
          lastAlertSent: user.lastAlertSent,
        },
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
    const { name, age, condition, preferences } = req.body;

    await req.user.update({
      name: name || req.user.name,
      age: age !== undefined ? age : req.user.age,
      condition: condition || req.user.condition,
      preferences: preferences || req.user.preferences,
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
          preferences: req.user.preferences,
        },
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Test DeepSeek API route
app.get("/api/test", authenticateToken, async (req, res) => {
  try {
    console.log("🧪 Testing DeepSeek API configuration...");

    const testData = {
      name: "Test User",
      age: 35,
      condition: "Diabetes",
      createdAt: new Date(),
    };

    const testHealthData = {
      adherenceRate: 75,
      medicationsCount: 2,
      recentSymptomsCount: 1,
      activeGoalsCount: 3,
      completedGoalsCount: 1,
      todayRemindersCount: 2,
      recentSymptoms: [{ type: "Headache", severity: 3 }],
      condition: "Diabetes",
    };

    console.log("🔑 API Key present:", !!process.env.DEEPSEEK_API_KEY);
    console.log(
      "🔑 API Key starts with sk-:",
      process.env.DEEPSEEK_API_KEY?.startsWith("sk-")
    );

    const recommendation = await deepSeekService.generateHealthRecommendation(
      testData,
      testHealthData
    );

    res.json({
      success: true,
      message: "DeepSeek API test successful",
      apiKeyConfigured: !!process.env.DEEPSEEK_API_KEY,
      apiKeyValid: process.env.DEEPSEEK_API_KEY?.startsWith("sk-"),
      recommendation: recommendation.substring(0, 200) + "...",
      fullLength: recommendation.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "DeepSeek API test failed: " + error.message,
      apiKeyConfigured: !!process.env.DEEPSEEK_API_KEY,
      apiKeyValid: process.env.DEEPSEEK_API_KEY?.startsWith("sk-"),
    });
  }
});

// 404 handler
app.use("/notFound", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");

    // Sync database
    await sequelize.sync({ alter: true });
    console.log("✅ Database synchronized successfully");

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(
        `📧 Email alerts scheduled: ${
          process.env.DAILY_ALERT_TIME || "0 8 * * * (8:00 AM daily)"
        }`
      );
      console.log(
        `🌐 Frontend URL: ${process.env.APP_URL || "http://localhost:3000"}`
      );

      // Send initial test alert if enabled
      if (process.env.SEND_INITIAL_ALERT === "true") {
        setTimeout(() => {
          console.log("Sending initial test alert...");
          sendDailyHealthAlerts();
        }, 5000);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
