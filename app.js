const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req, res) => res.sendFile("client.html", {root: __dirname}));

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
