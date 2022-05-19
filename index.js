const express = require("express");
const cors = require("cors");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { decode } = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dcmrw.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  // console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }

    req.decoded = decoded;
  });
  next();
}

async function run() {
  await client.connect();

  const todoCollection = client.db("Todo").collection("listoftodo");
  // console.log(todoCollection);
  try {
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      // console.log(user);
      res.send({ accessToken });
    });

    app.post("/register", async (req, res) => {
      const user = req.body;
      console.log(user);
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      console.log(accessToken);
      // console.log(user);
      res.send({ accessToken });
    });

    app.get("/todolist", async (req, res) => {
      res.send("hello");
    });

    app.get("/mytodolist", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded?.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = todoCollection.find(query);
        const product = await cursor.toArray();
        res.send(product);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });

    app.post("/newtodo", async (req, res) => {
      const newTodo = req.body;
      const result = await todoCollection.insertOne(newTodo);
      res.send(result);
    });

    app.delete("/todolist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await todoCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/todo/:id", async (req, res) => {
      const id = req.params.id;
      const updatedTodo = req.body;
      console.log(updatedTodo);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: updatedTodo.status,
        },
      };

      const result = await todoCollection.updateOne(filter, updateDoc, options);
      result.quantity = updatedTodo.quantity;
      res.send(result);
    });
  } finally {
  }
}

app.get("/", async (req, res) => {
  res.send("Hello World");
});

run().catch(console.dir);
app.listen(port, () => {
  console.log("port started at", port);
});
