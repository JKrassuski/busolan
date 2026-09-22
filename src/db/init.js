const fs = require("fs");
const path = require("path");
const pool = require("./pool");

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
  console.log("Schema aplicado com sucesso.");
  await pool.end();
}

init().catch((err) => {
  console.error("Falha ao aplicar schema:", err);
  process.exit(1);
});
