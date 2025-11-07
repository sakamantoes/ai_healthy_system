const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
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
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        dailyAlerts: true,
        medicationReminders: true,
        motivationalMessages: true,
      },
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
  },
  {
    tableName: "health_goals",
    timestamps: true,
  }
);

// Reminder Model
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
  },
  {
    tableName: "reminders",
    timestamps: true,
  }
);

// HealthMetrics Model (New for tracking vital signs)
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
  },
  {
    tableName: "health_metrics",
    timestamps: true,
  }
);

// Define relationships
User.hasMany(Medication, { foreignKey: "UserId", onDelete: "CASCADE" });
User.hasMany(Symptom, { foreignKey: "UserId", onDelete: "CASCADE" });
User.hasMany(HealthGoal, { foreignKey: "UserId", onDelete: "CASCADE" });
User.hasMany(Reminder, { foreignKey: "UserId", onDelete: "CASCADE" });
User.hasMany(HealthMetric, { foreignKey: "UserId", onDelete: "CASCADE" });

Medication.belongsTo(User, { foreignKey: "UserId" });
Symptom.belongsTo(User, { foreignKey: "UserId" });
HealthGoal.belongsTo(User, { foreignKey: "UserId" });
Reminder.belongsTo(User, { foreignKey: "UserId" });
HealthMetric.belongsTo(User, { foreignKey: "UserId" });

module.exports = {
  sequelize,
  User,
  Medication,
  Symptom,
  HealthGoal,
  Reminder,
  HealthMetric,
};
