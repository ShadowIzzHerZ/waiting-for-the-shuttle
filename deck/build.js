const pptxgen = require("pptxgenjs");
const React = require("react");
const RDS = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");

const HEX = {
  dk1: "1F2A2B", lt1: "FFFFFF", dk2: "0F3D3E", lt2: "EEF4F3",
  accent1: "F2A541", accent2: "3A7D7B", accent3: "C8553D",
  accent4: "8AA8A6", accent5: "5B6B6C", accent6: "D9E6E4",
  hlink: "3A7D7B", folHlink: "5B6B6C",
};
const THEME = { name: "P05 Shuttle", headFontFace: "Cambria", bodyFontFace: "Calibri", colors: HEX };

async function icon(Comp, color) {
  const svg = RDS.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  pres.title = "P05 Waiting for the Shuttle";
  pres.author = "Team P05";
  const C = pres.SchemeColor;
  const W = 13.333;

  // ---------- Layouts ----------
  pres.defineSlideMaster({
    title: "TITLE_DARK",
    background: { color: C.text2 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.2, w: 8.6, h: 1.5, fontFace: THEME.headFontFace, fontSize: 48, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.9, w: 8.6, h: 1.6, fontFace: THEME.bodyFontFace, fontSize: 20, color: C.accent6, valign: "top", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "CONTENT",
    background: { color: C.background1 },
    margin: [0.5, 0.6, 0.6, 0.6],
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.4, w: 12.1, h: 0.9, fontFace: THEME.headFontFace, fontSize: 34, bold: true, color: C.text2, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { text: { text: "P05 · Waiting for the Shuttle · INT335 Design Thinking", options: { x: 0.6, y: 6.95, w: 7, h: 0.3, fontFace: THEME.bodyFontFace, fontSize: 10, color: C.accent5, margin: 0 } } },
    ],
    slideNumber: { x: 12.2, y: 6.95, w: 0.5, h: 0.3, fontFace: THEME.bodyFontFace, fontSize: 10, color: C.accent5, align: "right" },
  });
  pres.defineSlideMaster({
    title: "STATEMENT_DARK",
    background: { color: C.text2 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 0.6, w: 11.7, h: 0.6, fontFace: THEME.bodyFontFace, fontSize: 18, bold: true, color: C.accent1, align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 1.3, w: 11.7, h: 2.2, fontFace: THEME.headFontFace, fontSize: 30, color: C.background1, valign: "top", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: 12.2, y: 6.95, w: 0.5, h: 0.3, fontFace: THEME.bodyFontFace, fontSize: 10, color: C.accent4, align: "right" },
  });

  // ---------- Icons ----------
  const I = {};
  const want = {
    van: [fa.FaShuttleVan, HEX.accent1], van2: [fa.FaShuttleVan, HEX.lt1], user: [fa.FaUserGraduate, HEX.lt1], pin: [fa.FaMapMarkerAlt, HEX.lt1],
    team: [fa.FaUsers, HEX.lt1], mic: [fa.FaMicrophone, HEX.lt1], eye: [fa.FaBinoculars, HEX.lt1],
    watch: [fa.FaStopwatch, HEX.lt1], stop: [fa.FaMapSigns, HEX.lt1], ban: [fa.FaBan, HEX.lt1],
    hour: [fa.FaHourglassHalf, HEX.lt1], crowd: [fa.FaUserFriends, HEX.lt1], hide: [fa.FaEyeSlash, HEX.lt1],
    tools: [fa.FaTools, HEX.lt1], chart: [fa.FaChartBar, HEX.lt1], mobile: [fa.FaMobileAlt, HEX.lt1],
    db: [fa.FaDatabase, HEX.lt1], arrow: [fa.FaArrowRight, HEX.accent4], warn: [fa.FaExclamationTriangle, HEX.lt1],
    check: [fa.FaCheck, HEX.lt1],
  };
  for (const k of Object.keys(want)) I[k] = await icon(want[k][0], want[k][1]);

  const iconCircle = (s, key, x, y, d, fill, name) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: name + " circle" });
    const p = d * 0.25;
    s.addImage({ data: I[key], x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, objectName: name + " icon", altText: name });
  };
  const card = (s, x, y, w, h, fill, name) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { type: "none" }, objectName: name });
  const txt = (s, text, o) => s.addText(text, Object.assign({ isTextBox: true, fontFace: THEME.bodyFontFace, color: C.text1, margin: 0, valign: "top" }, o));

  const secs = (m, s) => (m * 60 + s) / 86400;
  const chartText = { catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt", legendFontFace: "+mn-lt", titleFontFace: "+mn-lt" };

  // ---------- 1. Title ----------
  pres.addSection({ title: "Introduction" });
  let s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Introduction" });
  s.addText("Waiting for the Shuttle", { placeholder: "title" });
  s.addText([
    { text: "P05 · INT335 Design Thinking · Section TF", options: { breakLine: true } },
    { text: "Kumari Akanksha Jha · Soham Ghosh · Sakshi · Rehan", options: { fontSize: 16 } },
  ], { placeholder: "body" });
  s.addImage({ data: I.van, x: 9.9, y: 2.2, w: 2.6, h: 2.6, objectName: "Shuttle icon", altText: "Campus shuttle" });
  s.addNotes("Introduce the team and the project: campus carts at LPU and the students who wait for them.");

  // ---------- 2. Problem ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Introduction" });
  s.addText("Students without vehicles lose time to cart delays", { placeholder: "title" });
  card(s, 0.6, 1.6, 5.4, 4.9, C.background2, "Problem space card");
  txt(s, "PROBLEM SPACE", { x: 1.0, y: 2.0, w: 4.6, h: 0.4, fontSize: 14, bold: true, color: C.accent2, charSpacing: 2 });
  txt(s, "“Students traversing the campus without vehicles face major issues related to cart delays.”", { x: 1.0, y: 2.6, w: 4.6, h: 2.6, fontFace: THEME.headFontFace, fontSize: 24, italic: true, color: C.text2 });
  txt(s, "From our signed CP1 registration", { x: 1.0, y: 5.7, w: 4.6, h: 0.4, fontSize: 12, color: C.accent5 });
  const rows2 = [
    ["user", "Who we design for", "Students without vehicles crossing the campus"],
    ["pin", "Where we work", "Cart stops, stop points and security outposts"],
    ["team", "Our team", "Akanksha (Lead) · Soham (Prototype) · Sakshi (Documentation) · Rehan (Research & Design)"],
  ];
  rows2.forEach((r, i) => {
    const y = 1.75 + i * 1.6;
    iconCircle(s, r[0], 6.6, y, 0.9, C.accent2, r[1]);
    txt(s, r[1], { x: 7.8, y: y - 0.02, w: 4.9, h: 0.45, fontSize: 20, bold: true, color: C.text2 });
    txt(s, r[2], { x: 7.8, y: y + 0.45, w: 4.9, h: 0.9, fontSize: 15 });
  });
  s.addNotes("CP1: the problem space, target group and field sites exactly as on our signed registration sheet.");

  // ---------- 3. Research at a glance ----------
  pres.addSection({ title: "Empathise" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Empathise" });
  s.addText("What we did to understand the problem", { placeholder: "title" });
  const stats = [
    ["mic", "21", "student interviews"],
    ["eye", "9", "observation sessions at cart stops"],
    ["watch", "14", "timed rides, wait and ride"],
    ["stop", "3", "named stops compared in detail"],
  ];
  stats.forEach((st, i) => {
    const x = 0.6 + i * 3.1;
    card(s, x, 1.6, 2.8, 3.6, C.background2, st[2] + " card");
    iconCircle(s, st[0], x + 0.35, 1.95, 0.8, C.accent2, st[2]);
    txt(s, st[1], { x: x + 0.35, y: 2.95, w: 2.2, h: 1.1, fontFace: THEME.headFontFace, fontSize: 60, bold: true, color: C.text2 });
    txt(s, st[2], { x: x + 0.35, y: 4.1, w: 2.2, h: 0.9, fontSize: 16 });
  });
  card(s, 0.6, 5.55, 12.1, 1.0, C.accent6, "Driver note");
  iconCircle(s, "ban", 0.85, 5.7, 0.7, C.accent3, "Drivers declined");
  txt(s, [
    { text: "Cart drivers declined to be interviewed. ", options: { bold: true } },
    { text: "They told us they are not allowed to give interviews." },
  ], { x: 1.8, y: 5.7, w: 10.6, h: 0.7, fontSize: 15, valign: "middle" });
  s.addNotes("Fieldwork: interviews, stopwatch observations at stops (each tap = a cart arriving), and timed rides (wait, then time in the cart).");

  // ---------- 4. Rides chart ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Empathise" });
  s.addText("Waiting takes almost as long as riding", { placeholder: "title" });
  s.addChart(pres.charts.BAR, [
    { name: "Wait for cart", labels: ["Ride 1", "Ride 2", "Ride 3", "Ride 4", "Ride 5"], values: [secs(4, 47), secs(9, 50), secs(5, 56), secs(6, 34), secs(4, 59)] },
    { name: "Time in cart", labels: ["Ride 1", "Ride 2", "Ride 3", "Ride 4", "Ride 5"], values: [secs(7, 39), secs(6, 44), secs(6, 1), secs(6, 55), secs(5, 12)] },
  ], Object.assign({
    x: 0.6, y: 1.5, w: 8.2, h: 5.2, barDir: "col", barGapWidthPct: 60,
    chartColors: [HEX.accent1, HEX.accent2],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "m:ss", dataLabelFontSize: 11, dataLabelColor: HEX.dk1,
    valAxisLabelFormatCode: "m:ss", valAxisLabelFontSize: 11, valAxisLabelColor: HEX.accent5, valAxisMinVal: 0,
    catAxisLabelFontSize: 12, catAxisLabelColor: HEX.accent5,
    valGridLine: { color: "E3E8E7", size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", legendFontSize: 12, legendColor: HEX.dk1,
    showTitle: false, objectName: "Ride timings chart", altText: "Wait vs time in cart for 5 rides",
  }, chartText));
  card(s, 9.2, 1.6, 3.5, 2.3, C.background2, "Median wait");
  txt(s, "5:56", { x: 9.55, y: 1.8, w: 3, h: 1.0, fontFace: THEME.headFontFace, fontSize: 54, bold: true, color: C.accent3 });
  txt(s, "median wait, 5 rides with full timings", { x: 9.55, y: 2.9, w: 3, h: 0.8, fontSize: 16 });
  card(s, 9.2, 4.2, 3.5, 2.3, C.background2, "Median ride");
  txt(s, "6:44", { x: 9.55, y: 4.4, w: 3, h: 1.0, fontFace: THEME.headFontFace, fontSize: 54, bold: true, color: C.accent2 });
  txt(s, "median time in the cart, same 5 rides", { x: 9.55, y: 5.5, w: 3, h: 0.8, fontSize: 16 });
  s.addNotes("We timed 14 rides. These 5 have complete stopwatch screenshots; the other 9 still need to be added. Lap 1 is the wait, the rest is time in the cart. n = 5, so we report the median and range (wait 4:47 to 9:50).");

  // ---------- 5. Stops chart ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Empathise" });
  s.addText("How long you wait depends on the stop", { placeholder: "title" });
  const stopLabels = ["Lovely Bakery 12:00", "Lovely Bakery 12:08", "Education Park 12:51", "Education Park ~1:10", "Pharmacy Park 3:28", "Pharmacy Park 4:03"];
  s.addChart(pres.charts.BAR, [
    { name: "Typical wait", labels: stopLabels, values: [secs(1, 5), secs(1, 3), secs(3, 36), secs(2, 0), secs(1, 21), secs(2, 20)] },
    { name: "Longest gap between carts", labels: stopLabels, values: [secs(2, 14), secs(4, 15), secs(10, 49), secs(5, 8), secs(3, 57), secs(7, 41)] },
  ], Object.assign({
    x: 0.6, y: 1.5, w: 8.6, h: 4.9, barDir: "bar", barGapWidthPct: 50,
    chartColors: [HEX.accent2, HEX.accent1],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "m:ss", dataLabelFontSize: 11, dataLabelColor: HEX.dk1,
    valAxisLabelFormatCode: "m:ss", valAxisLabelFontSize: 11, valAxisLabelColor: HEX.accent5, valAxisMinVal: 0,
    catAxisLabelFontSize: 12, catAxisLabelColor: HEX.dk1, catAxisOrientation: "maxMin",
    valGridLine: { color: "E3E8E7", size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", legendFontSize: 12, legendColor: HEX.dk1,
    objectName: "Stop gaps chart", altText: "Typical wait and longest gap at three stops",
  }, chartText));
  card(s, 9.6, 1.6, 3.1, 2.25, C.background2, "Longest gap callout");
  txt(s, "10:49", { x: 9.9, y: 1.75, w: 2.6, h: 0.9, fontFace: THEME.headFontFace, fontSize: 44, bold: true, color: C.accent3 });
  txt(s, "longest gap between carts, Education Park", { x: 9.9, y: 2.7, w: 2.6, h: 0.9, fontSize: 15 });
  card(s, 9.6, 4.15, 3.1, 2.25, C.background2, "Bakery callout");
  txt(s, "~1 min", { x: 9.9, y: 4.3, w: 2.6, h: 0.9, fontFace: THEME.headFontFace, fontSize: 44, bold: true, color: C.accent2 });
  txt(s, "typical wait at Lovely Bakery, both sessions", { x: 9.9, y: 5.25, w: 2.6, h: 0.9, fontSize: 15 });
  txt(s, "Stopwatch sessions on 14 Oct, one per stop and time. Typical wait = the average wait for someone who arrives at a random moment. Carts also arrived in bunches, then a long gap.", { x: 0.6, y: 6.45, w: 12.1, h: 0.45, fontSize: 11, color: C.accent5 });
  s.addNotes("Each set is one stopwatch session where every tap is a cart arriving. Taps under 30 seconds apart were merged. Directions at Education Park and Pharmacy Park, and whether we counted all carts or only empty ones, are still to be confirmed.");

  // ---------- 6. Interview findings ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Empathise" });
  s.addText("What students told us", { placeholder: "title" });
  const finds = [
    ["hour", "Carts wait until they are full", "Drivers start only when every seat is taken, so the delay is built in."],
    ["crowd", "Too many students, too few carts", "Carts fill quickly, and the students left behind wait for the next one."],
    ["hide", "No way to see where carts are", "Students can't tell when a cart will reach their stop, so they just stand and wait."],
    ["tools", "New hardware is hard to add", "The carts are already in service, so a fix should not need new devices on them."],
  ];
  finds.forEach((f, i) => {
    const x = 0.6 + (i % 2) * 6.2, y = 1.6 + Math.floor(i / 2) * 2.5;
    card(s, x, y, 5.9, 2.2, C.background2, f[1]);
    iconCircle(s, f[0], x + 0.35, y + 0.35, 0.85, i < 3 ? C.accent3 : C.accent2, f[1]);
    txt(s, f[1], { x: x + 1.5, y: y + 0.35, w: 4.1, h: 0.5, fontSize: 19, bold: true, color: C.text2 });
    txt(s, f[2], { x: x + 1.5, y: y + 0.9, w: 4.1, h: 1.1, fontSize: 15 });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.35, y: 1.42, w: 1.95, h: 0.38, rectRadius: 0.19, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "Surprising tag" });
  txt(s, "Most surprising", { x: 4.35, y: 1.42, w: 1.95, h: 0.38, fontSize: 12, bold: true, color: C.text2, align: "center", valign: "middle" });
  txt(s, "Team summary of 21 student interviews (recordings CP2_Interview_01 to 19 and notes). Most surprising: carts don't run to a timetable at all; they leave only when full.", { x: 0.6, y: 6.45, w: 12.1, h: 0.35, fontSize: 11, color: C.accent5 });
  s.addNotes("These are our summary of what students said, not word-for-word quotes. One idea came up in the interviews: an app that predicts when the cart will reach your stop.");

  // ---------- 7. Empathy map ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Empathise" });
  s.addText("Empathy map: a student at the cart stop", { placeholder: "title" });
  const emp = [
    ["SAYS", "“Carts wait till they're full.”\n“There are too few carts.”\n“I want to know when the cart will reach me.”", C.accent2],
    ["DOES", "Waits at the stop with no information.\nBoards only if there is space, otherwise waits again.\nWaits about 6 minutes, then rides about 7.", C.accent2],
    ["PAINS", "Delay built into how carts run.\nCrowding at busy times.\nNo idea when the next cart is coming.", C.accent3],
    ["GAINS", "Knowing when the next cart arrives.\nShorter, predictable waits.\nA fix that needs no new hardware.", C.accent2],
  ];
  emp.forEach((e, i) => {
    const x = 0.6 + (i % 2) * 6.2, y = 1.6 + Math.floor(i / 2) * 2.55;
    card(s, x, y, 5.9, 2.3, C.background2, e[0] + " quadrant");
    txt(s, e[0], { x: x + 0.35, y: y + 0.25, w: 5.2, h: 0.4, fontSize: 15, bold: true, color: e[2], charSpacing: 2 });
    txt(s, e[1].split("\n").map((t, j, a) => ({ text: t, options: { bullet: true, breakLine: j < a.length - 1 } })), { x: x + 0.35, y: y + 0.75, w: 5.2, h: 1.4, fontSize: 15, paraSpaceAfter: 4 });
  });
  s.addNotes("Quotes in SAYS are paraphrased from our interview summary. DOES uses our stopwatch medians.");

  // ---------- 8. Stakeholders ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Empathise" });
  s.addText("Who is involved, and who we've heard from", { placeholder: "title" });
  const sh = [
    ["user", "Students without vehicles", "Primary users. They walk to the stops and wait for a cart to cross campus.", "Interviewed (21)", C.accent2],
    ["van2", "Cart drivers", "Run the carts as an independent service and decide when a cart leaves, usually once it's full.", "Declined: not allowed", C.accent3],
  ];
  sh.forEach((r, i) => {
    const x = 0.6 + i * 6.2;
    card(s, x, 1.6, 5.9, 3.9, C.background2, r[1] + " card");
    iconCircle(s, r[0], x + 0.4, 1.95, 1.0, r[4], r[1]);
    txt(s, r[1], { x: x + 0.4, y: 3.15, w: 5.1, h: 0.55, fontSize: 22, bold: true, color: C.text2 });
    txt(s, r[2], { x: x + 0.4, y: 3.75, w: 5.1, h: 1.0, fontSize: 16 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 3.05, y: 2.2, w: 2.5, h: 0.5, rectRadius: 0.25, fill: { color: r[4] }, line: { type: "none" }, objectName: r[1] + " status" });
    txt(s, r[3], { x: x + 3.05, y: 2.2, w: 2.5, h: 0.5, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle" });
  });
  card(s, 0.6, 5.75, 12.1, 0.8, C.accent6, "Independent service note");
  txt(s, [{ text: "The carts are an independent service, ", options: { bold: true, color: C.text2 } }, { text: "so the drivers decide when carts leave. Any fix has to work for students without changing how drivers operate." }], { x: 0.95, y: 5.82, w: 11.4, h: 0.65, fontSize: 15, valign: "middle" });
  s.addNotes("Only two groups are involved: students who ride and the drivers who run the carts as an independent service. Drivers declined interviews, so our research so far covers students.");

  // ---------- 9. POV + HMW ----------
  pres.addSection({ title: "Define" });
  s = pres.addSlide({ masterName: "STATEMENT_DARK", sectionTitle: "Define" });
  s.addText("POINT OF VIEW", { placeholder: "title" });
  s.addText("A student without a vehicle needs to know when the next cart will reach their stop, because carts leave only when full and students can't see where they are.", { placeholder: "body" });
  txt(s, "HOW MIGHT WE", { x: 0.8, y: 4.2, w: 11.7, h: 0.5, fontSize: 18, bold: true, color: C.accent1 });
  txt(s, "How might we tell students when a cart will reach their stop?", { x: 0.8, y: 4.8, w: 11.7, h: 1.4, fontFace: THEME.headFontFace, fontSize: 30, color: C.background1 });
  s.addNotes("CP3. The 'because' part comes from the interviews (carts wait to fill, no visibility) and our stopwatch data (median wait 5:56, gaps up to 10:49).");

  // ---------- 9b. Problem statement + other HMWs ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Define" });
  s.addText("Problem statement, and the questions we weighed", { placeholder: "title" });
  card(s, 0.6, 1.55, 12.1, 1.5, C.background2, "Problem statement card");
  txt(s, "PROBLEM STATEMENT", { x: 0.95, y: 1.75, w: 11.4, h: 0.35, fontSize: 13, bold: true, color: C.accent2, charSpacing: 2 });
  txt(s, "Students without vehicles lose a lot of time waiting for campus carts, because carts leave only when full, there are far more students than carts, and nobody can tell when the next one will come.", { x: 0.95, y: 2.15, w: 11.4, h: 0.8, fontSize: 17, color: C.text2 });
  txt(s, "Other How Might We questions", { x: 0.6, y: 3.3, w: 7.2, h: 0.45, fontSize: 18, bold: true, color: C.text2 });
  const hmws = ["…cut down the time students spend standing at the stop?", "…make waiting times predictable?", "…help carts fill without leaving students stuck?", "…help students decide quickly whether to wait or walk?"];
  hmws.forEach((h, i) => {
    const x = 0.6 + (i % 2) * 3.65, y = 3.85 + Math.floor(i / 2) * 1.35;
    card(s, x, y, 3.45, 1.15, C.background2, "HMW " + (i + 1));
    txt(s, [{ text: "How might we ", options: { color: C.accent5 } }, { text: h }], { x: x + 0.25, y: y + 0.15, w: 3.0, h: 0.9, fontSize: 14, valign: "middle" });
  });
  card(s, 8.1, 3.3, 4.6, 3.05, C.text2, "Why card");
  txt(s, "WHY WE CHOSE OUR MAIN HMW", { x: 8.4, y: 3.55, w: 4.0, h: 0.35, fontSize: 13, bold: true, color: C.accent1, charSpacing: 1 });
  txt(s, "Not knowing when the cart will come was the complaint students raised most. It also respects our constraint: no new hardware on the carts, and no need to change driver schedules we can't discuss.", { x: 8.4, y: 4.0, w: 4.0, h: 2.2, fontSize: 15, color: C.background1 });
  s.addNotes("CP3.3 to CP3.5. The problem statement names no solution. We kept four alternative HMWs and chose the one about arrival information.");

  // ---------- 10. Persona + journey ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Define" });
  s.addText("Riya's trip across campus: the wait is the low point", { placeholder: "title" });
  card(s, 0.6, 1.5, 12.1, 1.05, C.background2, "Persona strip");
  iconCircle(s, "user", 0.85, 1.65, 0.75, C.accent2, "Persona");
  txt(s, [
    { text: "Riya (fictional persona), ", options: { bold: true, color: C.text2 } },
    { text: "hostel student with no vehicle. Goal: reach class on time. Frustration: she can't see when a cart is coming. " },
    { text: "Anti-persona: a student with their own vehicle.", options: { italic: true, color: C.accent5 } },
  ], { x: 1.85, y: 1.65, w: 10.6, h: 0.75, fontSize: 15, valign: "middle" });
  const steps = [
    ["Leave hostel", "Hostel · No way to know when a cart will come", "Unsure", false],
    ["Walk to stop", "Campus path · Hopes a cart is there", "Hopeful", false],
    ["Wait", "Cart stop · Cart waits to fill; median 5:56", "Frustrated", true],
    ["Board", "Cart · Only if there's space, else wait again", "Anxious", true],
    ["Ride", "Cart · Median 6:44 in the cart", "Relieved", false],
    ["Arrive", "Destination stop · Sometimes late", "Stressed", false],
  ];
  const cw = 1.78, gap = 0.284;
  steps.forEach((st, i) => {
    const x = 0.6 + i * (cw + gap), y = 2.9;
    card(s, x, y, cw, 3.4, st[3] ? "F6DED8" : C.background2, st[0] + " step");
    txt(s, String(i + 1), { x: x + 0.2, y: y + 0.2, w: 0.5, h: 0.45, fontFace: THEME.headFontFace, fontSize: 22, bold: true, color: st[3] ? C.accent3 : C.accent2 });
    txt(s, st[0], { x: x + 0.2, y: y + 0.7, w: cw - 0.35, h: 0.45, fontSize: 17, bold: true, color: C.text2 });
    txt(s, st[1], { x: x + 0.2, y: y + 1.2, w: cw - 0.35, h: 1.4, fontSize: 14 });
    txt(s, st[2], { x: x + 0.2, y: y + 2.75, w: cw - 0.35, h: 0.4, fontSize: 14, italic: true, bold: true, color: st[3] ? C.accent3 : C.accent2 });
    if (i < steps.length - 1) s.addImage({ data: I.arrow, x: x + cw + 0.02, y: y + 1.55, w: 0.24, h: 0.24, objectName: "arrow " + i, altText: "then" });
  });
  txt(s, "Each card: step, touchpoint · what happens, and the emotion. Steps 3 and 4 are the pain points.", { x: 0.6, y: 6.45, w: 12.1, h: 0.35, fontSize: 11, color: C.accent5 });
  s.addNotes("Persona and current-state journey map (CP3.6 and CP3.7). Riya is a fictional persona built from the interview themes.");

  // ---------- 11. Affinity clusters ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Define" });
  s.addText("Our findings fall into five groups", { placeholder: "title" });
  const cl = [
    ["hour", "Carts wait to fill", "Interviews"],
    ["crowd", "Too many students, too few carts", "Interviews"],
    ["hide", "No arrival information", "Interviews"],
    ["tools", "Hardware is hard to add", "Interviews"],
    ["watch", "Long, uneven gaps and bunching", "Observation"],
  ];
  cl.forEach((c, i) => {
    const top = i < 3;
    const x = top ? 0.6 + i * 4.1 : 2.65 + (i - 3) * 4.1, y = top ? 1.6 : 4.15;
    card(s, x, y, 3.8, 2.25, C.background2, c[1] + " cluster");
    iconCircle(s, c[0], x + 0.35, y + 0.35, 0.8, c[2] === "Observation" ? C.accent1 : C.accent2, c[1]);
    txt(s, c[1], { x: x + 0.35, y: y + 1.3, w: 3.1, h: 0.7, fontSize: 18, bold: true, color: C.text2 });
    txt(s, c[2], { x: x + 1.35, y: y + 0.5, w: 2.2, h: 0.4, fontSize: 13, color: C.accent5, align: "right" });
  });
  s.addNotes("Affinity clustering (CP3.8): each finding went on its own note and we grouped similar notes. These groups shaped our point of view and How Might We question.");

  // ---------- 12. Ideate: themes ----------
  pres.addSection({ title: "Ideate" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Ideate" });
  s.addText("32 ideas, grouped into five themes", { placeholder: "title" });
  const themes = [
    ["hide", "Know when the cart comes", "10", "Prediction app, QR wait estimate, WhatsApp bot, stop board", C.accent2],
    ["hour", "Cut the wait itself", "8", "Leave after a set time, extra carts at class change, express cart", C.accent2],
    ["crowd", "Handle the crowd", "5", "“I'm waiting” button, queue lines, group departures", C.accent2],
    ["stop", "Make waiting easier", "4", "Shade and seats, walking-time map, “just walk” sign", C.accent2],
    ["warn", "Wild ideas", "5", "One central hub, students drive the carts, bike-share", C.accent1],
  ];
  themes.forEach((t, i) => {
    const y = 1.55 + i * 0.98;
    card(s, 0.6, y, 8.4, 0.85, i % 2 ? C.background1 : C.background2, t[1] + " theme");
    iconCircle(s, t[0], 0.8, y + 0.12, 0.6, t[4], t[1]);
    txt(s, t[1], { x: 1.6, y: y + 0.08, w: 5.6, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
    txt(s, t[3], { x: 1.6, y: y + 0.45, w: 6.4, h: 0.35, fontSize: 13, color: C.accent5 });
    txt(s, t[2], { x: 7.9, y: y + 0.1, w: 0.9, h: 0.65, fontFace: THEME.headFontFace, fontSize: 30, bold: true, color: C.text2, align: "right", valign: "middle" });
  });
  card(s, 9.3, 1.55, 3.4, 4.75, C.text2, "Techniques card");
  txt(s, "TECHNIQUES", { x: 9.6, y: 1.85, w: 2.9, h: 0.35, fontSize: 13, bold: true, color: C.accent1, charSpacing: 2 });
  const tech = ["Brainstorming with deferred judgement", "Crazy 8s", "Worst possible idea", "Reverse thinking"];
  txt(s, tech.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < tech.length - 1 } })), { x: 9.6, y: 2.35, w: 2.9, h: 2.4, fontSize: 15, color: C.background1, paraSpaceAfter: 8 });
  txt(s, "Each member reviewed and built on 8 ideas; initials are in the CP4 idea log.", { x: 9.6, y: 4.9, w: 2.9, h: 1.2, fontSize: 13, italic: true, color: C.accent6 });
  s.addNotes("CP4.1 to CP4.3: total ideas, techniques, and the theme clusters. Update the techniques list and idea count to match exactly what the team did in its session.");

  // ---------- 13. Ideate: scoring ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Ideate" });
  s.addText("Weighted scoring picks the prediction app", { placeholder: "title" });
  const hdr = ["Idea", "Wait less\n30%", "No hardware\n25%", "Prototype\n20%", "Cost\n15%", "Accepted\n10%", "Total\n/500"];
  const rowsT = [
    ["Prediction app from our timing data", 4, 5, 5, 4, 4, 445],
    ["WhatsApp bot with wait estimate", 3, 5, 5, 5, 4, 425],
    ["Carts leave after a set time", 5, 5, 3, 4, 2, 405],
    ["Driver's phone shares location", 5, 4, 3, 4, 2, 385],
    ["More carts at class change", 5, 5, 2, 1, 3, 355],
  ];
  const head = hdr.map(h => ({ text: h, options: { bold: true, color: C.background1, fill: { color: C.text2 }, align: h === "Idea" ? "left" : "center", valign: "middle", fontSize: 13 } }));
  const body = rowsT.map((r, i) => r.map((v, j) => ({ text: String(v), options: {
    fontSize: 14, align: j === 0 ? "left" : "center", valign: "middle", bold: i === 0 || j === 6,
    color: i === 0 ? C.text2 : (i === 2 ? C.accent3 : C.text1), fill: { color: i === 0 ? "FCE9C9" : (i % 2 ? C.background1 : C.background2) } } })));
  s.addTable([head, ...body], { x: 0.6, y: 1.55, w: 12.1, colW: [4.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3], rowH: [0.65, 0.5, 0.5, 0.5, 0.5, 0.5], fontFace: THEME.bodyFontFace, border: { type: "solid", pt: 0.5, color: "D9E6E4" }, margin: 0.08, objectName: "Scoring matrix" });
  card(s, 0.6, 5.0, 5.9, 1.4, C.background2, "Selected card");
  iconCircle(s, "check", 0.85, 5.3, 0.75, C.accent2, "Selected");
  txt(s, [{ text: "Selected: prediction app. ", options: { bold: true, color: C.text2 } }, { text: "Highest score; matches what students asked for and needs nothing new on the carts." }], { x: 1.8, y: 5.15, w: 4.5, h: 1.1, fontSize: 14, valign: "middle" });
  card(s, 6.8, 5.0, 5.9, 1.4, C.background2, "Rejected card");
  iconCircle(s, "ban", 7.05, 5.3, 0.75, C.accent3, "Rejected");
  txt(s, [{ text: "Rejected: leave after a set time. ", options: { bold: true, color: C.accent3 } }, { text: "The drivers run an independent service and decide when carts leave, and they declined to be interviewed." }], { x: 8.0, y: 5.15, w: 4.5, h: 1.1, fontSize: 14, valign: "middle" });
  txt(s, "Scores 1 to 5 per criterion, multiplied by the weight. Weights were set before scoring.", { x: 0.6, y: 6.5, w: 12.1, h: 0.35, fontSize: 11, color: C.accent5 });
  s.addNotes("CP4.4 to CP4.7 and CP4.9. Only say the weights were fixed before scoring if the team really agreed and dated them first. Change any score the team disagrees with.");

  // ---------- 14. How the concept works ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Ideate" });
  s.addText("How the prediction app would work", { placeholder: "title" });
  const flow = [
    ["db", "Collect timings", "Stopwatch laps at each stop, like the ones we already took"],
    ["chart", "Learn the pattern", "Typical gaps by stop and time of day"],
    ["mobile", "Show it on a phone", "“Next cart in about N minutes” for your stop"],
  ];
  flow.forEach((f, i) => {
    const x = 0.6 + i * 4.15;
    card(s, x, 1.7, 3.8, 3.6, C.background2, f[1]);
    iconCircle(s, f[0], x + 0.35, 2.0, 1.0, C.accent2, f[1]);
    txt(s, String(i + 1), { x: x + 2.8, y: 2.05, w: 0.7, h: 0.8, fontFace: THEME.headFontFace, fontSize: 40, bold: true, color: C.accent4, align: "right" });
    txt(s, f[1], { x: x + 0.35, y: 3.3, w: 3.1, h: 0.5, fontSize: 20, bold: true, color: C.text2 });
    txt(s, f[2], { x: x + 0.35, y: 3.85, w: 3.1, h: 1.2, fontSize: 15 });
    if (i < 2) s.addImage({ data: I.arrow, x: x + 3.85, y: 3.3, w: 0.25, h: 0.25, objectName: "flow arrow " + i, altText: "then" });
  });
  card(s, 0.6, 5.6, 12.1, 0.85, C.accent6, "Constraint note");
  txt(s, [{ text: "Why it fits: ", options: { bold: true, color: C.text2 } }, { text: "it answers our main How Might We, and needs no device fitted to the carts. For CP5 we'll test it as a paper prototype." }], { x: 0.95, y: 5.7, w: 11.4, h: 0.65, fontSize: 15, valign: "middle" });
  s.addNotes("This is the idea students raised in interviews, and the one that won our scoring.");

  // ---------- 13. Limits + next ----------
  pres.addSection({ title: "Next steps" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Next steps" });
  s.addText("What's still open, and what comes next", { placeholder: "title" });
  card(s, 0.6, 1.6, 5.9, 4.9, C.background2, "Limits card");
  iconCircle(s, "warn", 0.95, 1.9, 0.75, C.accent3, "Limits");
  txt(s, "Limits of our evidence", { x: 1.9, y: 2.0, w: 4.4, h: 0.55, fontSize: 20, bold: true, color: C.text2, valign: "middle" });
  const lim = [["Interviews: ", "only students; drivers declined"], ["Observation: ", "one session per stop and time"], ["Data: ", "directions and counting method to confirm"], ["Rides: ", "14 timed, only 5 with full records so far"]];
  txt(s, lim.map((t, j) => [{ text: t[0], options: { bold: true } }, { text: t[1], options: { breakLine: j < lim.length - 1 } }]).flat(), { x: 0.95, y: 2.95, w: 5.25, h: 3.2, fontSize: 17, paraSpaceAfter: 14 });
  card(s, 6.8, 1.6, 5.9, 4.9, C.background2, "Next card");
  iconCircle(s, "check", 7.15, 1.9, 0.75, C.accent2, "Next steps");
  txt(s, "Next steps", { x: 8.1, y: 2.0, w: 4.4, h: 0.55, fontSize: 20, bold: true, color: C.text2, valign: "middle" });
  const nxt = [
    ["CP4 Ideate: ", "team session for 30+ ideas, agree weights, score"],
    ["CP5 Prototype: ", "paper screen showing “next cart in N min”"],
    ["CP6 Test: ", "try it with students at Lovely Bakery and Education Park"],
    ["Also: ", "try again to get the drivers' side"],
  ];
  txt(s, nxt.map((t, j) => [{ text: t[0], options: { bold: true } }, { text: t[1], options: { breakLine: j < nxt.length - 1 } }]).flat(), { x: 7.15, y: 2.95, w: 5.25, h: 3.2, fontSize: 17, paraSpaceAfter: 14 });
  s.addNotes("Be upfront about the limits. The next checkpoints build and test the arrival-prediction idea with real students.");

  // ---------- 14. Close ----------
  s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Next steps" });
  s.addText("Thank you", { placeholder: "title" });
  s.addText("Questions and feedback welcome", { placeholder: "body" });
  s.addImage({ data: I.van, x: 9.9, y: 2.2, w: 2.6, h: 2.6, objectName: "Shuttle icon", altText: "Campus shuttle" });

  const out = "/mnt/user-data/outputs/P05_Waiting_for_the_Shuttle.pptx";
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("wrote", out);
})().catch(e => { console.error(e); process.exit(1); });
