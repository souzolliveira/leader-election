const express = require("express");
const http = require("http");
const axios = require("axios");
let cors = require("cors");

const APP = express();
APP.use(express.json());

const SERVER = http.createServer(APP);

const PORT = process.env.PORT;

APP.use(cors());

SERVER.listen(PORT);

let nodes = {
  9121: { state: null },
  9122: { state: null },
  9123: { state: null },
  9124: { state: null },
  9125: { state: null },
};

let leader = null;

const sendElection = async () => {
  Object.keys(nodes)
    .filter((node) => parseInt(node, 10) > PORT)
    .map(async (node) => {
      const SERVICE = axios.create({
        baseURL: `http://localhost:${node}`,
      });
      await SERVICE.get("/send-election");
      await SERVICE.get(`/election/${PORT}`).then((res) => {
        if (res.data.message === "OK") {
          nodes = {
            ...nodes,
            [node]: {
              state: "OK",
            },
          };
          leader = Math.max(leader, parseInt(node, 10));
        }
      });
    });
};

APP.get("/send-election", async (req, res) => {
  await sendElection();
  res.json({
    message: "Election sent",
  });
});

APP.get("/leader", (req, res) => {
  res.json({ port: PORT, leader });
});

APP.get("/election/:port", (req, res) => {
  const { port } = req.params;
  if (PORT > port) leader = parseInt(PORT, 10);
  else leader = parseInt(port, 10);
  /**
   * set true to 9125 responses DOWN to another
   * server to be elected
   */
  const test = false;
  if (parseInt(PORT, 10) === 9125 && test) res.json({ message: "DOWN" });
  else res.json({ message: "OK" });
});
