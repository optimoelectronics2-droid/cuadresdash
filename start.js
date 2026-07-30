const { execSync } = require("child_process");
const port = process.env.PORT || "3456";
execSync(`next start -p ${port}`, { stdio: "inherit" });
