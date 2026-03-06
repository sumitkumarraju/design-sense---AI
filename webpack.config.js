const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const isEnvProduction = process.env.NODE_ENV === "production";

const uiPath = path.resolve(__dirname, "./src/ui");
const sandboxPath = path.resolve(__dirname, "./src/sandbox");

module.exports = {
    mode: isEnvProduction ? "production" : "development",
    devtool: "source-map",
    entry: {
        index: "./src/ui/index.tsx",
        code: "./src/sandbox/code.ts"
    },
    experiments: {
        outputModule: true
    },
    output: {
        pathinfo: !isEnvProduction,
        path: path.resolve(__dirname, "dist"),
        module: true,
        filename: "[name].js"
    },
    externalsType: "module",
    externalsPresets: { web: true },
    externals: {
        "add-on-sdk-document-sandbox": "add-on-sdk-document-sandbox",
        "express-document-sdk": "express-document-sdk",
        "https://new.express.adobe.com/static/add-on-sdk/sdk.js": "https://new.express.adobe.com/static/add-on-sdk/sdk.js"
    },
    devServer: {
        server: {
            type: "https",
            options: {
                key: fs.readFileSync(path.resolve(__dirname, "localhost-key.pem")),
                cert: fs.readFileSync(path.resolve(__dirname, "localhost.pem"))
            }
        },
        port: 5241,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        },
        static: {
            directory: path.resolve(__dirname, "dist"),
            serveIndex: true
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "src/index.html",
            scriptLoading: "module",
            excludeChunks: ["code"]
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: "src/*.json", to: "[name][ext]" }]
        })
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: path.resolve(uiPath, "tsconfig.json")
                        }
                    }
                ],
                include: uiPath,
                exclude: /node_modules/
            },
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: path.resolve(sandboxPath, "tsconfig.json")
                        }
                    }
                ],
                include: sandboxPath,
                exclude: /node_modules/
            },
            {
                test: /(\.css)$/,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".css"]
    }
};
