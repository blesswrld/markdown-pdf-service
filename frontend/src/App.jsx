// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Tabs,
    Tab,
    TextField,
    Button,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Switch,
    FormControlLabel,
    Typography,
    Paper,
    CircularProgress,
    Snackbar,
    Alert,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
            style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
        >
            {value === index && (
                <Box
                    sx={{
                        p: 3,
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {children}
                </Box>
            )}
        </div>
    );
}

const DEFAULT_MARKDOWN = `# Технический отчет 🚀\n\n## 1. Архитектура\nМы используем **Node.js** и React. Вот пример кода:\n\n\`\`\`javascript\nfunction calculateROI(revenue, cost) {\n  return ((revenue - cost) / cost) * 100;\n}\nconsole.log(calculateROI(5000, 1000)); // 400%\n\`\`\`\n\n## 2. Смета проекта\n| Ресурс | Часы | Стоимость |\n|--------|------|-----------|\n| Frontend | 40 | $2000 |\n| Backend | 35 | $1750 |\n\n> Успех проекта зависит от качества документации.`;

export default function App() {
    const [tab, setTab] = useState(0);

    const [markdown, setMarkdown] = useState(() => {
        const saved = localStorage.getItem("saved_md");
        return saved !== null ? saved : DEFAULT_MARKDOWN;
    });

    const [customCss, setCustomCss] = useState(() => {
        const saved = localStorage.getItem("saved_css");
        return saved !== null
            ? saved
            : "/* Сделай заголовки синими */\n/* h1, h2 { color: #1976d2; } */";
    });

    const [format, setFormat] = useState("A4");
    const [orientation, setOrientation] = useState("Portrait");
    const [margins, setMargins] = useState("Standard");
    const [pageNumbers, setPageNumbers] = useState(true);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const previewRef = useRef(null);

    useEffect(() => {
        localStorage.setItem("saved_md", markdown);
    }, [markdown]);

    useEffect(() => {
        localStorage.setItem("saved_css", customCss);
    }, [customCss]);

    useEffect(() => {
        if (tab === 2 && previewRef.current) {
            try {
                previewRef.current
                    .querySelectorAll("pre code")
                    .forEach((block) => {
                        block.removeAttribute("data-highlighted");
                        hljs.highlightElement(block);
                    });
            } catch (err) {
                console.error("Ошибка подсветки кода:", err);
            }
        }
    }, [markdown, tab]);

    const handleGeneratePDF = async () => {
        if (!markdown || !markdown.trim()) {
            setSnackbar({
                open: true,
                message: "Сначала напишите текст в редакторе Markdown!",
                severity: "warning",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/generate-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    markdown,
                    format,
                    orientation,
                    margins,
                    customCss,
                    pageNumbers,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error || `Ошибка сервера: ${response.status}`,
                );
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Document_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setSnackbar({
                open: true,
                message: "PDF успешно сгенерирован и скачан!",
                severity: "success",
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Ошибка: ${error.message}`,
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                bgcolor: "#f8fafc",
            }}
        >
            <Box
                sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    bgcolor: "white",
                    px: 2,
                    pt: 1,
                }}
            >
                <Tabs
                    value={tab}
                    onChange={(e, newValue) => setTab(newValue)}
                    indicatorColor="primary"
                >
                    <Tab label="Редактор Markdown" />
                    <Tab label="Настройки & CSS" />
                    <Tab label="Предпросмотр" />
                </Tabs>
            </Box>

            <TabPanel value={tab} index={0}>
                <TextField
                    fullWidth
                    multiline
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    placeholder="Пишите текст здесь..."
                    sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: "white",
                        "& .MuiInputBase-root": {
                            flexGrow: 1,
                            alignItems: "flex-start",
                            p: 2,
                        },
                        "& .MuiInputBase-input": {
                            fontFamily: "monospace",
                            height: "100% !important",
                            overflowY: "auto !important",
                        },
                    }}
                />
            </TabPanel>

            <TabPanel value={tab} index={1}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" },
                        gap: 3,
                        height: "100%",
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            border: "1px solid #e2e8f0",
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="h6" mb={2}>
                            Параметры страницы
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                            }}
                        >
                            <FormControl fullWidth>
                                <InputLabel>Формат</InputLabel>
                                <Select
                                    value={format}
                                    label="Формат"
                                    onChange={(e) => setFormat(e.target.value)}
                                >
                                    <MenuItem value="A4">A4</MenuItem>
                                    <MenuItem value="Letter">Letter</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Ориентация</InputLabel>
                                <Select
                                    value={orientation}
                                    label="Ориентация"
                                    onChange={(e) =>
                                        setOrientation(e.target.value)
                                    }
                                >
                                    <MenuItem value="Portrait">
                                        Книжная
                                    </MenuItem>
                                    <MenuItem value="Landscape">
                                        Альбомная
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Поля</InputLabel>
                                <Select
                                    value={margins}
                                    label="Поля"
                                    onChange={(e) => setMargins(e.target.value)}
                                >
                                    <MenuItem value="None">Без полей</MenuItem>
                                    <MenuItem value="Standard">
                                        Стандартные
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={pageNumbers}
                                        onChange={(e) =>
                                            setPageNumbers(e.target.checked)
                                        }
                                    />
                                }
                                label="Нумерация страниц"
                            />
                        </Box>
                    </Paper>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            border: "1px solid #e2e8f0",
                            borderRadius: 2,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Typography variant="h6" mb={2}>
                            Custom CSS (Для PDF)
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            value={customCss}
                            onChange={(e) => setCustomCss(e.target.value)}
                            placeholder="body { background-color: #f0f0f0; }"
                            sx={{
                                flexGrow: 1,
                                display: "flex",
                                flexDirection: "column",
                                "& .MuiInputBase-root": {
                                    flexGrow: 1,
                                    alignItems: "flex-start",
                                    p: 2,
                                },
                                "& .MuiInputBase-input": {
                                    fontFamily: "monospace",
                                    color: "#15803d",
                                    height: "100% !important",
                                    overflowY: "auto !important",
                                },
                            }}
                        />
                    </Paper>
                </Box>
            </TabPanel>

            <TabPanel value={tab} index={2}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        flexGrow: 1,
                        overflowY: "auto",
                        border: "1px solid #e2e8f0",
                        bgcolor: "white",
                        textAlign: "left",
                        color: "#333",
                    }}
                >
                    <style>
                        {`
              .markdown-preview { font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; line-height: 1.6; color: #333; }
              
              .markdown-preview h1, 
              .markdown-preview h2, 
              .markdown-preview h3, 
              .markdown-preview h4 { 
                color: #111827 !important; 
                font-weight: bold;
                margin-top: 24px;
                margin-bottom: 16px;
              }

              .markdown-preview table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
              .markdown-preview th, .markdown-preview td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .markdown-preview th { background-color: #f2f2f2; color: #111827; }
              .markdown-preview blockquote { border-left: 4px solid #007bff; margin: 0; padding-left: 15px; color: #555; }
              .markdown-preview img { max-width: 100%; height: auto; border-radius: 8px; }
              .markdown-preview pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
              .markdown-preview code { font-family: monospace; color: #333; }
              
              ${(customCss || "").replace(/body/g, ".markdown-preview")} 
            `}
                    </style>

                    <div
                        ref={previewRef}
                        className="markdown-preview"
                        dangerouslySetInnerHTML={{
                            __html: marked.parse(markdown || ""),
                        }}
                    />
                </Paper>
            </TabPanel>

            <Box
                sx={{
                    p: 3,
                    bgcolor: "white",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Символов: {(markdown || "").length} | Изменения сохраняются
                    автоматически
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={
                        loading ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <PictureAsPdfIcon />
                        )
                    }
                    onClick={handleGeneratePDF}
                    disabled={loading}
                    sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: "bold",
                    }}
                >
                    {loading ? "Рендеринг в Chromium..." : "Экспорт в PDF"}
                </Button>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
