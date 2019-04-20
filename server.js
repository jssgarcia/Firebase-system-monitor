/**
 * Autor: Mario Pérez Esteso <mario@geekytheory.com>
 * Web: geekytheory.com
 */

const { port, ip, intervals } = require("./config.js"),
  { serverHandler, execHandler, errorHandler } = require("./utils"),
  server = require("http")
    .createServer(serverHandler)
    .listen(port, ip),
  io = require("socket.io").listen(server);

var connectCounter = 0;

//Cuando abramos el navegador estableceremos una conexión con socket.io.
//Cada X segundos mandaremos a la gráfica un nuevo valor.
io.sockets.on("connection", function(socket) {
  const address = socket.handshake.address;

  console.log("New connection from " + address.address + ":" + address.port);
  connectCounter++;
  console.log("NUMBER OF CONNECTIONS++: " + connectCounter);
  socket.on("disconnect", function() {
    connectCounter--;
    console.log("NUMBER OF CONNECTIONS--: " + connectCounter);
  });

  Promise.all([
    execHandler("egrep --color 'MemTotal' /proc/meminfo | egrep '[0-9.]{4,}' -o"), //MemTotal
    execHandler("hostname"), //Hostname
    execHandler("uptime | tail -n 1 | awk '{print $1}'"), //Uptime
    execHandler("uname -r"), //Uname
    execHandler("top -d 0.5 -b -n2 | tail -n 10 | awk '{print $12}'"), //top
  ])
    .then(stdouts => {
      socket.emit("memoryTotal", stdouts[0]);
      socket.emit("hostname", stdouts[1]);
      socket.emit("uptime", stdouts[2]);
      socket.emit("kernel", stdouts[3]);
      socket.emit("toplist", stdouts[4]);
    })
    .catch(errorHandler);

  // Function for checking memory

  /* SETINTEVALS FUNCTIONS */

  /* --- Intervals-short */
  setInterval(function() {
    // Function for checking memory free and used

    Promise.all([
      execHandler("egrep --color 'MemFree' /proc/meminfo | egrep '[0-9.]{4,}' -o"), // Function for checking memory free and used
      execHandler("egrep --color 'Buffers' /proc/meminfo | egrep '[0-9.]{4,}' -o"), // Function for checking memory buffered
      execHandler("egrep --color 'Cached' /proc/meminfo | egrep '[0-9.]{4,}' -o"), // Function for checking memory buffered
      execHandler("egrep --color 'MemTotal' /proc/meminfo | egrep '[0-9.]{4,}' -o"), //Funcion for MemoryTotal
    ])
      .then(stdouts => {
        const memTotal = stdouts[3];
        const memFree = stdouts[0];
        const memBuffered = stdouts[1];
        const memCached = stdouts[2];

        const memUsed = parseInt(memTotal, 10) - parseInt(memFree, 10);
        const percentUsed = Math.round((parseInt(memUsed, 10) * 100) / parseInt(memTotal, 10));
        const percentFree = 100 - percentUsed;
        const percentBuffered = Math.round((parseInt(memBuffered, 10) * 100) / parseInt(memTotal, 10));
        const percentCached = Math.round((parseInt(memCached, 10) * 100) / parseInt(memTotal, 10));

        socket.emit("memoryUpdate", percentFree, percentUsed, percentBuffered, percentCached);
      })
      .catch(errorHandler);

    // Function for measuring temperature
    execHandler("cat /sys/class/thermal/thermal_zone0/temp")
      .then(stdout => {
        //Es necesario mandar el tiempo (eje X) y un valor de temperatura (eje Y).
        var date = new Date().getTime();
        var temp = parseFloat(stdout) / 1000;
        socket.emit("temperatureUpdate", date, temp);
      })
      .catch(errorHandler);
  }, intervals.short);

  /* --- Intervals-medium */
  setInterval(function() {
    //TOP List
    execHandler("top -d 0.5 -b -n2 | grep 'Cpu(s)'|tail -n 1 | awk '{print $2 + $4}'")
      .then(stdout => {
        //Es necesario mandar el tiempo (eje X) y un valor de temperatura (eje Y).
        var date = new Date().getTime();
        socket.emit("cpuUsageUpdate", date, parseFloat(stdout));
      })
      .catch(errorHandler);

    //TOP List
    execHandler("ps aux --width 30 --sort -rss --no-headers | head  | awk '{print $11}'")
      .then(stdout => {
        socket.emit("toplist", stdout);
      })
      .catch(errorHandler);
  }, intervals.medium);

  /* --- Intervals-long */
  setInterval(function() {
    // Uptime
    execHandler("uptime | tail -n 1 | awk '{print $3 $4 $5}'")
      .then(stdout => {
        socket.emit("uptime", stdout);
      })
      .catch(errorHandler);
  }, intervals.long);
});

//Escuchamos en el puerto $port
server.listen(port);
