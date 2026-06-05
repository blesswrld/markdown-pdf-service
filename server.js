const express = require("express");
const puppeteer = require("puppeteer");
const { marked } = require("marked");

const app = express();
app.use(express.json());

let browserPool;

(async () => {
    browserPool = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox"],
    });
    console.log("PDF Engine Ready (Pro Mode)");
})();

app.post("/api/generate-pdf", async (req, res) => {
    const {
        markdown,
        format = "A4",
        orientation = "Portrait",
        margins = "Standard",
        customCss = "",
        pageNumbers = true,
    } = req.body;

    if (!markdown) return res.status(400).json({ error: "Нет текста" });

    try {
        const rawHtml = marked.parse(markdown);
        const page = await browserPool.newPage();

        let margin = {
            top: "20px",
            bottom: pageNumbers ? "60px" : "20px",
            left: "20px",
            right: "20px",
        };
        if (margins === "None")
            margin = { top: "0px", bottom: "0px", left: "0px", right: "0px" };
        if (margins === "Wide")
            margin = {
                top: "40px",
                bottom: pageNumbers ? "80px" : "40px",
                left: "40px",
                right: "40px",
            };

        const fullHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
                    <style>
                        body { font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; line-height: 1.6; color: #333; }
                        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        blockquote { border-left: 4px solid #007bff; margin: 0; padding-left: 15px; color: #555; }
                        img { max-width: 100%; height: auto; border-radius: 8px; }
                        /* Пользовательский CSS */
                        ${customCss}
                    </style>
                </head>
                <body>
                    ${rawHtml}
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
                    <script>hljs.highlightAll();</script>
                </body>
            </html>
        `;

        await page.setContent(fullHtml, { waitUntil: "networkidle0" });

        const pdf = await page.pdf({
            format: format,
            landscape: orientation === "Landscape",
            margin: margin,
            printBackground: true,
            displayHeaderFooter: pageNumbers,
            footerTemplate: `
                <div style="font-size: 10px; width: 100%; text-align: center; color: #888; font-family: sans-serif;">
                    Страница <span class="pageNumber"></span> из <span class="totalPages"></span>
                </div>
            `,
            headerTemplate: "<div></div>", // Пустой хедер
        });

        await page.close();

        res.setHeader("Content-Type", "application/pdf");
        res.send(pdf);
    } catch (e) {
        console.error("Ошибка:", e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(3000, () => console.log("Backend запущен: http://localhost:3000"));
