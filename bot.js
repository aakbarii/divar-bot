const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const { Telegraf } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const bot = new Telegraf(BOT_TOKEN);

// فایل ذخیره آگهی‌های ارسال‌شده
const DB_FILE = "sent_ads.json";
let seenLinks = new Set();

// بارگذاری لینک‌های قبلی از فایل
if (fs.existsSync(DB_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    seenLinks = new Set(saved);
  } catch (error) {
    console.warn("⚠️ فایل JSON معتبر نیست. آرایه جدید ساخته می‌شود.");
    seenLinks = new Set();
  }
}


// ذخیره در فایل
function saveLinksToFile() {
  fs.writeFileSync(DB_FILE, JSON.stringify([...seenLinks], null, 2));
}

const url = "https://divar.ir/s/tehran/car?chassis_status=both-healthy&has-photo=true&motor_status=healthy&price=150000000-230000000&production-year=1389-1404&q=%D9%BE%D8%B1%D8%A7%DB%8C%D8%AF%20111";

async function checkDivar() {
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8"
      }
    });

    const $ = cheerio.load(res.data);
    $("div.kt-post-card__info").each(async (i, el) => {
      const title = $(el).find("h2").text().trim();
      const desc = $(el).find("div.kt-post-card__description").text().trim();
      const link = "https://divar.ir" + $(el).closest("a").attr("href");

      if (!seenLinks.has(link)) {
        seenLinks.add(link);
        saveLinksToFile(); // ← ذخیره بعد از هر آگهی جدید

        const message = `📣 *${title}*\n${desc}\n[مشاهده آگهی](${link})`;
        await bot.telegram.sendMessage(CHAT_ID, message, { parse_mode: "Markdown" });
        console.log("🔔 آگهی جدید ارسال شد:", title);
      }
    });
  } catch (err) {
    console.error("❌ خطا:", err.message);
  }
}

// اجرای اولیه و سپس هر ۲ دقیقه
checkDivar();
setInterval(checkDivar, 2 * 60 * 1000);

// دریافت پیام و پاسخ
bot.on("text", (ctx) => {
  ctx.reply("جانم ✨");
});

// راه‌اندازی ربات
bot.launch();

