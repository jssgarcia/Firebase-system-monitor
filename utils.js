const fs = require("fs"),
  exec = require("child_process").exec;

//Si todo va bien al abrir el navegador, cargaremos el archivo index.html
function serverHandler(req, res) {
  fs.readFile(__dirname + "/index.html", function(err, data) {
    if (err) {
      //Si hay error, mandaremos un mensaje de error 500
      console.log(err);
      res.writeHead(500);
      res.end("Error loading index.html");
    } else {
      res.writeHead(200);
      res.end(data);
    }
  });
}

function execHandler(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, function(error, stdout, stderr) {
      if (error) {
        console.log("exec error: " + error);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

function errorHandler(err) {
  console.log("exec error: " + err);
}

module.exports = {
  serverHandler,
  execHandler,
  errorHandler,
};
