import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { dump } from "js-yaml";
import { read } from "yaml-import";
import OpenapiSchemaValidator from "openapi-schema-validator";
import type { Plugin, ViteDevServer } from "vite";

interface YamlPluginOptions {
    inputFile: string;
    outputFile: string;
}

export function yamlImportPlugin(options: YamlPluginOptions): Plugin {
    const { inputFile, outputFile } = options;

    let serverRef: ViteDevServer | null = null;
    let lastProcessedYaml = "";
    let watcher: fs.FSWatcher | null = null;

    async function processYaml(root: string): Promise<string> {
        const absoluteInputPath = path.resolve(root, "src/specs", inputFile);
        const processedYaml = await read(absoluteInputPath, {
            extensions: [".yml", ".yaml"],
        });

        const yamlString = dump(processedYaml, {
            noRefs: true,
            lineWidth: -1,
            quotingType: '"',
        });

        const data = yaml.load(yamlString);
        // OpenapiSchemaValidator 는 commonJS 기반이라 vite 에서는 .default 로 접근해야함
        const Validator = (OpenapiSchemaValidator as any).default || OpenapiSchemaValidator;
        const validator = new Validator({ version: 3 });
        const result = validator.validate(data as any);

        if (result.errors.length > 0) {
            console.error("❌ OpenAPI Schema is invalid");
            for (const error of result.errors) {
                console.error(`Path: ${error.instancePath || "/"}`);
                console.error(`Message: ${error.message}`);
            }
            throw new Error("OpenAPI schema validation failed");
        }

        console.log("✅ OpenAPI Schema is valid");
        lastProcessedYaml = yamlString;
        return yamlString;
    }

    async function writeYamlToFile(root: string) {
        const outputPath = path.resolve(root, "public", outputFile.replace(/^\//, ""));
        const outputDir = path.dirname(outputPath);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const yamlString = lastProcessedYaml || (await processYaml(root));
        fs.writeFileSync(outputPath, yamlString, "utf8");
    }

    return {
        name: "vite-yaml-import-plugin",

        async buildStart() {
            const root = process.cwd();
            await processYaml(root);
            await writeYamlToFile(root);
        },

        configureServer(server) {
            serverRef = server;
            const root = server.config.root;
            const watchDir = path.resolve(root, "src/specs");

            processYaml(root).catch((error) => {
                console.error(error);
            });

            server.middlewares.use(async (req, res, next) => {
                const requestPath = decodeURIComponent(req.url?.split("?")[0] ?? "");
                const cleanOutputPath = outputFile.startsWith("/") ? outputFile : `/${outputFile}`;

                if (requestPath === cleanOutputPath) {
                    try {
                        const yamlContent = lastProcessedYaml || (await processYaml(root));
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "text/yaml");
                        res.setHeader("Cache-Control", "no-cache");
                        res.end(yamlContent);
                        return;
                    } catch {
                        res.statusCode = 500;
                        res.end("Failed to process YAML");
                        return;
                    }
                }

                next();
            });

            watcher = fs.watch(watchDir, { recursive: true }, async (_, filename) => {
                if (!filename) return;
                const ext = path.extname(filename);
                if (ext !== ".yml" && ext !== ".yaml") return;

                try {
                    await processYaml(root);
                    await writeYamlToFile(root);
                    serverRef?.ws.send({ type: "full-reload" });
                } catch (error) {
                    console.error(error);
                }
            });
        },

        closeBundle() {
            watcher?.close();
            watcher = null;
        },
    };
}