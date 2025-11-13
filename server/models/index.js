const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQLUSER,
  process.env.MYSQLPASSWORD,
  {
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// User Model
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 120,
      },
    },
    condition: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastAlertSent: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

// Preference Model (for email reminders only)
const Preference = sequelize.define(
  "Preference",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Email Notification Preferences
    dailyHealthAlerts: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    medicationReminders: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    appointmentReminders: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    symptomTrackingReminders: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    goalProgressUpdates: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    motivationalMessages: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Email Frequency Preferences
    emailFrequency: {
      type: DataTypes.ENUM("instant", "daily_digest", "weekly_summary"),
      defaultValue: "instant",
    },
    // Preferred Email Times (for digest/summary)
    preferredEmailTime: {
      type: DataTypes.TIME,
      defaultValue: "09:00:00",
    },
  },
  {
    tableName: "preferences",
    timestamps: true,
  }
);

// Medication Model
const Medication = sequelize.define(
  "Medication",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dosage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    times: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    instructions: {
      type: DataTypes.TEXT,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Email reminder specific fields
    sendEmailReminders: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "medications",
    timestamps: true,
  }
);

// Symptom Model
const Symptom = sequelize.define(
  "Symptom",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    severity: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 10,
      },
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    duration: {
      type: DataTypes.STRING,
    },
    triggers: {
      type: DataTypes.TEXT,
    },
    recordedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // Email notification for symptom tracking
    emailAlertSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "symptoms",
    timestamps: true,
  }
);

// HealthGoal Model
const HealthGoal = sequelize.define(
  "HealthGoal",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    category: {
      type: DataTypes.ENUM(
        "medication",
        "exercise",
        "diet",
        "symptom",
        "lifestyle"
      ),
      allowNull: false,
    },
    targetValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currentValue: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    unit: {
      type: DataTypes.STRING,
    },
    deadline: {
      type: DataTypes.DATE,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      defaultValue: "medium",
    },
    // Email notifications for goal progress
    sendProgressEmails: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastProgressEmailSent: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "health_goals",
    timestamps: true,
  }
);

// Reminder Model (Email only)
const Reminder = sequelize.define(
  "Reminder",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.ENUM(
        "medication",
        "exercise",
        "appointment",
        "symptom_check",
        "water",
        "other"
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    scheduledTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    recurrencePattern: {
      type: DataTypes.STRING, // 'daily', 'weekly', 'monthly'
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      defaultValue: "medium",
    },
    // Email specific fields
    sendEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailSentAt: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "reminders",
    timestamps: true,
  }
);

// HealthMetrics Model
const HealthMetric = sequelize.define(
  "HealthMetric",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.ENUM(
        "blood_pressure",
        "heart_rate",
        "blood_sugar",
        "weight",
        "temperature",
        "other"
      ),
      allowNull: false,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    recordedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // Email alerts for critical metrics
    isCritical: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    criticalAlertSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "health_metrics",
    timestamps: true,
  }
);

// Define relationships
User.hasOne(Preference, { foreignKey: "UserId", onDelete: "CASCADE" });
User.hasMany(Medication, { foreignKey: "UserId", onDelete: "CASCADE" });
User.hasMany(Symptom, { foreignKey: "UserId", onDelete: "CASCADE" });
User.hasMany(HealthGoal, { foreignKey: "UserId", onDelete: "CASCADE" });
User.hasMany(Reminder, { foreignKey: "UserId", onDelete: "CASCADE" });
User.hasMany(HealthMetric, { foreignKey: "UserId", onDelete: "CASCADE" });

Preference.belongsTo(User, { foreignKey: "UserId" });
Medication.belongsTo(User, { foreignKey: "UserId" });
Symptom.belongsTo(User, { foreignKey: "UserId" });
HealthGoal.belongsTo(User, { foreignKey: "UserId" });
Reminder.belongsTo(User, { foreignKey: "UserId" });
HealthMetric.belongsTo(User, { foreignKey: "UserId" });

module.exports = {
  sequelize,
  User,
  Preference,
  Medication,
  Symptom,
  HealthGoal,
  Reminder,
  HealthMetric,
};
