const pptxgen = require("pptxgenjs");
const React = require("react");
const RDS = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
// theme script from the pptx skill; set PPTX_SKILL to that skill folder if it is somewhere else
const path = require("path");
const { applyTheme } = require(path.join(process.env.PPTX_SKILL || "/mnt/skills/public/pptx", "scripts/apply_theme.js"));

const HEX = {
  // colours from the team's floral bracelet: berry, rose, leaf green, red, dusty rose, grey, sky blue
  dk1: "2B1D20", lt1: "FFFFFF", dk2: "7A1F33", lt2: "FCE9EC",
  accent1: "E8708F", accent2: "3E9B54", accent3: "B8323F",
  accent4: "C98A97", accent5: "8C7A7E", accent6: "E6F3FA",
  hlink: "3E9B54", folHlink: "8C7A7E",
};
const THEME = { name: "P05 Shuttle", headFontFace: "Arial", bodyFontFace: "Calibri", colors: HEX };

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
  // app screenshots (1170 x 2532 px phone shots) and strips cut from them, for the slides' empty space
  const shot = f => path.join(__dirname, "screens", f + ".png");
  const crop = async (f, top, height) => "image/png;base64," + (await sharp(shot(f)).extract({ left: 0, top, width: 1170, height }).png().toBuffer()).toString("base64");
  const phone = (s, f, x, y, h, name) => s.addImage({ path: shot(f), x, y, w: h * 390 / 844, h, objectName: name, altText: "App screenshot: " + name });
  // small charts drawn with shapes, for the empty foot of a number card
  const rect = (s, x, y, w, h, fill, name) => s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { type: "none" }, objectName: name });
  const miniBars = (s, x, y, w, items, max, fmt, name) => items.forEach(([lab, v, col], i) => {   // label, bar, value on one row each
    const yy = y + i * 0.24, bw = (w - 1.45) * v / max;
    txt(s, lab, { x, y: yy, w: 1.0, h: 0.22, fontSize: 10, color: C.text1, valign: "middle" });
    rect(s, x + 1.0, yy + 0.04, Math.max(0.03, bw), 0.14, col, name + " bar " + (i + 1));
    txt(s, fmt(v), { x: x + 1.05 + bw, y: yy, w: 0.45, h: 0.22, fontSize: 10, bold: true, color: C.text1, valign: "middle" });
  });
  const kick = (s, t) => txt(s, t.toUpperCase(), { x: 0.6, y: 0.18, w: 8, h: 0.28, fontSize: 11, bold: true, color: C.accent1, charSpacing: 2 });   // section label above a title
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

  pres.addSection({ title: "Introduction" });
  // ---------- 1. Title ----------
  let s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Introduction" });
  s.addText("Waiting for the Shuttle", { placeholder: "title" });
  s.addText([
    { text: "P05 · INT335 Design Thinking · Section TF", options: { breakLine: true } },
    { text: "Kumari Akanksha Jha · Soham Ghosh · Sakshi · Rehan", options: { fontSize: 16 } },
  ], { placeholder: "body" });
  phone(s, "1-waiting", 9.75, 0.75, 6.0, "LPU CartNet showing carts coming to you");
  s.addNotes("Introduce the team and the project: campus carts at LPU and the students who wait for them.");

  pres.addSection({ title: "Problem statement" });
  // ---------- 2. Problem ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Problem statement" });
  kick(s, "01 · Problem statement");
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

  pres.addSection({ title: "Research plan" });
  // ---------- Research plan ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Research plan" });
  kick(s, "02 · Research plan");
  s.addText("What we set out to find", { placeholder: "title" });
  {
    card(s, 0.6, 1.5, 5.0, 2.35, C.background2, "Goal card");
    iconCircle(s, "eye", 0.9, 1.75, 0.7, C.accent2, "Goal");
    txt(s, "Goal", { x: 1.8, y: 1.8, w: 3.6, h: 0.6, fontSize: 20, bold: true, color: C.text2, valign: "middle" });
    txt(s, "Find out why students wait so long for carts, and fix it without hardware on the carts.", { x: 0.9, y: 2.65, w: 4.4, h: 1.05, fontSize: 15 });
    card(s, 0.6, 4.05, 5.0, 2.65, C.background2, "Objectives card");
    iconCircle(s, "check", 0.9, 4.3, 0.7, C.accent2, "Objectives");
    txt(s, "Objectives", { x: 1.8, y: 4.35, w: 3.6, h: 0.6, fontSize: 20, bold: true, color: C.text2, valign: "middle" });
    const ob = ["Talk to students who use the carts", "Time real waits and rides", "Count carts at several stops"];
    txt(s, ob.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < ob.length - 1 } })), { x: 0.9, y: 5.2, w: 4.5, h: 1.35, fontSize: 15, paraSpaceAfter: 6 });
    card(s, 5.9, 1.5, 6.8, 5.2, C.background2, "Hypotheses card");
    txt(s, "Hypotheses we tested", { x: 6.25, y: 1.7, w: 6.2, h: 0.55, fontSize: 20, bold: true, color: C.text2, valign: "middle" });
    const hy = [["H1", "Carts leave only when full"], ["H2", "Waiting takes as long as riding"], ["H3", "Not knowing is the worst part"], ["H4", "Carts come in bunches"]];
    hy.forEach(([k, t], i) => {
      const y = 2.5 + i * 1.02;
      txt(s, k, { x: 6.25, y, w: 0.7, h: 0.75, fontSize: 22, bold: true, color: C.accent1, valign: "middle" });
      txt(s, t, { x: 7.0, y, w: 3.4, h: 0.75, fontSize: 16, valign: "middle" });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 10.5, y: y + 0.15, w: 1.9, h: 0.45, rectRadius: 0.22, fill: { color: C.accent2 }, line: { type: "none" }, objectName: k + " result" });
      txt(s, "Supported", { x: 10.5, y: y + 0.15, w: 1.9, h: 0.45, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle" });
    });
  }
  s.addNotes("H1 and H3 from the 21 interviews; H2 from the timed rides (median wait 5:56 vs 6:44 in the cart); H4 from the stopwatch gaps (11 of 53 gaps under a minute on 12 Oct, longest 10:49).");

  pres.addSection({ title: "Primary research" });
  // ---------- 3. Research at a glance ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Primary research" });
  kick(s, "03 · Primary research");
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
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Primary research" });
  kick(s, "03 · Primary research");
  s.addText("Waiting takes almost as long as riding", { placeholder: "title" });
  {   // waits and rides as columns drawn with shapes (shows the same in every app)
    const waits = [287, 590, 356, 394, 299], rides = [459, 404, 361, 415, 312], X0 = 1.15, base = 6.3, top = 2.0, max = 600;
    const Y = v => base - (base - top) * v / max, mm = v => Math.floor(v / 60) + ":" + String(v % 60).padStart(2, "0");
    [0, 120, 240, 360, 480, 600].forEach(v => {
      rect(s, X0, Y(v), 5.3, 0.01, "EADDE0", "Grid " + v);
      txt(s, mm(v), { x: 0.5, y: Y(v) - 0.12, w: 0.55, h: 0.24, fontSize: 10, color: C.accent5, align: "right" });
    });
    waits.forEach((w, i) => {
      const gx = X0 + 0.12 + i * 1.06;
      [[w, HEX.accent1], [rides[i], HEX.accent2]].forEach(([v, col], k) => {
        const x = gx + k * 0.41;
        rect(s, x, Y(v), 0.38, base - Y(v), col, "Ride " + (i + 1) + (k ? " in cart" : " wait"));
        txt(s, mm(v), { x: x - 0.1, y: Y(v) - 0.27, w: 0.58, h: 0.25, fontSize: 10, bold: true, color: C.text1, align: "center" });
      });
      txt(s, "Ride " + (i + 1), { x: gx - 0.1, y: base + 0.05, w: 1.0, h: 0.28, fontSize: 12, color: C.accent5, align: "center" });
    });
    rect(s, 1.9, 1.62, 0.16, 0.16, HEX.accent1, "Legend wait");
    txt(s, "Wait for a cart", { x: 2.1, y: 1.55, w: 1.6, h: 0.3, fontSize: 12 });
    rect(s, 3.8, 1.62, 0.16, 0.16, HEX.accent2, "Legend ride");
    txt(s, "Time in the cart", { x: 4.0, y: 1.55, w: 1.8, h: 0.3, fontSize: 12 });
  }
  phone(s, "2-destination", 6.75, 1.6, 4.9, "the app shows the wait and the ride time for your stop");
  card(s, 9.2, 1.6, 3.5, 2.3, C.background2, "Median wait");
  txt(s, "5:56", { x: 9.55, y: 1.7, w: 3, h: 0.8, fontFace: THEME.headFontFace, fontSize: 46, bold: true, color: C.accent3 });
  txt(s, "median wait, 5 rides with full timings", { x: 9.55, y: 2.5, w: 3, h: 0.45, fontSize: 14 });
  {   // dot plot of the five waits on a 4:00 to 10:00 line, median in red
    const x0 = 9.65, x1 = 12.25, X = t => x0 + (x1 - x0) * (t - 240) / 360;
    rect(s, x0, 3.38, x1 - x0, 0.02, HEX.accent4, "Wait scale");
    [287, 590, 356, 394, 299].forEach((t, i) => s.addShape(pres.shapes.OVAL, { x: X(t) - 0.08, y: 3.31, w: 0.16, h: 0.16, fill: { color: t === 356 ? HEX.accent3 : HEX.accent1 }, line: { color: HEX.lt1, width: 1 }, objectName: "Wait dot " + (i + 1) }));
    txt(s, "4:00", { x: x0 - 0.2, y: 3.5, w: 0.5, h: 0.22, fontSize: 10, color: C.accent5 });
    txt(s, "10:00", { x: x1 - 0.3, y: 3.5, w: 0.55, h: 0.22, fontSize: 10, color: C.accent5, align: "right" });
    txt(s, "each ride's wait", { x: 10.4, y: 3.5, w: 1.1, h: 0.22, fontSize: 10, color: C.accent5, align: "center" });
  }
  card(s, 9.2, 4.2, 3.5, 2.3, C.background2, "Median ride");
  txt(s, "6:44", { x: 9.55, y: 4.3, w: 3, h: 0.8, fontFace: THEME.headFontFace, fontSize: 46, bold: true, color: C.accent2 });
  txt(s, "median time in the cart, same 5 rides", { x: 9.55, y: 5.1, w: 3, h: 0.45, fontSize: 14 });
  {   // the whole trip as one bar: 47% of it is waiting (5:56 of 12:40)
    const w = 2.6, ww = w * 356 / (356 + 404);
    rect(s, 9.65, 5.72, ww, 0.3, HEX.accent1, "Trip bar: wait");
    rect(s, 9.65 + ww, 5.72, w - ww, 0.3, HEX.accent2, "Trip bar: ride");
    txt(s, "waiting 47%", { x: 9.65, y: 6.05, w: 1.3, h: 0.25, fontSize: 11, bold: true, color: C.accent3 });
    txt(s, "riding 53%", { x: 11.0, y: 6.05, w: 1.25, h: 0.25, fontSize: 11, bold: true, color: C.text2, align: "right" });
  }
  s.addNotes("We timed 14 rides. These 5 have complete stopwatch screenshots; the other 9 still need to be added. Lap 1 is the wait, the rest is time in the cart. n = 5, so we report the median and range (wait 4:47 to 9:50).");

  // ---------- 5. Stops chart ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Primary research" });
  kick(s, "03 · Primary research");
  s.addText("How long you wait depends on the stop", { placeholder: "title" });
  const stopLabels = ["Lovely Bakery 12:00", "Lovely Bakery 12:08", "Education Park 12:51", "Education Park ~1:10", "Pharmacy Park 3:28", "Pharmacy Park 4:03"];
  {   // typical wait and longest gap per session as bars drawn with shapes
    const rows = [["Lovely Bakery 12:00", 65, 134], ["Lovely Bakery 12:08", 63, 255], ["Education Park 12:51", 216, 649], ["Education Park ~1:10", 120, 308], ["Pharmacy Park 3:28", 81, 237], ["Pharmacy Park 4:03", 140, 461]];
    const X0 = 2.55, W = 3.65, max = 660, mm = v => Math.floor(v / 60) + ":" + String(v % 60).padStart(2, "0");
    rect(s, 2.6, 1.62, 0.16, 0.16, HEX.accent2, "Legend typical");
    txt(s, "Typical wait", { x: 2.8, y: 1.55, w: 1.4, h: 0.3, fontSize: 12 });
    rect(s, 4.3, 1.62, 0.16, 0.16, HEX.accent1, "Legend longest");
    txt(s, "Longest gap between carts", { x: 4.5, y: 1.55, w: 2.4, h: 0.3, fontSize: 12 });
    rows.forEach(([lab, typ, lng], i) => {
      const y = 2.05 + i * 0.73;
      if (i % 2 === 0) rect(s, 0.6, y - 0.06, 6.55, 0.7, "FDF3F5", lab + " band");
      txt(s, lab, { x: 0.6, y, w: 1.9, h: 0.58, fontSize: 11, color: C.text1, align: "right", valign: "middle" });
      [[typ, HEX.accent2], [lng, HEX.accent1]].forEach(([v, col], k) => {
        const bw = W * v / max, yy = y + 0.04 + k * 0.27;
        rect(s, X0, yy, bw, 0.23, col, lab + (k ? " longest" : " typical"));
        txt(s, mm(v), { x: X0 + bw + 0.05, y: yy - 0.02, w: 0.6, h: 0.27, fontSize: 10, bold: k === 1 && v === 649, color: C.text1 });
      });
    });
  }
  phone(s, "1-waiting", 7.1, 1.6, 4.8, "two carts coming to the same stop at different times");
  card(s, 9.6, 1.6, 3.1, 2.25, C.background2, "Longest gap callout");
  txt(s, "10:49", { x: 9.85, y: 1.68, w: 2.7, h: 0.7, fontFace: THEME.headFontFace, fontSize: 40, bold: true, color: C.accent3 });
  txt(s, "longest gap between carts, Education Park", { x: 9.85, y: 2.38, w: 2.7, h: 0.45, fontSize: 13 });
  txt(s, "carts seen in each session", { x: 9.85, y: 2.85, w: 2.7, h: 0.22, fontSize: 10, color: C.accent5 });
  miniBars(s, 9.85, 3.07, 2.7, [["Bakery", 19, HEX.accent2], ["Edu Park", 7, HEX.accent3], ["Pharmacy", 10.5, HEX.accent1]], 19, v => (v === 7 ? "5, 9" : v === 19 ? "19, 19" : "12, 9"), "Carts seen");
  card(s, 9.6, 4.15, 3.1, 2.25, C.background2, "Bakery callout");
  txt(s, "~1 min", { x: 9.85, y: 4.23, w: 2.7, h: 0.7, fontFace: THEME.headFontFace, fontSize: 40, bold: true, color: C.accent2 });
  txt(s, "typical wait at Lovely Bakery, both sessions", { x: 9.85, y: 4.93, w: 2.7, h: 0.45, fontSize: 13 });
  txt(s, "typical wait at each stop", { x: 9.85, y: 5.4, w: 2.7, h: 0.22, fontSize: 10, color: C.accent5 });
  const mmss = v => Math.floor(v / 60) + ":" + String(Math.round(v % 60)).padStart(2, "0");
  miniBars(s, 9.85, 5.62, 2.7, [["Bakery", 64, HEX.accent2], ["Edu Park", 168, HEX.accent3], ["Pharmacy", 110, HEX.accent1]], 168, mmss, "Typical wait");
  txt(s, "Stopwatch sessions on 14 Oct, one per stop and time. Typical wait = the average wait for someone who arrives at a random moment. Carts also arrived in bunches, then a long gap.", { x: 0.6, y: 6.45, w: 12.1, h: 0.45, fontSize: 11, color: C.accent5 });
  s.addNotes("Each set is one stopwatch session where every tap is a cart arriving. Taps under 30 seconds apart were merged. Directions at Education Park and Pharmacy Park, and whether we counted all carts or only empty ones, are still to be confirmed.");

  pres.addSection({ title: "Questionnaire & findings" });
  // ---------- 6. Interview findings ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Questionnaire & findings" });
  kick(s, "04 · Questionnaire & findings");
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

  pres.addSection({ title: "Competitive analysis" });
  // ---------- Competitive analysis ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Competitive analysis" });
  kick(s, "05 · Competitive analysis");
  s.addText("What students use today, and where it fails", { placeholder: "title" });
  {
    const opts = [
      ["Wait and hope", "Free, no effort", "No information at all"],
      ["Walk instead", "Predictable", "About 20 min for the 1.7 km route"],
      ["Ask friends, WhatsApp", "Sometimes right", "Patchy, out of date fast"],
      ["Google Maps", "Good off campus", "Knows nothing about the carts"],
      ["lpu-wayfinder", "Finds blocks on a 3D map", "Shows buildings, not carts"],
      ["GPS shuttle trackers", "Live positions", "Need hardware on every cart"],
    ];
    txt(s, "Works for", { x: 4.3, y: 1.3, w: 3.5, h: 0.3, fontSize: 12, bold: true, color: C.accent2 });
    txt(s, "Fails because", { x: 8.3, y: 1.3, w: 4.2, h: 0.3, fontSize: 12, bold: true, color: C.accent3 });
    opts.forEach((r, i) => {
      const y = 1.65 + i * 0.66;
      if (i % 2 === 0) card(s, 0.6, y, 12.1, 0.6, C.background2, r[0] + " row");
      txt(s, r[0], { x: 0.9, y, w: 3.3, h: 0.6, fontSize: 15, bold: true, color: C.text2, valign: "middle" });
      txt(s, r[1], { x: 4.3, y, w: 3.8, h: 0.6, fontSize: 14, valign: "middle" });
      txt(s, r[2], { x: 8.3, y, w: 4.2, h: 0.6, fontSize: 14, valign: "middle" });
    });
    card(s, 0.6, 5.7, 12.1, 0.95, C.accent6, "The gap");
    txt(s, [{ text: "The gap: ", options: { bold: true, color: C.text2 } }, { text: "nothing tells you when the next empty cart reaches your stop, without hardware. That is what LPU CartNet does." }], { x: 0.95, y: 5.75, w: 11.4, h: 0.85, fontSize: 15, valign: "middle" });
  }
  s.addNotes("Walking time assumes about 5 km/h. lpu-wayfinder is Dushyant Pal's campus map, which our prototype builds on.");

  pres.addSection({ title: "Personas & empathy map" });
  // ---------- 7. Empathy map ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Personas & empathy map" });
  kick(s, "06 · Personas & empathy map");
  s.addText("Riya, and what she says, does and feels", { placeholder: "title" });
  const emp = [
    ["SAYS", "“Carts wait till they're full.”\n“There are too few carts.”\n“I want to know when the cart will reach me.”", C.accent2],
    ["DOES", "Waits at the stop with no information.\nBoards only if there is space, otherwise waits again.\nWaits about 6 minutes, then rides about 7.", C.accent2],
    ["PAINS", "Delay built into how carts run.\nCrowding at busy times.\nNo idea when the next cart is coming.", C.accent3],
    ["GAINS", "Knowing when the next cart arrives.\nShorter, predictable waits.\nA fix that needs no new hardware.", C.accent2],
  ];
  // persona on the left, the four quadrants beside it
  card(s, 0.6, 1.5, 3.6, 5.2, C.text2, "Persona card");
  iconCircle(s, "user", 0.95, 1.8, 1.0, C.accent1, "Riya");
  txt(s, "Riya", { x: 0.95, y: 2.95, w: 3.0, h: 0.55, fontSize: 24, bold: true, color: C.background1 });
  txt(s, "made-up name, built from our 21 interviews", { x: 0.95, y: 3.45, w: 3.0, h: 0.5, fontSize: 11, italic: true, color: C.accent4 });
  const pf = [["Who: ", "hostel student, no vehicle"], ["Wants: ", "to reach class on time"], ["Frustrated: ", "carts wait to fill, and she can't see them"]];
  txt(s, pf.map((t, j) => [{ text: t[0], options: { bold: true, color: C.accent4 } }, { text: t[1], options: { color: C.background1, breakLine: j < pf.length - 1 } }]).flat(), { x: 0.95, y: 4.05, w: 3.0, h: 2.5, fontSize: 16, paraSpaceAfter: 12 });
  emp.forEach((e, i) => {
    const x = 4.45 + (i % 2) * 4.18, y = 1.5 + Math.floor(i / 2) * 2.65;
    card(s, x, y, 4.0, 2.55, C.background2, e[0] + " quadrant");
    txt(s, e[0], { x: x + 0.3, y: y + 0.2, w: 3.5, h: 0.4, fontSize: 15, bold: true, color: e[2], charSpacing: 2 });
    txt(s, e[1].split("\n").map((t, j, a) => ({ text: t, options: { bullet: true, breakLine: j < a.length - 1 } })), { x: x + 0.3, y: y + 0.65, w: 3.5, h: 1.8, fontSize: 16, paraSpaceAfter: 6 });
  });
  s.addNotes("Quotes in SAYS are paraphrased from our interview summary. DOES uses our stopwatch medians.");

  // ---------- 8. Stakeholders ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Personas & empathy map" });
  kick(s, "06 · Personas & empathy map");
  s.addText("Who is involved, and who we've heard from", { placeholder: "title" });
  const sh = [   // role and status as in the team's 12 Nov stakeholder slide
    ["Students without vehicles", "Primary users: they wait at the stops", "Interviewed (21)", C.accent2],
    ["Cart drivers", "Run the carts and decide when to leave", "Declined: not allowed", C.accent3],
    ["Transport office", "Owns the carts, routes and schedules", "Permission requested", C.accent1],
    ["Gate security", "Sees crowds at gates and outposts", "Not yet interviewed", C.accent5],
    ["University administration", "Approves any app or schedule change", "Not yet contacted", C.accent5],
  ];
  sh.forEach((r, i) => {
    const y = 1.45 + i * 1.0;
    if (i % 2 === 0) card(s, 0.6, y, 12.1, 0.85, C.background2, r[0] + " row");
    txt(s, r[0], { x: 0.9, y, w: 3.6, h: 0.85, fontSize: 17, bold: true, color: C.text2, valign: "middle" });
    txt(s, r[1], { x: 4.8, y, w: 4.6, h: 0.85, fontSize: 15, valign: "middle" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.65, y: y + 0.17, w: 2.8, h: 0.5, rectRadius: 0.25, fill: { color: r[3] }, line: { type: "none" }, objectName: r[0] + " status" });
    txt(s, r[2], { x: 9.65, y: y + 0.17, w: 2.8, h: 0.5, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle" });
  });
  s.addNotes("Our research so far covers only students. Drivers and the transport office have the most influence over a fix, so getting their view is a priority.");

  pres.addSection({ title: "Ideation & prioritising" });
  // ---------- 9. POV + HMW ----------
  s = pres.addSlide({ masterName: "STATEMENT_DARK", sectionTitle: "Ideation & prioritising" });
  s.addText("POINT OF VIEW", { placeholder: "title" });
  s.addText("A student without a vehicle needs to know when the next cart will reach their stop, because carts leave only when full and students can't see where they are.", { placeholder: "body" });
  txt(s, "HOW MIGHT WE", { x: 0.8, y: 4.2, w: 11.7, h: 0.5, fontSize: 18, bold: true, color: C.accent1 });
  txt(s, "How might we tell students when a cart will reach their stop?", { x: 0.8, y: 4.8, w: 11.7, h: 1.4, fontFace: THEME.headFontFace, fontSize: 30, color: C.background1 });
  s.addNotes("CP3. The 'because' part comes from the interviews (carts wait to fill, no visibility) and our stopwatch data (median wait 5:56, gaps up to 10:49).");

  // ---------- 12. Ideate: themes ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Ideation & prioritising" });
  kick(s, "07 · Ideation & prioritising");
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
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Ideation & prioritising" });
  kick(s, "07 · Ideation & prioritising");
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

  pres.addSection({ title: "Storyboard & journey map" });
  // ---------- 10. Persona + journey ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Storyboard & journey map" });
  kick(s, "08 · Storyboard & journey map");
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

  // ---------- Prototype: the app ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Storyboard & journey map" });
  kick(s, "08 · Storyboard & journey map");
  s.addText("Storyboard: Riya's trip with LPU CartNet", { placeholder: "title" });
  const shots = [
    ["1-waiting", "See the carts coming", "Each empty cart heading to you, with its countdown and a dashed line along the road"],
    ["2-destination", "Choose where you're going", "Ride time, and the stretch of road the cart will drive"],
    ["3-riding", "Get on: the map follows", "When your cart reaches you, the map follows it and counts down to your stop"],
    ["4-collapsed", "Swipe down for more map", "The panel shrinks to just the countdown"],
  ];
  shots.forEach((sh, i) => {
    const x = 0.6 + i * 3.075, iw = 1.8, ih = iw * 844 / 390;
    card(s, x, 1.45, 2.85, 5.3, C.background2, sh[1] + " card");
    s.addImage({ path: path.join(__dirname, "screens", sh[0] + ".png"), x: x + (2.85 - iw) / 2, y: 1.6, w: iw, h: ih, objectName: sh[1] + " screenshot", altText: "App screenshot: " + sh[1] });
    txt(s, (i + 1) + ". " + sh[1], { x: x + 0.15, y: 5.62, w: 2.55, h: 0.35, fontSize: 14, bold: true, color: C.text2 });
    txt(s, sh[2], { x: x + 0.15, y: 5.98, w: 2.55, h: 0.72, fontSize: 12, color: C.text1 });
  });
  s.addNotes("Screens from the app at phone size. Cart positions are simulated from our stopwatch timings, not live tracking.");

  pres.addSection({ title: "IA & user flow" });
  // ---------- IA and user flow ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "IA & user flow" });
  kick(s, "09 · IA & user flow");
  s.addText("One screen: map on top, your cart below", { placeholder: "title" });
  {
    phone(s, "2-destination", 0.6, 1.4, 5.3, "the main screen, with a destination chosen");
    const lay = [["Header", "the two stops"], ["Map", "carts, you, block names, the route"], ["Map buttons", "location, whole route, 2D/3D, zoom"], ["Bottom panel", "countdown, ride time, upcoming carts"]];
    txt(s, "Screen layout", { x: 3.35, y: 1.45, w: 4.1, h: 0.45, fontSize: 18, bold: true, color: C.text2 });
    lay.forEach(([a, b], i) => {
      const y = 2.05 + i * 1.12;
      card(s, 3.35, y, 4.1, 0.95, C.background2, a + " layer");
      s.addShape(pres.shapes.OVAL, { x: 3.5, y: y + 0.22, w: 0.5, h: 0.5, fill: { color: C.accent1 }, line: { type: "none" }, objectName: a + " number" });
      txt(s, String(i + 1), { x: 3.5, y: y + 0.22, w: 0.5, h: 0.5, fontSize: 14, bold: true, color: C.background1, align: "center", valign: "middle" });
      txt(s, a, { x: 4.15, y: y + 0.08, w: 3.2, h: 0.4, fontSize: 15, bold: true, color: C.text2 });
      txt(s, b, { x: 4.15, y: y + 0.46, w: 3.2, h: 0.42, fontSize: 12 });
    });
    txt(s, "User flow", { x: 7.8, y: 1.45, w: 4.9, h: 0.45, fontSize: 18, bold: true, color: C.text2 });
    const fl = [["Open the app", "GPS finds you, or tap your stop"], ["See carts coming", "countdown and a line to you"], ["Pick a destination", "ride time appears"], ["Get on", "the map follows your cart"], ["Arrive", "countdown reaches zero"]];
    fl.forEach(([a, b], i) => {
      const y = 2.05 + i * 0.93;
      card(s, 7.8, y, 4.9, 0.72, i === 3 ? C.accent6 : C.background2, a + " step");
      txt(s, a, { x: 8.05, y, w: 2.2, h: 0.72, fontSize: 14, bold: true, color: C.text2, valign: "middle" });
      txt(s, b, { x: 10.2, y, w: 2.4, h: 0.72, fontSize: 12, valign: "middle" });
      if (i < fl.length - 1) s.addImage({ data: I.arrow, x: 10.1, y: y + 0.74, w: 0.17, h: 0.17, rotate: 90, objectName: "flow arrow " + i, altText: "then" });
    });
  }
  s.addNotes("Everything happens on one screen, so there is nothing to navigate. The developer panel (tap the logo) is only for the team: it places stops and edits cart roads.");

  pres.addSection({ title: "Wireframes & prototype" });
  // ---------- Prototype: how it works ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Wireframes & prototype" });
  kick(s, "10 · Wireframes & prototype");
  s.addText("What the prototype is built from", { placeholder: "title" });
  // the campus map on the left, what it is made of on the right
  card(s, 0.6, 1.45, 2.95, 5.3, C.background2, "Campus map card");
  s.addImage({ path: path.join(__dirname, "screens", "5-map.png"), x: 0.6 + (2.95 - 2.25) / 2, y: 1.6, w: 2.25, h: 2.25 * 844 / 390, objectName: "Campus map screenshot", altText: "App screenshot: the 3D campus map with block numbers and the cart route" });
  const parts = [
    ["pin", "Real campus map", "OpenStreetMap buildings and roads in 3D, block names from lpu-wayfinder (Dushyant Pal), and the roads around campus shown faded"],
    ["stop", "The roads carts use", "The route our team marked, Main Stop to 2nd Stop. Full carts take the fastest way; an empty cart takes another marked way 45% of the time"],
    ["watch", "Our timing data", "Carts leave as often as our 73 stopwatch gaps say, and most leave full, as we saw at the stops"],
    ["mobile", "Your phone", "Live GPS shows where you are, or tap the map to pick your stop. Runs in a browser or as an Android app"],
  ];
  parts.forEach((f, i) => {
    const y = 1.45 + i * 1.05;
    iconCircle(s, f[0], 3.9, y + 0.1, 0.7, C.accent2, f[1]);
    txt(s, f[1], { x: 4.85, y, w: 7.85, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
    txt(s, f[2], { x: 4.85, y: y + 0.4, w: 7.85, h: 0.6, fontSize: 14 });
  });
  card(s, 3.9, 5.7, 8.8, 1.05, C.accent6, "Honesty note");
  txt(s, [{ text: "Simulation, not live tracking: ", options: { bold: true, color: C.text2 } }, { text: "cart positions are generated from our timings, with no device on the carts. Cart speed (16.5 to 19.5 km/h) is an estimate." }], { x: 4.2, y: 5.78, w: 8.3, h: 0.9, fontSize: 14, valign: "middle" });
  s.addNotes("No hardware on the carts, as the problem statement requires. The 3D map is adapted from the lpu-wayfinder project by Dushyant Pal, with permission.");

  pres.addSection({ title: "Testing & accessibility" });
  // ---------- Testing and accessibility ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Testing & accessibility" });
  kick(s, "11 · Testing & accessibility");
  s.addText("How we tested it, and who it works for", { placeholder: "title" });
  {
    const two = [
      ["check", "What we tested", C.accent2, ["On a real Android phone and an emulator", "The team used it after every change", "Every marked road is used by a cart", "Getting on and arriving at a stop"]],
      ["user", "Accessibility", C.accent1, ["Buttons at least 44 px, with screen-reader labels", "The countdown is the biggest text", "Empty and full carts differ in shape and words, not just colour", "Works offline, on low-end phones"]],
    ];
    two.forEach(([ic, h, col, items], k) => {
      const x = 0.6 + k * 6.2;
      card(s, x, 1.5, 5.9, 3.35, C.background2, h + " card");
      iconCircle(s, ic, x + 0.3, 1.72, 0.7, col, h);
      txt(s, h, { x: x + 1.2, y: 1.77, w: 4.4, h: 0.6, fontSize: 20, bold: true, color: C.text2, valign: "middle" });
      txt(s, items.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < items.length - 1 } })), { x: x + 0.3, y: 2.6, w: 5.3, h: 2.1, fontSize: 14, paraSpaceAfter: 6 });
    });
    const today = [["1-waiting", 700, "Carts coming to you"], ["3-riding", 900, "Riding: the map follows your cart"], ["4-collapsed", 800, "Route to 2nd Stop"], ["5-map", 700, "Block names on the campus map"]];
    for (const [i, [f, top, alt]] of today.entries())
      s.addImage({ data: await crop(f, top, 706), x: 0.6 + i * 3.075, y: 5.0, w: 2.875, h: 2.875 * 706 / 1170, objectName: "App view " + (i + 1), altText: "App screenshot: " + alt });
  }
  s.addNotes("Not yet done: testing with students outside the team. That is CP6, at our stops, comparing the app's waits with new stopwatch timings.");

  pres.addSection({ title: "Conclusion & links" });
  // ---------- Conclusion and links ----------
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Conclusion & links" });
  kick(s, "12 · Conclusion & links");
  s.addText("What we learned, and what's next", { placeholder: "title" });
  {
    const cols = [
      ["eye", "Learned", C.accent2, ["The wait is the real cost", "Carts leave when full, and nobody can see them", "Our own timings are enough to predict"]],
      ["warn", "Limits", C.accent3, ["Only students interviewed", "Afternoon rides only", "The app simulates carts"]],
      ["check", "Next", C.accent1, ["CP6: test with students at our stops", "Talk to the transport office", "Collect morning timings"]],
    ];
    cols.forEach(([ic, h, col, items], k) => {
      const x = 0.6 + k * 4.15;
      card(s, x, 1.5, 3.8, 3.0, C.background2, h + " card");
      iconCircle(s, ic, x + 0.3, 1.72, 0.7, col, h);
      txt(s, h, { x: x + 1.2, y: 1.77, w: 2.4, h: 0.6, fontSize: 20, bold: true, color: C.text2, valign: "middle" });
      txt(s, items.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < items.length - 1 } })), { x: x + 0.3, y: 2.55, w: 3.3, h: 1.85, fontSize: 15, paraSpaceAfter: 6 });
    });
    card(s, 0.6, 4.7, 12.1, 2.0, C.accent6, "Links");
    txt(s, [
      { text: "Prototype and code: ", options: { bold: true, color: C.text2 } }, { text: "github.com/ShadowIzzHerZ/waiting-for-the-shuttle", options: { breakLine: true } },
      { text: "Campus map: ", options: { bold: true, color: C.text2 } }, { text: "lpu-wayfinder by Dushyant Pal (with permission) · © OpenStreetMap contributors · MapLibre GL JS", options: { breakLine: true } },
      { text: "AI use: ", options: { bold: true, color: C.text2 } }, { text: "Claude helped analyse our timings, write the app's code and draft the slides; all data is our own fieldwork." },
    ], { x: 0.95, y: 4.8, w: 11.4, h: 1.8, fontSize: 15, valign: "middle", paraSpaceAfter: 8 });
  }
  s.addNotes("Close on the main lesson: students lose almost as much time waiting as riding, and a prediction from our own timings answers the question they asked us.");

  // ---------- 14. Close ----------
  s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Conclusion & links" });
  s.addText("Thank you", { placeholder: "title" });
  s.addText("Questions and feedback welcome", { placeholder: "body" });
  phone(s, "5-map", 9.75, 0.75, 6.0, "LPU CartNet campus map");

  const out = path.join(__dirname, "P05_Waiting_for_the_Shuttle.pptx");
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("wrote", out);
})().catch(e => { console.error(e); process.exit(1); });
