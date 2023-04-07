import * as http from "http";
import events from "events";
import fs from "fs";
import csv from "csvtojson";
import { Transform } from "stream";
import { pipeline as asyncPipeline } from "stream/promises";

const hostname = '127.0.0.1';
const port = 3000;

const emitter = new events.EventEmitter();

const server = http.createServer((req, res) => {
   if (req.url === "/") {
      emitter.emit("handleRequest", { a: "this is my event" });
   }
   res.statusCode = 200;
   res.setHeader("Content-type", "application/json")
   emitter.on("wasEnded", function (events) {
      console.log("this is event received");
      console.log(events);
      res.end(JSON.stringify(events));
   });
});


server.listen(port, hostname, () => {
   console.log(`Server running at http://${hostname}:${port}/`);
});

emitter.on("handleRequest", async function (events) {
   console.log("this is event received");
   console.log(events);
   let countOriginal = 0;
   let countFilter = 0;
   let data: {
      name: any;
      email: any;
      age: number;
      salary: number;
      isActive: boolean;
   }[] = [];
   const stream = fs.createReadStream("./data/import.csv");

   // const writeStream = fs.createWriteStream("./data/export.csv");
   const transform = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
         const user = {
            name: chunk.name,
            email: chunk.email,
            age: Number(chunk.age),
            salary: Number(chunk.salary),
            isActive: chunk.isActive === "true" ? true : false,
         }
         countOriginal++;
         callback(null, user);
      }
   });

   const filter = new Transform({
      objectMode: true,
      transform(chunk, _encoding, callback) {
         if (!chunk.isActive || chunk.age < 60) {
            return callback(null);
         }
         data.push(chunk);
         countFilter++
         callback(null);
      }
   });

   // pipeline/promises instead of promisify(stream.pipeline)
   try {
      await asyncPipeline(
         stream,
         csv({ delimiter: " " }, { objectMode: true }),
         transform,
         filter,
         // data can be sent to a broker, api, db, etc.
      )
      console.log("finished", { countOriginal, countFilter });
      emitter.emit("wasEnded", data);
   } catch (err) {
      console.error('Pipeline failed.', err);
      emitter.emit("wasEnded", []);
   }

   // stream
   //    .pipe(csv({
   //       delimiter: " ",
   //    }, { objectMode: true }))
   //    .pipe(
   //       transform
   //    )
   //    .pipe(
   //       filter
   //    )
   //    .on("data", function (chunk) {
   //       console.log(chunk);
   //       data.push(chunk);
   //    })
   //    .on("error", function (err) {
   //       console.log(err);
   //    })
   //    .on("end", function () {
   //       console.log("finished", { countOriginal, countFilter });
   //       emitter.emit("wasEnded", data);
   //    })

   // .pipe(writeStream);

   // stream.on("data", function (chunk) {
   //    count++;
   //    data += chunk;
   //    console.log(count);
   //    writeStream.write(chunk);
   // });
   // writeStream.on("finish", function () {
   //    console.log("finished");
   // });

   // stream.on("end", function () {
   //    console.log("finished");
   // });
});