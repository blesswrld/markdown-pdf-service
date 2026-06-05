import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { marked } from "marked";

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST")
        return res.status(405).json({ error: "Method not allowed" });

    const {
        markdown,
        format = "A4",
        orientation = "Portrait",
        margins = "Standard",
        customCss = "",
        pageNumbers = true,
    } = req.body;
    if (!markdown) return res.status(400).json({ error: "Нет текста" });

    let browser = null;

    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        const rawHtml = marked.parse(markdown);

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
                        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
                        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; }
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
            footerTemplate: `<div style="font-size: 10px; width: 100%; text-align: center;">Страница <span class="pageNumber"></span></div>`,
            headerTemplate: "<div></div>",
        });

        res.setHeader("Content-Type", "application/pdf");
        res.status(200).send(pdf);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка генерации PDF" });
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}
