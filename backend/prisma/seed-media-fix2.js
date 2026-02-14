const { PrismaClient } = require("@prisma/client");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const prisma = new PrismaClient();

const ITEMS = [
  { url: "https://images.unsplash.com/photo-1543465077-db45d34b88a5?w=1920&h=1080&fit=crop&q=90", name: "motorwagen-bezorging.jpg", alt: "Bezorgwagen voor distributie", mimeType: "image/jpeg" },
  { url: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1920&h=1080&fit=crop&q=90", name: "motorwagen-wit.jpg", alt: "Witte bestelwagen voor vervoer", mimeType: "image/jpeg" }
];

function downloadFile(url, dest, maxRedirects) {
  maxRedirects = maxRedirects || 5;
  return new Promise(function(resolve, reject) {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    var file = fs.createWriteStream(dest);
    var protocol = url.startsWith("https") ? https : http;
    var request = protocol.get(url, { headers: { "User-Agent": "Moveo-CMS/1.0" }, timeout: 60000 }, function(response) {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        try { fs.unlinkSync(dest); } catch(e) {}
        var redirectUrl = response.headers.location;
        if (redirectUrl.startsWith("/")) {
          var parsed = new URL(url);
          redirectUrl = parsed.protocol + "//" + parsed.host + redirectUrl;
        }
        return downloadFile(redirectUrl, dest, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(dest); } catch(e) {}
        return reject(new Error("HTTP " + response.statusCode));
      }
      response.pipe(file);
      file.on("finish", function() { file.close(); resolve(); });
    });
    request.on("error", function(err) { file.close(); try { fs.unlinkSync(dest); } catch(e) {} reject(err); });
  });
}

async function run() {
  var dir = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
  for (var item of ITEMS) {
    var fp = path.join(dir, item.name);
    if (fs.existsSync(fp) && fs.statSync(fp).size > 1000) {
      console.log("skip " + item.name);
      continue;
    }
    try {
      console.log("Downloading " + item.name + "...");
      await downloadFile(item.url, fp);
      var s = fs.statSync(fp);
      console.log("OK " + item.name + " (" + (s.size / 1024).toFixed(0) + " KB)");
      var ex = await prisma.media.findFirst({ where: { filename: item.name } });
      if (!ex) {
        await prisma.media.create({
          data: {
            filename: item.name,
            originalName: item.name,
            mimeType: item.mimeType,
            size: s.size,
            path: "/uploads/" + item.name,
            altText: item.alt,
            width: 1920,
            height: 1080
          }
        });
      }
    } catch(e) {
      console.log("FAIL " + item.name + ": " + e.message);
    }
  }
}

run().catch(console.error).finally(function() { prisma.$disconnect(); });
