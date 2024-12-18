import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { validationResult } from "express-validator";
import dotenv from "dotenv";
dotenv.config();
import { MongoClient } from "mongodb";

const port = process.env.PORT || 3000;
const uri = process.env.ATLAS_URI;

const app = express();
app.set("view engine", "ejs");

async function getUsers() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db("datastack"); // Replace with your actual database name
    const usersCollection = database.collection("users");
    const users = await usersCollection.find().toArray();
    return users; // Return the users data
  } finally {
    await client.close();
  }
}
getUsers();

async function getTeams() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db("datastack"); // Replace with your actual database name
    const usersCollection = database.collection("teams");
    const users = await usersCollection.find().toArray();
    return users; // Return the users data
  } finally {
    await client.close();
  }
}
getTeams();

// Mongoose model for User
const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      id: Number,
      first_name: String,
      last_name: String,
      email: String,
      gender: String,
      avatar: String,
      domain: String,
      available: Boolean,
    },
    { collection: "users", strict: false }
  )
);

const Team = mongoose.model(
  "Team",
  new mongoose.Schema(
    {
      id: { type: Number, ref: "User" },
      name: String,
      users: [{ type: Number, ref: "User" }],
    },
    { collection: "teams" }
  )
);

app.use(cors());
app.use(express.json());

app.listen(port, () => {
  console.log("Server running on port", port);
});

mongoose
  .connect(uri, { dbName: "datastack" })
  .then(() => {
    console.log("MongoDB Connection Established");
  })
  .catch((e) => console.log("Connection Failed", e.message));

// app.get("/api/allusersdirect", async (req, res) => {
//   try {
//     const allUsers = await getUsers();
//     console.log("Fetched Users:", allUsers); // Debugging: log the fetched data
//     res.json(allUsers);
//   } catch (error) {
//     console.error("Error retrieving all users:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
// app.get("/test-mongoose", async (req, res) => {
//   try {
//     console.log("Fetching users via Mongoose...");
//     const users = await User.find(); // Fetch all users
//     console.log("Fetched users:", users); // Log fetched data for debugging
//     res.json(users);
//   } catch (error) {
//     console.error("Error with Mongoose query:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// app.get("/test-direct", async (req, res) => {
//   try {
//     const database = mongoose.connection.db;
//     const collection = database.collection("users");
//     console.log(collection);
//     const users = await collection.find({}).toArray();
//     console.log("Direct query results:", users);
//     res.json(users);
//   } catch (error) {
//     console.error("Error with direct MongoDB query:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
app.get("/attribute", async (req, res) => {
  const filteredUsers = await User.find();
  const domain = [];
  const gender = [];
  filteredUsers.map((c) => {
    if (!domain.includes(c.domain)) {
      domain.push(c.domain);
    }
    if (!gender.includes(c.gender)) {
      gender.push(c.gender);
    }
  });
  res.json({ domain, gender });
});
// Retrieve all users with pagination support
app.get("/api/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const defaultLimit = 10;
    const limit = parseInt(req.query.limit) || defaultLimit;
    const input = req.query.fullname || "";
    const skip = (page - 1) * limit;
    // Apply filtering logic directly in the database query
    const filteredUsers = await User.find({
      $or: [
        { first_name: { $regex: input, $options: "i" } },
        { last_name: { $regex: input, $options: "i" } },
      ],
    })
      .skip(skip)
      .limit(limit);

    const fil = await User.find({
      $or: [
        { first_name: { $regex: input, $options: "i" } },
        { last_name: { $regex: input, $options: "i" } },
      ],
    });
    const length = fil.length;

    // Fetch total count of filtered users
    const totalCount = await User.countDocuments({
      $or: [
        { first_name: { $regex: input, $options: "i" } },
        { last_name: { $regex: input, $options: "i" } },
      ],
    });

    // Return filtered users and total count in the response
    res.json({ users: filteredUsers, totalCount, length });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/allusers", async (req, res) => {
  try {
    const input = req.query.fullname || "";
    console.log("called");
    // Apply filtering logic directly in the database query
    const filteredUsers = await User.find({
      $or: [
        { first_name: { $regex: input, $options: "i" } },
        { last_name: { $regex: input, $options: "i" } },
      ],
    });
    console.log(filteredUsers);
    const fil = await User.find({
      $or: [
        { first_name: { $regex: input, $options: "i" } },
        { last_name: { $regex: input, $options: "i" } },
      ],
    });
    const length = fil.length;
    console.log(fil);
    // Fetch total count of filtered users
    const totalCount = await User.countDocuments({
      $or: [
        { first_name: { $regex: input, $options: "i" } },
        { last_name: { $regex: input, $options: "i" } },
      ],
    });

    // Return filtered users and total count in the response
    res.json({ users: filteredUsers, totalCount, length });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Retrieve a specific user by ID
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a user
app.delete("/api/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findOneAndDelete({ id: req.params.id });
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const id = req.params.id; // Assuming `id` is passed in the URL
    const { fname, lname, email, domain, gender, available } = req.body;

    const user = await User.findOneAndUpdate(
      { id },
      { fname, lname, email, domain, gender, available },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/teams", async (req, res) => {
  try {
    const { id, name, users } = req.body;
    const team = new Team({ id, name, users });
    await team.save();
    console.log(team);
    res.status(201).json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/teams/:id", async (req, res) => {
  try {
    const team = await Team.findOne({ id: req.params.id });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    res.json(team);
  } catch (error) {
    console.error("Error retrieving team:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/api/teams/", async (req, res) => {
  try {
    const team = await Team.find();
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    res.json(team);
  } catch (error) {
    console.error("Error retrieving team:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { first_name, last_name, email, domain, gender, available } =
      req.body;

    // Get the length of existing users and increment it by 1 for the new user ID
    const id = (await User.countDocuments()) + 1;

    // Create a new user instance based on the provided data and generated ID
    const user = new User({
      id,
      first_name,
      last_name,
      email,
      domain,
      gender,
      available,
    });

    // Save the new user to the database
    await user.save();

    // Return the newly created user in the response
    res.status(201).json(user);
  } catch (error) {
    // Handle errors
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
