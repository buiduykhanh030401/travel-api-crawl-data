const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const URL = "http://dulich24.com.vn/du-lich";
const rootURL = "http://dulich24.com.vn/";
const travelURL = "https://travel.com.vn/";

//SET UP
const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
dotenv.config();
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

//ROUTES

//GET all tour dulich 24h
app.get("/v1", async (req, resp) => {
  const thumbnails = [];
  // const limit = Number(req.query.limit);
  try {
    await axios(URL).then((res) => {
      const html = res.data;
      const $ = cheerio.load(html);
      $(".group-title", html).each(function () {
        const name = $(this).find("h3 > a");
        const urlTravel = $(this).find("a").attr("href");
        const image = $(this).find("a > img").attr("src");
        thumbnails.push({
          name: name.text(),
          url: `${urlTravel}`,
          image: image,
        });
      });
      resp.status(200).json(thumbnails);
    });
  } catch (err) {
    resp.status(500).json(err);
  }
});

//GET detail tour dulich 24h
app.get("/v1/:place", async (req, resp) => {
  const thumbnails = [];
  const place = req.params.place;
  let url = rootURL + place + "/diem-du-lich";

  try {
    await axios(url).then((res) => {
      const html = res.data;
      const $ = cheerio.load(html);
      $(".news-item", html).each(function (index) {
        const address = $(this).find("span")
        const image = $(this).find("img").attr("src");
        const name = $(this).find("img").attr("title");
        const detailURL = $(this).find("a").attr("href");
        console.log(image);
        if (index > 6) {
          thumbnails.push({
            place: place,
            name: name,
            address: address.text(),
            image: image,
            detailURL: rootURL + detailURL.slice(1)
          });
        }

      });
    });
    resp.status(200).json(thumbnails);
  } catch (err) {
    resp.status(500).json(err);
  }
});
const getTours = async (url, thumbnails) => {
  await axios(url).then((res) => {
    const html = res.data;
    console.log(html);
    const $ = cheerio.load(html);
    $(".tour-item", html).each(function (index) {
      const time = $(this).find("div > p.tour-item__date").text();
      const image = $(this).find("div > div > a > img").attr("src");
      const name = $(this).find("div > p > a").attr("title");
      const detailURL = $(this).find("div > p > a").attr("href");
      const start = $(this).find("div > div > p.tour-item__departure").text();
      const oldPrice = $(this).find("span.tour-item__price--old__number").text();
      const newPrice = $(this).find("span.tour-item__price--current__number").text();
      const code = $(this).find("div.tour-item__code > div").text().replace(`Mã tour:`, "").replace(/\n/g, "");

      console.log(image);
      if (index > 6) {
        thumbnails.push({
          name: name,
          time: time,
          image: image,
          detailURL: travelURL + detailURL.slice(1),
          start: start,
          oldPrice: oldPrice,
          newPrice: newPrice,
          code: code
        });
      }

    });
  });
}
// get tours
app.get("/api/get-tours", async (req, resp) => {
  const thumbnails = [];
  let url1 = `${travelURL}du-lich-gio-chot-p1.aspx`;
  let url2 = `${travelURL}du-lich-gio-chot-p2.aspx`;
  try {
    await getTours(url1, thumbnails);
    await getTours(url2, thumbnails);
    resp.status(200).json(thumbnails);
  } catch (err) {
    resp.status(500).json(err);
  }
})

// get details tours by detailURL
app.post("/api/get-tours", async (req, res) => {
  const thumbnails = [];
  const url = req.body.url;
  try {
    await axios(url).then((res) => {
      const html = res.data;
      const $ = cheerio.load(html);
      $(".tour-detail", html).each(function () {
        const oldPrice = $(this).find("span.tour-item__price--old__number").text();
        const newPrice = $(this).find("span.price").text();
        const name = $(this).find("h1.title").text();
        const description = $(this).find("p.s-title-03").text();
        const dateStart = $(this).find("div.goto > div.date > b").text();
        const dateEnd = $(this).find("div.comeback > div.date > b").text();
        const image = $(this).find("div.image > img ");
        let imgArr = [];
        image.each(function (i, e) {
          imgArr.push($(this).attr("src"));
        })


        thumbnails.push({
          name: name,
          oldPrice: oldPrice,
          newPrice: newPrice,
          image: imgArr,
          description: description,
          dateStart: dateStart,
          dateEnd: dateEnd
        });
      });
    });
    res.status(200).json(thumbnails);
  } catch (err) {
    res.status(500).json(err);
  }
})

// get description, image from google by name
app.post("/api/get-description-marker", async (req, res) => {
  const imageArr = [];
  const descriptionArr = [];
  // const url = "https://www.google.com/search?q=" + req.body.name;
  const url = "https://search.aol.com/aol/search?q=" + req.body.name;
  console.log(url);
  try {
    await axios(url).then((res) => {
      let html = res.data;
      console.log(html);

      const $ = cheerio.load(html);
      // console.log($);
      $(".thmb", html).each(function () {
        const image = $(this).find("img.s-img").attr("src");
        if (image.includes("http")) {
          imageArr.push({
            image: image
          });
        }
      });
      $(".compText", html).each(function () {
        let description = $(this).find("p.lh-16").html();
        // description = description.replace(/(<([^>]+)>)/ig, "");
        descriptionArr.push({
          description: description
        });
      });
    });
    res.status(200).json({ imageArr, descriptionArr });
  } catch (err) {
    res.status(500).json(err);
  }
})

// RUN PORT
app.listen(process.env.PORT || 8000, () => {
  console.log("Server is running... ");
});
